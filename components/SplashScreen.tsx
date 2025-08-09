"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  logoSrc?: string;   // path di /public
  duration?: number;  // ms
  title?: string;
  tagLine?: string;
};

export default function SplashScreen({
  logoSrc = "/logomindcards.png",
  duration = 2600,
  title = "MindCards",
  tagLine = "Mind maps + flashcards for smarter learning",
}: Props) {
  const [visible, setVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!visible) return null;

  return (
    <motion.aside
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white dark:bg-[#0b1020]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background aurora */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={prefersReducedMotion ? {} : { rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(79,70,229,0.12), rgba(139,92,246,0.12), rgba(6,182,212,0.12), rgba(79,70,229,0.12))",
          filter: "blur(60px)",
        }}
      />

      {/* Stack container with perspective */}
      <div className="relative flex flex-col items-center">
        <div className="relative h-[210px] w-[320px]" style={{ perspective: 1000 }}>
          {/* Back cards */}
          <motion.div
            className="absolute left-0 top-0 h-[180px] w-[280px] rounded-3xl shadow-2xl"
            style={{
              background: "linear-gradient(135deg,#4f46e5,#8b5cf6)",
              transform: "translate(28px,24px) rotate(-6deg)",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ duration: 0.4 }}
          />
          <motion.div
            className="absolute left-0 top-0 h-[180px] w-[280px] rounded-3xl shadow-2xl"
            style={{
              background: "linear-gradient(135deg,#06b6d4,#4f46e5)",
              transform: "translate(12px,10px) rotate(6deg)",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          />

          {/* Top card (flip in) */}
          <motion.div
            className="absolute left-0 top-0 flex h-[190px] w-[300px] items-center justify-center rounded-3xl bg-white/70 p-5 shadow-2xl ring-1 ring-black/5 backdrop-blur-md dark:bg-white/10 dark:ring-white/10"
            style={{ transformStyle: "preserve-3d", translateX: 10, translateY: 10 }}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{
              rotateY: 0,
              opacity: 1,
              y: prefersReducedMotion ? 0 : [0, -4, 0],
            }}
            transition={{
              type: "spring",
              stiffness: 160,
              damping: 18,
              y: { duration: 2.2, repeat: prefersReducedMotion ? 0 : Infinity, repeatType: "mirror" },
            }}
          >
            <Image
              src={logoSrc}
              alt="MindCards"
              width={220}
              height={120}
              priority
              className="drop-shadow"
            />
          </motion.div>
        </div>

        {/* Title + tagline */}
        <motion.div
          className="mt-6 text-center"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{tagLine}</p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="mx-auto mt-8 h-1 w-60 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: duration / 1000, ease: "easeInOut" }}
          style={{ transformOrigin: "left" }}
        >
          <div
            className="h-full w-full"
            style={{ background: "linear-gradient(90deg,#4f46e5,#8b5cf6,#06b6d4)" }}
          />
        </motion.div>

        {/* Skip */}
        <button
          onClick={() => setVisible(false)}
          className="mt-4 text-xs text-slate-500 underline-offset-4 hover:underline"
        >
          Lewati
        </button>
      </div>
    </motion.aside>
  );
}
