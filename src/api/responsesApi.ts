import type { SubmitResponsePayload } from '@/types/api.types';
import { request } from '@/api/http';
export async function submitResponse(shareToken: string, payload: SubmitResponsePayload) {
    return request(`/responses/${shareToken}`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
export async function listMyResponses(formId: string | number) {
    return request(`/responses/form/${formId}`, { method: 'GET' });
}
export async function deleteResponse(id: string | number) {
    return request(`/responses/${id}`, { method: 'DELETE' });
}
export async function updateResponse(id: string | number, data: any) {
    return request(`/responses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}
