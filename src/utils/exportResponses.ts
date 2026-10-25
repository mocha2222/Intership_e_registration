export interface ResponseColumn {
    key: string;
    label: string;
    type?: string;
}
export type ResponseValues = Record<string, unknown>;
export function exportValue(value: unknown, type?: string): string {
    const text = value == null ? '' : String(value);
    if (type === 'fileupload' || type === 'image') {
        try {
            const file = JSON.parse(text);
            if (Array.isArray(file))
                return file.map(item => item.fileName || item.name || '').filter(Boolean).join(', ');
            return file.fileName || file.name || text;
        }
        catch {
            return text;
        }
    }
    if (type === 'paragraph') {
        return new DOMParser().parseFromString(text, 'text/html').body.textContent || '';
    }
    return text;
}
export function responseMatrix(columns: ResponseColumn[], rows: ResponseValues[]): string[][] {
    return [
        ['Submission Date', ...columns.map(column => column.label)],
        ...rows.map(row => [
            String(row.submittedAt ?? ''),
            ...columns.map(column => exportValue(row[column.key], column.type)),
        ]),
    ];
}
function csvCell(value: string): string {
    // Keep spreadsheet programs from treating an answer as a formula.
    const safe = /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
    return '"' + safe.replace(/"/g, '""') + '"';
}
export function buildCSV(columns: ResponseColumn[], rows: ResponseValues[]): string {
    return '\uFEFF' + responseMatrix(columns, rows).map(row => row.map(csvCell).join(',')).join('\r\n');
}
export function downloadCSV(columns: ResponseColumn[], rows: ResponseValues[]) {
    const url = URL.createObjectURL(new Blob([buildCSV(columns, rows)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'responses.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
