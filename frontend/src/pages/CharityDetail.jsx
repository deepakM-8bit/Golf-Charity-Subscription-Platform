/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Calendar, Heart } from "lucide-react";
import { api } from "../lib/supabase.js";
import { useAuth } from "../contexts/UseAuth.js";
import Layout from "../components/Layout.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function CharityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [charity, setCharity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    api
      .publicGet(`/charities/${id}`)
      .then((d) => setCharity(d.charity))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelect = async () => {
    if (!user) return;
    setSelecting(true);
    try {
      await api.post("/charities/user/selection", {
        charity_id: id,
        contribution_percentage: 10,
      });
      setSelected(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSelecting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!charity)
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-zinc-500">Charity not found</p>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* ── back ── */}
        <Link
          to="/charities"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Charities
        </Link>

        {/* ── hero image ── */}
        {charity.image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl overflow-hidden h-64 md:h-80 mb-8"
          >
            <img
              src={charity.image_url}
              alt={charity.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {/* ── header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold font-['Syne']">
                  {charity.name}
                </h1>
                {charity.is_featured && (
                  <span className="text-xs text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1">
                    Featured
                  </span>
                )}
              </div>
              {charity.website_url && (
                <a
                  href={charity.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                >
                  <Globe size={14} />
                  Visit Website
                </a>
              )}
            </div>

            {/* select charity button */}
            {user && (
              <button
                onClick={handleSelect}
                disabled={selecting || selected}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 text-black disabled:text-zinc-500 font-bold px-6 py-3 rounded-xl transition-all"
              >
                <Heart size={16} />
                {selected
                  ? "Charity Selected!"
                  : selecting
                    ? "Selecting..."
                    : "Support This Charity"}
              </button>
            )}

            {!user && (
              <Link
                to="/auth"
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl transition-all"
              >
                Sign in to Support
              </Link>
            )}
          </div>
        </motion.div>

        {/* ── description ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6"
        >
          <h2 className="font-bold font-['Syne'] mb-3">About</h2>
          <p className="text-zinc-400 leading-relaxed">{charity.description}</p>
        </motion.div>

        {/* ── upcoming events ── */}
        {charity.events?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <h2 className="font-bold font-['Syne'] mb-4 flex items-center gap-2">
              <Calendar className="text-emerald-400" size={18} />
              Upcoming Events
            </h2>
            <div className="space-y-4">
              {charity.events.map((event, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-xl border border-zinc-800"
                >
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="text-emerald-400" size={18} />
                  </div>
                  <div>
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-zinc-500 text-sm">
                      {new Date(event.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    {event.description && (
                      <p className="text-zinc-400 text-sm mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
