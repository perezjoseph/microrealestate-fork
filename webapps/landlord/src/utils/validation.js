import * as Yup from 'yup';

export const createValidationSchema = (t) => {
  // Set default error messages for Yup
  Yup.setLocale({
    mixed: {
      required: t('This field is required')
    },
    string: {
      email: t('Please enter a valid email address')
    }
  });

  return Yup;
};

export const getLocalizedValidationSchema = (t) => {
  const localizedYup = createValidationSchema(t);

  return {
    signIn: localizedYup.object().shape({
      email: localizedYup.string().email().required(),
      password: localizedYup.string().required()
    }),

    signUp: localizedYup.object().shape({
      firstName: localizedYup.string().required(),
      lastName: localizedYup.string().required(),
      email: localizedYup.string().email().required(),
      password: localizedYup.string().required()
    }),

    forgotPassword: localizedYup.object().shape({
      email: localizedYup.string().email().required()
    }),

    resetPassword: localizedYup.object().shape({
      password: localizedYup.string().required(),
      confirmationPassword: localizedYup
        .string()
        .required()
        .oneOf([localizedYup.ref('password'), null], t('Passwords must match'))
    })
  };
};
