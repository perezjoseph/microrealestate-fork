import { useCallback, useContext, useState } from 'react';
import { Snackbar, Alert, Stepper } from '@material-ui/core';
import { StoreContext } from '../../store';
import useTranslation from 'next-translate/useTranslation';

export default function TenantStepper({ onSubmit }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (tenantPart) => {
      setIsSubmitting(true);
      setError(null);

      try {
        await onSubmit({
          ...tenantPart
        });

        setActiveStep((prevStep) => prevStep + 1);
      } catch (error) {
        console.error('Submit error:', error);
        setError(t('An error occurred while saving. Please try again.'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, t]
  );

  return (
    <>
      <Stepper activeStep={activeStep} orientation="vertical">
        {/* ... stepper content */}
      </Stepper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
