/// <reference types="vite/client" />

// (opzionale ma utile) tipizza le variabili che usi:
interface ImportMetaEnv {
    readonly VITE_GOOGLE_API_KEY: string
    // readonly VITE_ALTRA_VAR?: string
}
interface ImportMeta {
    readonly env: ImportMetaEnv
}
