import type { SubmittedFormData } from '@/types/api.types';
import { store } from './store';
import * as responsesApi from '@/api/responsesApi';
import type { SubmissionRow } from '@/types/domain.types';
import { apiResponseToStore } from '@/utils/mapper';
export async function addSubmission(shareToken: string, formData: SubmittedFormData) {
    if (!shareToken || /^\d+$/.test(shareToken)) {
        throw new Error('Open the public share link before submitting this form.');
    }
    return responsesApi.submitResponse(shareToken, { formData });
}
export function getSubmissions(formId: string): SubmissionRow[] {
    return store.submissions[formId] ?? [];
}
export async function deleteSubmission(formId: string, submissionId: string) {
    await responsesApi.deleteResponse(submissionId);
    store.submissions[formId] = getSubmissions(formId).filter(row => String(row.id) !== String(submissionId));
}
export async function fetchSubmissionsFromApi(formId: string): Promise<void> {
    const responses = await responsesApi.listMyResponses(Number(formId));
    store.submissions[formId] = responses.map(apiResponseToStore);
}
