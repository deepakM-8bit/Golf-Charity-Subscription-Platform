/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Trophy, Target, ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/supabase.js";
import Layout from "../components/Layout.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Landing() {
  const [charities, setCharities] = useState([]);

  useEffect(() => {
    api
      .publicGet("/charities?featured=true")
      .then((d) => setCharities(d.charities || []))
      .catch(() => {});
  }, []);

  return (
    <Layout>
      <div className="overflow-x-hidden">
        {/* ── HERO ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pb-20 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-500/8 blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-[80px]" />
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm mb-8"
          >
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Monthly draws live now
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-6xl md:text-8xl font-extrabold leading-none tracking-tight mb-6 max-w-5xl font-['Syne']"
          >
            Play Golf.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Win Big.
            </span>
            <br />
            Give More.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-zinc-400 text-lg md:text-xl max-w-xl leading-relaxed mb-10"
          >
            Subscribe, enter your Stableford scores, participate in monthly
            prize draws, and automatically donate to a cause you believe in.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/subscribe"
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-full text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Start Subscribing <ArrowRight size={20} />
            </Link>
            <Link
              to="/draws"
              className="flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all hover:bg-zinc-900"
            >
              See Draws
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-600 animate-bounce"
          >
            <ChevronDown size={24} />
          </motion.div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-32 px-6 max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-['Syne'] mb-4">
              How it works
            </h2>
            <p className="text-zinc-500">Three steps. That's all it takes.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Target className="text-emerald-400" size={28} />,
                step: "01",
                title: "Enter Your Scores",
                desc: "Submit your last 5 Stableford scores. Each score entered qualifies you for the monthly draw.",
              },
              {
                icon: <Trophy className="text-yellow-400" size={28} />,
                step: "02",
                title: "Win Prize Draws",
                desc: "Match 3, 4, or 5 numbers in our monthly draw to win from prize pools funded by all subscribers.",
              },
              {
                icon: <Heart className="text-rose-400" size={28} />,
                step: "03",
                title: "Support a Charity",
                desc: "At least 10% of your subscription automatically goes to a charity you choose. You can give more.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="relative p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all group"
              >
                <div className="absolute top-6 right-6 text-5xl font-extrabold text-zinc-800 group-hover:text-zinc-700 transition-colors font-['Syne']">
                  {item.step}
                </div>
                <div className="mb-4 p-3 rounded-xl bg-zinc-800 w-fit">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 font-['Syne']">
                  {item.title}
                </h3>
                <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── PRIZE POOLS ── */}
        <section className="py-24 px-6 border-y border-zinc-800 bg-zinc-900/30">
          <div className="max-w-5xl mx-auto text-center">
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-4xl font-bold font-['Syne'] mb-12"
            >
              Prize Pool Structure
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  match: "5 Number Match",
                  share: "40%",
                  label: "Jackpot",
                  color: "emerald",
                  rollover: true,
                },
                {
                  match: "4 Number Match",
                  share: "35%",
                  label: "Major Prize",
                  color: "yellow",
                  rollover: false,
                },
                {
                  match: "3 Number Match",
                  share: "25%",
                  label: "Prize",
                  color: "teal",
                  rollover: false,
                },
              ].map((tier, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className={`p-8 rounded-2xl border ${
                    tier.color === "emerald"
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : tier.color === "yellow"
                        ? "border-yellow-500/40 bg-yellow-500/5"
                        : "border-teal-500/40 bg-teal-500/5"
                  }`}
                >
                  <div
                    className={`text-5xl font-extrabold mb-2 font-['Syne'] ${
                      tier.color === "emerald"
                        ? "text-emerald-400"
                        : tier.color === "yellow"
                          ? "text-yellow-400"
                          : "text-teal-400"
                    }`}
                  >
                    {tier.share}
                  </div>
                  <div className="text-lg font-semibold mb-1">{tier.match}</div>
                  <div className="text-zinc-500 text-sm">{tier.label}</div>
                  {tier.rollover && (
                    <div className="mt-3 text-xs text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1 inline-block">
                      Jackpot rolls over if unclaimed
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURED CHARITIES ── */}
        {charities.length > 0 && (
          <section className="py-32 px-6 max-w-6xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold font-['Syne'] mb-4">
                Charities we support
              </h2>
              <p className="text-zinc-500">
                Your subscription makes a real difference
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {charities.map((charity, i) => (
                <motion.div
                  key={charity.id}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all group"
                >
                  <div className="h-48 overflow-hidden bg-zinc-800">
                    {charity.image_url && (
                      <img
                        src={charity.image_url}
                        alt={charity.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 font-['Syne']">
                      {charity.name}
                    </h3>
                    <p className="text-zinc-500 text-sm line-clamp-2">
                      {charity.description}
                    </p>
                    <Link
                      to={`/charities/${charity.id}`}
                      className="mt-4 text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-1"
                    >
                      Learn more <ArrowRight size={12} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mt-10"
            >
              <Link
                to="/charities"
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-2 justify-center"
              >
                View all charities <ArrowRight size={16} />
              </Link>
            </motion.div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="py-32 px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center p-12 rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/30 to-zinc-900/50"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-['Syne'] mb-4">
              Ready to play with purpose?
            </h2>
            <p className="text-zinc-400 mb-8">
              Join hundreds of golfers who subscribe, compete, and give back
              every month.
            </p>
            <Link
              to="/subscribe"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-10 py-5 rounded-full text-xl transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/30"
            >
              Subscribe Now <ArrowRight size={22} />
            </Link>
          </motion.div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-zinc-800 px-8 py-10 text-center text-zinc-600 text-sm">
          © 2026 GolfGives. Built for a better game and a better world.
        </footer>
      </div>
    </Layout>
  );
}
