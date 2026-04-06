"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rippleRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [cursorType, setCursorType] = useState<"teal" | "cyan" | "emerald">("cyan");
  const [cursorText, setCursorText] = useState<string>("");
  const [isMagnetic, setIsMagnetic] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    const ripple = rippleRef.current;
    if (!cursor || !follower || !ripple) return;

    // Movement Interpolation
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.05, ease: "none" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.05, ease: "none" });
    
    const xFollowerTo = gsap.quickTo(follower, "x", { duration: 0.5, ease: "power4.out" });
    const yFollowerTo = gsap.quickTo(follower, "y", { duration: 0.5, ease: "power4.out" });

    // Sharp Trail Physics
    const trailQuickToX = trailRefs.current.map((ref, i) => 
      gsap.quickTo(ref, "x", { duration: 0.15 + (i * 0.04), ease: "power2.out" })
    );
    const trailQuickToY = trailRefs.current.map((ref, i) => 
      gsap.quickTo(ref, "y", { duration: 0.15 + (i * 0.04), ease: "power2.out" })
    );

    let magneticTarget: HTMLElement | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      xTo(clientX);
      yTo(clientY);

      const target = e.target as HTMLElement;
      const interactive = target.closest("button, a, [role='button'], .magnetic-wrap") as HTMLElement;
      
      if (interactive) {
        const rect = interactive.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.sqrt((clientX - centerX) ** 2 + (clientY - centerY) ** 2);
        
        if (dist < 100) {
          setIsMagnetic(true);
          xFollowerTo(centerX + (clientX - centerX) * 0.1); 
          yFollowerTo(centerY + (clientY - centerY) * 0.1);
          
          if (interactive.classList.contains("magnetic-wrap")) {
            gsap.to(interactive, {
              x: (clientX - centerX) * 0.25,
              y: (clientY - centerY) * 0.25,
              duration: 0.4,
              ease: "power2.out"
            });
          }
          magneticTarget = interactive;
        } else {
          resetMagnetic();
        }
      } else {
        resetMagnetic();
      }

      function resetMagnetic() {
        if (magneticTarget) {
          gsap.to(magneticTarget, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1.1, 0.4)" });
          magneticTarget = null;
        }
        setIsMagnetic(false);
        xFollowerTo(clientX);
        yFollowerTo(clientY);
      }

      if (!isMagnetic) {
        xFollowerTo(clientX);
        yFollowerTo(clientY);
      }

      trailQuickToX.forEach((to) => to(clientX));
      trailQuickToY.forEach((to) => to(clientY));

      const cursorData = target.closest("[data-cursor-text]") as HTMLElement;
      setCursorText(cursorData?.getAttribute("data-cursor-text") || "");

      if (target.closest("#features") || target.closest(".vitals-card")) setCursorType("emerald");
      else if (target.closest("#pricing") || target.closest(".stat-card")) setCursorType("teal");
      else setCursorType("cyan");
    };

    const handleMouseDown = () => {
      gsap.fromTo(ripple, 
        { scale: 0.4, opacity: 1, border: "1px solid rgba(255,255,255,0.8)" },
        { scale: 3, opacity: 0, duration: 0.6, ease: "power3.out" }
      );
      gsap.to(follower, { scale: 0.8, duration: 0.15 });
    };

    const handleMouseUp = () => {
      gsap.to(follower, { scale: 1, duration: 0.3, ease: "back.out(2)" });
    };

    // 🏥 Medical Heartbeat Pulse
    const heartbeatTL = gsap.timeline({ repeat: -1 });
    heartbeatTL
      .to(cursor, { scale: 1.4, opacity: 1, duration: 0.1, ease: "power4.out" })
      .to(cursor, { scale: 1, opacity: 0.6, duration: 0.2, ease: "power2.in" })
      .to(cursor, { scale: 1.2, opacity: 0.9, duration: 0.1, ease: "power4.out" })
      .to(cursor, { scale: 1, opacity: 0.5, duration: 1.2, ease: "power2.out" });

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    const updateInteractives = () => {
      document.querySelectorAll("a, button, [role='button'], .tilt-card-reveal, .magnetic-wrap")
        .forEach((el) => {
          el.addEventListener("mouseenter", () => setIsHovering(true));
          el.addEventListener("mouseleave", () => setIsHovering(false));
        });
    };

    updateInteractives();
    const observer = new MutationObserver(updateInteractives);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      observer.disconnect();
    };
  }, [isMagnetic]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] hidden md:block select-none overflow-hidden">
      {/* 🧬 Signal Particle Trail */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            ref={(el) => { trailRefs.current[i] = el; }}
            className={cn(
              "fixed top-0 left-0 w-[3px] h-[3px] rounded-full transition-colors duration-700",
              cursorType === "cyan" && "bg-cyan-400/40",
              cursorType === "teal" && "bg-teal-400/40",
              cursorType === "emerald" && "bg-emerald-400/40"
            )}
            style={{
              transform: "translate(-50%, -50%)",
              opacity: 0.8 - i * 0.15,
            }}
          />
        ))}
      </div>

      {/* ⚠️ Click Shockwave */}
      <div
        ref={rippleRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-white opacity-0 -translate-x-1/2 -translate-y-1/2 z-0"
      />

      {/* 🔬 Precision Core */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-[6px] h-[6px] bg-white rounded-full -translate-x-1/2 -translate-y-1/2 z-50 shadow-[0_0_8px_white]"
      />
      
      {/* 🩺 Medical Aura Follower */}
      <div
        ref={followerRef}
        className={cn(
          "fixed top-0 left-0 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-500",
          isHovering ? "w-10 h-10 ring-1 ring-white/20" : "w-10 h-10 ring-0 ring-transparent",
          "rounded-full"
        )}
      >
        {/* 📟 Context Label */}
        {cursorText && (
          <div className="absolute -bottom-8 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-sm border border-white/10">
            <span className="text-[8px] font-mono tracking-[0.1em] text-white/90 uppercase whitespace-nowrap">
              {cursorText}
            </span>
          </div>
        )}

        {/* 🩺 Aura */}
        <div className={cn(
          "absolute inset-0 rounded-full blur-xl transition-all duration-700",
          cursorType === "cyan" && "bg-cyan-500/10",
          cursorType === "teal" && "bg-teal-500/10",
          cursorType === "emerald" && "bg-emerald-500/10",
          isHovering ? "opacity-40 scale-125" : "opacity-0 scale-100"
        )} />

        {/* 📏 Simple Subtle Ring */}
        <div className={cn(
          "absolute inset-0 border border-white/5 rounded-full transition-opacity duration-500",
          isHovering ? "opacity-100" : "opacity-0"
        )} />
      </div>
    </div>
  );
}
