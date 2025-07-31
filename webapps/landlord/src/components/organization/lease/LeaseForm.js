import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import {
  NumberField,
  SelectField,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import { useContext, useMemo } from 'react';

import { observer } from 'mobx-react-lite';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import useTranslation from 'next-translate/useTranslation';

const timeRanges = ['days', 'weeks', 'months', 'years'];

function initValues(lease) {
  const values = {
    name: lease?.name || '',
    description: lease?.description || '',
    numberOfTerms: lease?.numberOfTerms || '',
    timeRange: lease?.timeRange || '',
    active: lease?.active || true
  };

  console.log('=== INIT VALUES DEBUG ===');
  console.log('Input lease:', JSON.stringify(lease, null, 2));
  console.log('Initialized values:', JSON.stringify(values, null, 2));

  return values;
}

function getValidationSchema(newLease, existingLeases) {
  const existingNames = existingLeases
    .filter(({ _id }) => newLease?._id !== _id)
    .map(({ name }) => name);

  console.log('Lease validation - Existing lease names:', existingNames);
  console.log('Lease validation - Current lease:', newLease);

  const schema = Yup.object().shape({
    name: Yup.string().notOneOf(existingNames).required(),
    description: Yup.string(),
    numberOfTerms: Yup.number().integer().min(1).required(),
    timeRange: Yup.string().required(),
    active: Yup.boolean().required()
  });

  console.log('Lease validation schema created');
  return schema;
}

export const validate = (newLease, existingLeases) => {
  const values = initValues(newLease);
  const schema = getValidationSchema(newLease, existingLeases);

  console.log('=== LEASE FORM VALIDATION DEBUG ===');
  console.log('Values being validated:', JSON.stringify(values, null, 2));
  console.log('New lease data:', JSON.stringify(newLease, null, 2));

  return schema.validate(values, { abortEarly: false }).catch((error) => {
    console.error('=== VALIDATION ERRORS DETAILS ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    if (error.inner) {
      console.error('Individual field errors:');
      error.inner.forEach((err, index) => {
        console.error(
          `  ${index + 1}. Field: ${err.path}, Error: ${err.message}`
        );
      });
    }
    console.error('Full error object:', error);
    throw error;
  });
};

const LeaseForm = ({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  console.log('=== LEASE FORM COMPONENT DEBUG ===');
  console.log(
    'Store lease selected:',
    JSON.stringify(store.lease.selected, null, 2)
  );
  console.log('Store lease items:', store.lease.items?.length || 0, 'items');

  const validationSchema = useMemo(() => {
    try {
      const schema = getValidationSchema(
        store.lease.selected,
        store.lease.items
      );
      console.log('Validation schema created successfully');
      return schema;
    } catch (error) {
      console.error('Error creating validation schema:', error);
      throw error;
    }
  }, [store.lease.selected, store.lease.items]);

  const initialValues = useMemo(() => {
    try {
      const values = initValues(store.lease.selected);
      console.log('Initial values created successfully:', values);
      return values;
    } catch (error) {
      console.error('Error creating initial values:', error);
      throw error;
    }
  }, [store.lease.selected]);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values, actions) => {
        console.log('Lease form submission - Values:', values);
        console.log('Lease form submission - Errors:', actions.errors);
        console.log('Lease form validation schema:', validationSchema);
        onSubmit(values, actions);
      }}
    >
      {({ values, isSubmitting, errors, touched }) => {
        // Debug logging for form state
        if (Object.keys(errors).length > 0) {
          console.log('Lease form validation errors:', errors);
          console.log('Lease form touched fields:', touched);
          console.log('Lease form current values:', values);
        }

        return (
          <>
            {values.usedByTenants && (
              <div className="text-sm text-warning mb-4">
                {t(
                  'This contract is currently used, only some fields can be updated'
                )}
              </div>
            )}
            <Form autoComplete="off">
              <Section
                label={t('Contract information')}
                visible={!store.lease.selected?.stepperMode}
              >
                <TextField label={t('Name')} name="name" />
                <TextField
                  label={t('Description')}
                  name="description"
                  multiline
                  rows={2}
                />
                <div className="sm:flex sm:flex-row sm:gap-2 ">
                  <SelectField
                    label={t('Schedule type')}
                    name="timeRange"
                    values={timeRanges.map((timeRange) => ({
                      id: timeRange,
                      label: t(timeRange),
                      value: timeRange
                    }))}
                    disabled={values.usedByTenants}
                  />
                  <NumberField
                    label={t('Number of terms')}
                    name="numberOfTerms"
                    disabled={values.usedByTenants}
                  />
                </div>
              </Section>
              <SubmitButton
                label={!isSubmitting ? t('Save') : t('Submitting')}
              />
            </Form>
          </>
        );
      }}
    </Formik>
  );
};

export default observer(LeaseForm);
