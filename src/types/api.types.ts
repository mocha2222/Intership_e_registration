export interface ApiRequestOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: BodyInit | null;
}

// One submitted field: ordinary answers are values; uploaded files include their content.
export interface UploadedAnswer {
    name: string;
    data: string;
}
export type SubmittedValue = string | number | boolean | null | UploadedAnswer | UploadedAnswer[];
export interface SubmittedField {
    label: string;
    type: string;
    value: SubmittedValue;
}
export type SubmittedFormData = Record<string, SubmittedField>;
export interface SubmitResponsePayload {
    formData: SubmittedFormData;
}
