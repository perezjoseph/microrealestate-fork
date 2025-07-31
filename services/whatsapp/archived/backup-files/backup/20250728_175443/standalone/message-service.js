import axios from 'axios';
import PhoneUtils from './phone-utils.js';
import logger from './logger.js';

/**
 * WhatsApp message service for standalone implementation
 */
class MessageService {
  constructor(config) {
    this.config = config;
    this.messageStatusTracker = new Map();
  }

  /**
   * Send WhatsApp message via Business API
   * @param {string} phoneNumber - Phone number in international format (+1234567890)
   * @param {string} message - Message content (max 4096 characters)
   * @returns {Promise<Object>} API response from WhatsApp Business API
   * @throws {Error} When API is not configured or request fails
   * @example
   * const response = await messageService.sendApiMessage('+1234567890', 'Hello World');
   * console.log(`Message ID: ${response.messages[0].id}`);
   */
  async sendApiMessage(phoneNumber, message) {
    if (!this.config.isApiConfigured()) {
      throw new Error('WhatsApp API not configured');
    }

    const formattedPhone = PhoneUtils.formatForApi(phoneNumber);
    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: { body: message }
    };

    try {
      const response = await axios.post(
        `${this.config.get('WHATSAPP_API_URL')}/${this.config.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.config.get('WHATSAPP_ACCESS_TOKEN')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`WhatsApp message sent successfully to ${formattedPhone}`);
      this._trackMessage(response.data, formattedPhone);
      return response.data;
    } catch (error) {
      this._handleApiError(error, formattedPhone);
    }
  }

  /**
   * Send message with fallback strategy
   * @param {string} phoneNumber - Phone number
   * @param {string} message - Message content
   * @param {string} recipientName - Optional recipient name
   * @returns {Promise<Object>} - Result object
   */
  async sendMessageWithFallback(
    phoneNumber,
    message,
    recipientName = 'Unknown'
  ) {
    try {
      const apiResponse = await this.sendApiMessage(phoneNumber, message);
      return {
        success: true,
        method: 'api',
        messageId: apiResponse.messages?.[0]?.id,
        phoneNumber,
        recipientName,
        apiResponse
      };
    } catch (apiError) {
      logger.warn(
        `WhatsApp API failed for ${recipientName}:`,
        apiError.message
      );

      // Fallback to URL generation
      const whatsappURL = PhoneUtils.generateWhatsAppURL(phoneNumber, message);
      return {
        success: true,
        method: 'url',
        whatsappURL,
        phoneNumber,
        recipientName,
        apiError: apiError.message
      };
    }
  }

  /**
   * Send invoice to multiple phone numbers
   * @param {Array<string>} phoneNumbers - Array of phone numbers
   * @param {Object} invoiceData - Invoice data
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} - Array of results
   */
  async sendInvoiceToMultiple(phoneNumbers, invoiceData, options = {}) {
    const { concurrent = false, maxConcurrency = 3 } = options;
    const message = this._createInvoiceMessage(invoiceData);

    if (concurrent && phoneNumbers.length > 1) {
      return this._sendConcurrently(
        phoneNumbers,
        message,
        invoiceData,
        maxConcurrency
      );
    }

    return this._sendSequentially(phoneNumbers, message, invoiceData);
  }

  /**
   * Send messages sequentially (default behavior)
   * @private
   */
  async _sendSequentially(phoneNumbers, message, invoiceData) {
    const results = [];

    for (const phone of phoneNumbers) {
      try {
        const result = await this.sendMessageWithFallback(
          phone,
          message,
          invoiceData.tenantName
        );

        results.push({
          phoneNumber: phone,
          success: true,
          method: result.method,
          messageId: result.messageId,
          whatsappURL: result.whatsappURL
        });

        logger.info(`Invoice sent to ${phone} via ${result.method}`);
      } catch (error) {
        logger.error(`Error processing ${phone}:`, error.message);

        results.push({
          phoneNumber: phone,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Send messages concurrently with controlled concurrency
   * @private
   */
  async _sendConcurrently(phoneNumbers, message, invoiceData, maxConcurrency) {
    const chunks = this._chunkArray(phoneNumbers, maxConcurrency);
    const allResults = [];

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (phone) => {
        try {
          const result = await this.sendMessageWithFallback(
            phone,
            message,
            invoiceData.tenantName
          );

          logger.info(`Invoice sent to ${phone} via ${result.method}`);

          return {
            phoneNumber: phone,
            success: true,
            method: result.method,
            messageId: result.messageId,
            whatsappURL: result.whatsappURL
          };
        } catch (error) {
          logger.error(`Error processing ${phone}:`, error.message);

          return {
            phoneNumber: phone,
            success: false,
            error: error.message
          };
        }
      });

      const chunkResults = await Promise.allSettled(chunkPromises);
      const processedResults = chunkResults.map((result) =>
        result.status === 'fulfilled' ? result.value : result.reason
      );

      allResults.push(...processedResults);
    }

    return allResults;
  }

  /**
   * Split array into chunks
   * @private
   */
  _chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Create invoice message from data
   * @param {Object} invoiceData - Invoice data
   * @returns {string} - Formatted message
   * @private
   */
  _createInvoiceMessage(invoiceData) {
    const {
      tenantName = 'Cliente',
      invoicePeriod,
      totalAmount,
      currency = 'RD$',
      dueDate = 'Por definir',
      invoiceUrl,
      organizationName = 'MicroRealEstate'
    } = invoiceData;

    return `Estimado/a ${tenantName},

Su factura del período ${invoicePeriod} está lista.

💰 Total: ${currency} ${totalAmount}
📅 Fecha límite: ${dueDate}

${invoiceUrl ? `📄 Ver factura: ${invoiceUrl}` : ''}

Gracias por su confianza.
${organizationName}`;
  }

  // Private methods
  _trackMessage(apiResponse, formattedPhone) {
    if (apiResponse.messages?.[0]) {
      const messageId = apiResponse.messages[0].id;
      this.messageStatusTracker.set(messageId, {
        status: 'sent',
        timestamp: new Date(),
        recipientId: formattedPhone,
        lastUpdated: new Date(),
        messageType: 'text'
      });
    }
  }

  _handleApiError(error, phoneNumber) {
    if (error.response?.data?.error) {
      const fbError = error.response.data.error;
      logger.error(`WhatsApp API Error for ${phoneNumber}:`, fbError);

      const errorMessages = {
        131030: `Phone number ${phoneNumber} not in allowed list`,
        190: 'WhatsApp access token expired or invalid',
        132000: 'Template not found or not approved',
        131031: 'Phone number is not a WhatsApp Business API phone number'
      };

      const message =
        errorMessages[fbError.code] ||
        `WhatsApp API Error (${fbError.code}): ${fbError.message}`;
      throw new Error(message);
    }
    throw new Error(`WhatsApp API request failed: ${error.message}`);
  }
}

export default MessageService;
