/**
 * Determines the active email delivery service and extracts common email settings
 */
function getEmailServiceConfig(organization) {
  if (!organization || typeof organization !== 'object') {
    throw new Error('Invalid organization object provided');
  }
  
  const thirdParties = organization.thirdParties || {};
  let emailDeliveryServiceName;
  let fromEmail = organization.contacts?.[0]?.email || '';
  let replyToEmail = organization.contacts?.[0]?.email || '';

  if (thirdParties.gmail?.selected) {
    emailDeliveryServiceName = 'gmail';
    fromEmail = thirdParties.gmail.fromEmail || '';
    replyToEmail = thirdParties.gmail.replyToEmail || '';
  } else if (thirdParties.smtp?.selected) {
    emailDeliveryServiceName = 'smtp';
    fromEmail = thirdParties.smtp.fromEmail || '';
    replyToEmail = thirdParties.smtp.replyToEmail || '';
  } else if (thirdParties.mailgun?.selected) {
    emailDeliveryServiceName = 'mailgun';
    fromEmail = thirdParties.mailgun.fromEmail || '';
    replyToEmail = thirdParties.mailgun.replyToEmail || '';
  }

  return {
    emailDeliveryServiceActive: !!(
      thirdParties.gmail?.selected ||
      thirdParties.smtp?.selected ||
      thirdParties.mailgun?.selected
    ),
    emailDeliveryServiceName,
    fromEmail,
    replyToEmail
  };
}

/**
 * Extracts Gmail configuration from organization
 */
function getGmailConfig(organization) {
  const gmail = organization.thirdParties?.gmail || {};
  return {
    gmail_email: gmail.email || '',
    gmail_appPassword: gmail.appPassword || ''
  };
}

/**
 * Extracts SMTP configuration from organization
 */
function getSMTPConfig(organization) {
  const smtp = organization.thirdParties?.smtp || {};
  return {
    smtp_server: smtp.server || '',
    smtp_port: smtp.port || 25,
    smtp_secure: !!smtp.secure,
    smtp_authentication:
      smtp.authentication === undefined ? true : smtp.authentication,
    smtp_username: smtp.username || '',
    smtp_password: smtp.password || ''
  };
}

/**
 * Extracts Mailgun configuration from organization
 */
function getMailgunConfig(organization) {
  const mailgun = organization.thirdParties?.mailgun || {};
  return {
    mailgun_apiKey: mailgun.apiKey || '',
    mailgun_domain: mailgun.domain || ''
  };
}

/**
 * Extracts WhatsApp configuration from organization
 */
function getWhatsAppConfig(organization) {
  const whatsapp = organization.thirdParties?.whatsapp || {};

  // Handle both old and new template structure
  const getTemplateName = (templateKey, fallback = '') => {
    if (whatsapp.templates?.[templateKey]?.name) {
      return whatsapp.templates[templateKey].name;
    }
    return whatsapp[templateKey] || fallback;
  };

  return {
    whatsappActive: !!whatsapp.accessToken,
    whatsappAccessToken: whatsapp.accessToken || '',
    whatsappPhoneNumberId: whatsapp.phoneNumberId || '',
    whatsappBusinessAccountId: whatsapp.businessAccountId || '',
    whatsappInvoiceTemplate: getTemplateName(
      'invoice',
      whatsapp.invoiceTemplate
    ),
    whatsappPaymentNoticeTemplate: getTemplateName(
      'paymentNotice',
      whatsapp.paymentNoticeTemplate
    ),
    whatsappPaymentReminderTemplate: getTemplateName(
      'paymentReminder',
      whatsapp.paymentReminderTemplate
    ),
    whatsappFinalNoticeTemplate: getTemplateName(
      'finalNotice',
      whatsapp.finalNoticeTemplate
    ),
    whatsappTemplateLanguage:
      whatsapp.defaultLanguage || whatsapp.templateLanguage || 'en_US'
  };
}

/**
 * Extracts B2 storage configuration from organization
 */
function getB2Config(organization) {
  const b2 = organization.thirdParties?.b2 || {};
  return {
    b2Active: !!b2.keyId,
    keyId: b2.keyId || '',
    applicationKey: b2.applicationKey || '',
    endpoint: b2.endpoint || '',
    bucket: b2.bucket || ''
  };
}

/**
 * Creates initial form values from organization data
 */
export function createInitialValues(organization) {
  return {
    ...getEmailServiceConfig(organization),
    ...getGmailConfig(organization),
    ...getSMTPConfig(organization),
    ...getMailgunConfig(organization),
    ...getWhatsAppConfig(organization),
    ...getB2Config(organization)
  };
}
