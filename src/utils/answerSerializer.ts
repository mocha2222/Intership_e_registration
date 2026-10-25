import type { FormElement, FormPage } from '@/types/domain.types';
import type { SubmittedFormData, SubmittedValue } from '@/types/api.types';
type AnswerMap = Record<string, any>;
// Turn the input values into one labeled dictionary for the backend.
export function serializeAnswers(form: {
    pages: FormPage[];
}, answers: AnswerMap, dropdownValue: (field: FormElement) => string): SubmittedFormData {
    const SKIP_TYPES = new Set(['heading', 'logobanner']);
    const formData: SubmittedFormData = {};
    if (form) {
        for (const page of form.pages) {
            for (const el of page.elements) {
                if (SKIP_TYPES.has(el.type))
                    continue;
                const label = el.label || el.type;
                let value: SubmittedValue = '';
                switch (el.type) {
                    case 'fullname': {
                        const first = answers[`el_${el.id}_first`] || '';
                        const last = answers[`el_${el.id}_last`] || '';
                        value = `${first} ${last}`.trim();
                        break;
                    }
                    case 'address': {
                        const street = answers[`el_${el.id}_street`] || '';
                        const street2 = answers[`el_${el.id}_street2`] || '';
                        const city = answers[`el_${el.id}_city`] || '';
                        const state = answers[`el_${el.id}_state`] || '';
                        const postal = answers[`el_${el.id}_postal`] || '';
                        value = [street, street2, city, state, postal].filter(Boolean).join(', ');
                        break;
                    }
                    case 'starrating': {
                        const val = answers[`el_${el.id}`];
                        value = val ? `${val} Stars` : '';
                        break;
                    }
                    case 'multiplechoice': {
                        const val = answers[`el_${el.id}`];
                        value = Array.isArray(val)
                            ? val.map(item => (`${item || ''}`).trim().toLowerCase() === 'other' ? (answers[`el_${el.id}_other`] || item) : item).filter(Boolean).join(', ')
                            : (val || '');
                        break;
                    }
                    case 'fileupload':
                    case 'image': {
                        const data = answers[`el_${el.id}`];
                        if (data) {
                            const defaultName = el.type === 'image' ? 'Uploaded_Image.png' : 'File';
                            const names = answers[`el_${el.id}_name`];
                            if (Array.isArray(data)) {
                                value = data.map((fileData, index) => ({
                                    name: names?.[index] || defaultName,
                                    data: fileData,
                                }));
                            }
                            else {
                                value = { name: names || defaultName, data };
                            }
                        }
                        break;
                    }
                    case 'tableinput': {
                        const val = answers[`el_${el.id}`];
                        if (val && typeof val === 'object') {
                            value = Object.entries(val).map(([r, c]) => `${r}: ${c}`).join(', ');
                        }
                        break;
                    }
                    case 'dropdown':
                        value = dropdownValue(el);
                        break;
                    case 'singlechoice': {
                        const selected = answers[`el_${el.id}`] || '';
                        value = (`${selected}`).trim().toLowerCase() === 'other'
                            ? (answers[`el_${el.id}_other`] || selected)
                            : selected;
                        break;
                    }
                    default:
                        value = answers[`el_${el.id}`] ?? '';
                }
                formData[`el_${el.id}`] = { label, type: el.type, value };
            }
        }
    }
    return formData;
}
