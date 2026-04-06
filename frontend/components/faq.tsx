"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, HelpCircle, Plus, Minus } from "lucide-react";
import { cn } from "../lib/utils";
import gsap from "gsap";

const faqs = [
  {
    q: "Is Obvis a clinical replacement for professional consultation?",
    a: "Absolutely not. Obvis is an informational AI layer designed to help you understand medical data. It is NOT a substitute for professional diagnosis, treatment, or clinical advice. Always consult a certified healthcare professional before making health decisions.",
  },
  {
    q: "What diagnostic formats are supported for analysis?",
    a: "Our clinical engine supports a wide range of formats including CBC, LFT, RFT, ECG digital summaries, high-resolution prescription images, X-ray descriptive texts, and MRI/CT scan reports.",
  },
  {
    q: "How strictly is my medical confidentiality maintained?",
    a: "We implement rigorous AES-256 encryption at rest and TLS/SSL protocols in transit. Our infrastructure is engineered to exceed global data protection standards, ensuring your most sensitive health information remains yours alone.",
  },
  {
    q: "Are the AI insights accessible in native languages?",
    a: "Yes. Obvis features a robust multi-lingual engine supporting English, Urdu, and Roman Urdu. All clinical interpretations and wellness recommendations are localized to your preferred dialect.",
  },
  {
    q: "What payment methods are supported for Pro subscriptions?",
    a: "We support a wide array of payment gateways including major international credit cards, as well as local Pakistan providers like JazzCash and EasyPaisa for seamless accessibility.",
  },
];

function FAQItem({ faq, isOpen, onClick, i }: { faq: any, isOpen: boolean, onClick: () => void, i: number }) {
  const itemRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!itemRef.current || !glareRef.current || !isOpen) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const rotateX = (y - rect.height/2) / 40;
    const rotateY = (rect.width/2 - x) / 40;

    gsap.to(itemRef.current, {
      rotateX,
      rotateY,
      duration: 0.4,
      ease: "power2.out",
      transformPerspective: 1000,
    });

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    gsap.to(glareRef.current, {
      opacity: 0.2,
      background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.1) 0%, transparent 70%)`,
      duration: 0.4,
    });
  };

  const handleMouseLeave = () => {
    if (!itemRef.current || !glareRef.current) return;
    gsap.to(itemRef.current, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "power2.out" });
    gsap.to(glareRef.current, { opacity: 0, duration: 0.4 });
  };

  return (
    <motion.div
      ref={itemRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05 }}
      style={{ transformStyle: "preserve-3d" }}
      className={cn(
        "relative rounded-[2.5rem] border transition-all duration-500 overflow-hidden",
        isOpen 
          ? "bg-white/[0.03] border-white/10 shadow-2xl" 
          : "bg-white/[0.01] border-white/5 hover:border-white/10"
      )}
    >
      <div ref={glareRef} className="absolute inset-0 pointer-events-none opacity-0 z-20 transition-opacity" />
      
      <button
        onClick={onClick}
        className="w-full relative z-10 flex items-center justify-between px-8 md:px-12 py-8 text-left group"
      >
        <span className={cn(
          "font-bold text-lg md:text-xl pr-8 transition-colors duration-300",
          isOpen ? "text-white" : "text-slate-400 group-hover:text-slate-200"
        )}>
          {faq.q}
        </span>
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-500",
          isOpen 
            ? "bg-sky-500 border-sky-400 text-white rotate-180" 
            : "border-white/10 text-slate-500 rotate-0"
        )}>
          {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-8 md:px-12 pb-10 text-slate-400 text-lg leading-relaxed border-t border-white/5 pt-8">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 md:py-40 bg-[#020617] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/[0.03] blur-[150px] -z-10 rounded-full animate-pulse" />

      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 section-header">
          <div className="text-sky-400 text-xs font-bold uppercase tracking-[0.3em] mb-4">
            Support Center
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Inquiries & <br />
            <span className="medical-gradient-animated block pb-2">Clarifications</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Essential information regarding our clinical AI technology and operations.
          </p>
        </div>

        <div className="space-y-6 reveal-content">
          {faqs.map((faq, i) => (
            <FAQItem 
              key={i} 
              faq={faq} 
              i={i} 
              isOpen={openIndex === i} 
              onClick={() => setOpenIndex(openIndex === i ? null : i)} 
            />
          ))}
        </div>

        {/* Still have questions? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-4 px-8 py-5 rounded-full bg-white/[0.02] border border-white/10 backdrop-blur-xl">
            <HelpCircle className="w-6 h-6 text-sky-400" />
            <span className="text-slate-300 text-base">
              Additional questions? <a href="mailto:support@obvis.ai" className="text-sky-400 font-bold hover:underline">Speak with our clinical team.</a>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
