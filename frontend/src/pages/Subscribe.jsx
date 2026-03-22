/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/UseAuth.js";
import { motion } from "framer-motion";
import { Check, ArrowRight, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/supabase.js";
import Layout from "../components/Layout.jsx";
import { supabase } from "../lib/supabase.js";

const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    price: "$89.00",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "Monthly prize draw entry",
      "Charity contribution (min 10%)",
      "Score tracking dashboard",
      "Winner verification system",
    ],
    popular: false,
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "$859.00",
    period: "/year",
    description: "Save 17% vs monthly",
    features: [
      "Everything in Monthly",
      "2 months free",
      "Priority draw entry",
      "Yearly impact report",
    ],
    popular: true,
  },
];

export default function Subscribe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [searchParams] = useSearchParams();
  const cancelled = searchParams.get("cancelled");

  const handleSubscribe = async (planId) => {
    console.log("Clicked plan:", planId);

    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate("/auth");
      return;
    }

    try {
      setLoading(planId);

      // error if the session is dead, which this catch block will elegantly handle.
      const res = await api.post("/subscriptions/create-order", {
        plan: planId,
      });

      console.log("API RESPONSE:", res);

      if (res?.approvalUrl) {
        // Safe redirect to PayPal
        window.location.href = res.approvalUrl;
      } else {
        throw new Error("No approval URL received from server");
      }
    } catch (err) {
      console.error("FULL ERROR:", err);
      // Clean fallback error message for users
      const errorMessage = err?.error || err?.message || "Something went wrong";
      toast.error(errorMessage);

      // If the error was our session timeout, redirect them to login
      if (errorMessage.includes("Session expired")) {
        navigate("/auth");
      }
    } finally {
      // Because we threw an error, this will ALWAYS run now!
      setLoading(null);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* ── cancelled notice ── */}
          {cancelled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-8 text-yellow-400"
            >
              <X size={16} />
              Payment cancelled. Choose a plan to try again.
            </motion.div>
          )}

          {/* ── header ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold font-['Syne'] mb-4">
              Choose Your Plan
            </h1>
            <p className="text-zinc-400 max-w-md mx-auto">
              Subscribe to enter monthly prize draws and support your chosen
              charity automatically.
            </p>
          </motion.div>

          {/* ── plan cards ── */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-8 rounded-2xl border transition-all ${
                  plan.popular
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                {/* popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                    BEST VALUE
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold font-['Syne'] mb-1">
                    {plan.label}
                  </h2>
                  <p className="text-zinc-500 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tabular-nums tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-zinc-500">{plan.period}</span>
                  </div>
                </div>

                {/* features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-3 text-sm text-zinc-300"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                        <Check size={10} className="text-emerald-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all ${
                    plan.popular
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                      : "bg-zinc-800 hover:bg-zinc-700 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.id
                    ? "Redirecting to PayPal..."
                    : `Subscribe ${plan.label}`}
                  {loading !== plan.id && <ArrowRight size={16} />}
                </button>
              </motion.div>
            ))}
          </div>

          {/* ── info ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-zinc-500 text-sm space-y-2"
          >
            <p>
              Payments processed securely via PayPal — PCI DSS Level 1 compliant
            </p>
            <p>
              Cancel anytime from your dashboard. Access continues until end of
              billing period.
            </p>
            <p className="text-zinc-600">
              Already have an account?{" "}
              <Link
                to="/auth"
                className="text-emerald-400 hover:text-emerald-300"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
