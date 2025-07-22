import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select
} from '@material-ui/core';
import { useField, useFormikContext } from 'formik';
import useTranslation from 'next-translate/useTranslation';

export function SelectField({ label, values = [], disabled, ...props }) {
  const { t } = useTranslation('common');
  const [field, meta] = useField(props);
  const { isSubmitting } = useFormikContext();
  const hasError = !!(meta.touched && meta.error);

  // Try to translate the error message, fallback to original if translation doesn't exist
  const getErrorMessage = (error) => {
    if (!error) return '';
    
    // Check if the error message has a translation
    const translatedError = t(error, { fallback: error });
    return translatedError;
  };

  return (
    <FormControl margin="normal" fullWidth>
      <InputLabel htmlFor={props.name} error={hasError}>
        {label}
      </InputLabel>
      <Select
        disabled={disabled || isSubmitting}
        error={hasError}
        {...field}
        {...props}
      >
        {values.map(({ id, value, label, disabled: disabledMenu }) => (
          <MenuItem key={id} value={value} disabled={disabledMenu}>
            {label}
          </MenuItem>
        ))}
      </Select>
      {hasError && (
        <FormHelperText error={hasError}>
          {getErrorMessage(meta.error)}
        </FormHelperText>
      )}
    </FormControl>
  );
}
