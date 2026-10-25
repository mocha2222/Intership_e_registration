import { request } from '@/api/http';
export async function createForm(data: any) {
    const payload = { ...data };
    if (payload.expirationDate !== undefined || payload.expirationTime !== undefined) {
        let expirationAt = null;
        const dateVal = payload.expirationDate;
        const timeVal = payload.expirationTime || '12:15 PM';
        if (dateVal) {
            const [time, modifier] = timeVal.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12')
                hours = '00';
            if (modifier === 'PM')
                hours = (parseInt(hours, 10) + 12).toString();
            expirationAt = `${dateVal}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
        }
        if (!payload.settings) payload.settings = {};
        payload.settings.expirationAt = expirationAt;
        delete payload.expirationDate;
        delete payload.expirationTime;
    }
    return request('/forms', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
export async function listMyForms(filter?: string) {
    const qs = filter ? `?filter=${filter}` : '';
    return request(`/forms${qs}`, { method: 'GET' });
}
export async function getPublicForm(id: string | number) {
    return request(`/forms/${id}/public`, { method: 'GET' });
}
export async function getMyForm(id: string | number) {
    return request(`/forms/${id}`, { method: 'GET' });
}
export async function updateMyForm(id: string | number, data: any) {
    const payload = { ...data };
    if (payload.expirationDate !== undefined || payload.expirationTime !== undefined) {
        let expirationAt = null;
        const dateVal = payload.expirationDate;
        const timeVal = payload.expirationTime || '12:15 PM';
        if (dateVal) {
            const [time, modifier] = timeVal.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12')
                hours = '00';
            if (modifier === 'PM')
                hours = (parseInt(hours, 10) + 12).toString();
            expirationAt = `${dateVal}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
        }
        if (!payload.settings) payload.settings = {};
        payload.settings.expirationAt = expirationAt;
        delete payload.expirationDate;
        delete payload.expirationTime;
    }
    if (payload.settings) {
        delete payload.settings.id;
        delete payload.settings.formId;
    }
    if (payload.attendance) {
        delete payload.attendance.id;
        delete payload.attendance.formId;
    }
    return request(`/forms/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}
export async function deleteMyForm(id: string | number) {
    return request(`/forms/${id}`, { method: 'DELETE' });
}
export async function toggleFavoriteForm(id: string | number) {
    return request(`/forms/${id}/favorite`, { method: 'PATCH' });
}
export async function archiveFormApi(id: string | number) {
    return request(`/forms/${id}/archive`, { method: 'PATCH' });
}
export async function unarchiveFormApi(id: string | number) {
    return request(`/forms/${id}/unarchive`, { method: 'PATCH' });
}
export async function trashFormApi(id: string | number) {
    return request(`/forms/${id}/trash`, { method: 'PATCH' });
}
export async function restoreFormApi(id: string | number) {
    return request(`/forms/${id}/restore`, { method: 'PATCH' });
}
export async function permanentDeleteFormApi(id: string | number) {
    return request(`/forms/${id}/permanent`, { method: 'DELETE' });
}
