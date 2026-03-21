import { createClient } from "@supabase/supabase-js";

// ── Supabase client — anon key for frontend ──
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// ── get current session token ──
const getToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("TOKEN SESSION:", session);

  if (!session?.access_token) {
    return null;
  }

  return session.access_token;
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
    const token = await getToken();

    if (!token) {
      throw { error: "Session expired. Please login again." };
    }

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
