import { request } from '@/api/http';
export async function login({ email, password }: {
    email: string;
    password: string;
}) {
    return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}
export async function getMe() {
    return request('/users/me', { method: 'GET' });
}
export async function updateProfile(data: any) {
    return request('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}
export async function changePassword(oldPassword: string, newPassword: string) {
    return request('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ oldPassword, newPassword }),
    });
}
