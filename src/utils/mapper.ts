import type { StoreForm, StoreFolder, FormDesign, SubmissionRow, PublicFormViewModel, FormPage } from '@/types/domain.types';
import { formatDate, formatDateTime, formatTime } from '@/utils/dates';
export const defaultDesign = (): FormDesign => ({
    pageBgColor: '#f0f2f8',
    formBgColor: '#FFFFFF',
    fontColor: '#2C3345',
    inputBgColor: '#FFFFFF',
    pageBgImage: '',
    formBgImage: '',
});
export function apiFormToStore(apiForm: any): StoreForm {
    try {
        const createdAt = apiForm.createdAt ? formatDate(apiForm.createdAt) : '';
        const updatedAt = apiForm.updatedAt ? formatDate(apiForm.updatedAt) : '';
        let pages = apiForm.pages;
        if (pages && typeof pages === 'string') {
            try {
                pages = JSON.parse(pages);
            }
            catch (e) {
                pages = [{ elements: [] }];
            }
        }
        if (!Array.isArray(pages))
            pages = [{ elements: [] }];
        return {
            id: String(apiForm.id),
            shareToken: apiForm.shareToken || '',
            title: apiForm.title || 'Untitled Form',
            status: apiForm.status || 'enabled',
            ownerId: String(apiForm.ownerId || ''),
            created_at: createdAt,
            updated_at: updatedAt,
            layoutType: apiForm.layoutType || 'classic',
            folderId: apiForm.folderId ? Number(apiForm.folderId) : null,
            description: apiForm.description || null,
            schema: apiForm.schema || null,
            pages: pages,
            nextElementId: Number(apiForm.nextElementId || 1),
            logoUrl: apiForm.logoUrl || '',
            design: apiForm.design || defaultDesign(),
            type: apiForm.type || 'form',
            isFavorite: Boolean(apiForm.isFavorite),
            isArchived: Boolean(apiForm.isArchived),
            trashedAt: apiForm.trashedAt || null,
            settings: {
                permissionMode: apiForm.settings?.permissionMode || 'submit_and_view',
                materialUploadEnabled: Boolean(apiForm.settings?.materialUploadEnabled),
                submissionStartTime: apiForm.settings?.submissionStartTime || null,
                submissionEndTime: apiForm.settings?.submissionEndTime || null,
                expirationAt: apiForm.settings?.expirationAt || null,
                submissionLimit: apiForm.settings?.submissionLimit ?? null,
            },
            attendance: apiForm.attendance ? {
                attendanceEnabled: Boolean(apiForm.attendance?.attendanceEnabled),
                eventStartTime: apiForm.attendance?.eventStartTime || null,
                eventEndTime: apiForm.attendance?.eventEndTime || null,
                attendanceCloseTime: apiForm.attendance?.attendanceCloseTime || null,
            } : null,
        };
    }
    catch (err) {
        console.error('[Store] Failed to map form:', apiForm.id, err);
        return {
            id: String(apiForm?.id || 'err'), title: 'Error loading', status: 'disabled',
            ownerId: '', created_at: '', updated_at: '', layoutType: 'classic',
            folderId: null, pages: [{ elements: [] }], nextElementId: 1,
            logoUrl: '', design: defaultDesign(), isFavorite: false, isArchived: false,
            trashedAt: null,
            settings: {
                permissionMode: 'submit_and_view',
                materialUploadEnabled: false,
                submissionStartTime: null,
                submissionEndTime: null,
                expirationAt: null,
                submissionLimit: null
            },
            attendance: null,
        };
    }
}
export function apiPublicFormToViewModel(apiForm: unknown): PublicFormViewModel {
    if (!apiForm || typeof apiForm !== 'object') {
        throw new Error('Invalid public form response.');
    }
    const response = apiForm as Record<string, any>;
    let pages: unknown = response.pages;
    if (typeof pages === 'string') {
        try {
            pages = JSON.parse(pages);
        }
        catch {
            throw new Error('Invalid public form pages.');
        }
    }
    const normalizedPages: FormPage[] = Array.isArray(pages)
        ? pages.map((page: any) => ({
            elements: Array.isArray(page?.elements) ? page.elements : [],
        }))
        : [];
    return {
        id: String(response.id || ''),
        shareToken: response.shareToken || '',
        title: typeof response.title === 'string' ? response.title : 'Untitled Form',
        description: response.description ?? null,
        status: typeof response.status === 'string' ? response.status : 'enabled',
        pages: normalizedPages.length ? normalizedPages : [{ elements: [] }],
        nextElementId: Number(response.nextElementId || 1),
        logoUrl: response.logoUrl || '',
        design: {
            ...defaultDesign(),
            ...(response.design && typeof response.design === 'object' ? response.design : {}),
        },
        settings: {
            permissionMode: response.settings?.permissionMode || 'submit_and_view',
            materialUploadEnabled: Boolean(response.settings?.materialUploadEnabled),
            submissionStartTime: response.settings?.submissionStartTime || null,
            submissionEndTime: response.settings?.submissionEndTime || null,
            expirationAt: response.settings?.expirationAt || null,
            submissionLimit: response.settings?.submissionLimit ?? null,
        },
        attendance: response.attendance && typeof response.attendance === 'object'
            ? {
                attendanceEnabled: Boolean(response.attendance.attendanceEnabled),
                eventStartTime: response.attendance.eventStartTime || null,
                eventEndTime: response.attendance.eventEndTime || null,
                attendanceCloseTime: response.attendance.attendanceCloseTime || null,
            }
            : null,
    };
}
export function apiFolderToStore(apiFolder: any): StoreFolder {
    return {
        id: String(apiFolder.id),
        name: apiFolder.name,
        color: apiFolder.color || '#4eaee7',
        parentId: apiFolder.parentId ? String(apiFolder.parentId) : null,
        ownerId: String(apiFolder.ownerId),
        createdAt: formatDate(apiFolder.createdAt),
        updatedAt: formatDate(apiFolder.updatedAt),
        isOpen: true
    };
}

// Convert one backend response into a row for the response table.
export function apiResponseToStore(response: any): SubmissionRow {
    const answers: Record<string, string> = {};
    for (const [key, entry] of Object.entries(response.formData ?? {})) {
        const value = (entry as {
            value?: unknown;
        }).value;
        answers[key] = value == null ? '' : String(value);
    }
    return {
        ...answers,
        id: String(response.id),
        submittedAt: formatDateTime(response.createdAt || response.submittedAt),
        status: response.status || 'pending',
        checkInTime: formatTime(response.checkInTime),
    };
}
