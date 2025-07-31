import axios from 'axios';
import PhoneUtils from './phone-utils.js';
import logger from './logger.js';
import { getWhatsAppConfigService } from './whatsapp-config-service.js';

/**
 * Enhanced WhatsApp message service with database-driven configuration
 */
class MessageService {
  constructor(fallbackConfig = null) {
    this.fallbackConfig = fallbackConfig; // Keep for backward compatibility
    this.configService = getWhatsAppConfigService();
    this.messageStatusTracker = new Map();
  }

  /**
   * Send WhatsApp template message with organization-specific configuration
   * @param {string} realmId - Organization/Realm ID
   * @param {string} phoneNumber - Phone number in international format
   * @param {string} templateType - Template type (invoice, paymentNotice, etc.)
   * @param {Object} templateData - Template parameter data
   * @param {string} recipientName - Optional recipient name
   * @returns {Promise<Object>} Result object
   */
  async sendTemplateMessage(
    realmId,
    phoneNumber,
    templateType,
    templateData,
    recipientName = 'Unknown'
  ) {
    try {
      // Get organization-specific configuration
      const config = await this.configService.getWhatsAppConfig(realmId);

      if (!config.isApiConfigured()) {
        logger.warn(
          `WhatsApp API not configured for realm ${realmId}, using fallback`
        );
        return this._sendWithFallback(
          phoneNumber,
          templateData,
          recipientName,
          templateType
        );
      }

      // Get template configuration
      const template = this.configService.getTemplate(config, templateType);

      // Build template parameters
      const templateParams = this._buildTemplateParameters(
        template,
        templateData
      );

      // Send via WhatsApp Business API
      const apiResponse = await this._sendTemplateViaAPI(
        config,
        phoneNumber,
        template,
        templateParams
      );

      // Log message for audit trail
      await this._logMessage(
        realmId,
        templateType,
        templateData,
        phoneNumber,
        'api',
        apiResponse
      );

      return {
        success: true,
        method: 'api',
        messageId: apiResponse.messages?.[0]?.id,
        phoneNumber,
        recipientName,
        templateType,
        configSource: config.source,
        apiResponse
      };
    } catch (error) {
      logger.error(
        `Template message failed for realm ${realmId}, template ${templateType}:`,
        error.message
      );

      // Fallback to URL generation
      return this._sendWithFallback(
        phoneNumber,
        templateData,
        recipientName,
        templateType,
        error.message
      );
    }
  }

