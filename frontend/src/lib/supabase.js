import { createClient } from "@supabase/supabase-js";

// ── Supabase client — anon key for frontend ──
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

//  Forcefully clears corrupted local storage
export const clearSupabaseStorage = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.error("Failed to clear local storage", e);
  }
};

// Read local storage directly, ignoring Supabase's network lock
const getLocalSession = () => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Find the exact key Supabase uses to hide the token
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        return JSON.parse(localStorage.getItem(key));
      }
    }
  } catch (e) {
    console.error("Error reading local session", e);
  }
  return null;
};

// ── get current session token (PRODUCTION READY) ──
const getToken = async () => {
  // 1. Instantly grab the session from memory. Zero promises, zero timeouts.
  const sessionData = getLocalSession();

  // If it's missing entirely, they are cleanly logged out.
  if (!sessionData || !sessionData.access_token) {
    clearSupabaseStorage();
    throw new Error("Session expired. Please sign in again.");
  }

  // Manually check if the token is physically expired.
  // sessionData.expires_at is in seconds. Date.now() is in milliseconds.
  const currentTime = Math.floor(Date.now() / 1000);

  // We add a 30-second buffer to ensure the token doesn't expire while traveling to your Node.js backend
  if (sessionData.expires_at < currentTime + 30) {
    console.warn("Token physically expired. Nuke and redirect.");
    clearSupabaseStorage();
    throw new Error("Session expired. Please sign in again.");
  }

  // 4. Return the token instantly! No deadlocks possible.
  return sessionData.access_token;
};

// ── API helper — auto attaches Bearer token ──
const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  // ── authenticated requests ──
  get: async (path) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  post: async (path, body) => {
    // If there is no token or it's expired, getToken() will instantly throw an error here.
    // That error is caught by your Subscribe.jsx file, preventing the infinite hang.
    const token = await getToken();

    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log("API RAW RESPONSE:", data);

    if (!res.ok) throw data;
    return data;
  },

  put: async (path, body) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  delete: async (path) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // ── file upload — multipart/form-data ──
  upload: async (path, formData) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData, // no Content-Type — browser sets it with boundary
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // ── public requests — no auth needed ──
  publicGet: async (path) => {
    const res = await fetch(`${API_URL}${path}`);
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
};
