"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Activity } from "lucide-react";
import gsap from "gsap";
import { Logo } from "./logo";

function Magnetic({ children }: { children: React.ReactElement }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const xTo = gsap.quickTo(ref.current, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yTo = gsap.quickTo(ref.current, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const { clientX, clientY } = e;
      const { height, width, left, top } = ref.current.getBoundingClientRect();
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);
      xTo(x * 0.35);
      yTo(y * 0.35);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    const element = ref.current;
    if (element) {
      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (element) {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`pointer-events-auto flex items-center justify-between gap-8 px-6 h-14 md:h-16 rounded-full transition-all duration-500 max-w-5xl w-full ${
          scrolled
            ? "glass border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] translate-y-2 scale-[0.98]"
            : "bg-white/5 border-transparent backdrop-blur-sm"
        }`}
      >
        <Logo size="md" className="pointer-events-auto" />

        <div className="hidden md:flex items-center gap-1">
          {["Features", "How It Works", "Pricing", "FAQ"].map((item) => (
            <Magnetic key={item}>
              <a
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-all rounded-full hover:bg-white/5"
              >
                {item}
              </a>
            </Magnetic>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Magnetic>
            <a href="/login" className="text-sm font-medium text-slate-400 hover:text-white px-4 py-2 transition-colors">
              Log In
            </a>
          </Magnetic>
          <a href="/signup" className="relative group overflow-hidden px-6 py-2.5 rounded-full">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-cyan-400 transition-transform group-hover:scale-105" />
            <span className="relative text-sm font-semibold text-white">Get Started</span>
          </a>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-slate-300 hover:text-white">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="absolute top-24 left-4 right-4 glass rounded-3xl p-6 flex flex-col gap-4 md:hidden pointer-events-auto"
          >
            {["Features", "How It Works", "Pricing", "FAQ"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setMobileOpen(false)} className="text-lg font-medium text-slate-300 hover:text-white py-2">
                {item}
              </a>
            ))}
            <div className="h-px bg-white/5 my-2" />
            <a href="/login" className="text-lg font-medium text-slate-400">Log In</a>
            <a href="/signup" className="text-center py-4 bg-sky-500 text-white rounded-2xl font-semibold">Get Started Free</a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
