// TypeScript interfaces for third party configurations

export interface WhatsAppTemplate {
  name: string;
  language: string;
  parameters: string[];
}

export interface WhatsAppConfig {
  selected: boolean;
  accessToken: string;
  accessTokenUpdated?: boolean;
  phoneNumberId: string;
  businessAccountId: string;
  defaultLanguage: string;
  templates: {
    invoice: WhatsAppTemplate;
    paymentNotice: WhatsAppTemplate;
    paymentReminder: WhatsAppTemplate;
    finalNotice: WhatsAppTemplate;
    login: WhatsAppTemplate;
  };
}

export interface EmailServiceConfig {
  selected: boolean;
  fromEmail: string;
  replyToEmail: string;
}

export interface GmailConfig extends EmailServiceConfig {
  email: string;
  appPassword: string;
  appPasswordUpdated?: boolean;
}

export interface SMTPConfig extends EmailServiceConfig {
  server: string;
  port: number;
  secure: boolean;
  authentication: boolean;
  username: string;
  password: string;
  passwordUpdated?: boolean;
}

export interface MailgunConfig extends EmailServiceConfig {
  apiKey: string;
  apiKeyUpdated?: boolean;
  domain: string;
}

export interface B2Config {
  keyId: string;
  applicationKey: string;
  keyIdUpdated?: boolean;
  applicationKeyUpdated?: boolean;
  endpoint: string;
  bucket: string;
}

export interface ThirdPartiesConfig {
  gmail: GmailConfig | null;
  smtp: SMTPConfig | null;
  mailgun: MailgunConfig | null;
  whatsapp: WhatsAppConfig | null;
  b2: B2Config | null;
}

export interface FormValues {
  emailDeliveryServiceActive: boolean;
  emailDeliveryServiceName?: string;
  gmail_email: string;
  gmail_appPassword: string;
  smtp_server: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_authentication: boolean;
  smtp_username: string;
  smtp_password: string;
  mailgun_apiKey: string;
  mailgun_domain: string;
  fromEmail: string;
  replyToEmail: string;
  whatsappActive: boolean;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappBusinessAccountId: string;
  whatsappInvoiceTemplate: string;
  whatsappPaymentNoticeTemplate: string;
  whatsappPaymentReminderTemplate: string;
  whatsappFinalNoticeTemplate: string;
  whatsappTemplateLanguage: string;
  b2Active: boolean;
  keyId: string;
  applicationKey: string;
  endpoint: string;
  bucket: string;
}
