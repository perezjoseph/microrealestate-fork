import * as Yup from 'yup';
import {
  AddressField,
  ContactField,
  RadioField,
  RadioFieldGroup,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import { Form, Formik } from 'formik';
import { useContext, useMemo } from 'react';
import { ArrayField } from '../../formfields/ArrayField';
import { nanoid } from 'nanoid';
import { observer } from 'mobx-react-lite';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import useTranslation from 'next-translate/useTranslation';

const createValidationSchema = (t) =>
  Yup.object().shape({
    name: Yup.string().required(t('This field is required')),
    isCompany: Yup.string().required(t('This field is required')),
    legalRepresentative: Yup.string().when('isCompany', {
      is: 'true',
      then: (schema) => schema.required(t('This field is required')),
      otherwise: (schema) => schema
    }),
    legalStructure: Yup.string().when('isCompany', {
      is: 'true',
      then: (schema) => schema.required(t('This field is required')),
      otherwise: (schema) => schema
    }),
    ein: Yup.string().when('isCompany', {
      is: 'true',
      then: (schema) => schema.required(t('This field is required')),
      otherwise: (schema) => schema
    }),
    dos: Yup.string().when('isCompany', {
      is: 'true',
      then: (schema) => schema,
      otherwise: (schema) => schema
    }),
    contacts: Yup.array().of(
      Yup.object()
        .shape({
          key: Yup.string().required(),
          contact: Yup.string().required(t('This field is required')),
          email: Yup.string()
            .email(t('Please enter a valid email address'))
            .when(['phone1', 'phone2', 'whatsapp1', 'whatsapp2'], {
              is: (phone1, phone2, whatsapp1, whatsapp2) => {
                // Email is required only if no WhatsApp-enabled phone is provided
                const hasWhatsAppPhone =
                  (phone1 && whatsapp1) || (phone2 && whatsapp2);
                return !hasWhatsAppPhone;
              },
              then: (schema) => schema.required(t('This field is required')),
              otherwise: (schema) => schema
            }),
          phone1: Yup.string(),
          phone2: Yup.string(),
          whatsapp1: Yup.boolean(),
          whatsapp2: Yup.boolean()
        })
        .test(
          'contact-method',
          t('Either email or WhatsApp phone number is required'),
          function (value) {
            const { email, phone1, phone2, whatsapp1, whatsapp2 } = value;
            const hasEmail = email && email.trim() !== '';
            const hasWhatsAppPhone =
              (phone1 && whatsapp1) || (phone2 && whatsapp2);

            // At least one contact method must be available
            return hasEmail || hasWhatsAppPhone;
          }
        )
    ),
    address: Yup.object().shape({
      street1: Yup.string().required(t('This field is required')),
      street2: Yup.string(),
      city: Yup.string().required(t('This field is required')),
      zipCode: Yup.string().required(t('This field is required')),
      state: Yup.string(),
      country: Yup.string().required(t('This field is required'))
    })
  });

const emptyContact = {
  key: nanoid(),
  contact: '',
  email: '',
  phone1: '',
  phone2: '',
  whatsapp1: false,
  whatsapp2: false
};

const initValues = (tenant) => {
  return {
    name: tenant?.name || '',
    isCompany: tenant?.isCompany ? 'true' : 'false',
    legalRepresentative: tenant?.manager || '',
    legalStructure: tenant?.legalForm || '',
    ein: tenant?.siret || '',
    dos: tenant?.rcs || '',
    capital: tenant?.capital || '',
    contacts: tenant?.contacts?.length
      ? tenant.contacts.map(
          ({
            contact,
            email,
            phone,
            phone1,
            phone2,
            whatsapp1,
            whatsapp2
          }) => ({
            key: nanoid(),
            contact,
            email,
            phone1: phone1 || phone,
            phone2: phone2 || '',
            whatsapp1: whatsapp1 || false,
            whatsapp2: whatsapp2 || false
          })
        )
      : [{ ...emptyContact }],
    address: {
      street1: tenant?.street1 || '',
      street2: tenant?.street2 || '',
      city: tenant?.city || '',
      zipCode: tenant?.zipCode || '',
      state: tenant?.state || '',
      country: tenant?.country || ''
    }
  };
};

export const validate = (tenant, t) => {
  return createValidationSchema(t).validate(initValues(tenant));
};

const TenantForm = observer(({ readOnly, onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const initialValues = useMemo(
    () => initValues(store.tenant?.selected),
    [store.tenant?.selected]
  );

  const validationSchema = useMemo(() => createValidationSchema(t), [t]);

  const _onSubmit = async (tenant) => {
    await onSubmit({
      name: tenant.name,
      isCompany: tenant.isCompany === 'true',
      company: tenant.isCompany === 'true' ? tenant.name : '',
      manager:
        tenant.isCompany === 'true' ? tenant.legalRepresentative : tenant.name,
      legalForm: tenant.isCompany === 'true' ? tenant.legalStructure : '',
      siret: tenant.isCompany === 'true' ? tenant.ein : '',
      rcs: tenant.isCompany === 'true' ? tenant.dos : '',
      capital: tenant.isCompany === 'true' ? tenant.capital : '',
      street1: tenant.address.street1,
      street2: tenant.address.street2 || '',
      zipCode: tenant.address.zipCode,
      city: tenant.address.city,
      state: tenant.address.state,
      country: tenant.address.country,
      contacts: tenant.contacts
        .filter(({ contact }) => !!contact)
        .map(({ contact, email, phone1, phone2, whatsapp1, whatsapp2 }) => {
          return {
            contact,
            email,
            phone1,
            phone2,
            whatsapp1: whatsapp1 || false,
            whatsapp2: whatsapp2 || false
          };
        })
    });
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={_onSubmit}
    >
      {({ values, isSubmitting }) => {
        return (
          <Form autoComplete="off">
            <Section
              label={t('Tenant information')}
              visible={!store.tenant.selected.stepperMode}
            >
              <TextField label={t('Name')} name="name" disabled={readOnly} />
              <RadioFieldGroup
                aria-label="organization type"
                label={t('The tenant belongs to')}
                name="isCompany"
              >
                <RadioField
                  value="false"
                  label={t('A personal account')}
                  disabled={readOnly}
                  data-cy="tenantIsPersonalAccount"
                />
                <RadioField
                  value="true"
                  label={t('A business or an institution')}
                  disabled={readOnly}
                  data-cy="tenantIsBusinessAccount"
                />
              </RadioFieldGroup>
              {values.isCompany === 'true' && (
                <>
                  <TextField
                    label={t('Legal representative')}
                    name="legalRepresentative"
                    disabled={readOnly}
                  />
                  <TextField
                    label={t('Legal structure')}
                    name="legalStructure"
                    disabled={readOnly}
                  />
                  <TextField
                    label={t('Employer Identification Number')}
                    name="ein"
                    disabled={readOnly}
                  />
                  <TextField
                    label={t('Administrative jurisdiction')}
                    name="dos"
                    disabled={readOnly}
                  />
                  <TextField
                    label={t('Capital')}
                    name="capital"
                    disabled={readOnly}
                  />
                </>
              )}
            </Section>
            <Section label={t('Address')}>
              <AddressField disabled={readOnly} />
            </Section>
            <Section
              label={t('Contacts')}
              description={t(
                "The contacts will receive the invoices and will be able to access the tenant's portal"
              )}
            >
              <ArrayField
                name="contacts"
                addLabel={t('Add a contact')}
                emptyItem={() => ({ ...emptyContact, key: nanoid() })}
                items={values.contacts}
                readOnly={readOnly}
                renderTitle={(contact, index) =>
                  t('Contact #{{count}}', { count: index + 1 })
                }
                renderContent={(contact, index) => (
                  <ContactField
                    contactName={`contacts[${index}].contact`}
                    emailName={`contacts[${index}].email`}
                    phone1Name={`contacts[${index}].phone1`}
                    phone2Name={`contacts[${index}].phone2`}
                    whatsapp1Name={`contacts[${index}].whatsapp1`}
                    whatsapp2Name={`contacts[${index}].whatsapp2`}
                    disabled={readOnly}
                  />
                )}
              />
            </Section>
            {!readOnly && (
              <SubmitButton
                size="large"
                label={!isSubmitting ? t('Save') : t('Saving')}
              />
            )}
          </Form>
        );
      }}
    </Formik>
  );
});

export default TenantForm;
