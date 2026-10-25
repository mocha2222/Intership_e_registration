import GOOGLE_FONT_FAMILIES from '@/assets/google-fonts.json';
export const SYSTEM_FONTS = [
    'Arial',
    'Helvetica',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Lucida Console',
    'Palatino Linotype',
    'Garamond',
    'Segoe UI',
    'Calibri',
    'Cambria',
    'Consolas',
];
const SYSTEM_FONT_SET = new Set(SYSTEM_FONTS);
const LEGACY_KHMER_FONT_ALIASES: Record<string, string> = {
    'Khmer OS': 'Noto Sans Khmer',
    'Khmer OS Battambang': 'Battambang',
    'Khmer OS Siemreap': 'Siemreap',
    'Khmer OS Muol': 'Moul',
    'Khmer OS Bokor': 'Bokor',
    'Khmer OS Content': 'Content',
    'Khmer OS Fasthand': 'Fasthand',
    'Khmer OS Freehand': 'Freehand',
    'Khmer OS Metal Chrieng': 'Metal',
    'Khmer OS Muol Light': 'Moul',
    'Khmer OS Muol Pali': 'Moulpali',
    'Khmer OS System': 'Noto Sans Khmer',
};
export function normalizeFontFamily(fontName: string): string {
    return LEGACY_KHMER_FONT_ALIASES[fontName] || fontName;
}
export function loadGoogleFont(fontName: string): void {
    const resolvedFontName = normalizeFontFamily(fontName);
    if (!resolvedFontName || SYSTEM_FONT_SET.has(resolvedFontName))
        return;
    // Normalize ID
    const id = `gfont-${resolvedFontName.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(id))
        return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(resolvedFontName)}&display=swap`;
    document.head.appendChild(link);
}
export const POPULAR_GOOGLE_FONTS = [
    ...new Set([...GOOGLE_FONT_FAMILIES, ...SYSTEM_FONTS]),
].sort((a, b) => a.localeCompare(b));
