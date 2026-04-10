"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Activity } from "lucide-react";
import { cn } from "../lib/utils";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function CTA() {
  const container = useRef<HTMLDivElement>(null);
  const primaryButton = useRef<HTMLAnchorElement>(null);
  const secondaryButton = useRef<HTMLAnchorElement>(null);

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

  return (
    <section ref={container} className="relative py-16 sm:py-20 md:py-28 lg:py-40 bg-[#020617] overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[600px] lg:h-[600px] rounded-full bg-sky-500/10 blur-[100px] sm:blur-[140px] lg:blur-[180px] animate-pulse" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-6 text-center reveal-content">
        <div className="relative rounded-[4rem] border border-white/10 bg-white/[0.02] backdrop-blur-3xl p-12 md:p-24 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-sky-500/10 blur-[60px] rounded-full" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[60px] rounded-full" />

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sky-400 text-xs font-bold uppercase tracking-[0.2em] mb-8"
            >
              <Activity className="w-4 h-4" />
              Join the Medical AI Revolution
            </motion.div>

            <h2 className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-8">
              Empower Your <br />
              <span className="medical-gradient-animated block pb-2">Health Journey Today</span>
            </h2>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              Experience the future of medical diagnostics. Start your clinical analysis 
              with 3 comprehensive reports—absolutely no commitment required.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <a 
                ref={primaryButton}
                onMouseMove={(e) => applyMagnetic(e, primaryButton.current)}
                onMouseLeave={() => resetMagnetic(primaryButton.current)}
                href="/signup" 
                className="group relative px-10 py-5 rounded-full bg-sky-500 text-white font-bold text-lg transition-all hover:bg-sky-400 shadow-[0_20px_40px_rgba(14,165,233,0.3)]"
              >
                Get Started for Free
                <ArrowRight className="inline-block ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </a>
              
              <a 
                ref={secondaryButton}
                onMouseMove={(e) => applyMagnetic(e, secondaryButton.current)}
                onMouseLeave={() => resetMagnetic(secondaryButton.current)}
                href="/login" 
                className="px-10 py-5 rounded-full border border-white/10 bg-white/5 text-white font-bold text-lg backdrop-blur-md transition-all hover:bg-white/10"
              >
                Sign In
              </a>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-12 text-slate-500 text-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              Already trusted by 10,000+ proactive patients globally.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
