import React, { useState, useEffect, useCallback } from 'react';

/**
 * Basic form wrapper - SSR utilities not yet implemented
 * 
 * Note: This is a simplified implementation until SSR utilities are available
 */
export const SSRFormWrapper = ({
  children,
  initialValues = {},
  onSubmit,
  className = '',
  ...props
}) => {
  const [formState, setFormState] = useState(() => ({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValidating: false
  }));

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (onSubmit) {
      setFormState(prev => ({ ...prev, isSubmitting: true }));
      try {
        await onSubmit(formState.values);
      } finally {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
      }
    }
  }, [onSubmit, formState.values]);

  // Basic form context
  const formContext = {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    setFieldValue: (field, value) => {
      setFormState(prev => ({
        ...prev,
        values: { ...prev.values, [field]: value }
      }));
    },
    setFieldError: (field, error) => {
      setFormState(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: error }
      }));
    }
  };

  if (!isClient) {
    // Server-side rendering fallback
    return (
      <div className={className} {...props}>
        <form onSubmit={handleSubmit}>
          {typeof children === 'function' ? children(formContext) : children}
        </form>
      </div>
    );
  }

  return (
    <div className={className} {...props}>
      <form onSubmit={handleSubmit}>
        {typeof children === 'function' ? children(formContext) : children}
      </form>
    </div>
  );
};

export default SSRFormWrapper;
