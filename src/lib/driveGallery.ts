// src/lib/driveGallery.ts
const DRIVE_API = "https://www.googleapis.com/drive/v3/files";

// CDN pubblico (no key)
export function driveCdnSrc(fileId: string, w = 1600) {
    // Esempi: =w320, =w640, =w1280; puoi usare anche -rw ecc.
    return `https://lh3.googleusercontent.com/d/${fileId}=w${w}`;
}

// Fallback API (richiede key, più “solido” ma meno cache/CDN)
export function driveApiSrc(fileId: string, apiKey: string) {
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${encodeURIComponent(apiKey)}`;
}

export type DriveImage = {
    id: string;
    name: string;
    mimeType: string;
    // sorgente principale: CDN
    src: string;
    // fallback alternativo: API
    fallbackSrc: string;
    modifiedTime?: string;
    thumbnail?: string | null;
};

type ListOpts = {
    apiKey: string;
    pageSize?: number;
    includeSharedDrives?: boolean;
};

type DriveFile = {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime?: string;
    thumbnailLink?: string;
    shortcutDetails?: { targetId?: string; targetMimeType?: string };
};

export async function listImagesInFolder(
    folderId: string,
    { apiKey, pageSize = 100, includeSharedDrives = true }: ListOpts
): Promise<DriveImage[]> {
    if (!apiKey) throw new Error("Google API key mancante");

    const fetchAll = async (q: string): Promise<DriveFile[]> => {
        const acc: DriveFile[] = [];
        let pageToken: string | undefined;
        do {
            const url = new URL(DRIVE_API);
            url.searchParams.set("q", q);
            url.searchParams.set("fields", "nextPageToken,files(id,name,mimeType,modifiedTime,thumbnailLink,shortcutDetails)");
            url.searchParams.set("pageSize", String(pageSize));
            url.searchParams.set("key", apiKey);
            if (pageToken) url.searchParams.set("pageToken", pageToken);
            if (includeSharedDrives) {
                url.searchParams.set("supportsAllDrives", "true");
                url.searchParams.set("includeItemsFromAllDrives", "true");
            }
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`Drive list error ${res.status}: ${await res.text()}`);
            const json = await res.json();
            (json.files ?? []).forEach((f: DriveFile) => acc.push(f));
            pageToken = json.nextPageToken;
        } while (pageToken);
        return acc;
    };

    // Split in due query per evitare 500
    const qImages = `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`;
    const qShort  = `'${folderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.shortcut'`;

    const [filesImages, filesShortcuts] = await Promise.all([fetchAll(qImages), fetchAll(qShort)]);
    const all = [...filesImages, ...filesShortcuts];

    const items = all
        .map((f) => {
            const isShortcut = f.mimeType === "application/vnd.google-apps.shortcut";
            const id = isShortcut ? f.shortcutDetails?.targetId : f.id;
            const mt = isShortcut ? f.shortcutDetails?.targetMimeType : f.mimeType;
            if (!id || !(mt ?? "").startsWith("image/")) return null;
            return {
                id,
                name: f.name,
                mimeType: mt!,
                modifiedTime: f.modifiedTime,
                thumbnail: f.thumbnailLink ?? null,
                src: driveCdnSrc(id, 1280),          // 👈 default 1280px lato CDN
                fallbackSrc: driveApiSrc(id, apiKey) // 👈 fallback API
            } as DriveImage;
        })
        .filter(Boolean) as DriveImage[];

    // de-duplica per id
    const seen = new Set<string>();
    return items.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}
