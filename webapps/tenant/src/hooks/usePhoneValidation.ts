import { useCallback, useEffect, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import {
    PhoneValidationResult,
    OptimizedPhoneValidator as PhoneValidator
} from '../utils/phone/PhoneValidatorOptimized';
import { Country } from '../utils/phone/Countries';
import { PHONE_VALIDATION_MESSAGES } from '../utils/phone/PhoneValidationMessages';
import useTranslation from '@/utils/i18n/client/useTranslation';

export interface PhoneValidationState {
    isValid: boolean;
    isValidating: boolean;
    error: string | null;
    result: PhoneValidationResult | null;
}

export interface PhoneValidationHookResult {
    validationState: PhoneValidationState;
    validateNumber: (phoneNumber: string) => void;
    validateSync: (phoneNumber: string) => PhoneValidationResult;
    clearValidation: () => void;
    debouncedValue: string;
}

/**
 * Hook for real-time phone number validation with debouncing
 */
export const usePhoneValidation = (
    country: Country,
    debounceMs: number = 300
): PhoneValidationHookResult => {
    const { t } = useTranslation();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [validationState, setValidationState] = useState<PhoneValidationState>({
        isValid: false,
        isValidating: false,
        error: null,
        result: null
    });

    // Debounce the phone number input to avoid excessive validation calls
    const [debouncedPhoneNumber] = useDebounceValue(phoneNumber, debounceMs);

    /**
     * Synchronous validation function (basic validation for immediate feedback)
     */
    const validateSync = useCallback(
        (phoneNumber: string): PhoneValidationResult => {
            if (!phoneNumber.trim()) {
                return {
                    isValid: false,
                    formatted: '',
                    e164: '',
                    national: '',
                    error: t(PHONE_VALIDATION_MESSAGES.REQUIRED)
                };
            }

            // Use basic validation for immediate feedback
            const basicResult = PhoneValidator.basicValidate(phoneNumber, country.code);

            return {
                isValid: basicResult.isValid,
                formatted: phoneNumber,
                e164: '',
                national: '',
                error: basicResult.error || null
            };
        },
        [country.code, t]
    );

    /**
     * Asynchronous validation function with state updates
     */
    const validateNumber = useCallback((phoneNumber: string) => {
        setPhoneNumber(phoneNumber);

        if (!phoneNumber.trim()) {
            setValidationState({
                isValid: false,
                isValidating: false,
                error: null,
                result: null
            });
            return;
        }

        setValidationState((prev) => ({
            ...prev,
            isValidating: true
        }));
    }, []);

    /**
     * Clear validation state
     */
    const clearValidation = useCallback(() => {
        setPhoneNumber('');
        setValidationState({
            isValid: false,
            isValidating: false,
            error: null,
            result: null
        });
    }, []);

    /**
     * Effect to perform validation when debounced value changes
     */
    useEffect(() => {
        if (!debouncedPhoneNumber.trim()) {
            setValidationState({
                isValid: false,
                isValidating: false,
                error: null,
                result: null
            });
            return;
        }

        // Start with basic validation for immediate feedback
        const basicResult = validateSync(debouncedPhoneNumber);

        setValidationState({
            isValid: basicResult.isValid,
            isValidating: basicResult.isValid, // Only do async validation if basic passes
            error: basicResult.error ? t(basicResult.error) : null,
            result: basicResult
        });

        // If basic validation passes, do full async validation
        if (basicResult.isValid) {
            const performAsyncValidation = async () => {
                try {
                    let result: PhoneValidationResult;

                    // Use Dominican Republic special validation if needed
                    if (country.code === 'DO') {
                        result = await PhoneValidator.validateDominicanRepublic(debouncedPhoneNumber);
                    } else {
                        result = await PhoneValidator.validate(debouncedPhoneNumber, country.code);
                    }

                    setValidationState({
                        isValid: result.isValid,
                        isValidating: false,
                        error: result.error ? t(result.error) : null,
                        result
                    });
                } catch (error) {
                    setValidationState({
                        isValid: false,
                        isValidating: false,
                        error: t(PHONE_VALIDATION_MESSAGES.INVALID),
                        result: null
                    });
                }
            };

            performAsyncValidation();
        }
    }, [debouncedPhoneNumber, validateSync, country.code, t]);

    /**
     * Effect to reset validation when country changes
     */
    useEffect(() => {
        if (phoneNumber.trim()) {
            // Re-validate with new country using basic validation first
            const result = validateSync(phoneNumber);
            setValidationState({
                isValid: result.isValid,
                isValidating: result.isValid, // Only async validate if basic passes
                error: result.error ? t(result.error) : null,
                result
            });

            // If basic validation passes, do full async validation
            if (result.isValid) {
                const performAsyncValidation = async () => {
                    try {
                        let asyncResult: PhoneValidationResult;

                        if (country.code === 'DO') {
                            asyncResult = await PhoneValidator.validateDominicanRepublic(phoneNumber);
                        } else {
                            asyncResult = await PhoneValidator.validate(phoneNumber, country.code);
                        }

                        setValidationState({
                            isValid: asyncResult.isValid,
                            isValidating: false,
                            error: asyncResult.error ? t(asyncResult.error) : null,
                            result: asyncResult
                        });
                    } catch (error) {
                        setValidationState({
                            isValid: false,
                            isValidating: false,
                            error: t(PHONE_VALIDATION_MESSAGES.INVALID),
                            result: null
                        });
                    }
                };

                performAsyncValidation();
            }
        }
    }, [country.code, phoneNumber, validateSync, t]);

    return {
        validationState,
        validateNumber,
        validateSync,
        clearValidation,
        debouncedValue: debouncedPhoneNumber
    };
};

/**
 * Hook for batch phone number validation
 */
export const useBatchPhoneValidation = (country: Country) => {
    const [results, setResults] = useState<Map<string, PhoneValidationResult>>(
        new Map()
    );
    const [isValidating, setIsValidating] = useState(false);

    const validateBatch = useCallback(
        async (phoneNumbers: string[]) => {
            setIsValidating(true);
            const newResults = new Map<string, PhoneValidationResult>();

            // Process in batches to avoid blocking the UI
            const batchSize = 10;
            for (let i = 0; i < phoneNumbers.length; i += batchSize) {
                const batch = phoneNumbers.slice(i, i + batchSize);

                await Promise.all(batch.map(async (phoneNumber) => {
                    const result = country.code === 'DO'
                        ? await PhoneValidator.validateDominicanRepublic(phoneNumber)
                        : await PhoneValidator.validate(phoneNumber, country.code);

                    newResults.set(phoneNumber, result);
                }));

                // Allow UI to update between batches
                await new Promise((resolve) => setTimeout(resolve, 0));
            }

            setResults(newResults);
            setIsValidating(false);
        },
        [country.code]
    );

    const getResult = useCallback(
        (phoneNumber: string): PhoneValidationResult | null => {
            return results.get(phoneNumber) || null;
        },
        [results]
    );

    const clearResults = useCallback(() => {
        setResults(new Map());
    }, []);

    return {
        validateBatch,
        getResult,
        clearResults,
        isValidating,
        resultCount: results.size
    };
};

/**
 * Hook for validating phone number on form submission
 */
export const usePhoneSubmissionValidation = (country: Country) => {
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    const validateForSubmission = useCallback(
        (
            phoneNumber: string
        ): {
            isValid: boolean;
            error: string | null;
            e164: string;
        } => {
            setSubmissionError(null);

            if (!phoneNumber.trim()) {
                const error = 'Phone number is required';
                setSubmissionError(error);
                return { isValid: false, error, e164: '' };
            }

            // Use basic validation for submission (sync)
            const basicResult = PhoneValidator.basicValidate(phoneNumber, country.code);

            if (!basicResult.isValid) {
                const errorMessage = basicResult.error ? t(basicResult.error) : t(PHONE_VALIDATION_MESSAGES.INVALID);
                setSubmissionError(errorMessage);
                return {
                    isValid: false,
                    error: errorMessage,
                    e164: ''
                };
            }

            // For submission, we need the E.164 format, so we'll use a simplified approach
            // In a real app, you might want to cache the async validation result
            const result = {
                isValid: true,
                e164: phoneNumber.startsWith('+') ? phoneNumber : `${country.dialCode}${phoneNumber}`,
                error: null
            };

            if (!result.isValid) {
                const errorMessage = result.error ? t(result.error) : t(PHONE_VALIDATION_MESSAGES.INVALID);
                setSubmissionError(errorMessage);
                return {
                    isValid: false,
                    error: errorMessage,
                    e164: ''
                };
            }

            return {
                isValid: true,
                error: null,
                e164: result.e164
            };
        },
        [country.code]
    );

    const clearSubmissionError = useCallback(() => {
        setSubmissionError(null);
    }, []);

    return {
        validateForSubmission,
        submissionError,
        clearSubmissionError
    };
};
