import { store } from '@/store/store';
import type { StoreForm } from '@/types/domain.types';
import * as formsApi from '@/api/formsApi';
import { apiFormToStore } from '@/utils/mapper';
import { fetchSubmissionsFromApi } from '@/store/submissionStore';
export function getForm(id: string): StoreForm | undefined {
    return store.forms.find(f => f.id === id);
}
export function getFormsByUser(): StoreForm[] {
    return store.forms;
}
export function getActiveForms(): StoreForm[] {
    return store.forms.filter(f => !f.isArchived && !f.trashedAt);
}
export function getFavoriteForms(): StoreForm[] {
    return store.forms.filter(f => f.isFavorite && !f.trashedAt);
}
export function getArchivedForms(): StoreForm[] {
    return store.forms.filter(f => f.isArchived && !f.trashedAt);
}
export function getTrashedForms(): StoreForm[] {
    return store.forms.filter(f => !!f.trashedAt);
}
export function isFavorite(formId: string): boolean {
    const f = getForm(formId);
    return f?.isFavorite || false;
}
export async function createForm(_id: string, title: string, layoutType: string, folderId?: number | null): Promise<StoreForm> {
    const result = await formsApi.createForm({
        title: title || 'Form', layoutType, folderId: folderId ?? null,
        pages: [{ elements: [] }], nextElementId: 1,
    });
    const form = apiFormToStore(result);
    store.forms.push(form);
    store.submissions[form.id] = [];
    return form;
}
export function saveForm(form: StoreForm): Promise<void> {
    const numId = Number(form.id);
    if (isNaN(numId) || numId <= 0) {
        console.warn('[Store] Skipping save for local-only ID:', form.id);
        return Promise.resolve();
    }
    const dto = {
        title: form.title,
        status: form.status,
        pages: form.pages,
        nextElementId: form.nextElementId,
        logoUrl: form.logoUrl ?? '',
        design: form.design,
        folderId: form.folderId,
        layoutType: form.layoutType,
        settings: form.settings,
        attendance: form.attendance,
        expirationDate: form.expirationDate,
        expirationTime: form.expirationTime,
    };
    console.log(`[Store] Saving form ${form.id}...`);
    return formsApi.updateMyForm(numId, dto).then(() => {
        // success
    }).catch((e: any) => {
        console.error(`[Store] Failed to save form ${form.id} to API:`, e);
        throw e;
    });
}
export function toggleFavorite(formId: string): void {
    const form = getForm(formId);
    if (!form)
        return;
    form.isFavorite = !form.isFavorite;
    const numId = Number(formId);
    if (!isNaN(numId) && numId > 0) {
        formsApi.toggleFavoriteForm(numId).catch(() => { form.isFavorite = !form.isFavorite; });
    }
}
export function archiveForm(formId: string): void {
    const form = getForm(formId);
    if (!form)
        return;
    form.isArchived = true;
    const numId = Number(formId);
    if (!isNaN(numId) && numId > 0) {
        formsApi.archiveFormApi(numId).catch(() => { form.isArchived = false; });
    }
}
export function unarchiveForm(formId: string): void {
    const form = getForm(formId);
    if (!form)
        return;
    form.isArchived = false;
    const numId = Number(formId);
    if (!isNaN(numId) && numId > 0) {
        formsApi.unarchiveFormApi(numId).catch(() => { form.isArchived = true; });
    }
}
export function moveToTrash(formId: string): void {
    const form = getForm(formId);
    if (!form)
        return;
    form.isFavorite = false;
    form.isArchived = false;
    form.trashedAt = new Date().toISOString();
    const numId = Number(formId);
    if (!isNaN(numId) && numId > 0) {
        formsApi.trashFormApi(numId).catch(() => { form.trashedAt = null; });
    }
}
export function restoreFromTrash(formId: string): void {
    const form = getForm(formId);
    if (!form)
        return;
    const prevTrashed = form.trashedAt;
    form.trashedAt = null;
    const numId = Number(formId);
    if (!isNaN(numId) && numId > 0) {
        formsApi.restoreFormApi(numId).catch(() => { form.trashedAt = prevTrashed; });
    }
}
export async function permanentDelete(formId: string): Promise<void> {
    await formsApi.permanentDeleteFormApi(Number(formId));
    store.forms = store.forms.filter(form => form.id !== formId);
    delete store.submissions[formId];
    delete store.materials[formId];
}
export function purgeOldTrash(): void {
    // Backend handles 30-day purge
}
export function isOwner(formId: string): boolean {
    const form = getForm(formId);
    if (!form)
        return false;
    if (!store.currentUser)
        return false;
    return form.ownerId === String(store.currentUser.id);
}
export async function fetchFormsFromApi(filter?: string): Promise<void> {
    try {
        const apiForms = await formsApi.listMyForms(filter || 'all');
        if (Array.isArray(apiForms)) {
            store.forms = apiForms.map(apiFormToStore);
            await Promise.all(store.forms.map(form => fetchSubmissionsFromApi(form.id).catch(error => {
                console.warn('Could not load responses for form ' + form.id, error);
            })));
        }
    }
    catch (e) {
        console.warn('[Store] Failed to load forms:', e);
    }
}
