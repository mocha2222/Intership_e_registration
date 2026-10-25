import { store } from './store';
import { getMe } from '@/api/authApi';
import { ApiError } from '@/api/http';
import { fetchFormsFromApi } from './formStore';
import { fetchFoldersFromApi } from './folderStore';
import type { StoreUser } from '@/types/domain.types';
export function signOut() {
    for (const key of ['jfAccessToken', 'jfAdminToken', 'jfUserName', 'jfUserId'])
        localStorage.removeItem(key);
    store.currentUser = null;
    store.forms = [];
    store.folders = [];
    store.submissions = {};
    store.materials = {};
}
export async function loginUser(user: StoreUser): Promise<void> {
    store.currentUser = user;
    localStorage.setItem('jfUserName', user.name);
    localStorage.setItem('jfUserId', String(user.id));
    await Promise.all([fetchFormsFromApi('all'), fetchFoldersFromApi()]);
}
export async function restoreSession(): Promise<void> {
    if (!localStorage.getItem('jfAccessToken'))
        return;
    try {
        const user = await getMe();
        await loginUser(user);
    }
    catch (error) {
        if (error instanceof ApiError && error.status === 401)
            signOut();
        else
            console.warn('Could not restore your session. Try reloading.', error);
    }
}
