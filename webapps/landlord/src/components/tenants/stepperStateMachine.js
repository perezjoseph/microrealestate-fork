// State machine for stepper logic
export const STEPPER_STATES = {
  TENANT_INFO: 'TENANT_INFO',
  LEASE: 'LEASE',
  BILLING: 'BILLING',
  DOCUMENTS: 'DOCUMENTS',
  COMPLETED: 'COMPLETED'
};

export const STEPPER_ACTIONS = {
  NEXT: 'NEXT',
  PREVIOUS: 'PREVIOUS',
  SUBMIT: 'SUBMIT',
  RESET: 'RESET'
};

export const stepperReducer = (state, action) => {
  switch (action.type) {
    case STEPPER_ACTIONS.NEXT:
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1)
      };
    case STEPPER_ACTIONS.PREVIOUS:
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0)
      };
    case STEPPER_ACTIONS.SUBMIT:
      return {
        ...state,
        isSubmitting: action.payload.isSubmitting,
        error: action.payload.error || null
      };
    case STEPPER_ACTIONS.RESET:
      return {
        currentStep: 0,
        isSubmitting: false,
        error: null,
        totalSteps: 4
      };
    default:
      return state;
  }
};
