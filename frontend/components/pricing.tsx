"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Check, Shield, Star, Crown } from "lucide-react";
import { cn } from "../lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "Forever",
    description: "Essential medical AI for individuals.",
    features: [
      "3 Comprehensive report analyses",
      "Core symptom AI diagnostic",
      "End-to-end data encryption",
      "Standard processing queue",
    ],
    cta: "Get Started",
    popular: false,
    icon: <Shield className="w-5 h-5" />,
  },
  {
    name: "Pro",
    price: "$50",
    period: "Per Month",
    description: "Advanced health monitoring & analytics.",
    features: [
      "Unlimited report processing",
      "Longitudinal health tracking",
      "PDF medical export engine",
      "Priority clinical queue",
      "Dedicated wellness liaison",
    ],
    cta: "Unlock Pro",
    popular: true,
    icon: <Star className="w-5 h-5" />,
  },
  {
    name: "Enterprise",
    price: "$100",
    period: "Per Month",
    description: "Complete family wellness infrastructure.",
    features: [
      "Multi-member profiles (up to 5)",
      "Collaborative doctor sharing",
      "Predictive health forecasting",
      "24/7 Priority clinical support",
      "Advanced biomarker analytics",
    ],
    cta: "Contact Sales",
    popular: false,
    icon: <Crown className="w-5 h-5" />,
  },
];

/* 3D tilt card with GSAP parallax, Glare, and Magnetic Icon */
function TiltCard({ 
  children, 
  className, 
  icon, 
  badge 
}: { 
  children: React.ReactNode; 
  className: string; 
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}) {
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
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;

    gsap.to(cardRef.current, {
      rotateX,
      rotateY,
      duration: 0.5,
      ease: "power2.out",
      transformPerspective: 1200,
    });

    // Parallax content
    gsap.to(contentRef.current, {
      x: (x - centerX) / 15,
      y: (y - centerY) / 15,
      z: 40,
      duration: 0.5,
      ease: "power2.out",
    });

    // Magnetic Icon
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        x: (x - centerX) / 10,
        y: (y - centerY) / 10,
        z: 60,
        duration: 0.4,
        ease: "power2.out",
      });
    }

    // Specular Glare
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    gsap.to(glareRef.current, {
      opacity: 0.35,
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
      className={cn("relative group/card transition-all duration-300 pt-6 tilt-card-reveal", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Badge rendered outside overflow-hidden */}
      {badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          {badge}
        </div>
      )}

      <div 
        className="relative h-full w-full rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent overflow-hidden"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div ref={glareRef} className="absolute inset-0 pointer-events-none opacity-0 z-20 transition-opacity duration-300" />
        <div ref={contentRef} className="relative h-full w-full z-10" style={{ transformStyle: "preserve-3d" }}>
          <div className="h-full rounded-[2.3rem] bg-[#03081c]/90 backdrop-blur-md p-8 md:p-12 border border-white/5 group-hover/card:border-white/10 transition-colors">
            {icon && (
              <div ref={iconRef} className="inline-block mb-10" style={{ transformStyle: "preserve-3d" }}>
                {icon}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 md:py-40 bg-[#020617] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20 md:mb-32 section-header">
          <div className="text-sky-400 text-xs font-bold uppercase tracking-[0.3em] mb-4">
            Tiered Intelligence
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8">
            Invest in Your <br />
            <span className="medical-gradient-animated block pb-2">Digital Health Future</span>
          </h2>
          <p className="text-lg text-slate-400">
            Choose the precision level that fits your medical monitoring needs.
          </p>
        </div>

        {/* Improved layout spacing and perfected cards */}
        <div className="grid lg:grid-cols-3 gap-10 lg:gap-14 items-stretch">
          {plans.map((plan, i) => (
            <TiltCard 
              key={plan.name} 
              className="h-full"
              icon={
                <div className={cn("p-5 rounded-2xl bg-white/5", plan.popular ? "text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.2)]" : "text-slate-500")}>
                  {plan.icon}
                </div>
              }
              badge={plan.popular ? (
                <div className="px-6 py-2 bg-sky-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                  Clinical Choice
                </div>
              ) : null}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-right ml-auto">
                  <div className="text-3xl font-bold text-white">{plan.price}</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">{plan.period}</div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">{plan.description}</p>

              <div className="space-y-4 mb-12 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="mt-1 p-0.5 rounded-full bg-sky-500/20 text-sky-400">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm text-slate-400 leading-relaxed font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <a
                href="/signup"
                className={cn(
                  "block w-full py-4 rounded-2xl text-center text-sm font-bold transition-all duration-300",
                  plan.popular
                    ? "bg-sky-500 text-white hover:bg-sky-400 shadow-[0_10px_20px_rgba(14,165,233,0.2)]"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                )}
              >
                {plan.cta}
              </a>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
