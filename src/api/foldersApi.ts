import { request } from '@/api/http';
export async function createFolder(data: any) {
    return request('/folders', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
export async function listFolders() {
    return request('/folders', { method: 'GET' });
}
export async function updateFolder(id: string | number, data: any) {
    return request(`/folders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}
export async function deleteFolder(id: string | number) {
    return request(`/folders/${id}`, { method: 'DELETE' });
}
