export function useFormDraft(shareToken: string) {
    const key = 'formDraft_' + shareToken;
    function load(): Record<string, unknown> | null {
        try {
            const value = JSON.parse(localStorage.getItem(key) || 'null');
            return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
        }
        catch {
            return null;
        }
    }
    function save(answers: Record<string, unknown>) {
        try {
            localStorage.setItem(key, JSON.stringify(answers));
        }
        catch {
            // The form still works when browser storage is unavailable.
        }
    }
    function clear() {
        try {
            localStorage.removeItem(key);
        }
        catch { /* Storage may be disabled. */ }
    }
    return { load, save, clear };
}
