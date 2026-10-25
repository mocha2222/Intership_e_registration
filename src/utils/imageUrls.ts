export function resolveImageUrl(url: string | null | undefined): string {
    if (!url)
        return '';
    if (!url.startsWith('/uploads'))
        return url;
    const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/api\/?$/, '');
    return base + url;
}
