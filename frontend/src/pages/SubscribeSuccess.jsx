/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { api } from "../lib/supabase.js";
import { useAuth } from "../contexts/UseAuth.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Layout from "../components/Layout.jsx";

export default function SubscribeSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [error, setError] = useState("");
  const { refreshSubscription } = useAuth();

  useEffect(() => {
    const capturePayment = async () => {
      // PayPal returns token as order ID
      const orderId = searchParams.get("token");

      if (!orderId) {
        setError("No payment token found");
        setStatus("error");
        return;
      }

      try {
        await api.post("/subscriptions/capture-order", { orderId });
        await refreshSubscription(); // update auth context
        setStatus("success");
      } catch (err) {
        console.error("Capture error:", err);
        setError(err.error || "Failed to activate subscription");
        setStatus("error");
      }
    };

    capturePayment();
  }, [searchParams, refreshSubscription]);

  if (status === "loading") return <LoadingSpinner fullScreen />;

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center"
        >
          {status === "success" ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-emerald-400" size={40} />
                </div>
              </div>
              <h1 className="text-3xl font-bold font-['Syne'] mb-3">
                You're all set! 🎉
              </h1>
              <p className="text-zinc-400 mb-8">
                Your subscription is now active. Start entering your scores and
                participate in monthly prize draws!
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-full transition-all hover:scale-105"
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                  <XCircle className="text-red-400" size={40} />
                </div>
              </div>
              <h1 className="text-3xl font-bold font-['Syne'] mb-3">
                Something went wrong
              </h1>
              <p className="text-zinc-400 mb-4">{error}</p>
              <p className="text-zinc-500 text-sm mb-8">
                Your payment may have been processed. Please contact support if
                you were charged.
              </p>
              <Link
                to="/subscribe"
                className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-4 rounded-full transition-all"
              >
                Try Again
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
