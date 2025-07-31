import * as Yup from 'yup';
import {
  DateField,
  NumberField,
  RangeDateField,
  SelectField,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import { Form, Formik, validateYupSchema, yupToFormErrors } from 'formik';
import {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { ArrayField } from '../../formfields/ArrayField';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { observer } from 'mobx-react-lite';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  leaseId: Yup.string().required('Lease contract is required'),
  beginDate: Yup.date().required('Start date is required'),
  endDate: Yup.date()
    .required('End date is required')
    .min(Yup.ref('beginDate'), 'End date must be after start date'),
  terminationDate: Yup.date()
    .min(Yup.ref('beginDate'))
    .max(Yup.ref('endDate'))
    .nullable(),
  properties: Yup.array()
    .of(
      Yup.object().shape({
        _id: Yup.string().required('Property selection is required'),
        rent: Yup.number()
          .moreThan(0, 'Rent must be greater than 0')
          .required('Rent is required'),
        expenses: Yup.array().of(
          Yup.object().shape({
            key: Yup.string().required(),
            title: Yup.mixed().when('amount', {
              is: (val) => val > 0,
              then: Yup.string().required()
            }),
            amount: Yup.number().min(0),
            beginDate: Yup.date()
              .nullable()
              .when('amount', {
                is: (val) => val > 0,
                then: Yup.date().required()
              }),
            endDate: Yup.date()
              .nullable()
              .when('amount', {
                is: (val) => val > 0,
                then: Yup.date().required()
              })
          })
        ),
        entryDate: Yup.date()
          .required()
          .test(
            'entryDate',
            'Date not included in the contract date range',
            (value, context) => {
              const beginDate = context.options.context.beginDate;
              if (value && beginDate) {
                return moment(value).isSameOrAfter(beginDate);
              }
              return true;
            }
          ),
        exitDate: Yup.date()
          .min(Yup.ref('entryDate'))
          .required()
          .test(
            'exitDate',
            'Date not included in the contract date range',
            (value, context) => {
              const endDate = context.options.context.endDate;
              if (value && endDate) {
                return moment(value).isSameOrBefore(endDate);
              }
              return true;
            }
          )
      })
    )
    .min(1, 'At least one property must be selected'),
  guaranty: Yup.number().min(0).required(),
  guarantyPayback: Yup.number().min(0)
});

const emptyExpense = (beginDate = null, endDate = null) => ({
  key: nanoid(),
  title: '',
  amount: 0,
  beginDate: beginDate,
  endDate: endDate
});

const emptyProperty = (beginDate = null, endDate = null) => ({
  key: nanoid(),
  _id: '',
  rent: 0,
  expenses: [emptyExpense(beginDate, endDate)]
});

const initValues = (tenant) => {
  const beginDate = tenant?.beginDate
    ? moment(tenant.beginDate, 'DD/MM/YYYY').startOf('day')
    : null;
  const endDate = tenant?.endDate
    ? moment(tenant.endDate, 'DD/MM/YYYY').endOf('day')
    : null;

  const initialValues = {
    leaseId: tenant?.leaseId || '',
    beginDate,
    endDate,
    terminated: !!tenant?.terminationDate,
    terminationDate: tenant?.terminationDate
      ? moment(tenant.terminationDate, 'DD/MM/YYYY').endOf('day')
      : null,
    properties: tenant?.properties?.length
      ? tenant.properties.map((property) => {
          return {
            key: property.property._id,
            _id: property.property._id,
            rent: property.rent || '',
            expenses: property.expenses?.length
              ? property.expenses.map((expense) => ({
                  ...expense,
                  key: expense.key || nanoid(),
                  beginDate: expense.beginDate
                    ? moment(expense.beginDate, 'DD/MM/YYYY').isValid()
                      ? moment(expense.beginDate, 'DD/MM/YYYY')
                      : beginDate
                    : beginDate,
                  endDate: expense.endDate
                    ? moment(expense.endDate, 'DD/MM/YYYY').isValid()
                      ? moment(expense.endDate, 'DD/MM/YYYY')
                      : endDate
                    : endDate
                }))
              : [emptyExpense(beginDate, endDate)],
            entryDate: property.entryDate
              ? moment(property.entryDate, 'DD/MM/YYYY').isValid()
                ? moment(property.entryDate, 'DD/MM/YYYY')
                : beginDate
              : beginDate,
            exitDate: property.exitDate
              ? moment(property.exitDate, 'DD/MM/YYYY').isValid()
                ? moment(property.exitDate, 'DD/MM/YYYY')
                : endDate
              : endDate
          };
        })
      : [
          {
            ...emptyProperty(beginDate, endDate),
            entryDate: beginDate,
            exitDate: endDate
          }
        ],
    guaranty: tenant?.guaranty || 0,
    guarantyPayback: tenant?.guarantyPayback || 0
  };

  return initialValues;
};

