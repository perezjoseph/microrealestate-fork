/**
 * Example demonstrating SSR-compatible form components
 * Shows proper usage of OptimizedInputField with SSR features
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Button, Paper, Typography, Box } from '@material-ui/core';
import { OptimizedInputField } from '../components/FormFields/OptimizedInputField.jsx';
import { SSRProvider, useSSR } from '../utils/ssr';

// Validation schema
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required')
});

// Custom validator example
const customEmailValidator = async (value) => {
  // Simulate API call to check email availability
  if (value && value.includes('test@')) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ error: 'This email is already taken' });
      }, 500);
    });
  }
  return { error: null };
};

// Initial values that work consistently across SSR and client
const getInitialValues = (ssrData = {}) => ({
  email: ssrData.email || '',
  password: '',
  confirmPassword: '',
  firstName: ssrData.firstName || '',
  lastName: ssrData.lastName || ''
});

/**
 * Main form component with SSR compatibility
 */
function SSRFormExample({ ssrData = {} }) {
  const { isSSR } = useSSR();
  const [submitStatus, setSubmitStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Handle validation errors from custom validators
  const handleValidationError = useCallback((error, fieldName) => {
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  // Form submission handler
  const handleSubmit = useCallback(async (values, { setSubmitting, setFieldError }) => {
    try {
      setSubmitStatus('submitting');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate validation error
      if (values.email === 'error@example.com') {
        setFieldError('email', 'Server validation failed');
        setSubmitStatus('error');
        return;
      }
      
      console.log('Form submitted:', values);
      setSubmitStatus('success');
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  }, []);

  return (
    <Paper elevation={2} style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        SSR-Compatible Form Example
      </Typography>
      
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Environment: {isSSR ? 'Server-Side Rendering' : 'Client-Side'}
      </Typography>

      {submitStatus === 'success' && (
        <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
          Form submitted successfully!
        </div>
      )}

      {submitStatus === 'error' && (
        <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
          There was an error submitting the form. Please try again.
        </div>
      )}

      <Formik
        initialValues={getInitialValues(ssrData)}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ isSubmitting, values, errors, touched }) => (
          <Form>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Email field with custom validation */}
              <OptimizedInputField
                name="email"
                type="email"
                label="Email Address"
                required
                ssrValue={ssrData.email}
                customValidator={customEmailValidator}
                onValidationError={handleValidationError}
                enableStatePersistence={true}
                formId="ssr-form-example"
                debounceMs={500}
                suppressHydrationWarning={true}
              />

              {validationErrors.email && (
                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
                  {validationErrors.email}
                </div>
              )}

              {/* Password field with visibility toggle */}
              <OptimizedInputField
                name="password"
                type="password"
                label="Password"
                required
                showHidePassword={true}
                suppressHydrationWarning={true}
              />

              {/* Confirm password field */}
              <OptimizedInputField
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                required
                showHidePassword={true}
                suppressHydrationWarning={true}
              />

              {/* First name field */}
              <OptimizedInputField
                name="firstName"
                type="text"
                label="First Name"
                required
                ssrValue={ssrData.firstName}
                enableStatePersistence={true}
                formId="ssr-form-example"
                suppressHydrationWarning={true}
              />

              {/* Last name field */}
              <OptimizedInputField
                name="lastName"
                type="text"
                label="Last Name"
                required
                ssrValue={ssrData.lastName}
                enableStatePersistence={true}
                formId="ssr-form-example"
                suppressHydrationWarning={true}
              />

              {/* Submit button */}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || submitStatus === 'submitting'}
                size="large"
                style={{ marginTop: '16px' }}
              >
                {isSubmitting || submitStatus === 'submitting' 
                  ? 'Submitting...' 
                  : 'Submit Form'
                }
              </Button>

              {/* Debug information in development */}
              {process.env.NODE_ENV === 'development' && (
                <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
                  <Typography variant="subtitle2" gutterBottom>
                    Debug Information:
                  </Typography>
                  <Typography variant="body2" component="pre">
                    {JSON.stringify({
                      environment: isSSR ? 'SSR' : 'Client',
                      values,
                      errors,
                      touched,
                      validationErrors,
                      submitStatus
                    }, null, 2)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Form>
        )}
      </Formik>
    </Paper>
  );
}

/**
 * Wrapper component with SSR provider
 */
function SSRFormExampleWithProvider({ ssrData = {} }) {
  return (
    <SSRProvider 
      initialData={ssrData}
      fallbackTheme="light"
    >
      <SSRFormExample ssrData={ssrData} />
    </SSRProvider>
  );
}

export default SSRFormExampleWithProvider;
export { SSRFormExample };