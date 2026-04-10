"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Cpu, ClipboardList, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const steps = [
  {
    icon: <Upload className="w-8 h-8" />,
    title: "Secure Intake",
    description: "Upload any medical documentation—lab results, imaging, or prescriptions. Our HIPAA-compliant gateway ensures total end-to-end encryption.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
  },
  {
    icon: <Cpu className="w-8 h-8" />,
    title: "Clinical Core Processing",
    description: "Our proprietary AI engine extracts biomarkers, identifies anomalies, and cross-references data against current clinical guidelines.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: <ClipboardList className="w-8 h-8" />,
    title: "Insight Delivery",
    description: "Receive a comprehensive digital summary including simplified jargon, risk assessments, and targeted wellness recommendations.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
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
    const rotateX = (y - centerY) / 12;
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
      x: 0,
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || !contentRef.current || !glareRef.current) return;
    gsap.to(cardRef.current, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
    gsap.to(contentRef.current, { x: 0, y: 0, z: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
    if (iconRef.current) gsap.to(iconRef.current, { x: 0, y: 0, z: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
    gsap.to(glareRef.current, { opacity: 0, duration: 0.4 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative group/card overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent transition-all duration-300 tilt-card-reveal", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div 
        ref={glareRef} 
        className="absolute inset-0 pointer-events-none opacity-0 z-20 transition-opacity duration-300" 
      />
      <div ref={contentRef} className="relative h-full w-full z-10" style={{ transformStyle: "preserve-3d" }}>
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

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-16 sm:py-20 md:py-28 lg:py-40 bg-[#020617] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-20 md:mb-32 section-header">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold uppercase tracking-widest mb-6">
            Workflow
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8">
            Precision Analysis <br />
            <span className="medical-gradient-animated block pb-2">In Three Simple Steps</span>
          </h2>
          <p className="text-lg text-slate-400">
            Our seamless workflow ensures your medical data is processed with clinical rigor and returned with absolute clarity.
          </p>
        </div>

        {/* Steps Grid - Increased gap to avoid overlap in 3D */}
        <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
          {steps.map((step, i) => (
            <TiltCard 
              key={step.title} 
              className="h-full"
              icon={
                <div className={cn("p-5 rounded-2xl bg-white/5", step.bg, step.color)}>
                  {step.icon}
                </div>
              }
            >
              {/* Number Overlay */}
              <span className="absolute top-6 right-10 text-8xl font-black text-white/[0.03] group-hover:text-white/[0.05] transition-colors pointer-events-none">
                0{i + 1}
              </span>

              <h3 className="text-2xl font-bold text-white mb-6">
                {step.title}
              </h3>
              
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                {step.description}
              </p>

              {i < steps.length - 1 && (
                <div className="hidden lg:flex items-center gap-2 text-slate-600">
                  <span className="text-xs font-bold uppercase tracking-widest">Next Phase</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </TiltCard>
          ))}
        </div>

        {/* Confidence Statement */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <p className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-slate-400 text-sm italic">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Designed for uncompromising security and clinical precision.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
