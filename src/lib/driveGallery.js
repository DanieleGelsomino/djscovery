/* global gapi, google */
const GAPI_SRC = "https://apis.google.com/js/api.js";          // gapi (client)
const GIS_SRC  = "https://accounts.google.com/gsi/client";      // Google Identity Services

const API_KEY   = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let gapiLoaded = false;
let gapiInitted = false;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
    });
}

export async function initDriveClient() {
    if (!API_KEY || !CLIENT_ID) throw new Error("Missing Google env vars");
    await loadScript(GAPI_SRC);
    await loadScript(GIS_SRC);

    if (!gapiLoaded) {
        await new Promise((res) => {
            gapi.load("client", () => res());
        });
        gapiLoaded = true;
    }
    if (!gapiInitted) {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        });
        gapiInitted = true;
    }
}

async function getAccessToken(prompt = "none") {
    return new Promise((resolve, reject) => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: "https://www.googleapis.com/auth/drive.readonly",
            callback: (resp) => {
                if (resp && resp.access_token) resolve(resp.access_token);
                else reject(resp?.error || "No access token");
            },
        });
        tokenClient.requestAccessToken({ prompt });
    });
}

/** Ritorna: [{id, name, src, createdTime}] dalla cartella */
export async function listImagesInFolder(folderId, pageSize = 100) {
    await initDriveClient();
    // token silenzioso -> se fallisce chiedi consenso
    let token;
    try {
        token = await getAccessToken("none");
    } catch {
        token = await getAccessToken("consent");
    }
    gapi.client.setToken({ access_token: token });

    const res = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        orderBy: "createdTime desc",
        pageSize,
        fields: "files(id,name,createdTime)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });

    const files = res?.result?.files || [];
    return files.map((f) => ({
        id: f.id,
        name: f.name,
        createdTime: f.createdTime,
        src: `https://drive.google.com/uc?export=view&id=${f.id}`,
    }));
}
