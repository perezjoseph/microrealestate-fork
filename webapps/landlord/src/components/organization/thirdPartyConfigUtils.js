import {
  createWhatsAppTemplateConfig,
  WHATSAPP_TEMPLATE_TYPES
} from './whatsappTemplateConfig';

/**
 * Creates email service configuration based on form values
 */
export function createEmailServiceConfig(values, initialValues) {
  if (!values.emailDeliveryServiceActive) {
    return {
      gmail: null,
      smtp: null,
      mailgun: null
    };
  }

  const { emailDeliveryServiceName, fromEmail, replyToEmail } = values;

  return {
    gmail: {
      selected: emailDeliveryServiceName === 'gmail',
      email: values.gmail_email,
      appPassword: values.gmail_appPassword,
      appPasswordUpdated:
        values.gmail_appPassword !== initialValues.gmail_appPassword,
      fromEmail,
      replyToEmail
    },
    smtp: {
      selected: emailDeliveryServiceName === 'smtp',
      server: values.smtp_server,
      port: values.smtp_port,
      secure: values.smtp_secure,
      authentication: values.smtp_authentication,
      username: values.smtp_username,
      password: values.smtp_password,
      passwordUpdated: values.smtp_password !== initialValues.smtp_password,
      fromEmail,
      replyToEmail
    },
    mailgun: {
      selected: emailDeliveryServiceName === 'mailgun',
      apiKey: values.mailgun_apiKey,
      apiKeyUpdated: values.mailgun_apiKey !== initialValues.mailgun_apiKey,
      domain: values.mailgun_domain,
      fromEmail,
      replyToEmail
    }
  };
}

/**
 * Creates WhatsApp service configuration based on form values
 */
export function createWhatsAppServiceConfig(values, initialValues) {
  if (!values.whatsappActive) {
    return null;
  }

  const templateNames = {
    [WHATSAPP_TEMPLATE_TYPES.INVOICE]: values.whatsappInvoiceTemplate,
    [WHATSAPP_TEMPLATE_TYPES.PAYMENT_NOTICE]:
      values.whatsappPaymentNoticeTemplate,
    [WHATSAPP_TEMPLATE_TYPES.PAYMENT_REMINDER]:
      values.whatsappPaymentReminderTemplate,
    [WHATSAPP_TEMPLATE_TYPES.FINAL_NOTICE]: values.whatsappFinalNoticeTemplate
  };

  return {
    selected: true,
    accessToken: values.whatsappAccessToken,
    accessTokenUpdated:
      values.whatsappAccessToken !== initialValues.whatsappAccessToken,
    phoneNumberId: values.whatsappPhoneNumberId,
    businessAccountId: values.whatsappBusinessAccountId,
    defaultLanguage: values.whatsappTemplateLanguage,
    templates: createWhatsAppTemplateConfig(
      templateNames,
      values.whatsappTemplateLanguage
    )
  };
}

/**
 * Creates B2 storage service configuration based on form values
 */
export function createB2ServiceConfig(values, initialValues) {
  if (!values.b2Active) {
    return null;
  }

  return {
    keyId: values.keyId,
    applicationKey: values.applicationKey,
    keyIdUpdated: values.keyId !== initialValues.keyId,
    applicationKeyUpdated:
      values.applicationKey !== initialValues.applicationKey,
    endpoint: values.endpoint,
    bucket: values.bucket
  };
}

/**
 * Creates complete third party services configuration
 */
export function createThirdPartyConfig(values, initialValues) {
  return {
    thirdParties: {
      ...createEmailServiceConfig(values, initialValues),
      whatsapp: createWhatsAppServiceConfig(values, initialValues),
      b2: createB2ServiceConfig(values, initialValues)
    }
  };
}