  /**
   * Send template message with fallback (backward compatibility method)
   * @param {string} phoneNumber - Phone number
   * @param {string} templateName - Template name (e.g., 'factura2')
   * @param {string} language - Template language
   * @param {Array} templateParams - Template parameters
   * @param {string} recipientName - Recipient name
   * @returns {Promise<Object>} Result object
   */
  async sendTemplateMessageWithFallback(
    phoneNumber,
    templateName,
    language,
    templateParams,
    recipientName = 'Unknown'
  ) {
    try {
      // Use fallback config for backward compatibility
      if (!this.fallbackConfig?.isApiConfigured()) {
        throw new Error('WhatsApp API not configured');
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: PhoneUtils.formatForApi(phoneNumber),
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components: [
            {
              type: 'body',
              parameters: templateParams.map((param) => ({
                type: 'text',
                text: String(param)
              }))
            }
          ]
        }
      };

      const response = await axios.post(
        `${this.fallbackConfig.get('WHATSAPP_API_URL')}/${this.fallbackConfig.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.fallbackConfig.get('WHATSAPP_ACCESS_TOKEN')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(
        `WhatsApp template message sent successfully to ${PhoneUtils.formatForApi(phoneNumber)}`
      );
      this._trackMessage(response.data, PhoneUtils.formatForApi(phoneNumber));

      return {
        success: true,
        method: 'api',
        messageId: response.data.messages?.[0]?.id,
        phoneNumber,
        recipientName,
        apiResponse: response.data
      };
    } catch (error) {
      logger.warn(
        `WhatsApp template API failed for ${recipientName}:`,
        error.message
      );

      // Fallback to URL generation with formatted message
      const message = this._formatTemplateAsText(templateName, templateParams);
      const whatsappURL = PhoneUtils.generateWhatsAppURL(phoneNumber, message);

      return {
        success: true,
        method: 'url',
        whatsappURL,
        phoneNumber,
        recipientName,
        apiError: error.message
      };
    }
  }

  /**
   * Send WhatsApp message via Business API (original method)
   * @param {string} phoneNumber - Phone number in international format
   * @param {string} message - Message content
   * @returns {Promise<Object>} API response
   */
  async sendApiMessage(phoneNumber, message) {
    if (!this.fallbackConfig?.isApiConfigured()) {
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
        `${this.fallbackConfig.get('WHATSAPP_API_URL')}/${this.fallbackConfig.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.fallbackConfig.get('WHATSAPP_ACCESS_TOKEN')}`,
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
   * Send message with fallback strategy (original method)
   * @param {string} phoneNumber - Phone number
   * @param {string} message - Message content
   * @param {string} recipientName - Optional recipient name
   * @returns {Promise<Object>} Result object
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
   * Send invoice to multiple phone numbers with organization-specific configuration
   * @param {string} realmId - Organization/Realm ID
   * @param {Array<string>} phoneNumbers - Array of phone numbers
   * @param {Object} invoiceData - Invoice data
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Array of results
   */
  async sendInvoiceToMultiple(
    realmId,
    phoneNumbers,
    invoiceData,
    options = {}
  ) {
    const { concurrent = false, maxConcurrency = 3 } = options;

    if (concurrent) {
      return this._sendConcurrently(
        realmId,
        phoneNumbers,
        invoiceData,
        maxConcurrency
      );
    } else {
      return this._sendSequentially(realmId, phoneNumbers, invoiceData);
    }
  }

  // Private methods

  /**
   * Send template message via WhatsApp Business API
   * @private
   */
  async _sendTemplateViaAPI(config, phoneNumber, template, templateParams) {
    const formattedPhone = PhoneUtils.formatForApi(phoneNumber);

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: template.name,
        language: { code: template.language },
        components: [
          {
            type: 'body',
            parameters: templateParams.map((param) => ({
              type: 'text',
              text: String(param)
            }))
          }
        ]
      }
    };

    const response = await axios.post(
      `${config.apiUrl}/${config.phoneNumberId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(
      `WhatsApp template message sent successfully to ${formattedPhone}`
    );
    this._trackMessage(response.data, formattedPhone);
    return response.data;
  }

  /**
   * Build template parameters from template configuration and data
   * @private
   */
  _buildTemplateParameters(template, templateData) {
    return template.parameters.map((paramName) => {
      const value = templateData[paramName];
      if (value === undefined || value === null) {
        logger.warn(`Missing template parameter: ${paramName}`);
        return `[${paramName}]`; // Placeholder for missing data
      }
      return String(value);
    });
  }

  /**
   * Send with fallback URL generation
   * @private
   */
  _sendWithFallback(
    phoneNumber,
    templateData,
    recipientName,
    templateType,
    apiError = null
  ) {
    const message = this._createMessageFromTemplate(templateType, templateData);
    const whatsappURL = PhoneUtils.generateWhatsAppURL(phoneNumber, message);

    return {
      success: true,
      method: 'url',
      whatsappURL,
      phoneNumber,
      recipientName,
      templateType,
      apiError
    };
  }

  /**
   * Create formatted message from template type and data
   * @private
   */
  _createMessageFromTemplate(templateType, templateData) {
    switch (templateType) {
      case 'invoice':
        return this._createInvoiceMessage(templateData);
      case 'paymentNotice':
        return this._createPaymentNoticeMessage(templateData);
      case 'paymentReminder':
        return this._createPaymentReminderMessage(templateData);
      case 'finalNotice':
        return this._createFinalNoticeMessage(templateData);
      case 'login':
        return this._createLoginMessage(templateData);
      default:
        return this._createGenericMessage(templateData);
    }
  }

  /**
   * Create invoice message from data
   * @private
   */
  _createInvoiceMessage(templateData) {
    const {
      tenantName = 'Cliente',
      period = 'N/A',
      amount = '0',
      dueDate = 'Por definir',
      organization = 'MicroRealEstate'
    } = templateData;

    return `Estimado/a ${tenantName},

Su factura del período ${period} está lista.

💰 Total: ${amount}
📅 Fecha límite: ${dueDate}

Gracias por su confianza.
${organization}`;
  }

  /**
   * Create payment notice message
   * @private
   */
  _createPaymentNoticeMessage(templateData) {
    const {
      tenantName = 'Cliente',
      amount = '0',
      dueDate = 'Por definir'
    } = templateData;

    return `Estimado/a ${tenantName},

Le recordamos que tiene un pago pendiente:

💰 Monto: ${amount}
📅 Fecha límite: ${dueDate}

Por favor, realice su pago a tiempo.`;
  }

  /**
   * Create payment reminder message
   * @private
   */
  _createPaymentReminderMessage(templateData) {
    const {
      tenantName = 'Cliente',
      amount = '0',
      dueDate = 'Por definir',
      daysOverdue = '0'
    } = templateData;

    return `Estimado/a ${tenantName},

Su pago está vencido por ${daysOverdue} días.

💰 Monto: ${amount}
📅 Fecha límite: ${dueDate}

Por favor, regularice su situación lo antes posible.`;
  }

  /**
   * Create final notice message
   * @private
   */
  _createFinalNoticeMessage(templateData) {
    const {
      tenantName = 'Cliente',
      amount = '0',
      dueDate = 'Por definir',
      daysOverdue = '0'
    } = templateData;

    return `AVISO FINAL - ${tenantName}

Su pago está vencido por ${daysOverdue} días.

💰 Monto: ${amount}
📅 Fecha límite: ${dueDate}

Este es su último aviso antes de tomar medidas legales.`;
  }

  /**
   * Create login/OTP message
   * @private
   */
  _createLoginMessage(templateData) {
    const { code = '000000', expiry = '10 minutos' } = templateData;

    return `Su código de verificación es: ${code}

Este código expira en ${expiry}.

No comparta este código con nadie.`;
  }

  /**
   * Create generic message
   * @private
   */
  _createGenericMessage(templateData) {
    return `Mensaje de MicroRealEstate\n\n${JSON.stringify(templateData, null, 2)}`;
  }

  /**
   * Format template as text message for fallback
   * @private
   */
  _formatTemplateAsText(templateName, templateParams) {
    // Simple template formatting for fallback
    switch (templateName) {
      case 'factura2': {
        const [tenantName, period, amount, dueDate, organization] =
          templateParams;
        return this._createInvoiceMessage({
          tenantName,
          period,
          amount,
          dueDate,
          organization
        });
      }
      default:
        return `Mensaje: ${templateParams.join(', ')}`;
    }
  }

  /**
   * Log message for audit trail
   * @private
   */
  async _logMessage(
    realmId,
    templateType,
    templateData,
    phoneNumber,
    method,
    apiResponse = null
  ) {
    try {
      // This would integrate with the WhatsAppMessage collection
      // For now, just log to console
      logger.info('WhatsApp message logged', {
        realmId,
        templateType,
        phoneNumber: PhoneUtils.formatForApi(phoneNumber),
        method,
        messageId: apiResponse?.messages?.[0]?.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to log WhatsApp message:', error);
    }
  }

  /**
   * Send messages sequentially
   * @private
   */
  async _sendSequentially(realmId, phoneNumbers, invoiceData) {
    const results = [];

    for (const phone of phoneNumbers) {
      try {
        const result = await this.sendTemplateMessage(
          realmId,
          phone,
          'invoice',
          invoiceData,
          invoiceData.tenantName
        );
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          phoneNumber: phone,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Send messages concurrently
   * @private
   */
  async _sendConcurrently(realmId, phoneNumbers, invoiceData, maxConcurrency) {
    const chunks = [];
    for (let i = 0; i < phoneNumbers.length; i += maxConcurrency) {
      chunks.push(phoneNumbers.slice(i, i + maxConcurrency));
    }

    const results = [];
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (phone) => {
        try {
          return await this.sendTemplateMessage(
            realmId,
            phone,
            'invoice',
            invoiceData,
            invoiceData.tenantName
          );
        } catch (error) {
          return {
            success: false,
            phoneNumber: phone,
            error: error.message
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  // Keep existing private methods for backward compatibility
  _trackMessage(apiResponse, formattedPhone) {
    if (apiResponse.messages?.[0]) {
      const messageId = apiResponse.messages[0].id;
      this.messageStatusTracker.set(messageId, {
        status: 'sent',
        timestamp: new Date(),
        recipientId: formattedPhone,
        lastUpdated: new Date(),
        messageType: 'template'
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
