// Client-side data structures used throughout the application.
// These mirror backend entities but use string IDs for Vue reactivity.
export interface StoreUser {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    username?: string;
    phoneNumber?: string;
    organizationName?: string;
}
export interface FormElement {
    id: number;
    type: string;
    label?: string;
    text?: string;
    subtext?: string;
    placeholder?: string;
    options?: string[];
    address?: Record<string, string>;
    scaleMax?: number;
    minLabel?: string;
    maxLabel?: string;
    columns?: string[];
    rows?: string[];
    settings?: ElementSettings;
}
export type DropdownOptionType = 'dropdown' | 'filltext';
export interface DropdownOptionMapping {
    parent: string;
    options: string[];
}
export interface DropdownChildSettings {
    id: string | number;
    label: string;
    mappings: DropdownOptionMapping[];
    optionTypes?: Record<string, DropdownOptionType>;
    children?: DropdownChildSettings[];
}
export interface ElementSettings {
    // Translation keys used by newly created elements until the user edits them.
    labelKey?: string;
    headingKey?: string;
    // Shared field presentation.
    sublabel?: string;
    content?: string;
    fontSize?: string;
    textAlign?: string;
    textColor?: string;
    // Compound field labels.
    firstLabel?: string;
    lastLabel?: string;
    street1Label?: string;
    street2Label?: string;
    cityLabel?: string;
    stateLabel?: string;
    postalLabel?: string;
    // Choices, tables, and dependent dropdowns.
    options?: string[];
    columns?: string[];
    rows?: string[];
    minLabel?: string; // Minimum label for range inputs (e.g., sliders).
    maxLabel?: string; // Maximum label for range inputs (e.g., sliders).
    optionTypes?: Record<string, DropdownOptionType>;
    childDropdowns?: DropdownChildSettings[];
    // Images and logo banners.
    imageUrl?: string;
    url?: string;
    width?: string;
    height?: string;
    panX?: number;
    panY?: number;
}
export interface FormPage {
    elements: FormElement[];
}
export interface FormDesign {
    pageBgColor: string;
    formBgColor: string;
    fontColor: string;
    inputBgColor: string;
    pageBgImage: string;
    formBgImage: string;
    fontFamily?: string;
}
export interface StoreFolder {
    id: string;
    name: string;
    color: string;
    parentId: string | null;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    isOpen?: boolean;
}
export interface FormSettings {
    permissionMode: string;
    materialUploadEnabled: boolean;
    submissionStartTime: string | null;
    submissionEndTime: string | null;
    expirationAt: string | null;
    submissionLimit: number | null;
}
export interface FormAttendance {
    attendanceEnabled: boolean;
    eventStartTime: string | null;
    eventEndTime: string | null;
    attendanceCloseTime: string | null;
}
export interface FormMaterial {
    id: number;
    formId: number;
    originalName: string;
    storedFilename: string;
    mimeType: string;
    size: number;
    createdAt?: string;
}
export interface StoreForm {
    id: string;
    shareToken?: string;
    title: string;
    status: string;
    ownerId: string;
    created_at: string;
    updated_at: string;
    layoutType: string;
    folderId: number | null;
    description?: string | null;
    schema?: unknown;
    pages: FormPage[];
    nextElementId: number;
    logoUrl: string;
    design: FormDesign;
    type?: string;
    isFavorite?: boolean;
    isArchived?: boolean;
    trashedAt?: string | null;
    settings: FormSettings;
    attendance: FormAttendance | null;
    
    // UI-convenience: split from expirationAt for date/time picker components
    expirationDate?: string | null;
    expirationTime?: string | null;
}
export interface PublicFormViewModel {
    id: string;
    shareToken?: string;
    title: string;
    description?: string | null;
    status: string;
    pages: FormPage[];
    nextElementId: number;
    logoUrl: string;
    design: FormDesign;
    settings: FormSettings;
    attendance: FormAttendance | null;
}
export interface SubmissionRow {
    id: string;
    submittedAt: string;
    [key: string]: string;
}
