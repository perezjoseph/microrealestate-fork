/**
 * Message templates for WhatsApp service
 */

export const MessageTemplates = {
  /**
   * Invoice notification template in Spanish
   */
  invoiceNotification: {
    es: (data) => `Estimado/a ${data.tenantName || 'Cliente'},

Su factura del período ${data.invoicePeriod} está lista.

💰 Total: ${data.currency || 'RD$'} ${data.totalAmount}
📅 Fecha límite: ${data.dueDate || 'Por definir'}

${data.invoiceUrl ? `📄 Ver factura: ${data.invoiceUrl}` : ''}

Gracias por su confianza.
${data.organizationName || 'MicroRealEstate'}`,

    en: (data) => `Dear ${data.tenantName || 'Customer'},

Your invoice for period ${data.invoicePeriod} is ready.

💰 Total: ${data.currency || 'USD'} ${data.totalAmount}
📅 Due date: ${data.dueDate || 'To be defined'}

${data.invoiceUrl ? `📄 View invoice: ${data.invoiceUrl}` : ''}

Thank you for your trust.
${data.organizationName || 'MicroRealEstate'}`
  },

  /**
   * Payment reminder template
   */
  paymentReminder: {
    es: (data) => `Estimado/a ${data.tenantName || 'Cliente'},

Le recordamos que tiene un pago pendiente:

💰 Monto: ${data.currency || 'RD$'} ${data.amount}
📅 Vencimiento: ${data.dueDate}

Por favor, realice el pago a la brevedad posible.

${data.organizationName || 'MicroRealEstate'}`,

    en: (data) => `Dear ${data.tenantName || 'Customer'},

We remind you that you have a pending payment:

💰 Amount: ${data.currency || 'USD'} ${data.amount}
📅 Due date: ${data.dueDate}

Please make the payment as soon as possible.

${data.organizationName || 'MicroRealEstate'}`
  }
};

/**
 * Get message template by type and language
 * @param {string} type - Template type (invoiceNotification, paymentReminder)
 * @param {string} language - Language code (es, en)
 * @param {Object} data - Template data
 * @returns {string} Formatted message
 */
export function getMessageTemplate(type, language = 'es', data = {}) {
  // Validate inputs
  if (!type || typeof type !== 'string') {
    throw new Error('Template type must be a non-empty string');
  }

  if (!language || typeof language !== 'string') {
    throw new Error('Language must be a non-empty string');
  }

  const template = MessageTemplates[type];
  if (!template) {
    throw new Error(
      `Unknown message template type: ${type}. Available types: ${Object.keys(MessageTemplates).join(', ')}`
    );
  }

  // Fallback to Spanish if requested language not available
  const languageTemplate = template[language] || template.es;
  if (typeof languageTemplate !== 'function') {
    throw new Error(
      `Invalid template for type: ${type}, language: ${language}`
    );
  }

  // Validate required data fields based on template type
  const requiredFields = getRequiredFields(type);
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required template data: ${missingFields.join(', ')}`
    );
  }

  try {
    return languageTemplate(data);
  } catch (error) {
    throw new Error(
      `Template rendering failed for ${type}/${language}: ${error.message}`
    );
  }
}

/**
 * Get required fields for a template type
 * @param {string} type - Template type
 * @returns {string[]} Required field names
 */
function getRequiredFields(type) {
  const requiredFieldsMap = {
    invoiceNotification: ['tenantName', 'invoicePeriod', 'totalAmount'],
    paymentReminder: ['tenantName', 'amount', 'dueDate']
  };

  return requiredFieldsMap[type] || [];
}

/**
 * Get available template types
 * @returns {string[]} Available template types
 */
export function getAvailableTemplateTypes() {
  return Object.keys(MessageTemplates);
}

/**
 * Get available languages for a template type
 * @param {string} type - Template type
 * @returns {string[]} Available language codes
 */
export function getAvailableLanguages(type) {
  const template = MessageTemplates[type];
  return template ? Object.keys(template) : [];
}

export default MessageTemplates;
