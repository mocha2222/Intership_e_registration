import { request } from './http';
import type { FormMaterial } from '@/types/domain.types';
export function uploadMaterials(formId: string | number, files: File[]): Promise<FormMaterial[]> {
    const body = new FormData();
    for (const file of files)
        body.append('files', file);
    return request('/forms/' + formId + '/materials', { method: 'POST', body });
}
export function listMaterials(shareToken: string | number): Promise<FormMaterial[]> {
    return request('/forms/' + encodeURIComponent(String(shareToken)) + '/materials');
}
export function deleteMaterial(formId: string | number, materialId: number) {
    return request('/forms/' + formId + '/materials/' + materialId, { method: 'DELETE' });
}
