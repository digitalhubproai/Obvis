import { Shield, Globe, Mail, MessageSquare } from "lucide-react";
import { cn } from "../lib/utils";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-[#020617] pt-16 pb-8 sm:pt-20 sm:pb-10 md:pt-24 md:pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-12 gap-8 sm:gap-12 md:gap-16 mb-12 sm:mb-16 md:mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-4 max-w-sm">
            <Logo size="md" className="mb-8" />
            <p className="text-slate-500 text-lg leading-relaxed mb-10">
              Pioneering clinical AI to provide unparalleled diagnostic clarity and personal health empowerment.
            </p>
            <div className="flex gap-6">
              {[Globe, Mail, MessageSquare].map((Icon, i) => (
                <a key={i} href="#" className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-white hover:border-white/10 transition-all">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8 grid sm:grid-cols-3 gap-12">
            {[
              { 
                title: "Platform", 
                links: [
                  { name: "Clinical Analysis", href: "#" },
                  { name: "Symptom Diagnostic", href: "#" },
                  { name: "Health Tracking", href: "#" },
                  { name: "Enterprise API", href: "#" }
                ] 
              },
              { 
                title: "Integrity", 
                links: [
                  { name: "Privacy Protocol", href: "#" },
                  { name: "Security Standards", href: "#" },
                  { name: "Clinical Validation", href: "#" },
                  { name: "Regulatory Compliance", href: "#" }
                ] 
              },
              { 
                title: "Network", 
                links: [
                  { name: "Medical Partners", href: "#" },
                  { name: "Clinical Research", href: "#" },
                  { name: "Support Portal", href: "#" },
                  { name: "Status Center", href: "#" }
                ] 
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-bold text-sm uppercase tracking-[0.2em] mb-8">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map((link) => (
                    <li key={link.name}>
                      <a href={link.href} className="text-slate-500 hover:text-sky-400 transition-colors text-base">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Disclaimer Block */}
        <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-center md:text-left">
              <h5 className="text-white font-bold text-sm mb-1 uppercase tracking-widest">Clinical Disclaimer</h5>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                Obvis is an artificial intelligence-driven information platform. It is engineered to assist in the interpretation of medical data and provide health information for educational purposes only. Obvis does <span className="text-slate-300 font-semibold italic">not</span> provide medical advice, diagnosis, or clinical treatment. The use of this platform is not a substitute for professional medical consultation. Always prioritize the advice of a qualified healthcare professional.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-white/5">
          <p className="text-slate-600 text-sm font-medium">
            &copy; {new Date().getFullYear()} Obvis Clinical Intelligence Systems.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-slate-600 hover:text-slate-400 text-xs font-bold uppercase tracking-widest transition-colors">Global Privacy</a>
            <a href="#" className="text-slate-600 hover:text-slate-400 text-xs font-bold uppercase tracking-widest transition-colors">Legal Terms</a>
            <a href="#" className="text-slate-600 hover:text-slate-400 text-xs font-bold uppercase tracking-widest transition-colors">Clinical Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
