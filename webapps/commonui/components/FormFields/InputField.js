import {
  FormControl,
  FormHelperText,
  IconButton,
  Input,
  InputAdornment,
  InputLabel
} from '@material-ui/core';
import { useCallback, useState } from 'react';
import { useField, useFormikContext } from 'formik';
import { Visibility, VisibilityOff } from '@material-ui/icons';
import useTranslation from 'next-translate/useTranslation';

export function InputField({
  label,
  disabled,
  showHidePassword = true,
  ...props
}) {
  const { t } = useTranslation('common');
  const [displayPassword, showPassword] = useState(false);
  const [field, meta] = useField(props);
  const { isSubmitting } = useFormikContext();
  const hasError = !!(meta.touched && meta.error);

  const handleClickShowPassword = useCallback(() => {
    showPassword((displayPassword) => !displayPassword);
  }, [showPassword]);

  const handleMouseDownPassword = useCallback((event) => {
    event.preventDefault();
  }, []);

  // Try to translate the error message, fallback to original if translation doesn't exist
  const getErrorMessage = (error) => {
    if (!error) return '';
    
    // Check if the error message has a translation
    const translatedError = t(error, { fallback: error });
    return translatedError;
  };

  return (
    <FormControl margin="normal" fullWidth>
      {label ? (
        <InputLabel htmlFor={props.name} error={hasError} shrink>
          {label}
        </InputLabel>
      ) : null}

      <Input
        error={hasError}
        endAdornment={
          props.type === 'password' && showHidePassword ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
              >
                {displayPassword ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          ) : null
        }
        disabled={disabled || isSubmitting}
        fullWidth
        {...props}
        {...field}
        type={
          props.type === 'password' && displayPassword ? 'text' : props.type
        }
      />
      {hasError && (
        <FormHelperText error={hasError}>
          {getErrorMessage(meta.error)}
        </FormHelperText>
      )}
    </FormControl>
  );
}
