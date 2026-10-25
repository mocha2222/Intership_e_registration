// Format dates and times for display.
export function formatDate(dateString: string | Date | number): string {
    if (!dateString)
        return '';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
}
// Format response timestamps for display, using '-' when no date is available.
export function formatDateTime(value: string | Date | number | null | undefined): string {
    const date = parseApiDatetime(typeof value === 'number' ? new Date(value) : value);
    if (!date) return '-';
    return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatTime(value: string | Date | number | null | undefined): string {
    const date = parseApiDatetime(typeof value === 'number' ? new Date(value) : value);
    if (!date) return '-';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Date/time inputs need local calendar parts, rather than the UTC parts of an ISO string.
export function toLocalDatetime(value: string | Date | null | undefined): string {
    const date = parseApiDatetime(value, 0, 0);
    if (!date) return '';
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Parse dates and times into Date objects for comparisons.
export function parseApiDatetime(value: string | Date | undefined | null, defaultHour = 23, defaultMinute = 59): Date | null {
    // No value
    if (!value) {
        return null;
    }
    // Already a Date object
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }
    // Convert value to string
    const text = String(value).trim();
    // Preserve the instant in API timestamps before displaying it in local time.
    // Rebuilding these values from date parts would discard their UTC offset.
    if (/[T\s]\d{2}:\d{2}.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)) {
        const date = new Date(text);
        return isNaN(date.getTime()) ? null : date;
    }
    // Try to get YYYY-MM-DD and optional HH:MM
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
    if (match && match[3]) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        // If time exists, use it.
        // Otherwise use 23:59.
        const hour = match[4] ? Number(match[4]) : defaultHour;
        const minute = match[5] ? Number(match[5]) : defaultMinute;
        return new Date(year, month - 1, day, hour, minute);
    }
    // If the format wasn't recognized, let JavaScript try.
    const date = new Date(text);
    return isNaN(date.getTime()) ? null : date;
}
export function parseDateTime(dateValue: string | Date | undefined | null, timeValue?: string | null): Date | null {
    // No date
    if (!dateValue) {
        return null;
    }
    // If a time was provided, try to combine it with the date
    if (timeValue) {
        const match = String(timeValue).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (match && match[3]) {
            let hour = Number(match[1]);
            const minute = Number(match[2]);
            const period = match[3].toUpperCase();
            // Convert PM to 24-hour format
            if (period === 'PM' && hour !== 12) {
                hour += 12;
            }
            // Convert 12 AM to 00
            if (period === 'AM' && hour === 12) {
                hour = 0;
            }
            const dateAndTime = `${dateValue}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
            const result = parseApiDatetime(dateAndTime);
            if (result) {
                return result;
            }
        }
    }
    return parseApiDatetime(dateValue);
}

