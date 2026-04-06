
"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShieldCheck, Search, Activity, Sparkles } from "lucide-react";

const slides = [
  {
    src: "/images/hero-1.jpg",
    badge: "Transforming Patient Experiences",
    title: "Your Healthcare,",
    subtitle: "Perfectly Decoded",
    text: "Understand your medical reports with unprecedented clarity using our advanced clinical AI models.",
    accent: "text-sky-400",
  },
  {
    src: "/images/hero-2.jpg",
    badge: "Smart Symptom Insights",
    title: "Medical Insights,",
    subtitle: "Within Seconds",
    text: "Describe your symptoms and receive instant, science-backed guidance based on global medical data.",
    accent: "text-cyan-400",
  },
  {
    src: "/images/hero-3.jpg",
    badge: "Privacy & Security First",
    title: "Your Privacy,",
    subtitle: "Fortress-Level Secure",
    text: "Your health data is encrypted end-to-end with AES-256. We prioritize your confidentiality above all else.",
    accent: "text-blue-400",
  },
  {
    src: "/images/hero-4.jpg",
    badge: "24/7 Digital Wellness",
    title: "Your Health,",
    subtitle: "Always Empowered",
    text: "Empowering you with tools to manage your health journey anytime, anywhere in your language.",
    accent: "text-indigo-400",
  },
];

const trustItems = [
  { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, text: "End-to-end encrypted" },
  { icon: <Search className="w-4 h-4 text-sky-400" />, text: "Science-backed" },
  { icon: <Activity className="w-4 h-4 text-cyan-400" />, text: "99.2% accuracy" },
];

