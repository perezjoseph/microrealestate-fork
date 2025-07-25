import { FormControlLabel, Grid, Switch } from '@material-ui/core';
import { TextField } from './TextField';
import { useFormikContext } from 'formik';
import useTranslation from 'next-translate/useTranslation';

// Helper function to get nested value from object using dot notation or bracket notation
const getNestedValue = (obj, path) => {
  if (!path) return undefined;

  // Handle bracket notation like "contacts[0].whatsapp1"
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');

  return keys.reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

export function ContactField({
  contactName,
  emailName,
  phone1Name,
  phone2Name,
  whatsapp1Name,
  whatsapp2Name,
  disabled
}) {
  const { t } = useTranslation('common');
  const { values, setFieldValue } = useFormikContext();

  // Get values using the helper function to handle nested paths
  const whatsapp1Value = whatsapp1Name
    ? getNestedValue(values, whatsapp1Name) || false
    : false;
  const whatsapp2Value = whatsapp2Name
    ? getNestedValue(values, whatsapp2Name) || false
    : false;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label={t('Contact')}
          name={contactName || 'contact'}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          label={t('Email')}
          name={emailName || 'email'}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          label={t('Phone 1')}
          name={phone1Name || 'phone1'}
          disabled={disabled}
        />
        {whatsapp1Name && (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(whatsapp1Value)}
                onChange={(e) => {
                  if (whatsapp1Name) {
                    setFieldValue(whatsapp1Name, e.target.checked);
                  }
                }}
                disabled={disabled}
                color="primary"
                size="small"
              />
            }
            label={t('WhatsApp')}
            style={{ marginTop: 4, fontSize: '0.875rem' }}
          />
        )}
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          label={t('Phone 2')}
          name={phone2Name || 'phone2'}
          disabled={disabled}
        />
        {whatsapp2Name && (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(whatsapp2Value)}
                onChange={(e) => {
                  if (whatsapp2Name) {
                    setFieldValue(whatsapp2Name, e.target.checked);
                  }
                }}
                disabled={disabled}
                color="primary"
                size="small"
              />
            }
            label={t('WhatsApp')}
            style={{ marginTop: 4, fontSize: '0.875rem' }}
          />
        )}
      </Grid>
    </Grid>
  );
}
