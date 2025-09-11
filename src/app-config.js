// src/app-config.js
// Makes selected build-time env vars available at runtime via window.APP_CONFIG
// so components can fallback when import.meta.env is unavailable post-build.

// Ensure global exists
window.APP_CONFIG = window.APP_CONFIG || {};

try {
  // Vite replaces import.meta.env.* at build time
  window.APP_CONFIG.GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || window.APP_CONFIG.GOOGLE_API_KEY || "";
  window.APP_CONFIG.GOOGLE_DRIVE_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || window.APP_CONFIG.GOOGLE_DRIVE_FOLDER_ID || "";
  window.APP_CONFIG.API_BASE_URL = (import.meta.env.VITE_API_BASE_URL && String(import.meta.env.VITE_API_BASE_URL)) || window.APP_CONFIG.API_BASE_URL || "";
  // Other optional keys you might want available at runtime
  window.APP_CONFIG.WHATSAPP_COMMUNITY_URL = import.meta.env.VITE_WHATSAPP_COMMUNITY_URL || window.APP_CONFIG.WHATSAPP_COMMUNITY_URL || "";
  window.APP_CONFIG.WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || window.APP_CONFIG.WHATSAPP_PHONE || "";
  window.APP_CONFIG.GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY || window.APP_CONFIG.GEOAPIFY_KEY || "";
  window.APP_CONFIG.ORG_NAME = import.meta.env.VITE_ORG_NAME || window.APP_CONFIG.ORG_NAME || "";
  window.APP_CONFIG.ORG_EMAIL = import.meta.env.VITE_ORG_EMAIL || window.APP_CONFIG.ORG_EMAIL || "";
  window.APP_CONFIG.ORG_ADDRESS = import.meta.env.VITE_ORG_ADDRESS || window.APP_CONFIG.ORG_ADDRESS || "";
  window.APP_CONFIG.ORG_PIVA = import.meta.env.VITE_ORG_PIVA || window.APP_CONFIG.ORG_PIVA || "";
  window.APP_CONFIG.SITE_URL = import.meta.env.VITE_SITE_URL || window.APP_CONFIG.SITE_URL || "";
} catch (e) {
  // No-op: in dev/build import.meta.env is defined; this is just a safety net
}

