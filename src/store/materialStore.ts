import { store } from '@/store/store';
import * as materialsApi from '@/api/materialsApi';
import type { FormMaterial } from '@/types/domain.types';

export function getMaterials(formKey: string | number): FormMaterial[] {
    return store.materials[String(formKey)] ?? [];
}

export async function fetchMaterials(identifier: string | number, cacheKey: string | number = identifier): Promise<FormMaterial[]> {
    const materials = await materialsApi.listMaterials(identifier);
    store.materials[String(cacheKey)] = materials;
    return materials;
}

export async function uploadMaterials(formId: string | number, files: File[]): Promise<FormMaterial[]> {
    const createdMaterials = await materialsApi.uploadMaterials(formId, files);
    const key = String(formId);
    store.materials[key] = [...getMaterials(key), ...createdMaterials];
    return createdMaterials;
}

export async function deleteMaterial(formId: string | number, materialId: number): Promise<void> {
    await materialsApi.deleteMaterial(formId, materialId);
    const key = String(formId);
    store.materials[key] = getMaterials(key).filter(material => material.id !== materialId);
}
