import type { StoreUser, StoreForm, StoreFolder, SubmissionRow, FormMaterial } from '@/types/domain.types';
export interface RootState {
    currentUser: StoreUser | null;
    forms: StoreForm[];
    folders: StoreFolder[];
    submissions: Record<string, SubmissionRow[]>;
    materials: Record<string, FormMaterial[]>;
}
