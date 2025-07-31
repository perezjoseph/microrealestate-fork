import * as Yup from 'yup';

// Helper function for conditional required validation
const conditionalRequired = (condition, message = 'This field is required') =>
  Yup.string().when(condition.field, {
    is: condition.value,
    then: Yup.string().required(message)
  });

// Helper function for conditional email validation
const conditionalEmail = (condition, message = 'Please enter a valid email') =>
  Yup.string().when(condition.field, {
    is: condition.value,
    then: Yup.string().email(message).required(message)
  });

// Email service validation schemas
const emailServiceValidation = {
  emailDeliveryServiceActive: Yup.boolean().required(),
  emailDeliveryServiceName: conditionalRequired({
    field: 'emailDeliveryServiceActive',
    value: true
  }),
  fromEmail: conditionalEmail({
    field: 'emailDeliveryServiceActive',
    value: true
  }),
  replyToEmail: conditionalEmail({
    field: 'emailDeliveryServiceActive',
    value: true
  })
};

// Gmail specific validation
const gmailValidation = {
  gmail_email: conditionalEmail({
    field: 'emailDeliveryServiceName',
    value: 'gmail'
  }),
  gmail_appPassword: conditionalRequired({
    field: 'emailDeliveryServiceName',
    value: 'gmail'
  })
};

// SMTP specific validation
const smtpValidation = {
  smtp_server: conditionalRequired({
    field: 'emailDeliveryServiceName',
    value: 'smtp'
  }),
  smtp_port: Yup.number().when('emailDeliveryServiceName', {
    is: 'smtp',
    then: Yup.number().required().integer().min(1).max(65535)
  }),
  smtp_secure: Yup.boolean().when('emailDeliveryServiceName', {
    is: 'smtp',
    then: Yup.boolean().required()
  }),
  smtp_authentication: Yup.boolean().when('emailDeliveryServiceName', {
    is: 'smtp',
    then: Yup.boolean().required()
  }),
  smtp_username: Yup.string().when(
    ['emailDeliveryServiceName', 'smtp_authentication'],
    {
      is: (scheme, auth) => scheme === 'smtp' && auth,
      then: Yup.string().required()
    }
  ),
  smtp_password: Yup.string().when(
    ['emailDeliveryServiceName', 'smtp_authentication'],
    {
      is: (scheme, auth) => scheme === 'smtp' && auth,
      then: Yup.string().required()
    }
  )
};

// Mailgun specific validation
const mailgunValidation = {
  mailgun_apiKey: conditionalRequired({
    field: 'emailDeliveryServiceName',
    value: 'mailgun'
  }),
  mailgun_domain: conditionalRequired({
    field: 'emailDeliveryServiceName',
    value: 'mailgun'
  })
};

// WhatsApp validation
const whatsappValidation = {
  whatsappActive: Yup.boolean(),
  whatsappAccessToken: conditionalRequired({
    field: 'whatsappActive',
    value: true
  }),
  whatsappPhoneNumberId: conditionalRequired({
    field: 'whatsappActive',
    value: true
  }),
  whatsappBusinessAccountId: conditionalRequired({
    field: 'whatsappActive',
    value: true
  }),
  whatsappInvoiceTemplate: conditionalRequired({
    field: 'whatsappActive',
    value: true
  }),
  whatsappPaymentNoticeTemplate: conditionalRequired({
    field: 'whatsappActive',
    value: true
  }),
  whatsappPaymentReminderTemplate: conditionalRequired({
    field: 'whatsappActive',
    value: true
  }),
  whatsappFinalNoticeTemplate: conditionalRequired({
    field: 'whatsappActive',
    value: true
  }),
  whatsappTemplateLanguage: conditionalRequired({
    field: 'whatsappActive',
    value: true
  })
};

// B2 storage validation
const b2Validation = {
  b2Active: Yup.boolean().required(),
  keyId: conditionalRequired({
    field: 'b2Active',
    value: true
  }),
  applicationKey: conditionalRequired({
    field: 'b2Active',
    value: true
  }),
  endpoint: conditionalRequired({
    field: 'b2Active',
    value: true
  }),
  bucket: conditionalRequired({
    field: 'b2Active',
    value: true
  })
};

// Combined validation schema
export const thirdPartiesValidationSchema = Yup.object().shape({
  ...emailServiceValidation,
  ...gmailValidation,
  ...smtpValidation,
  ...mailgunValidation,
  ...whatsappValidation,
  ...b2Validation
});
