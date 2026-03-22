/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Plus, Pencil, Trash2, X, Check, Star } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/supabase.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

const EMPTY_FORM = {
  name: "",
  description: "",
  website_url: "",
  is_featured: false,
  events: [],
};

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    description: "",
  });

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    setLoading(true);
    try {
      const res = await api.publicGet("/charities");
      setCharities(res.charities || []);
    } catch {
      toast.error("Failed to fetch charities");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setShowForm(true);
  };

  const handleOpenEdit = (charity) => {
    setEditingId(charity.id);
    setForm({
      name: charity.name || "",
      description: charity.description || "",
      website_url: charity.website_url || "",
      is_featured: charity.is_featured || false,
      events: charity.events || [],
    });
    setImageFile(null);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Charity name is required");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("website_url", form.website_url);
      formData.append("is_featured", form.is_featured);
      formData.append("events", JSON.stringify(form.events));
      if (imageFile) formData.append("image", imageFile);

      if (editingId) {
        await api.upload(`/charities/${editingId}`, formData);
        toast.success("Charity updated!");
      } else {
        await api.upload("/charities", formData);
        toast.success("Charity created!");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchCharities();
    } catch (err) {
      toast.error(err.error || "Failed to save charity");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this charity? This cannot be undone.")) return;
    try {
      await api.delete(`/charities/${id}`);
      toast.success("Charity deleted");
      fetchCharities();
    } catch {
      toast.error("Failed to delete charity");
    }
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error("Event title and date are required");
      return;
    }
    setForm((f) => ({ ...f, events: [...f.events, { ...newEvent }] }));
    setNewEvent({ title: "", date: "", description: "" });
  };

  const handleRemoveEvent = (index) => {
    setForm((f) => ({ ...f, events: f.events.filter((_, i) => i !== index) }));
  };

  // ── upload method for PUT needs to use fetch directly ──
  api.upload = async (path, formData) => {
    const { supabase } = await import("../../lib/supabase.js");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const isUpdate = path.includes("/charities/") && editingId;
    const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
      method: isUpdate ? "PUT" : "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  };

  if (loading)
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        {/* ── header ── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Syne'] flex items-center gap-3">
              <Heart size={22} className="text-rose-400" />
              Charities
            </h1>
            <p className="text-zinc-500 mt-1">
              {charities.length} charities listed
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            <Plus size={16} />
            Add Charity
          </button>
        </div>

        {/* ── create/edit form ── */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold font-['Syne']">
                {editingId ? "Edit Charity" : "Add New Charity"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* name */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Charity name"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* description */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Charity description"
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* website */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={form.website_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, website_url: e.target.value }))
                  }
                  placeholder="https://charity.org"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* image upload */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-400 text-sm focus:outline-none file:mr-3 file:bg-zinc-700 file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs"
                />
                {imageFile && (
                  <p className="text-xs text-emerald-400 mt-1">
                    ✓ {imageFile.name}
                  </p>
                )}
              </div>

              {/* featured toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, is_featured: !f.is_featured }))
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    form.is_featured
                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  <Star size={14} />
                  {form.is_featured ? "Featured" : "Not Featured"}
                </button>
              </div>

              {/* events */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Events
                </label>
                {form.events.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl mb-2"
                  >
                    <div>
                      <p className="text-sm font-semibold">{event.title}</p>
                      <p className="text-xs text-zinc-500">{event.date}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvent(i)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Event title"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent((f) => ({ ...f, title: e.target.value }))
                    }
                    className="flex-1 min-w-32 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent((f) => ({ ...f, date: e.target.value }))
                    }
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddEvent}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl text-sm transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-50"
                >
                  <Check size={14} />
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Charity"
                      : "Create Charity"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ── charities list ── */}
        <div className="space-y-4">
          {charities.map((charity, i) => (
            <motion.div
              key={charity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex gap-4"
            >
              {/* image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                {charity.image_url ? (
                  <img
                    src={charity.image_url}
                    alt={charity.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart className="text-zinc-600" size={20} />
                  </div>
                )}
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold font-['Syne'] truncate">
                    {charity.name}
                  </h3>
                  {charity.is_featured && (
                    <Star size={12} className="text-yellow-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-zinc-500 text-sm line-clamp-1">
                  {charity.description}
                </p>
                {charity.events?.length > 0 && (
                  <p className="text-xs text-zinc-600 mt-1">
                    {charity.events.length} event(s)
                  </p>
                )}
              </div>

              {/* actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleOpenEdit(charity)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(charity.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
