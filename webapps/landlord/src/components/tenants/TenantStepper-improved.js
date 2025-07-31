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
const STEPS = {
  TENANT_INFO: 0,
  LEASE: 1,
  BILLING: 2,
  DOCUMENTS: 3
};

const DOCUMENTS_STEP_INDEX = 3;

export default function TenantStepper({ onSubmit }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const [activeStep, setActiveStep] = useState(0);

  // Extract validation logic into separate function
  const validateAllForms = useCallback(async (tenantData) => {
    try {
      await Promise.all([
        TenantFormValidate(tenantData),
        LeaseContractFormValidate(tenantData),
        BillingFormValidate(tenantData)
      ]);
      return true;
    } catch (error) {
      console.warn('Form validation failed:', error);
      return false;
    }
  }, []);

  // Determine if we're in stepper mode (forms not fully valid)
  const isStepperMode = useCallback((isFormsValid, currentStep) => {
    // All forms are valid if we reach the Documents step and validation passes
    return !(isFormsValid && currentStep >= DOCUMENTS_STEP_INDEX);
  }, []);

  const handleSubmit = useCallback(
    async (tenantPart) => {
      try {
        const isFormsValid = await validateAllForms(store.tenant?.selected);
        const stepperMode = isStepperMode(isFormsValid, activeStep);

        // Submit the form data
        await onSubmit({
          ...tenantPart,
          stepperMode
        });

        // Only advance to next step if submission was successful
        setActiveStep((prevStep) => prevStep + 1);
      } catch (error) {
        console.error('Submit error:', error);
        // Don't advance step on error - let user retry
        // Could add user-friendly error notification here
      }
    },
    [
      onSubmit,
      store.tenant?.selected,
      activeStep,
      validateAllForms,
      isStepperMode
    ]
  );

  const steps = [
    {
      label: t('Tenant information'),
      component: TenantForm
    },
    {
      label: t('Lease'),
      component: LeaseContractForm
    },
    {
      label: t('Billing information'),
      component: BillingForm
    },
    {
      label: t('Documents'),
      component: DocumentsForm
    }
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
