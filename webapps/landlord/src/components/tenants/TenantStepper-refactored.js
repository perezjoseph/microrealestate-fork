import BillingForm, {
  validate as BillingFormValidate
} from './forms/BillingForm';
import LeaseContractForm, {
  validate as LeaseContractFormValidate
} from './forms/LeaseContractForm';
import TenantForm, { validate as TenantFormValidate } from './forms/TenantForm';
import { useCallback, useContext, useState } from 'react';
import DocumentsForm from './forms/DocumentsForm';
import Step from '@material-ui/core/Step';
import StepContent from '@material-ui/core/StepContent';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import { StoreContext } from '../../store';
import useTranslation from 'next-translate/useTranslation';

// Constants for better maintainability
const STEP_INDICES = {
  TENANT_INFO: 0,
  LEASE: 1,
  BILLING: 2,
  DOCUMENTS: 3
};

export default function TenantStepper({ onSubmit }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const [activeStep, setActiveStep] = useState(0);

  // Validation logic extracted and simplified
  const validateAllForms = useCallback(async (tenantData) => {
    const validators = [
      { name: 'TenantForm', validate: TenantFormValidate },
      { name: 'LeaseContractForm', validate: LeaseContractFormValidate },
      { name: 'BillingForm', validate: BillingFormValidate }
    ];

    try {
      await Promise.all(validators.map(({ validate }) => validate(tenantData)));
      return { isValid: true, errors: [] };
    } catch (error) {
      return { isValid: false, errors: [error.message] };
    }
  }, []);

  // Clean, focused submit handler
  const handleSubmit = useCallback(
    async (tenantPart) => {
      try {
        const updatedTenant = { ...store.tenant?.selected, ...tenantPart };
        const validationResult = await validateAllForms(updatedTenant);

        // Determine if we're still in stepper mode
        const stepperMode =
          !validationResult.isValid || activeStep < STEP_INDICES.DOCUMENTS;

        // Submit the form data
        await onSubmit({ ...tenantPart, stepperMode });

        // Advance to next step on success
        setActiveStep((prevStep) => prevStep + 1);
      } catch (error) {
        console.error('Submit error:', error);
        // TODO: Add user-friendly error notification
      }
    },
    [onSubmit, store.tenant?.selected, activeStep, validateAllForms]
  );

  // Data-driven step configuration
  const steps = [
    { label: t('Tenant information'), component: TenantForm },
    { label: t('Lease'), component: LeaseContractForm },
    { label: t('Billing information'), component: BillingForm },
    { label: t('Documents'), component: DocumentsForm }
  ];

  return (
    <Stepper activeStep={activeStep} orientation="vertical">
      {steps.map((step, index) => {
        const StepComponent = step.component;
        return (
          <Step key={index}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>
              <div className="px-2">
                <StepComponent onSubmit={handleSubmit} />
              </div>
            </StepContent>
          </Step>
        );
      })}
    </Stepper>
  );
}
