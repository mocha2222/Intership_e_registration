import { request } from '@/api/http';
export async function scanAttendance(token: string) {
    return request('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
}
export async function getAttendanceReport(formId: string | number) {
    return request(`/attendance/form/${formId}/report`, { method: 'GET' });
}
