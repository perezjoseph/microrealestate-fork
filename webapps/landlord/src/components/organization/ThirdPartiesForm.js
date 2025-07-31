import { Form, Formik, validateYupSchema, yupToFormErrors } from 'formik';
import { mergeOrganization, updateStoreOrganization } from './utils';
import {
  NumberField,
  RadioField,
  RadioFieldGroup,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import { QueryKeys, updateOrganization } from '../../utils/restcalls';
import { useCallback, useContext, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from '../Link';
import { Section } from '../formfields/Section';
import { StoreContext } from '../../store';
import { SwitchField } from '../formfields/SwitchField';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';
import { thirdPartiesValidationSchema } from './validationSchemas';
import { createInitialValues } from './initialValuesUtils';
import { createThirdPartyConfig } from './thirdPartyConfigUtils';

export default function ThirdPartiesForm({ organization }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const queryClient = useQueryClient();
  const { mutateAsync, isError } = useMutation({
    mutationFn: updateOrganization,
    onSuccess: (updatedOrganization) => {
      updateStoreOrganization(store, updatedOrganization);
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ORGANIZATIONS] });
    }
  });

  if (isError) {
    toast.error(t('Error updating organization'));
  }

  const initialValues = useMemo(() => {
    let emailDeliveryServiceName;
    let fromEmail = organization.contacts?.[0]?.email || '';
    let replyToEmail = organization.contacts?.[0]?.email || '';

    if (organization.thirdParties?.gmail?.selected) {
      emailDeliveryServiceName = 'gmail';
      fromEmail = organization.thirdParties?.gmail?.fromEmail || '';
      replyToEmail = organization.thirdParties?.gmail?.replyToEmail || '';
    } else if (organization.thirdParties?.smtp?.selected) {
      emailDeliveryServiceName = 'smtp';
      fromEmail = organization.thirdParties?.smtp?.fromEmail || '';
      replyToEmail = organization.thirdParties?.smtp?.replyToEmail || '';
    } else if (organization.thirdParties?.mailgun?.selected) {
      emailDeliveryServiceName = 'mailgun';
      fromEmail = organization.thirdParties?.mailgun?.fromEmail || '';
      replyToEmail = organization.thirdParties?.mailgun?.replyToEmail || '';
    }

    return {
      emailDeliveryServiceActive:
        !!organization.thirdParties?.gmail?.selected ||
        !!organization.thirdParties?.smtp?.selected ||
        !!organization.thirdParties?.mailgun?.selected,
      emailDeliveryServiceName,
      gmail_email: organization.thirdParties?.gmail?.email || '',
      gmail_appPassword: organization.thirdParties?.gmail?.appPassword || '',

      smtp_server: organization.thirdParties?.smtp?.server || '',
      smtp_port: organization.thirdParties?.smtp?.port || 25,
      smtp_secure: !!organization.thirdParties?.smtp?.secure,
      smtp_authentication:
        organization.thirdParties?.smtp?.authentication === undefined
          ? true
          : organization.thirdParties.smtp.authentication,
      smtp_username: organization.thirdParties?.smtp?.username || '',
      smtp_password: organization.thirdParties?.smtp?.password || '',

      mailgun_apiKey: organization.thirdParties?.mailgun?.apiKey || '',
      mailgun_domain: organization.thirdParties?.mailgun?.domain || '',

      fromEmail,
      replyToEmail,

      // WhatsApp configuration
      whatsappActive:
        !!organization.thirdParties?.whatsapp?.selected ||
        !!organization.thirdParties?.whatsapp?.accessToken,
      whatsappAccessToken:
        organization.thirdParties?.whatsapp?.accessToken || '',
      whatsappPhoneNumberId:
        organization.thirdParties?.whatsapp?.phoneNumberId || '',
      whatsappBusinessAccountId:
        organization.thirdParties?.whatsapp?.businessAccountId || '',
      whatsappInvoiceTemplate:
        organization.thirdParties?.whatsapp?.templates?.invoice?.name || '',
      whatsappPaymentNoticeTemplate:
        organization.thirdParties?.whatsapp?.templates?.paymentNotice?.name ||
        '',
      whatsappPaymentReminderTemplate:
        organization.thirdParties?.whatsapp?.templates?.paymentReminder?.name ||
        '',
      whatsappFinalNoticeTemplate:
        organization.thirdParties?.whatsapp?.templates?.finalNotice?.name || '',
      whatsappTemplateLanguage:
        organization.thirdParties?.whatsapp?.defaultLanguage || 'en_US',

      b2Active: !!organization.thirdParties?.b2?.keyId,
      keyId: organization.thirdParties?.b2?.keyId,
      applicationKey: organization.thirdParties?.b2?.applicationKey,
      endpoint: organization.thirdParties?.b2?.endpoint,
      bucket: organization.thirdParties?.b2?.bucket
    };
  }, [
    organization.contacts,
    organization.thirdParties?.b2?.applicationKey,
    organization.thirdParties?.b2?.bucket,
    organization.thirdParties?.b2?.endpoint,
    organization.thirdParties?.b2?.keyId,
    organization.thirdParties?.gmail?.appPassword,
    organization.thirdParties?.gmail?.email,
    organization.thirdParties?.gmail?.fromEmail,
    organization.thirdParties?.gmail?.replyToEmail,
    organization.thirdParties?.gmail?.selected,
    organization.thirdParties?.mailgun?.apiKey,
    organization.thirdParties?.mailgun?.domain,
    organization.thirdParties?.mailgun?.fromEmail,
    organization.thirdParties?.mailgun?.replyToEmail,
    organization.thirdParties?.mailgun?.selected,
    organization.thirdParties?.smtp?.authentication,
    organization.thirdParties?.smtp?.fromEmail,
    organization.thirdParties?.smtp?.password,
    organization.thirdParties?.smtp?.port,
    organization.thirdParties?.smtp?.replyToEmail,
    organization.thirdParties?.smtp?.secure,
    organization.thirdParties?.smtp?.selected,
    organization.thirdParties?.smtp?.server,
    organization.thirdParties?.smtp?.username,
    organization.thirdParties?.whatsapp?.selected,
    organization.thirdParties?.whatsapp?.accessToken,
    organization.thirdParties?.whatsapp?.phoneNumberId,
    organization.thirdParties?.whatsapp?.businessAccountId,
    organization.thirdParties?.whatsapp?.defaultLanguage,
    organization.thirdParties?.whatsapp?.templates?.invoice?.name,
    organization.thirdParties?.whatsapp?.templates?.paymentNotice?.name,
    organization.thirdParties?.whatsapp?.templates?.paymentReminder?.name,
    organization.thirdParties?.whatsapp?.templates?.finalNotice?.name
  ]);

  const onSubmit = useCallback(
    async (values) => {
      const formData = createThirdPartyConfig(values, initialValues);
      await mutateAsync({
        store,
        organization: mergeOrganization(organization, formData)
      });
    },
    [mutateAsync, store, organization, initialValues]
  );

  const handleFormValidation = useCallback((value) => {
    try {
      validateYupSchema(value, thirdPartiesValidationSchema, true, value);
    } catch (err) {
      console.error(err);
      return yupToFormErrors(err); //for rendering validation errors
    }
    return {};
  }, []);

  return (
    <Formik
      initialValues={initialValues}
      validate={handleFormValidation}
      onSubmit={onSubmit}
    >
      {({ values, isSubmitting }) => {
        return (
          <Form autoComplete="off">
            <Section
              label={t('Email delivery service')}
              description={t(
                'Configuration required for sending invoices, notices and all kind of communication to the tenants via email'
              )}
              withSwitch
              switchName="emailDeliveryServiceActive"
            >
              {values?.emailDeliveryServiceActive ? (
                <>
                  <RadioFieldGroup
                    label={t('Service')}
                    name="emailDeliveryServiceName"
                  >
                    <RadioField value="gmail" label="Gmail" />
                    <RadioField value="smtp" label="SMTP" />
                    <RadioField value="mailgun" label="Mailgun" />
                  </RadioFieldGroup>
                  {values?.emailDeliveryServiceName === 'gmail' && (
                    <>
                      <Link
                        href={`https://support.google.com/accounts/answer/185833?hl=${organization.locale}`}
                        target="_blank"
                        rel="noreferrer"
                        className="my-2"
                      >
                        {t('How to use the App password with Gmail')}
                      </Link>
                      <TextField label={t('Email')} name="gmail_email" />
                      <TextField
                        label={t('Application password')}
                        name="gmail_appPassword"
                        type="password"
                        showHidePassword={
                          values.appPassword !== initialValues.appPassword
                        }
                      />
                    </>
                  )}
                  {values?.emailDeliveryServiceName === 'smtp' && (
                    <>
                      <TextField label={t('Server')} name="smtp_server" />
                      <NumberField
                        label={t('Port')}
                        name="smtp_port"
                        min="1"
                        max="65535"
                      />
                      <SwitchField
                        label={t(
                          'Enable explicit TLS (Implicit TLS / StartTLS is always used when supported by the SMTP)'
                        )}
                        name="smtp_secure"
                      />
                      <br />
                      <SwitchField
                        label={t('Use authentication')}
                        name="smtp_authentication"
                      />
                      {values?.smtp_authentication ? (
                        <>
                          <TextField
                            label={t('Username')}
                            name="smtp_username"
                          />
                          <TextField
                            label={t('Password')}
                            name="smtp_password"
                            type="password"
                            showHidePassword={
                              values.password !== initialValues.password
                            }
                          />
                        </>
                      ) : null}
                    </>
                  )}
                  {values?.emailDeliveryServiceName === 'mailgun' && (
                    <>
                      <Link
                        href={`https://help.mailgun.com/hc/${organization.locale.toLowerCase()}/articles/203380100-Where-can-I-find-my-API-key-and-SMTP-credentials-`}
                        target="_blank"
                        rel="noreferrer"
                        className="my-2"
                      >
                        {t('How to use the API key and domain with Mailgun')}
                      </Link>
                      <TextField
                        label={t('Private API key')}
                        name="mailgun_apiKey"
                        type="password"
                        showHidePassword={
                          values.apiKey !== initialValues.apiKey
                        }
                      />
                      <TextField label={t('Domain')} name="mailgun_domain" />
                    </>
                  )}
                  <TextField label={t('From Email')} name="fromEmail" />
                  <TextField label={t('Reply to email')} name="replyToEmail" />
                </>
              ) : null}
            </Section>
            <Section
              label={t('WhatsApp Business API')}
              description={t(
                'Configuration for sending invoices, notices and communication via WhatsApp'
              )}
              withSwitch
              switchName="whatsappActive"
            >
              {values?.whatsappActive ? (
                <>
                  <Link
                    href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started"
                    target="_blank"
                    rel="noreferrer"
                    className="my-2"
                  >
                    {t('How to set up WhatsApp Business API')}
                  </Link>
                  <TextField
                    label={t('Access Token')}
                    name="whatsappAccessToken"
                    type="password"
                    showHidePassword={
                      values.whatsappAccessToken !==
                      initialValues.whatsappAccessToken
                    }
                  />
                  <TextField
                    label={t('Phone Number ID')}
                    name="whatsappPhoneNumberId"
                  />
                  <TextField
                    label={t('Business Account ID')}
                    name="whatsappBusinessAccountId"
                  />
                  <TextField
                    label={t('Invoice Template Name')}
                    name="whatsappInvoiceTemplate"
                    placeholder="invoice_notification"
                  />
                  <TextField
                    label={t('Payment Notice Template Name')}
                    name="whatsappPaymentNoticeTemplate"
                    placeholder="payment_notice"
                  />
                  <TextField
                    label={t('Payment Reminder Template Name')}
                    name="whatsappPaymentReminderTemplate"
                    placeholder="payment_reminder"
                  />
                  <TextField
                    label={t('Final Notice Template Name')}
                    name="whatsappFinalNoticeTemplate"
                    placeholder="final_notice"
                  />
                  <TextField
                    label={t('Template Language Code')}
                    name="whatsappTemplateLanguage"
                    placeholder="en_US"
                  />
                </>
              ) : null}
            </Section>
            <Section
              label="Backblaze B2 Cloud Storage"
              description={t(
                'Configuration required to store documents in the cloud'
              )}
              withSwitch
              switchName="b2Active"
            >
              {values?.b2Active ? (
                <>
                  <TextField
                    label="KeyId"
                    name="keyId"
                    type="password"
                    showHidePassword={values.keyId !== initialValues.keyId}
                  />
                  <TextField
                    label="ApplicationKey"
                    name="applicationKey"
                    type="password"
                    showHidePassword={
                      values.applicationKey !== initialValues.applicationKey
                    }
                  />
                  <TextField label={t('Bucket')} name="bucket" />
                  <TextField label={t('Bucket endpoint')} name="endpoint" />
                </>
              ) : null}
            </Section>
            <SubmitButton
              size="large"
              label={!isSubmitting ? t('Save') : t('Saving')}
            />
          </Form>
        );
      }}
    </Formik>
  );
}
