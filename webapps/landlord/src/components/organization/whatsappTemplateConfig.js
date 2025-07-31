// WhatsApp template configuration constants
export const WHATSAPP_TEMPLATE_TYPES = {
  INVOICE: 'invoice',
  PAYMENT_NOTICE: 'paymentNotice',
  PAYMENT_REMINDER: 'paymentReminder',
  FINAL_NOTICE: 'finalNotice',
  LOGIN: 'login'
};

export const WHATSAPP_TEMPLATE_PARAMETERS = {
  [WHATSAPP_TEMPLATE_TYPES.INVOICE]: [
    'tenantName',
    'period',
    'amount',
    'dueDate',
    'organization'
  ],
  [WHATSAPP_TEMPLATE_TYPES.PAYMENT_NOTICE]: ['tenantName', 'amount', 'dueDate'],
  [WHATSAPP_TEMPLATE_TYPES.PAYMENT_REMINDER]: [
    'tenantName',
    'amount',
    'dueDate',
    'daysOverdue'
  ],
  [WHATSAPP_TEMPLATE_TYPES.FINAL_NOTICE]: [
    'tenantName',
    'amount',
    'dueDate',
    'daysOverdue'
  ],
  [WHATSAPP_TEMPLATE_TYPES.LOGIN]: ['code', 'expiry']
};

export const DEFAULT_TEMPLATE_NAMES = {
  [WHATSAPP_TEMPLATE_TYPES.LOGIN]: 'otpcode'
};

/**
 * Creates WhatsApp template configuration object
 * @param {Object} templateNames - Template names from form
 * @param {string} language - Template language
 * @returns {Object} Template configuration
 */
export function createWhatsAppTemplateConfig(templateNames, language) {
  const templates = {};

  Object.values(WHATSAPP_TEMPLATE_TYPES).forEach((type) => {
    const templateName = templateNames[type] || DEFAULT_TEMPLATE_NAMES[type];
    if (templateName) {
      templates[type] = {
        name: templateName,
        language,
        parameters: WHATSAPP_TEMPLATE_PARAMETERS[type]
      };
    }
  });

  return templates;
}
