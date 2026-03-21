/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowRight, Check } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/supabase.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

// minimum 10% charity contribution
const MIN_CONTRIBUTION = 10;

export default function Onboarding() {
  const [charities, setCharities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [contribution, setContribution] = useState(MIN_CONTRIBUTION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .publicGet("/charities")
      .then((d) => setCharities(d.charities || []))
      .catch(() => toast.error("Failed to load charities"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!selected) {
      toast.error("Please select a charity to continue");
      return;
    }
    setSaving(true);
    try {
      await api.post("/charities/user/selection", {
        charity_id: selected,
        contribution_percentage: contribution,
      });
      toast.success("Charity selected successfully!");
      navigate("/subscribe");
    } catch (err) {
      toast.error(err.error || "Failed to save charity selection");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* ── header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Heart className="text-emerald-400" size={24} />
          </div>
          <h1 className="text-4xl font-bold font-['Syne'] mb-3">
            Choose Your Charity
          </h1>
          <p className="text-zinc-400 max-w-md mx-auto">
            A minimum of{" "}
            <span className="text-emerald-400 font-semibold">10%</span> of your
            subscription will go directly to your chosen charity every month.
          </p>
        </motion.div>

        {/* ── charity grid ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {charities.map((charity, i) => (
            <motion.div
              key={charity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setSelected(charity.id)}
              className={`relative cursor-pointer rounded-2xl border overflow-hidden transition-all ${
                selected === charity.id
                  ? "border-emerald-500 bg-emerald-500/5"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"
              }`}
            >
              {/* selected check */}
              {selected === charity.id && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center z-10">
                  <Check size={12} className="text-black" />
                </div>
              )}

              {charity.image_url && (
                <div className="h-36 overflow-hidden">
                  <img
                    src={charity.image_url}
                    alt={charity.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-5">
                <h3 className="font-bold font-['Syne'] mb-1">{charity.name}</h3>
                <p className="text-zinc-500 text-sm line-clamp-2">
                  {charity.description}
                </p>
                {charity.is_featured && (
                  <span className="mt-2 inline-block text-xs text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">
                    Featured
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── contribution slider ── */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Monthly Contribution</h3>
              <span className="text-2xl font-bold text-emerald-400 font-['Syne']">
                {contribution}%
              </span>
            </div>
            <input
              type="range"
              min={MIN_CONTRIBUTION}
              max={100}
              value={contribution}
              onChange={(e) => setContribution(parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>Min 10%</span>
              <span>100%</span>
            </div>
            <p className="text-zinc-500 text-sm mt-3">
              You can always adjust this from your dashboard.
            </p>
          </motion.div>
        )}

        {/* ── continue button ── */}
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black disabled:text-zinc-500 font-bold px-10 py-4 rounded-full text-lg transition-all hover:scale-105"
          >
            {saving ? "Saving..." : "Continue to Subscribe"}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
