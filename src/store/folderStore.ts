import { store } from '@/store/store';
import * as foldersApi from '@/api/foldersApi';
import { apiFolderToStore } from '@/utils/mapper';
export async function fetchFoldersFromApi(): Promise<void> {
    try {
        const apiFolders = await foldersApi.listFolders();
        if (Array.isArray(apiFolders)) {
            store.folders = apiFolders.map(apiFolderToStore);
        }
    }
    catch (e) {
        console.warn('[Store] Failed to load folders:', e);
    }
}
export async function createFolder(name: string, color: string, parentId?: number) {
    try {
        const apiFolder = await foldersApi.createFolder({ name, color, parentId });
        const folder = apiFolderToStore(apiFolder);
        store.folders.push(folder);
        return folder;
    }
    catch (e) {
        console.error('Failed to create folder:', e);
    }
}
export async function updateFolder(id: number, data: any) {
    try {
        const apiFolder = await foldersApi.updateFolder(id, data);
        const updated = apiFolderToStore(apiFolder);
        const idx = store.folders.findIndex(f => f.id === String(id));
        if (idx !== -1)
            store.folders[idx] = updated;
        return updated;
    }
    catch (e) {
        console.error('Failed to update folder:', e);
    }
}
export async function deleteFolder(id: number) {
    try {
        const result = await foldersApi.deleteFolder(id);
        if (result && result.ids) {
            const idsToDelete = result.ids.map(String);
            store.folders = store.folders.filter(f => !idsToDelete.includes(f.id));
        }
        else {
            store.folders = store.folders.filter(f => f.id !== String(id));
        }
    }
    catch (e) {
        console.error('Failed to delete folder:', e);
    }
}