/* Enhanced Floating particles component with glow effects */
function FloatingParticles() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 0.5,
    duration: Math.random() * 15 + 8,
    delay: Math.random() * 8,
    color: ["rgba(14, 165, 233, 0.4)", "rgba(34, 211, 238, 0.3)", "rgba(103, 232, 249, 0.3)"][
      Math.floor(Math.random() * 3)
    ],
  }));

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full blur-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            filter: `blur(${p.size * 0.3}px)`,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          }}
          animate={{
            y: [0, -(Math.random() * 150 + 30)],
            x: [0, (Math.random() - 0.5) * 80],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.8],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function Hero() {
  const [current, setCurrent] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const magneticButton = useRef<HTMLAnchorElement>(null);
  const magneticSecondary = useRef<HTMLAnchorElement>(null);

  useGSAP(() => {
    // Initial Reveal
    const tl = gsap.timeline();
    tl.from(".reveal-text", {
      y: 100,
      opacity: 0,
      duration: 1.2,
      ease: "power4.out",
      stagger: 0.1,
    });
  }, { scope: container });

  // Magnetic Button Effect Utility
  const applyMagnetic = (e: React.MouseEvent, target: HTMLAnchorElement | null) => {
    if (!target) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = target.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const moveX = (clientX - centerX) * 0.35;
    const moveY = (clientY - centerY) * 0.35;

    gsap.to(target, {
      x: moveX,
      y: moveY,
      duration: 0.6,
      ease: "power2.out",
    });
  };

  const resetMagnetic = (target: HTMLAnchorElement | null) => {
    if (!target) return;
    gsap.to(target, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "elastic.out(1, 0.3)",
    });
  };

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const id = setInterval(nextSlide, 7000);
    return () => clearInterval(id);
  }, [nextSlide]);

  return (
    <section
      ref={container}
      className="relative flex items-center justify-center overflow-hidden min-h-[85vh]"
    >
      {/* ======= Base Background Layer ======= */}
      <div className="absolute inset-0 bg-[#020617] -z-40" />

      {/* ======= Cinematic Slideshow Background ======= */}
      <div className="absolute inset-0 -z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[current].src}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 2, ease: [0.33, 1, 0.68, 1] }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slides[current].src}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.4) saturate(0.6) contrast(1.1)" }}
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Multi-layer depth overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617]" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#020617]/40 to-[#020617]" />
      </div>

      {/* ======= Grid Pattern Overlay ======= */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(14,165,233,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.4) 1px, transparent 1px)`,
          backgroundSize: "100px 100px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 80%)",
        }}
      />

      {/* ======= Floating Particles ======= */}
      <FloatingParticles />

      {/* ======= Main Content ======= */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 md:pt-32 pb-16 md:pb-24 text-center">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-sky-400/30 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-sky-500/10 backdrop-blur-2xl shadow-[0_0_30px_rgba(14,165,233,0.3)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-300" />
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={slides[current].badge}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                className="text-[11px] font-black uppercase tracking-[0.35em] bg-gradient-to-r from-sky-200 to-cyan-200 bg-clip-text text-transparent"
              >
                {slides[current].badge}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Headline */}
        <div className="relative mb-8 max-w-[1000px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute -inset-4 bg-gradient-to-r from-sky-600/0 via-sky-500/5 to-cyan-600/0 rounded-3xl blur-3xl -z-20"
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] text-white drop-shadow-[0_10px_30px_rgba(14,165,233,0.3)]">
                <span className="inline-block pb-0 overflow-hidden">
                  {slides[current].title.split(" ").map((word, i) => (
                    <span key={i} className="inline-block overflow-hidden align-bottom">
                      <motion.span
                        initial={{ y: "150%", opacity: 0, rotateX: 90 }}
                        animate={{ y: 0, opacity: 1, rotateX: 0 }}
                        transition={{ 
                          duration: 0.9, 
                          delay: i * 0.12, 
                          ease: [0.16, 1, 0.3, 1] 
                        }}
                        className="inline-block mr-[0.25em]"
                        style={{ perspective: "1200px" }}
                      >
                        {word}
                      </motion.span>
                    </span>
                  ))}
                </span>
                <br />
                <span className="inline-block pb-0 overflow-hidden -mt-2">
                  {slides[current].subtitle.split(" ").map((word, i) => (
                    <span key={i} className="inline-block overflow-hidden align-bottom">
                      <motion.span
                        initial={{ y: "150%", opacity: 0, rotateX: 90 }}
                        animate={{ y: 0, opacity: 1, rotateX: 0 }}
                        transition={{ 
                          duration: 0.9, 
                          delay: 0.2 + i * 0.12, 
                          ease: [0.16, 1, 0.3, 1] 
                        }}
                        className="medical-gradient-animated inline-block mr-[0.25em] font-black"
                        style={{ perspective: "1200px" }}
                      >
                        {word}
                      </motion.span>
                    </span>
                  ))}
                </span>
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Subtitle */}
        <div className="h-[60px] flex items-center justify-center mb-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={current}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mx-auto max-w-xl text-sm md:text-base text-slate-100 font-medium leading-relaxed"
            >
              {slides[current].text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: [0.25, 1, 0.5, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <a
            ref={magneticButton}
            onMouseMove={(e) => applyMagnetic(e, magneticButton.current)}
            onMouseLeave={() => resetMagnetic(magneticButton.current)}
            href="/signup"
            className="group relative px-8 py-4 rounded-full font-bold text-base overflow-hidden transition-all shadow-[0_20px_60px_rgba(14,165,233,0.4)] hover:shadow-[0_30px_80px_rgba(14,165,233,0.6)]"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-400 bg-[length:200%_auto] animate-[gradient-shift_3s_ease_infinite]" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>

            <span className="relative flex items-center gap-3 text-white z-10">
              <Sparkles className="w-5 h-5" />
              Start Analyzing Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </a>

          <a
            ref={magneticSecondary}
            onMouseMove={(e) => applyMagnetic(e, magneticSecondary.current)}
            onMouseLeave={() => resetMagnetic(magneticSecondary.current)}
            href="#features"
            className="group relative px-8 py-4 rounded-full border border-cyan-400/40 bg-gradient-to-br from-sky-500/10 to-cyan-500/5 text-white font-bold text-base backdrop-blur-md transition-all hover:bg-gradient-to-br hover:from-sky-500/20 hover:to-cyan-500/15 hover:border-cyan-300/60 hover:shadow-[0_15px_40px_rgba(34,211,238,0.3)]"
          >
            <span className="relative flex items-center gap-2 z-10">
              Explore Capabilities
              <motion.div
                className="group-hover:translate-x-1 transition-transform duration-300"
              >
                →
              </motion.div>
            </span>
          </a>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.1 }}
          className="mt-24 pt-12 border-t border-gradient-to-r from-transparent via-sky-500/20 to-transparent flex flex-wrap items-center justify-center gap-8 md:gap-16"
        >
          {trustItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 + i * 0.1 }}
              whileHover={{ y: -2, scale: 1.05 }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg backdrop-blur-sm bg-sky-500/5 border border-sky-400/20 text-sm font-bold uppercase tracking-wider text-sky-200 hover:bg-sky-500/10 hover:border-sky-400/40 transition-all cursor-default"
            >
              <span className="text-lg">{item.icon}</span>
              {item.text}
            </motion.div>
          ))}
        </motion.div>

        {/* Slides Progress Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="mt-20 flex justify-center gap-4"
        >
          {slides.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setCurrent(i)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 1.4 + i * 0.05 }}
              whileHover={{ scale: 1.3 }}
              className="group relative h-2 w-20 rounded-full bg-white/10 transition-all hover:bg-white/20 cursor-pointer"
            >
              {i === current && (
                <motion.div
                  layoutId="indicator"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-400 shadow-lg shadow-sky-500/50"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 7, ease: "linear" }}
                />
              )}
              {i !== current && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-white/20"
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
