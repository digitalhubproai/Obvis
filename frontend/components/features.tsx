"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { FileScan, MessageCircle, ShieldCheck, TrendingUp, Activity, Stethoscope, Zap, Sparkles } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: <FileScan className="w-6 h-6" />,
    title: "Instant Report Analysis",
    description: "Upload any lab report or prescription. Our AI clinical engine translates complex data into actionable insights you can actually understand.",
    span: "md:col-span-2",
    accent: "from-sky-500/20 to-sky-400/5",
    iconColor: "text-sky-400",
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Smart Symptom Chat",
    description: "Describe symptoms naturally. Our AI asks targeted follow-ups (max 5) for precise guidance.",
    span: "md:col-span-1",
    accent: "from-cyan-500/20 to-cyan-400/5",
    iconColor: "text-cyan-400",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Data Sovereignty",
    description: "AES-256 encryption at rest, TLS in transit. Your health records are sovereign-level secure.",
    span: "md:col-span-1",
    accent: "from-emerald-500/20 to-emerald-400/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Longitudinal Health Tracking",
    description: "Monitor vitals and diagnostic trends over time to spot subtle health patterns your eye would miss.",
    span: "md:col-span-2",
    accent: "from-indigo-500/20 to-indigo-400/5",
    iconColor: "text-indigo-400",
  },
];

const stats = [
  { label: "Clinical Accuracy", value: "99.2%", icon: <Stethoscope className="w-4 h-4" /> },
  { label: "Encryption", value: "AES-256", icon: <ShieldCheck className="w-4 h-4" /> },
  { label: "Processing Speed", value: "< 2.5s", icon: <Zap className="w-4 h-4" /> },
];

/* 3D tilt card with GSAP parallax, Glare, and Magnetic Icon */
function TiltCard({ children, className, icon }: { children: React.ReactNode; className: string; icon?: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!glareRef.current || !cardRef.current) return;
    
    // One-time "Glare Wipe" on entry
    gsap.fromTo(glareRef.current, 
      { opacity: 0, x: "-100%" },
      { 
        opacity: 0.4, 
        x: "100%", 
        duration: 1.5, 
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 80%",
        },
        onComplete: () => {
          gsap.set(glareRef.current, { x: 0, opacity: 0 });
        }
      }
    );
  }, { scope: cardRef });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !contentRef.current || !glareRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Tilt calculation
    const rotateX = (y - centerY) / 12; // Slightly more tilt for "Awesome"
    const rotateY = (centerX - x) / 12;

    gsap.to(cardRef.current, {
      rotateX,
      rotateY,
      duration: 0.5,
      ease: "power2.out",
      transformPerspective: 1200,
    });

    // Parallax content
    gsap.to(contentRef.current, {
      x: (x - centerX) / 12,
      y: (y - centerY) / 12,
      z: 50,
      duration: 0.5,
      ease: "power2.out",
    });

    // Magnetic Icon
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        x: (x - centerX) / 8,
        y: (y - centerY) / 8,
        z: 80,
        duration: 0.4,
        ease: "power2.out",
      });
    }

    // Specular Glare
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    gsap.to(glareRef.current, {
      opacity: 0.4,
      background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
      duration: 0.4,
      x: 0, // Reset any entry wipe offset
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || !contentRef.current || !glareRef.current) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.4)",
    });
    gsap.to(contentRef.current, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.4)",
    });
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.4)",
      });
    }
    gsap.to(glareRef.current, {
      opacity: 0,
      duration: 0.4,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative group/card overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent transition-all duration-300 tilt-card-reveal", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Glare Layer */}
      <div 
        ref={glareRef} 
        className="absolute inset-0 pointer-events-none opacity-0 z-20 transition-opacity duration-300" 
      />
      
      <div 
        ref={contentRef} 
        className="relative h-full w-full z-10"
        style={{ transformStyle: "preserve-3d" }} 
      >
        <div className="h-full rounded-[2.3rem] bg-[#03081c]/80 backdrop-blur-sm p-10 md:p-12 border border-white/5 group-hover/card:border-white/10 transition-colors">
          {icon && (
            <div ref={iconRef} className="mb-8 inline-block" style={{ transformStyle: "preserve-3d" }}>
              {icon}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative py-24 md:py-40 bg-[#020617] overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-sky-500/[0.04] blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-500/[0.04] blur-[100px] rounded-full animate-pulse" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 section-header">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold uppercase tracking-widest mb-6">
            <Activity className="w-3 h-3" />
            Capabilities
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Medical Intelligence,{" "}
            <span className="medical-gradient-animated block">Redefined</span>
          </h2>

          <p className="text-lg text-slate-400/80 leading-relaxed max-w-2xl mx-auto">
            Our AI integrates directly with your lab data to provide unparalleled diagnostic clarity and wellness management.
          </p>
        </div>

        {/* Bento grid - Dynamic Glare and Magnetic Icons */}
        <div className="grid md:grid-cols-3 gap-10 lg:gap-14">
          {features.map((f, i) => (
            <TiltCard
              key={f.title}
              className={cn(f.span)}
              icon={
                <div className={cn("p-5 rounded-2xl bg-white/5 shadow-2xl", f.iconColor)}>
                  {f.icon}
                </div>
              }
            >
              <h3 className="text-2xl font-bold text-white mb-4">
                {f.title}
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                {f.description}
              </p>
              
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-t border-white/5 pt-6">
                <Sparkles className="w-3 h-3 text-sky-400" />
                Next Generation Engine
              </div>
            </TiltCard>
          ))}
        </div>

        {/* Metrics bar */}
        <div className="mt-20 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-md border border-white/[0.05] p-8 md:p-12 flex flex-col md:flex-row flex-wrap justify-between items-center gap-10 reveal-content">
          <div>
            <h4 className="text-white font-bold text-xl mb-1">The Obvis Standard</h4>
            <p className="text-slate-500 text-sm">Verified performance across all analysis nodes.</p>
          </div>
          <div className="flex gap-10 md:gap-16">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sky-400">{stat.icon}</div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{stat.label}</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
