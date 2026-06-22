/**
 * getVideoEmbedUrl
 *
 * YouTube, Vimeo, അല്ലെങ്കിൽ direct URL-നെ
 * proper embed URL ആക്കി return ചെയ്യുന്നു.
 *
 * YouTube handle ചെയ്യുന്നത്:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST
 *  - https://youtu.be/VIDEO_ID
 *  - https://youtu.be/VIDEO_ID?si=SHARE_TOKEN
 *  - https://www.youtube.com/shorts/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID (already embed)
 */
export function getVideoEmbedUrl(url: string): string {
    if (!url) return "";
    const trimmed = url.trim();

    // ── YouTube ──────────────────────────────────────────────
    if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
        const videoId = extractYouTubeId(trimmed);
        if (videoId) {
            // autoplay=0, rel=0 (related videos hide), modestbranding=1
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
        }
        // ID extract ചെയ്യാൻ കഴിഞ്ഞില്ലെങ്കിൽ as-is return
        return trimmed;
    }

    // ── Vimeo ────────────────────────────────────────────────
    if (trimmed.includes("vimeo.com")) {
        // https://vimeo.com/123456789 അല്ലെങ്കിൽ https://vimeo.com/channels/xxx/123456789
        const match = trimmed.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
        const vimeoId = match?.[1];
        if (vimeoId) {
            return `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`;
        }
        return trimmed;
    }

    // ── Other / Direct URL ───────────────────────────────────
    return trimmed;
}

/**
 * extractYouTubeId
 * YouTube video ID extract ചെയ്യുന്നു — എല്ലാ YouTube URL formats-ഉം support ചെയ്യുന്നു
 */
export function extractYouTubeId(url: string): string | null {
    // Already an embed URL → ID extract
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    // youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];

    // youtube.com/shorts/VIDEO_ID
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];

    // youtube.com/v/VIDEO_ID
    const vMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
    if (vMatch) return vMatch[1];

    return null;
}

/**
 * getVideoType
 * URL നോക്കി video type return ചെയ്യുന്നു
 */
export function getVideoType(url: string | null): "bunny" | "youtube" | "vimeo" | "mp4" | "none" {
    if (!url) return "none";
    const u = url.trim();
    if (u.startsWith("bunny://")) return "bunny";
    if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
    if (u.includes("vimeo.com")) return "vimeo";
    return "mp4";
}
