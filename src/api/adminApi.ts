import { request } from '@/api/http';
export async function adminLogin(data: any) {
    return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
export async function adminCreateUser(data: any) {
    return request('/auth/admin/users', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
export async function adminListUsers() {
    return request('/auth/admin/users', {
        method: 'GET'
    });
}
export async function adminDeleteUser(id: number) {
    return request(`/auth/admin/users/${id}`, {
        method: 'DELETE'
    });
}
