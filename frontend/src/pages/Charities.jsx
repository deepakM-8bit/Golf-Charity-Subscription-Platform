/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowRight, Heart } from "lucide-react";
import { api } from "../lib/supabase.js";
import Layout from "../components/Layout.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function Charities() {
  const [charities, setCharities] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .publicGet("/charities")
      .then((d) => setCharities(d.charities || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = charities.filter((c) => c.is_featured);
  const filtered = charities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* ── header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-4">
            <Heart className="text-rose-400" size={24} />
          </div>
          <h1 className="text-4xl font-bold font-['Syne'] mb-3">
            Our Charities
          </h1>
          <p className="text-zinc-400 max-w-md mx-auto">
            Every subscription contributes to these causes. Choose the one
            closest to your heart.
          </p>
        </motion.div>

        {/* ── search ── */}
        <div className="relative max-w-md mx-auto mb-12">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search charities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* ── featured section ── */}
        {!search && featured.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold font-['Syne'] mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              Featured Charities
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {featured.map((charity, i) => (
                <motion.div
                  key={charity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <CharityCard charity={charity} featured />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── all charities ── */}
        <div>
          <h2 className="text-xl font-bold font-['Syne'] mb-6">
            {search ? `Results for "${search}"` : "All Charities"}
          </h2>

          {filtered.length === 0 ? (
            <p className="text-zinc-500 text-center py-12">
              No charities found.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((charity, i) => (
                <motion.div
                  key={charity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <CharityCard charity={charity} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ── charity card component ──
function CharityCard({ charity, featured = false }) {
  return (
    <Link
      to={`/charities/${charity.id}`}
      className={`block rounded-2xl overflow-hidden border transition-all hover:border-zinc-600 group ${
        featured
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-zinc-800 bg-zinc-900/50"
      }`}
    >
      <div className="h-44 overflow-hidden bg-zinc-800">
        {charity.image_url ? (
          <img
            src={charity.image_url}
            alt={charity.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Heart className="text-zinc-700" size={32} />
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold font-['Syne']">{charity.name}</h3>
          {charity.is_featured && (
            <span className="text-xs text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5 flex-shrink-0">
              Featured
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-sm line-clamp-2 mb-3">
          {charity.description}
        </p>
        {charity.events?.length > 0 && (
          <p className="text-xs text-zinc-600">
            {charity.events.length} upcoming event
            {charity.events.length > 1 ? "s" : ""}
          </p>
        )}
        <div className="flex items-center gap-1 text-emerald-400 text-sm mt-3 font-semibold">
          View details <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  );
}
