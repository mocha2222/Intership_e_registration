import { reactive } from 'vue';
import type { RootState } from '@/types/store.types';
export const store = reactive<RootState>({
    currentUser: null,
    forms: [],
    folders: [],
    submissions: {},
    materials: {},
});
