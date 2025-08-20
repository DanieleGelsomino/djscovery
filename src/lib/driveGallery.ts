// src/lib/driveGallery.ts
const DRIVE_API = "https://www.googleapis.com/drive/v3/files";

// URL immagine diretto (niente OAuth) per file PUBBLICI
export function driveImageSrc(fileId: string, apiKey: string) {
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${encodeURIComponent(apiKey)}`;
}

export type DriveImage = {
    id: string;
    name: string;
    mimeType: string;
    src: string;
    modifiedTime?: string;
    thumbnail?: string | null;
};

type ListOpts = {
    apiKey: string;
    pageSize?: number;
    includeSharedDrives?: boolean; // true se la cartella è in uno Shared Drive
};

type DriveShortcutDetails = {
    targetId?: string;
    targetMimeType?: string;
};

type DriveFile = {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime?: string;
    thumbnailLink?: string;
    shortcutDetails?: DriveShortcutDetails;
};

type DriveListResponse = {
    nextPageToken?: string;
    files?: DriveFile[];
};

export async function listImagesInFolder(
    folderId: string,
    opts: ListOpts
): Promise<DriveImage[]> {
    const { apiKey, pageSize = 100, includeSharedDrives = true } = opts;
    if (!apiKey) throw new Error("Google API key mancante");

    // Helper per paginare con campi minimali (evita 500)
    const fetchAll = async (q: string): Promise<DriveFile[]> => {
        const acc: DriveFile[] = [];
        let pageToken: string | undefined;

        do {
            const url = new URL(DRIVE_API);
            url.searchParams.set("q", q);
            // campi minimi; niente nested complessi nel filtro
            url.searchParams.set(
                "fields",
                "nextPageToken,files(id,name,mimeType,modifiedTime,thumbnailLink,shortcutDetails)"
            );
            url.searchParams.set("pageSize", String(pageSize));
            url.searchParams.set("key", apiKey);
            if (pageToken) url.searchParams.set("pageToken", pageToken);
            if (includeSharedDrives) {
                url.searchParams.set("supportsAllDrives", "true");
                url.searchParams.set("includeItemsFromAllDrives", "true");
            }

            const res = await fetch(url.toString());
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Drive list error ${res.status}: ${text}`);
            }
            const json = (await res.json()) as DriveListResponse;
            (json.files ?? []).forEach((f) => acc.push(f));
            pageToken = json.nextPageToken;
        } while (pageToken);

        return acc;
    };

    // 1) Immagini reali
    const Q_IMAGES = `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`;
    const filesImages = await fetchAll(Q_IMAGES);

    // 2) Shortcut (filtrate lato client, niente targetMimeType nella query)
    const Q_SHORTCUTS = `'${folderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.shortcut'`;
    const filesShortcuts = await fetchAll(Q_SHORTCUTS);

    // Normalizza: tieni solo immagini (vere o target di shortcut)
    const all = [...filesImages, ...filesShortcuts];

    const items: DriveImage[] = all
        .map((f) => {
            const isShortcut = f.mimeType === "application/vnd.google-apps.shortcut";
            const effectiveId = isShortcut ? f.shortcutDetails?.targetId : f.id;
            const effectiveMime = isShortcut
                ? f.shortcutDetails?.targetMimeType
                : f.mimeType;

            if (!effectiveId || !(effectiveMime ?? "").startsWith("image/")) return null;

            return {
                id: effectiveId,
                name: f.name,
                mimeType: effectiveMime!,
                modifiedTime: f.modifiedTime,
                thumbnail: f.thumbnailLink ?? null,
                src: driveImageSrc(effectiveId, apiKey),
            } as DriveImage;
        })
        .filter((x): x is DriveImage => Boolean(x));

    // De-duplica per id (caso: immagine presente e anche shortcut verso la stessa)
    const seen = new Set<string>();
    const dedup: DriveImage[] = [];
    for (const it of items) {
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        dedup.push(it);
    }

    return dedup;
}