export const validate = (tenant) => {
  const values = initValues(tenant);
  return validationSchema.validate(values, {
    context: {
      beginDate: values.beginDate,
      endDate: values.endDate
    }
  });
};

function LeaseContractForm({ readOnly, onSubmit }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [contractDuration, setContractDuration] = useState();

  useEffect(() => {
    const lease = store.tenant.selected?.lease;
    if (lease) {
      setContractDuration(
        moment.duration(lease.numberOfTerms, lease.timeRange)
      );
    } else {
      setContractDuration();
    }
  }, [store.tenant.selected?.lease]);

  const initialValues = useMemo(() => {
    const initialValues = initValues(store.tenant?.selected);

    return initialValues;
  }, [store.tenant.selected]);

  const availableLeases = useMemo(() => {
    return store.lease.items.map(({ _id, name, active }) => ({
      id: _id,
      value: _id,
      label: name,
      disabled: !active
    }));
  }, [store.lease.items]);

  const availableProperties = useMemo(() => {
    const currentProperties = store.tenant.selected?.properties
      ? store.tenant.selected.properties.map(({ propertyId }) => propertyId)
      : [];
    return [
      { id: '', label: '', value: '' },
      ...store.property.items.map(({ _id, name, status, occupantLabel }) => ({
        id: _id,
        value: _id,
        label: t('{{name}} - {{status}}', {
          name,
          status:
            status === 'occupied'
              ? !currentProperties.includes(_id)
                ? t('occupied by {{tenantName}}', {
                    tenantName: occupantLabel
                  })
                : t('occupied by current tenant')
              : t('vacant')
        })
      }))
    ];
  }, [t, store.tenant.selected.properties, store.property.items]);

  const _onSubmit = useCallback(
    async (lease) => {
      try {
        console.log('=== FORM SUBMISSION DEBUG ===');
        console.log('Raw form data received:', JSON.stringify(lease, null, 2));
        console.log(
          'leaseId type:',
          typeof lease.leaseId,
          'value:',
          lease.leaseId
        );
        console.log(
          'beginDate type:',
          typeof lease.beginDate,
          'value:',
          lease.beginDate
        );
        console.log(
          'endDate type:',
          typeof lease.endDate,
          'value:',
          lease.endDate
        );
        console.log('properties length:', lease.properties?.length);
        if (lease.properties?.length > 0) {
          lease.properties.forEach((prop, index) => {
            console.log(`Property ${index}:`, {
              _id: prop._id,
              rent: prop.rent,
              entryDate: prop.entryDate,
              exitDate: prop.exitDate
            });
          });
        }

        const selectedLease = store.lease.items.find(
          ({ _id }) => _id === lease.leaseId
        );
        if (!selectedLease) {
          throw new Error('Selected lease not found');
        }

        const submissionData = {
          leaseId: lease.leaseId,
          frequency: selectedLease.timeRange,
          beginDate: lease.beginDate?.format('DD/MM/YYYY') || '',
          endDate: lease.endDate?.format('DD/MM/YYYY') || '',
          terminationDate: lease.terminationDate?.format('DD/MM/YYYY') || '',
          guaranty: lease.guaranty || 0,
          guarantyPayback: lease.guarantyPayback || 0,
          properties: lease.properties
            .filter((property) => !!property._id)
            .map((property) => {
              return {
                propertyId: property._id,
                rent: property.rent,
                expenses: property.expenses.length
                  ? property.expenses.map((expense) => ({
                      ...expense,
                      beginDate: expense.beginDate?.format('DD/MM/YYYY'),
                      endDate: expense.endDate?.format('DD/MM/YYYY')
                    }))
                  : [],
                entryDate: property.entryDate?.format('DD/MM/YYYY'),
                exitDate: property.exitDate?.format('DD/MM/YYYY')
              };
            })
        };

        console.log('Processed submission data:', submissionData);
        await onSubmit(submissionData);
      } catch (error) {
        console.error('Error submitting lease form:', error);
        throw error;
      }
    },
    [onSubmit, store.lease.items]
  );

  const handleFormValidation = useCallback((value) => {
    try {
      // Ensure all expenses have keys before validation
      const valueWithKeys = {
        ...value,
        properties:
          value.properties?.map((property) => ({
            ...property,
            expenses:
              property.expenses?.map((expense) => ({
                ...expense,
                key: expense.key || nanoid() // Generate key if missing
              })) || []
          })) || []
      };

      validateYupSchema(valueWithKeys, validationSchema, true, {
        ...valueWithKeys,
        beginDate: valueWithKeys.beginDate,
        endDate: valueWithKeys.endDate
      });
    } catch (err) {
      console.error('=== LEASE FORM VALIDATION ERRORS ===');
      console.error('Error type:', err.name);
      console.error('Error message:', err.message);
      console.error(
        'Form values being validated:',
        JSON.stringify(value, null, 2)
      );

      if (err.inner && err.inner.length > 0) {
        console.error('Specific field errors:');
        err.inner.forEach((fieldError, index) => {
          console.error(
            `  ${index + 1}. Field: "${fieldError.path}" - Error: "${fieldError.message}"`
          );
        });
      }

      const formErrors = yupToFormErrors(err);
      console.error('Formatted form errors:', formErrors);
      console.error('=== END VALIDATION ERRORS ===');

      return formErrors; //for rendering validation errors
    }
    return {};
  }, []);

  return (
    <Formik
      initialValues={initialValues}
      validate={handleFormValidation}
      onSubmit={_onSubmit}
    >
      {({ values, isSubmitting, handleChange }) => {
        const onLeaseChange = (evt) => {
          const lease = store.lease.items.find(
            ({ _id }) => _id === evt.target.value
          );
          if (lease) {
            setContractDuration(
              moment.duration(lease.numberOfTerms, lease.timeRange)
            );
          } else {
            setContractDuration();
          }
          handleChange(evt);
        };
        const onPropertyChange = (evt, previousProperty) => {
          const property = store.property.items.find(
            ({ _id }) => _id === evt.target.value
          );
          if (previousProperty) {
            previousProperty._id = property?._id;
            previousProperty.rent = property?.price || '';
            previousProperty.expenses = [
              {
                title: t('General expenses'),
                // TODO: find another way to have expenses configurable
                amount: Math.round(property.price * 100 * 0.1) / 100,
                beginDate: values.beginDate,
                endDate: values.endDate
              }
            ];
          }
          handleChange(evt);
        };

        return (
          <Form autoComplete="off">
            {values.terminated && (
              <Section label={t('Termination')}>
                <DateField
                  label={t('Termination date')}
                  name="terminationDate"
                  minDate={values.beginDate.toISOString()}
                  maxDate={values.endDate.toISOString()}
                  disabled={readOnly}
                />
                <NumberField
                  label={t('Amount of the deposit refund')}
                  name="guarantyPayback"
                  disabled={readOnly}
                />
              </Section>
            )}
            <Section
              label={t('Lease')}
              visible={!store.tenant.selected.stepperMode}
            >
              <SelectField
                label={t('Lease')}
                name="leaseId"
                values={availableLeases}
                onChange={onLeaseChange}
                disabled={readOnly}
              />
              <RangeDateField
                beginLabel={t('Start date')}
                beginName="beginDate"
                endLabel={t('End date')}
                endName="endDate"
                duration={contractDuration}
                disabled={!values.leaseId || readOnly}
              />
              <NumberField
                label={t('Deposit')}
                name="guaranty"
                disabled={!values.leaseId || readOnly}
              />
            </Section>
            <Section label={t('Properties')}>
              <ArrayField
                name="properties"
                addLabel={t('Add a property')}
                emptyItem={() => ({
                  ...emptyProperty(values.beginDate, values.endDate),
                  entryDate: values.beginDate,
                  exitDate: values.endDate
                })}
                items={values.properties}
                renderTitle={(property, index) =>
                  t('Property #{{count}}', { count: index + 1 })
                }
                renderContent={(property, index) => (
                  <Fragment key={property.key}>
                    <div className="sm:flex sm:gap-2">
                      <div className="md:w-3/4">
                        <SelectField
                          label={t('Property')}
                          name={`properties[${index}]._id`}
                          values={availableProperties}
                          onChange={(evt) => onPropertyChange(evt, property)}
                          disabled={readOnly}
                        />
                      </div>
                      <div className="md:w-1/4">
                        <NumberField
                          label={t('Rent')}
                          name={`properties[${index}].rent`}
                          disabled={!values.properties[index]?._id || readOnly}
                        />
                      </div>
                    </div>
                    <ArrayField
                      name={`properties[${index}].expenses`}
                      addLabel={t('Add a expense')}
                      emptyItem={() =>
                        emptyExpense(values.beginDate, values.endDate)
                      }
                      items={values.properties[index]?.expenses}
                      renderTitle={(expense, index_expense) =>
                        t('Expense #{{count}}', { count: index_expense + 1 })
                      }
                      renderContent={(expense, index_expense) => (
                        <Fragment key={expense.key}>
                          <div className="sm:flex sm:gap-2">
                            <div className="md:w-1/2">
                              <TextField
                                label={t('Expense')}
                                name={`properties[${index}].expenses[${index_expense}].title`}
                                disabled={
                                  !values.properties[index]?._id || readOnly
                                }
                              />
                            </div>

                            <div className="md:w-1/6">
                              <NumberField
                                label={t('Amount')}
                                name={`properties[${index}].expenses[${index_expense}].amount`}
                                disabled={
                                  !values.properties[index]?._id || readOnly
                                }
                              />
                            </div>

                            <div>
                              <RangeDateField
                                beginLabel={t('Start date')}
                                beginName={`properties[${index}].expenses[${index_expense}].beginDate`}
                                endLabel={t('End date')}
                                endName={`properties[${index}].expenses[${index_expense}].endDate`}
                                minDate={values?.beginDate}
                                maxDate={values?.endDate}
                                disabled={
                                  !values.properties[index]?._id || readOnly
                                }
                              />
                            </div>
                          </div>
                        </Fragment>
                      )}
                      readOnly={readOnly}
                    />
                    <RangeDateField
                      beginLabel={t('Entry date')}
                      beginName={`properties[${index}].entryDate`}
                      endLabel={t('Exit date')}
                      endName={`properties[${index}].exitDate`}
                      minDate={values?.beginDate}
                      maxDate={values?.endDate}
                      disabled={!property?._id || readOnly}
                    />
                  </Fragment>
                )}
                readOnly={readOnly}
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
}

export default observer(LeaseContractForm);
