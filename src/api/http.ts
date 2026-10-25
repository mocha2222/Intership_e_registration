import type { ApiRequestOptions } from '@/types/api.types';
export { resolveImageUrl } from '@/utils/imageUrls';
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) { super(message); this.status = status; }
}
export function getAccessToken(): string | null {
    return localStorage.getItem('jfAccessToken');
}
export async function request(endpoint: string, options: ApiRequestOptions = {}): Promise<any> {
    const headers = new Headers(options.headers);
    const publicRequest = endpoint === '/auth/login' || endpoint.endsWith('/public') ||
        (endpoint.startsWith('/responses/') && options.method === 'POST');
    const token = publicRequest ? null : localStorage.getItem(endpoint.includes('/admin/') ? 'jfAdminToken' : 'jfAccessToken');
    if (token)
        headers.set('Authorization', 'Bearer ' + token);
    if (options.body && !(options.body instanceof FormData))
        headers.set('Content-Type', 'application/json');
    const response = await fetch(API_BASE_URL + endpoint, { ...options, headers });
    const text = await response.text();
    let data: any = null;
    if (text) {
        try {
            data = JSON.parse(text);
        }
        catch {
            throw new ApiError('The server returned an unexpected response.', response.status);
        }
    }
    if (!response.ok) {
        const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
        throw new ApiError(message || 'Request failed (' + response.status + ')', response.status);
    }
    return data;
}
