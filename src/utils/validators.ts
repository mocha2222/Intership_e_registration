import type { FormElement } from '@/types/domain.types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,30}$/;
const SAFE_TEXT_REGEX = /^[A-Za-z0-9 _.-]+$/;
export interface ValidationError {
    key: string;
    params?: Record<string, any>;
}
export function sanitizeText(value: any, maxLength = 100): string {
    const asString = String(value ?? '');
    const noControlChars = asString.replace(/[\u0000-\u001F\u007F]/g, '');
    return noControlChars.slice(0, maxLength);
}
export function validateRequired(value: any, fieldName: string): ValidationError | null {
    if (!String(value ?? '').trim()) {
        return { key: 'validation.required', params: { field: fieldName } };
    }
    return null;
}
export function validateEmail(value: any): ValidationError | null {
    const requiredError = validateRequired(value, 'Email');
    if (requiredError)
        return requiredError;
    if (!EMAIL_REGEX.test(String(value).trim())) {
        return { key: 'validation.invalidEmail' };
    }
    return null;
}
// Keep the existing rule: a phone number must contain at least seven digits.
export function validatePhone(value: unknown): ValidationError | null {
    const requiredError = validateRequired(value, 'Phone number');
    if (requiredError) return requiredError;

    const digits = String(value).replace(/\D/g, '');
    if (digits.length < 7) {
        return { key: 'validation.invalidPhone' };
    }
    return null;
}

export function validateEmailOrUsername(value: any): ValidationError | null {
    const requiredError = validateRequired(value, 'EmailOrUser');
    if (requiredError)
        return requiredError;
    const trimmed = String(value).trim();
    const isEmail = EMAIL_REGEX.test(trimmed);
    const isUsername = USERNAME_REGEX.test(trimmed);
    if (!isEmail && !isUsername) {
        return { key: 'validation.invalidEmailOrUser' };
    }
    return null;
}
export function validatePassword(value: any, minLength = 8): ValidationError | null {
    const requiredError = validateRequired(value, 'Password');
    if (requiredError)
        return requiredError;
    const text = String(value);
    if (text.length < minLength) {
        return { key: 'validation.minLength', params: { field: 'Password', min: minLength } };
    }
    return null;
}
export function validateSafeName(value: any, fieldName: string, minLength = 2, maxLength = 40): ValidationError | null {
    const requiredError = validateRequired(value, fieldName);
    if (requiredError)
        return requiredError;
    const trimmed = String(value).trim();
    if (trimmed.length < minLength) {
        return { key: 'validation.minLength', params: { field: fieldName, min: minLength } };
    }
    if (trimmed.length > maxLength) {
        return { key: 'validation.maxLength', params: { field: fieldName, max: maxLength } };
    }
    if (!SAFE_TEXT_REGEX.test(trimmed)) {
        return { key: 'validation.safeText', params: { field: fieldName } };
    }
    return null;
}

// Checks that depend on the form field type.
type AnswerMap = Record<string, any>;
// Basic blank checks use validateRequired; compound fields add their own rules.
function isFieldIncomplete(element: FormElement, answers: AnswerMap, dropdownIncomplete: (field: FormElement) => boolean): boolean {
    const key = 'el_' + element.id;
    const label = element.label || element.type;
    const value = answers[key];

    switch (element.type) {
        case 'heading':
        case 'image':
        case 'logobanner':
            return false;

        case 'fullname':
        case 'address': {
            const parts = element.type === 'fullname'
                ? ['first', 'last']
                : ['street', 'city', 'state', 'postal'];
            for (const part of parts) {
                if (validateRequired(answers[key + '_' + part], label)) return true;
            }
            return false;
        }

        case 'multiplechoice': {
            if (!Array.isArray(value) || value.length === 0) return true;
            for (const option of value) {
                if (String(option).trim().toLowerCase() === 'other') {
                    if (validateRequired(answers[key + '_other'], label)) return true;
                }
            }
            return false;
        }

        case 'singlechoice':
            if (validateRequired(value, label)) return true;
            if (String(value).trim().toLowerCase() === 'other') {
                return validateRequired(answers[key + '_other'], label) !== null;
            }
            return false;

        case 'starrating':
        case 'scalerating':
            // Zero means no rating selected, unlike a regular number field.
            return !value || value === 0;

        case 'tableinput': {
            if (!value || typeof value !== 'object') return true;
            const entries = Object.entries(value);
            if (entries.length === 0) return true;
            for (const [, answer] of entries) {
                if (validateRequired(answer || '', label)) return true;
            }
            const expectedRows = element.rows ? element.rows.length : 0;
            return entries.length < expectedRows;
        }

        case 'dropdown':
            return dropdownIncomplete(element);

        default:
            // Text, email, phone, date, number, and file answers.
            return validateRequired(value, label) !== null;
    }
}

// Validate all fields on one page and collect their errors.
export function validatePage(elements: FormElement[], answers: AnswerMap, dropdownIncomplete: (field: FormElement) => boolean) {
    const errors: string[] = [];
    const fieldIds = new Set<number>();
    for (const element of elements) {
        const label = element.label || element.type;
        const value = answers['el_' + element.id];
        let error = '';
        if (isFieldIncomplete(element, answers, dropdownIncomplete)) {
            error = label + ' is required.';
        }
        else if (element.type === 'email' && validateEmail(value)) {
            error = label + ': Please enter a valid email address.';
        }
        else if (element.type === 'phonenumber' && validatePhone(value)) {
            error = label + ': Please enter a valid phone number.';
        }
        if (error) {
            errors.push(error);
            fieldIds.add(element.id);
        }
    }
    return { errors, fieldIds };
}
