"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useAuth, getToken, getUserFromToken, signOut } from "@/lib/auth";
import {
  LayoutDashboard, FileUp, MessageCircle, Bell, Settings, LogOut,
  Shield, ArrowRight, Upload, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, Brain, File, X, ChevronDown, ChevronUp, Download,
  Pill, HeartPulse, Lightbulb, AlertCircle, FileText, FileDown,
  Sparkles, Activity, Zap, Stethoscope, Eye, BarChart3, Plus,
  Search, Filter, TrendingUp, FolderOpen, Users, Menu,
  Send, Bot, User, Crown,
} from "lucide-react";
import { Logo } from "@/components/logo";
import {
  apiGetReports, apiAnalyzeReport,
  apiDownloadOriginal, apiDownloadAnalysis, apiSymptomChat,
  apiUploadReportSSE, type UploadProgress,
  type Report, type Analysis,
} from "@/lib/api";

/* Legacy wrapper for apiUploadReportSSE */
async function apiUploadReport(token: string, file: File) {
  await apiUploadReportSSE(token, file, () => {});
}
import { format } from "date-fns";

/* ─── Utility ─── */
function formatTimeAgo(date: string) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return format(new Date(date), "MMM d, yyyy");
}

/* ─── Animated number counter ─── */
function AnimatedCount({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const steps = 30;
    const stepTime = (duration * 1000) / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += target / steps;
      if (current >= target) { setDisplay(target); clearInterval(interval); }
      else { setDisplay(Math.round(current)); }
    }, stepTime);
    return () => clearInterval(interval);
  }, [target, duration]);
  return <>{display}</>;
}

/* ─── Circular Health Score Ring ─── */
function HealthRing({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";
  const colorGlow = score >= 80 ? "rgba(52,211,153,0.3)" : score >= 60 ? "rgba(251,191,36,0.3)" : "rgba(248,113,113,0.3)";
  const gradId = "healthGrad";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Pulsing outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${colorGlow}, transparent 70%)` }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={score >= 80 ? "#22d3ee" : score >= 60 ? "#f59e0b" : "#ef4444"} />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={6} className="health-ring-bg" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={8}
          stroke={`url(#${gradId})`} strokeLinecap="round"
          className="health-ring-fill"
          style={{ strokeDasharray: circ, strokeDashoffset: offset }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <HeartPulse className="w-4 h-4 mb-1" style={{ color }} />
        <span className="text-3xl font-bold text-white"><AnimatedCount target={score} /></span>
        <span className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">Health</span>
      </div>
    </div>
  );
}

/* ─── Mini Sparkline ─── */
function Sparkline({ color = "#0ea5e9" }: { color?: string }) {
  const pts = useMemo(() => {
    const arr = Array.from({ length: 8 }, () => Math.random() * 20 + 5);
    return arr.map((y, i) => `${i * 14},${30 - y}`).join(" ");
  }, []);
  return (
    <svg width="98" height="30" className="opacity-40 mt-2">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" className="sparkline-path" />
    </svg>
  );
}

/* ─── Time greeting ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

const chatSuggestions = [
  { icon: <HeartPulse className="w-3.5 h-3.5" />, text: "I have a headache and fever" },
  { icon: <Stethoscope className="w-3.5 h-3.5" />, text: "What does high cholesterol mean?" },
  { icon: <Pill className="w-3.5 h-3.5" />, text: "Side effects of common medicines" },
  { icon: <Activity className="w-3.5 h-3.5" />, text: "How to improve my health score?" },
];

/* ─── Floating particles ─── */
function DashboardParticles() {
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 0.5,
    dur: Math.random() * 12 + 8,
    delay: Math.random() * 6,
    color: ["rgba(14,165,233,0.25)", "rgba(34,211,238,0.15)", "rgba(99,102,241,0.15)"][Math.floor(Math.random() * 3)],
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, backgroundColor: p.color, boxShadow: `0 0 ${p.size * 6}px ${p.color}` }}
          animate={{ y: [0, -(Math.random() * 60 + 20)], opacity: [0, 0.7, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Orbital Data Particles ─── */
function OrbitalData({ radius = 100, count = 6, color = "#0ea5e9" }: { radius?: number; count?: number; color?: string }) {
  const points = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (i * 360) / count,
    delay: i * 0.5,
    dur: 15 + Math.random() * 10,
    size: 4 + Math.random() * 4,
  })), [count]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {points.map((p) => (
        <motion.div
          key={p.id}
          className="orbital-data-point"
          style={{ 
            "--orbit-radius": `${radius}px`, 
            "--rev-angle": `${p.angle}deg`,
            backgroundColor: color,
            boxShadow: `0 0 12px ${color}`,
            width: p.size,
            height: p.size
          } as any}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: "linear", delay: p.delay }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full opacity-50" />
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Activity Heart Pulse ─── */
function ActivityPulse({ color = "#0ea5e9" }: { color?: string }) {
  return (
    <svg width="60" height="30" viewBox="0 0 60 30" className="opacity-60 overflow-visible">
      <motion.path
        d="M0,15 L10,15 L15,5 L20,25 L25,15 L60,15"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, x: [0, 60], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}

/* ─── Bio-Hero Section ─── */
function HealthHero({ score }: { score: number }) {
  return (
    <div className="relative w-full h-[320px] rounded-3xl overflow-hidden holographic-card border border-white/10 group mb-8">
      <div className="absolute inset-0 bio-scan-line opacity-20" />
      <DashboardParticles />
      <div className="absolute inset-0 flex flex-col lg:flex-row items-center justify-around p-8 z-10">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left mb-6 lg:mb-0">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-4 inline-block">System Status: Optimal</span>
            <h2 className="text-4xl font-bold text-white mb-2 tracking-tight glow-text-blue">Biometric Overview</h2>
            <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
              Your health intelligence profile is synchronized. Based on your latest reports, your overall wellness index is performing above your average.
            </p>
          </motion.div>
          <div className="flex items-center gap-6 mt-8">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Live Vitals</span>
              <ActivityPulse color="#0ea5e9" />
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Sync Stability</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div key={i} animate={{ height: [8, 16, 8] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }} className="w-1 bg-sky-500/40 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, type: "spring" }}>
            <HealthRing score={score} size={200} />
            <OrbitalData radius={120} count={5} color="#0ea5e9" />
            <OrbitalData radius={140} count={3} color="#22d3ee" />
          </motion.div>
          <div className="absolute -bottom-4 -left-4 -right-4 p-2 rounded-xl bg-white/[0.02] backdrop-blur-md border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 status-glow" />
              <span className="text-[9px] text-slate-400 uppercase font-medium">Real-time Analysis</span>
            </div>
            <Zap className="w-3 h-3 text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Configs ─── */
const navItems = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Overview", id: "overview" },
  { icon: <FileUp className="w-4 h-4" />, label: "Reports", id: "reports" },
  { icon: <MessageCircle className="w-4 h-4" />, label: "Chat", id: "chat" },
];

const statusConfig: Record<string, { color: string; glow: string; label: string; icon: React.ReactNode }> = {
  pending: { color: "text-amber-400 bg-amber-400/10", glow: "shadow-amber-500/20", label: "Pending", icon: <Clock className="w-3.5 h-3.5" /> },
  completed: { color: "text-emerald-400 bg-emerald-400/10", glow: "shadow-emerald-500/20", label: "Completed", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

const flagConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  HIGH: { icon: <ArrowRight className="w-3.5 h-3.5 rotate-[-45deg]" />, color: "text-red-400 bg-red-400/10", label: "High" },
  LOW: { icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-blue-400 bg-blue-400/10", label: "Low" },
  Borderline: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-400 bg-amber-400/10", label: "Borderline" },
  BORDERLINE: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-400 bg-amber-400/10", label: "BORDERLINE" },
  Normal: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-400 bg-emerald-400/10", label: "Normal" },
  normal: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-400 bg-emerald-400/10", label: "Normal" },
  NORMAL: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-400 bg-emerald-400/10", label: "NORMAL" },
};

function calcHealthScore(analysis: Analysis): number {
  if (!analysis.values || analysis.values.length === 0) return 0;
  const normal = analysis.values.filter((v) =>
    (v.flag || "").toString().toUpperCase() === "NORMAL" || v.flag === "Normal" || v.flag === "normal"
  ).length;
  return Math.round((normal / analysis.values.length) * 100);
}

/* ─── Stagger animation variants ─── */
const staggerContainer: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeInUp: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } };

/* ─── Pro Upsell Banner ─── */
function ProUpsell({ used, limit }: { used: number; limit: number }) {
  const pct = Math.round((used / limit) * 100);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/15 p-5 mb-6 relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            {used >= limit ? (
              <>
                <p className="text-sm font-semibold text-amber-300">Free tier exhausted — upgrade to Pro</p>
                <p className="text-xs text-slate-500 mt-0.5">You used all {limit} free report analyses. Unlock unlimited reports with Pro.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-amber-300">Free tier: {used}/{limit} reports used</p>
                <p className="text-xs text-slate-500 mt-0.5">{limit - used} free {(limit - used) === 1 ? "report" : "reports"} remaining. Upgrade to Pro for unlimited analyses.</p>
              </>
            )}
          </div>
        </div>
        <a href="/#pricing"
          className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all"
        >
          Upgrade to Pro — $50/mo
        </a>
      </div>
      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <div className="mt-1 text-[10px] text-slate-600">{pct}% of free tier used</div>
    </motion.div>
  );
}

/* ========================================================================= */
/*                             MAIN DASHBOARD                                */
/* ========================================================================= */
export default function DashboardPage() {
  const router = useRouter();
  useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [reports, setReports] = useState<Report[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"summary" | "values" | "precautions">("summary");
  const [downloading, setDownloading] = useState<"original" | "analysis" | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string; analysis?: any; summary?: string; medicine_suggestions?: string[]; advice?: string[]; recommendations?: string[]; question_count?: number }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = getToken();
  const user = getUserFromToken();

  /* ─── Load reports ─── */
  const loadReports = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiGetReports(token);
      setReports(data);
      // Auto-load analyses for completed reports
      for (const r of data) {
        if (r.status === "completed" && !analyses[r.id]) {
          try {
            const a = await apiAnalyzeReport(token, r.id);
            setAnalyses((prev) => ({ ...prev, [r.id]: a }));
          } catch {}
        }
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { loadReports(); }, [loadReports]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  /* ─── Upload ─── */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    setUploadProgress({ status: "reading", message: "Reading report...", progress: 10 });
    try {
      const analysis = await apiUploadReportSSE(token, file, setUploadProgress);
      if (analysis) {
        setAnalyses((prev) => ({ ...prev, [crypto.randomUUID()]: analysis }));
      }
      await loadReports();
    } catch {
      setUploadProgress({ status: "failed", message: "Upload failed", progress: 0 });
    }
    setUploading(false);
    setUploadProgress(null);
    e.target.value = "";
  };

  /* ─── Analyze ─── */
  const handleAnalyze = async (reportId: string) => {
    if (!token) return;
    setAnalyzing(reportId);
    try {
      const a = await apiAnalyzeReport(token, reportId);
      setAnalyses((prev) => ({ ...prev, [reportId]: a }));
      await loadReports();
    } catch {}
    setAnalyzing(null);
  };

  /* ─── Downloads ─── */
  const handleDownloadOriginal = async (report: Report) => {
    if (!token) return;
    setDownloading("original");
    try { await apiDownloadOriginal(token, report.id, report.name); } catch {}
    setDownloading(null);
  };
  const handleDownloadAnalysis = async (report: Report) => {
    if (!token) return;
    setDownloading("analysis");
    try { await apiDownloadAnalysis(token, report.id, report.name); } catch {}
    setDownloading(null);
  };

  /* ─── Chat ─── */
  const sendChat = async () => {
    if (!chatInput.trim() || !token || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    const newCount = questionCount + 1;
    setQuestionCount(newCount);
    setChatMessages((prev) => [...prev, { from: "user", text: msg }]);
    setChatLoading(true);
    try {
      const res = await apiSymptomChat(token, msg, chatMessages);
      setChatMessages((prev) => [...prev, { from: "bot", text: res.text, analysis: res.analysis, recommendations: res.recommendations, question_count: res.question_count }]);
    } catch {
      setChatMessages((prev) => [...prev, { from: "bot", text: "Sorry, something went wrong. Please try again." }]);
    }
    setChatLoading(false);
  };

  const resetChat = () => {
    setChatMessages([]);
    setChatInput("");
    setChatLoading(false);
    setQuestionCount(0);
  };

  /* ─── Computed stats ─── */
  const totalReports = reports.length;
  const completedReports = reports.filter((r) => r.status === "completed").length;
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const FREE_TIER_LIMIT = 3;
  const freeReportsUsed = Math.min(completedReports, FREE_TIER_LIMIT);
  const isFreeTier = completedReports < FREE_TIER_LIMIT;
  const avgHealth = useMemo(() => {
    const scores = Object.values(analyses).map(calcHealthScore).filter(Boolean);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [analyses]);

  const filteredReports = reports.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => { signOut(); router.push("/login"); };

  /* ─── Drag & Drop ─── */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !token) return;
    setUploading(true);
    apiUploadReport(token, file).then(() => loadReports()).finally(() => setUploading(false));
  }, [token, loadReports]);

  /* ─── Stat cards config ─── */
  const statCards = [
    { label: "Total Reports", value: totalReports, icon: <FolderOpen className="w-5 h-5" />, gradient: "from-sky-500/20 to-cyan-500/10", iconBg: "bg-sky-500/15", iconColor: "text-sky-400", border: "border-sky-500/10", sparkColor: "#0ea5e9", glowColor: "rgba(14,165,233,0.3)", trend: "+2 this week" },
    { label: "Analyzed", value: completedReports, icon: <CheckCircle2 className="w-5 h-5" />, gradient: "from-emerald-500/20 to-green-500/10", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", border: "border-emerald-500/10", sparkColor: "#34d399", glowColor: "rgba(52,211,153,0.3)", trend: "Up to date" },
    { label: "Pending", value: pendingReports, icon: <Clock className="w-5 h-5" />, gradient: "from-amber-500/20 to-orange-500/10", iconBg: "bg-amber-500/15", iconColor: "text-amber-400", border: "border-amber-500/10", sparkColor: "#fbbf24", glowColor: "rgba(251,191,36,0.3)", trend: "Action needed" },
    { label: "Health Score", value: avgHealth, icon: <HeartPulse className="w-5 h-5" />, gradient: "from-purple-500/20 to-violet-500/10", iconBg: "bg-purple-500/15", iconColor: "text-purple-400", border: "border-purple-500/10", suffix: "%", sparkColor: "#a78bfa", glowColor: "rgba(167,139,250,0.3)", trend: "Based on analyses" },
  ];

  /* ========================================================================= */
  return (
    <div className="min-h-screen bg-[#020617] text-white flex relative overflow-hidden">
      {/* BG Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="dashboard-grid-pattern absolute inset-0" />
        <div className="dashboard-glow-orb" style={{ width: 500, height: 500, top: "-10%", left: "-5%", background: "radial-gradient(circle, rgba(14,165,233,0.08), transparent 70%)" }} />
        <div className="dashboard-glow-orb" style={{ width: 400, height: 400, bottom: "-10%", right: "-5%", background: "radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)" }} />
        <DashboardParticles />
      </div>

      {/* ─── SIDEBAR ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            className="fixed left-0 top-0 bottom-0 w-[260px] z-40 flex flex-col"
          >
            <div className="flex flex-col h-full m-3 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-xl border border-white/[0.06] shadow-2xl shadow-black/40">
              {/* Logo */}
              <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
                <Logo size="md" href="/dashboard" />
              </div>

              {/* Nav */}
              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => (
                  <motion.button key={item.id} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(item.id)}
                    data-cursor-text={`OPEN ${item.label.toUpperCase()}`}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 magnetic-wrap ${
                      activeTab === item.id
                        ? "bg-sky-500/10 text-sky-300 nav-active-glow border border-sky-500/10"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {activeTab === item.id && (
                      <motion.div layoutId="navIndicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400 shadow-lg shadow-sky-400/50" />
                    )}
                  </motion.button>
                ))}
              </nav>

              {/* User & Logout */}
              <div className="px-3 pb-4 border-t border-white/[0.04] pt-3 space-y-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white">
                    {user?.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{user?.email || "User"}</div>
                    <div className="text-[10px] text-slate-500">{user?.is_admin ? "Admin" : "Member"}</div>
                  </div>
                </div>
                <motion.button whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </motion.button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ─── */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-[260px]" : "ml-0"} relative z-10`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between backdrop-blur-xl bg-[#020617]/60 border-b border-white/[0.04]">
          <div className="flex items-center gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {activeTab === "overview" ? `${getGreeting()}, ${user?.email?.split("@")[0] || "User"}` : activeTab === "reports" ? "Reports" : "AI Health Chat"}
              </h1>
              <p className="text-xs text-slate-500">
                {activeTab === "overview" ? format(new Date(), "EEEE, MMMM d, yyyy") : activeTab === "reports" ? "Manage and analyze your medical reports" : "Get AI-powered health insights"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="relative p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <Bell className="w-4.5 h-4.5" />
              {pendingReports > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 badge-pulse" />
              )}
            </motion.button>
          </div>
        </div>

        <div className="p-6 max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            {/* ═══════════ OVERVIEW TAB ═══════════ */}
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
                {/* Biometric Hero Section */}
                <HealthHero score={avgHealth || 0} />

                {/* Pro Upsell Banner */}
                {!isFreeTier && <ProUpsell used={FREE_TIER_LIMIT} limit={FREE_TIER_LIMIT} />}
                {isFreeTier && completedReports > 0 && <ProUpsell used={freeReportsUsed} limit={FREE_TIER_LIMIT} />}

                {/* Stat Cards */}
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {statCards.map((card, i) => (
                    <motion.div key={i} variants={fadeInUp}
                      whileHover={{ y: -6, scale: 1.02 }}
                      data-cursor-text={`VIEW ${card.label.toUpperCase()}`}
                      className={`stat-card-glow card-shine relative group rounded-2xl bg-gradient-to-br ${card.gradient} backdrop-blur-sm border ${card.border} p-5 cursor-default overflow-hidden magnetic-wrap`}
                      style={{ "--glow-color": card.glowColor } as React.CSSProperties}
                    >
                      {/* Shimmer */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
                      </div>
                      <div className="relative z-10 flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
                          <p className="text-3xl font-bold text-white">
                            <AnimatedCount target={card.value} />
                            {card.suffix && <span className="text-lg text-slate-400 ml-0.5">{card.suffix}</span>}
                          </p>
                          <Sparkline color={card.sparkColor} />
                          <p className="text-[10px] text-slate-500 mt-1">{card.trend}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center ${card.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                          {card.icon}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Quick Actions + Recent Reports */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Health Ring + Quick Actions */}
                  <motion.div variants={fadeInUp} initial="hidden" animate="visible"
                    className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-sm border border-white/[0.06] p-6"
                  >
                    <div className="flex flex-col items-center mb-5 pb-5 border-b border-white/[0.04]">
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-sky-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white tracking-tight">System Analysis</p>
                          <p className="text-[10px] text-slate-500">Last updated: Just now</p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-sky-400" /> Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <motion.button whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                        onClick={() => fileInputRef.current?.click()}
                        data-cursor-text="UPLOAD FILE"
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-sky-500/[0.08] border border-sky-500/10 text-sky-300 hover:bg-sky-500/15 transition-all group magnetic-wrap"
                      >
                        <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center"><Upload className="w-4 h-4" /></div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium">Upload Report</div>
                          <div className="text-[10px] text-slate-500">PDF, JPG, PNG</div>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>

                      <motion.button whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab("chat")}
                        data-cursor-text="START CHAT"
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-500/[0.08] border border-purple-500/10 text-purple-300 hover:bg-purple-500/15 transition-all group magnetic-wrap"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center"><MessageCircle className="w-4 h-4" /></div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium">AI Health Chat</div>
                          <div className="text-[10px] text-slate-500">Ask about symptoms</div>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>

                      <motion.button whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab("reports")}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center"><Eye className="w-4 h-4" /></div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium">View Reports</div>
                          <div className="text-[10px] text-slate-500">{totalReports} reports</div>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>
                    </div>

                    {/* Drag-drop zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      className={`mt-4 p-4 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer ${
                        dragOver ? "drop-zone-active border-sky-500/40 bg-sky-500/[0.06]" : "border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className={`w-5 h-5 mx-auto mb-1.5 ${dragOver ? "text-sky-400" : "text-slate-600"} transition-colors`} />
                      <p className="text-[10px] text-slate-500">{dragOver ? "Drop file here" : "Or drag & drop a file"}</p>
                    </div>
                  </motion.div>

                  {/* Recent Reports */}
                  <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}
                    className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-sm border border-white/[0.06] p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-sky-400" /> Recent Activity
                      </h3>
                      <button onClick={() => setActiveTab("reports")} className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1">
                        View All <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-400 rounded-full"
                        />
                      </div>
                    ) : reports.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                          <FileUp className="w-7 h-7 text-slate-600" />
                        </div>
                        <p className="text-sm text-slate-400 mb-2">No reports yet</p>
                        <p className="text-xs text-slate-600">Upload your first medical report to get started</p>
                      </div>
                    ) : (
                      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/[0.05] before:to-transparent">
                        {reports.slice(0, 5).map((r, i) => {
                          const sc = statusConfig[r.status] || statusConfig.pending;
                          return (
                            <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                              className="relative flex items-center gap-6 group cursor-pointer"
                              onClick={() => { setActiveTab("reports"); setExpandedReport(r.id); }}
                            >
                              <div className={`absolute left-5 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-slate-900 z-10 transition-colors ${r.status === "completed" ? "bg-emerald-400 status-glow" : "bg-amber-400 animate-pulse"}`} />
                              
                              <div className="flex-1 ml-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-sky-500/10 hover:bg-white/[0.03] transition-all flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                  <FileText className="w-4.5 h-4.5 text-sky-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-white truncate">{r.name}</p>
                                    <span className="text-[9px] text-slate-500 shrink-0 font-medium uppercase tracking-wider">{formatTimeAgo(r.uploaded_at)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] font-medium ${sc.color} flex items-center gap-1`}>
                                      {sc.icon} {sc.label}
                                    </span>
                                    {r.status === "completed" && analyses[r.id] && (
                                      <>
                                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                                        <span className="text-[10px] text-slate-500 font-medium">Health Index: {calcHealthScore(analyses[r.id])}%</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* ═══════════ REPORTS TAB ═══════════ */}
            {activeTab === "reports" && (
              <motion.div key="reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
                {/* Pro Upsell Banner */}
                {isFreeTier && completedReports > 0 && <ProUpsell used={freeReportsUsed} limit={FREE_TIER_LIMIT} />}
                {!isFreeTier && <ProUpsell used={FREE_TIER_LIMIT} limit={FREE_TIER_LIMIT} />}

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="text" placeholder="Search reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/30 focus:ring-1 focus:ring-sky-500/10 transition-all"
                      />
                    </div>
                  </div>
                  {/* Upload button — blocked when free tier exceeded */}
                  {isFreeTier ? (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all disabled:opacity-50"
                    >
                      {uploading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {uploading && uploadProgress ? uploadProgress.message : "Upload Report"}
                      {uploading && uploadProgress && <span className="text-[10px] opacity-70">{uploadProgress.progress}%</span>}
                    </motion.button>
                  ) : (
                    <a href="/#pricing"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all"
                    >
                      <Crown className="w-4 h-4" /> Upgrade to Pro
                    </a>
                  )}

                  {/* Upload Progress Modal */}
                  <AnimatePresence>
                    {uploading && uploadProgress && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
                      >
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 200, damping: 20 }}
                          className="relative max-w-md w-full"
                        >
                          {/* Outer glow ring */}
                          <div className="absolute -inset-8 rounded-full blur-3xl opacity-20"
                            style={{ background: "conic-gradient(from 0deg, #0ea5e9, #8b5cf6, #0ea5e9)" }} />

                          <div className="relative bg-gradient-to-b from-slate-900/95 to-slate-950/95 rounded-[2rem] border border-white/10 p-10 shadow-[0_0_100px_rgba(14,165,233,0.15)]">
                            {/* Animated DNA-like helix */}
                            <div className="flex justify-center mb-8 h-32 overflow-hidden">
                              <svg viewBox="0 0 200 120" className="w-40 h-32">
                                <motion.g>
                                  {/* Helix strand 1 */}
                                  <motion.path
                                    d="M10,60 Q50,10 100,60 Q150,110 190,60"
                                    fill="none"
                                    stroke="url(#grad1)"
                                    strokeWidth="2.5"
                                    animate={{ d: [
                                      "M10,60 Q50,10 100,60 Q150,110 190,60",
                                      "M10,60 Q50,110 100,60 Q150,10 190,60",
                                      "M10,60 Q50,10 100,60 Q150,110 190,60",
                                    ]}}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                  />
                                  {/* Helix strand 2 */}
                                  <motion.path
                                    d="M10,60 Q50,110 100,60 Q150,10 190,60"
                                    fill="none"
                                    stroke="url(#grad2)"
                                    strokeWidth="2.5"
                                    animate={{ d: [
                                      "M10,60 Q50,110 100,60 Q150,10 190,60",
                                      "M10,60 Q50,10 100,60 Q150,110 190,60",
                                      "M10,60 Q50,110 100,60 Q150,10 190,60",
                                    ]}}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                  />
                                  {/* Connection dots */}
                                  {[30, 60, 90, 120, 150, 180].map((x, i) => (
                                    <g key={x}>
                                      <circle cx={x} cy={60} r="2" fill="rgba(14,165,233,0.6)" />
                                      <motion.line
                                        x1={x} y1="55" x2={x} y2="65"
                                        stroke="rgba(14,165,233,0.15)"
                                        strokeWidth="0.5"
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                      />
                                    </g>
                                  ))}
                                  <defs>
                                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#0ea5e9" />
                                      <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                    <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="0%">
                                      <stop offset="0%" stopColor="#0ea5e9" />
                                      <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                  </defs>
                                </motion.g>
                              </svg>
                            </div>

                            {/* Title with shimmer */}
                            <h3 className="text-2xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-purple-400 animate-gradient">
                              Obvis AI Analysis
                            </h3>
                            <p className="text-sm text-slate-500 text-center mb-6">Processing your medical report</p>

                            {/* Status messages with icon transitions */}
                            <div className="space-y-2 mb-6">
                              {[
                                { icon: "📄", text: "Reading document...", show: true },
                                { icon: "🔬", text: "Analyzing medical data...", show: true },
                                { icon: "💡", text: "Generating insights...", show: true },
                                { icon: "✅", text: "Analysis complete!", show: uploadProgress.status === "completed" },
                              ].map((step, i) => (
                                step.show ? (
                                  <motion.div key={i}
                                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm ${
                                      uploadProgress.status === "completed" && i === 3
                                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                        : "bg-white/5 text-slate-400 border border-white/5"
                                    }`}
                                  >
                                    <span className="text-lg">{step.icon}</span>
                                    <span className="text-xs font-medium tracking-wide">{step.text}</span>
                                    {i === 3 && uploadProgress.status === "completed" && (
                                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                                        Done!
                                      </motion.span>
                                    )}
                                  </motion.div>
                                ) : null
                              ))}
                            </div>

                            {/* Circular progress */}
                            <div className="flex justify-center">
                              <div className="relative">
                                <svg width="100" height="100" className="-rotate-90">
                                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6"
                                    stroke="rgba(255,255,255,0.05)" />
                                  <motion.circle cx="50" cy="50" r="42" fill="none" strokeWidth="6"
                                    strokeLinecap="round"
                                    stroke="url(#progressGradient)"
                                    initial={{ strokeDasharray: "264" }}
                                    animate={{ strokeDasharray: `${(uploadProgress.progress / 100) * 264} 264` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                  />
                                  <defs>
                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#0ea5e9" />
                                      <stop offset="50%" stopColor="#6366f1" />
                                      <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <motion.div
                                  className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white"
                                  key={uploadProgress.progress}
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ duration: 0.5 }}
                                >
                                  {uploadProgress.progress}%
                                </motion.div>
                              </div>
                            </div>

                            {/* Pulsing outer border glow */}
                            <motion.div
                              className="absolute inset-0 rounded-[2rem] border border-transparent"
                              style={{ background: "transparent", boxShadow: "inset 0 0 30px rgba(14,165,233,0.05)" }}
                              animate={{ borderColor: ["rgba(14,165,233,0.1)", "rgba(139,92,246,0.1)", "rgba(14,165,233,0.1)"] }}
                              transition={{ duration: 4, repeat: Infinity }}
                            />
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Reports List */}
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-400 rounded-full"
                    />
                  </div>
                ) : filteredReports.length === 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
                      <FileUp className="w-9 h-9 text-slate-600" />
                    </div>
                    <p className="text-base text-slate-300 mb-2">No reports found</p>
                    <p className="text-sm text-slate-600">Upload a medical report to get AI-powered analysis</p>
                  </motion.div>
                ) : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                    {filteredReports.map((r) => {
                      const sc = statusConfig[r.status] || statusConfig.pending;
                      const analysis = analyses[r.id];
                      const isExpanded = expandedReport === r.id;
                      return (
                        <motion.div key={r.id} variants={fadeInUp}
                          className="group relative rounded-2xl holographic-card hover:border-sky-500/20 transition-all overflow-hidden"
                        >
                          <div className="absolute inset-0 bio-scan-line opacity-0 group-hover:opacity-10 transition-opacity" />
                          
                          {/* Report Header */}
                          <div className="p-5 flex items-center gap-4 cursor-pointer relative z-10 card-shine" onClick={() => setExpandedReport(isExpanded ? null : r.id)}>
                            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                              <FileText className="w-6 h-6 text-sky-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{r.name}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{formatTimeAgo(r.uploaded_at)}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${sc.color}`}>
                              {sc.icon} {sc.label}
                            </span>
                            {r.status === "pending" && (
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); handleAnalyze(r.id); }}
                                disabled={analyzing === r.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/10 transition-all disabled:opacity-50"
                              >
                                {analyzing === r.id ? (
                                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-3 h-3 border border-sky-400/30 border-t-sky-400 rounded-full" />
                                ) : (
                                  <Brain className="w-3.5 h-3.5" />
                                )}
                                {analyzing === r.id ? "Analyzing..." : "Analyze"}
                              </motion.button>
                            )}
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            </motion.div>
                          </div>

                          {/* Expanded Detail */}
                          <AnimatePresence>
                            {isExpanded && analysis && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }} className="overflow-hidden"
                              >
                                <div className="px-5 pb-5 pt-0 border-t border-white/[0.04]">
                                  {/* Health Bar */}
                                  <div className="flex items-center gap-3 mt-4 mb-4">
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Health</span>
                                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: `${calcHealthScore(analysis)}%` }} transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full rounded-full ${calcHealthScore(analysis) >= 80 ? "bg-emerald-400" : calcHealthScore(analysis) >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                                      />
                                    </div>
                                    <span className={`text-xs font-bold ${calcHealthScore(analysis) >= 80 ? "text-emerald-400" : calcHealthScore(analysis) >= 60 ? "text-amber-400" : "text-red-400"}`}>
                                      {calcHealthScore(analysis)}%
                                    </span>
                                  </div>

                                  {/* Detail Tabs */}
                                  <div className="flex items-center justify-between mb-4 gap-2">
                                    <div className="flex glass-pill rounded-xl p-1 shadow-inner shadow-white/5">
                                      {([
                                        { id: "summary" as const, label: "Summary", icon: <HeartPulse className="w-3.5 h-3.5" /> },
                                        { id: "values" as const, label: "Values", icon: <BarChart3 className="w-3.5 h-3.5" /> },
                                        { id: "precautions" as const, label: "Advice", icon: <Lightbulb className="w-3.5 h-3.5" /> },
                                      ]).map((t) => (
                                        <button key={t.id} onClick={() => setDetailTab(t.id)}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            detailTab === t.id ? "bg-sky-500/20 text-sky-300 shadow-lg shadow-sky-500/10" : "text-slate-500 hover:text-slate-300"
                                          }`}
                                        >{t.icon} {t.label}</button>
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button onClick={() => handleDownloadOriginal(r)} disabled={downloading === "original"}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white/5 text-slate-400 hover:bg-sky-500/10 hover:text-sky-400 border border-white/5 transition-all disabled:opacity-40"
                                      ><FileText className="w-3.5 h-3.5" />{downloading === "original" ? "..." : "Original"}</button>
                                      <button onClick={() => handleDownloadAnalysis(r)} disabled={downloading === "analysis"}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/10 transition-all disabled:opacity-40 shadow-lg shadow-sky-500/10"
                                      ><FileDown className="w-3.5 h-3.5" />{downloading === "analysis" ? "..." : "AI PDF"}</button>
                                    </div>
                                  </div>

                                  {/* Tab Content */}
                                  <AnimatePresence mode="wait">
                                    {detailTab === "summary" && (
                                      <motion.div key="sum" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                                        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
                                          <p className="text-sm text-slate-300 leading-relaxed">{analysis.summary}</p>
                                        </div>
                                        {analysis.medicine_suggestions?.length > 0 && (
                                          <div className="mt-3 space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium"><Pill className="w-3 h-3 text-purple-400" /> Medicine Suggestions</div>
                                            {analysis.medicine_suggestions.map((m, i) => {
                                              const text = typeof m === "string" ? m : JSON.stringify(m);
                                              return (
                                                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                                  className="flex items-start gap-2 text-xs text-slate-300 bg-purple-500/[0.04] rounded-lg border border-purple-500/10 p-2.5"
                                                ><Pill className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" /><span>{text}</span></motion.div>
                                              );
                                            })}
                                          </div>
                                        )}
                                        {analysis.lifestyle_tips?.length > 0 && (
                                          <div className="mt-3 space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium"><Lightbulb className="w-3 h-3 text-amber-400" /> Lifestyle Tips</div>
                                            {analysis.lifestyle_tips.map((tip, i) => (
                                              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                                className="flex items-start gap-2 text-xs text-slate-300 bg-amber-500/[0.04] rounded-lg border border-amber-500/10 p-2.5"
                                              ><Lightbulb className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" /><span>{tip}</span></motion.div>
                                            ))}
                                          </div>
                                        )}
                                      </motion.div>
                                    )}
                                    {detailTab === "values" && (
                                      <motion.div key="val" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                                        {(analysis.values || []).length > 0 ? (
                                          <div className="overflow-x-auto rounded-xl border border-white/[0.05]">
                                            <table className="w-full text-xs">
                                              <thead>
                                                <tr className="border-b border-white/[0.05] bg-white/[0.02] text-slate-400">
                                                  <th className="text-left py-2.5 px-3 font-semibold uppercase tracking-wider text-[10px]">Test</th>
                                                  <th className="text-center py-2.5 px-2 font-semibold uppercase tracking-wider text-[10px]">Value</th>
                                                  <th className="text-center py-2.5 px-2 font-semibold uppercase tracking-wider text-[10px]">Unit</th>
                                                  <th className="text-center py-2.5 px-2 font-semibold uppercase tracking-wider text-[10px]">Range</th>
                                                  <th className="text-center py-2.5 px-2 font-semibold uppercase tracking-wider text-[10px]">Flag</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {(analysis.values || []).map((v, i) => {
                                                  const fc = flagConfig[v.flag] || flagConfig.normal;
                                                  return (
                                                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                                      className={`border-b border-white/[0.03] ${v.flag === "HIGH" || v.flag === "LOW" ? "bg-red-500/[0.04]" : i % 2 === 1 ? "bg-white/[0.01]" : ""}`}
                                                    >
                                                      <td className="py-2.5 px-3 text-slate-200 font-medium">{v.name}</td>
                                                      <td className="py-2.5 px-2 text-center text-slate-200 font-mono">{v.value}</td>
                                                      <td className="py-2.5 px-2 text-center text-slate-500">{v.unit}</td>
                                                      <td className="py-2.5 px-2 text-center text-slate-600">{v.normal_range}</td>
                                                      <td className="py-2.5 px-2 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${fc.color}`}>{fc.icon} {fc.label}</span>
                                                      </td>
                                                    </motion.tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <BarChart3 className="w-10 h-10 text-slate-600 mb-2" />
                                            <p className="text-sm text-slate-500">No test values found</p>
                                            <p className="text-xs text-slate-600 mt-1">The report may not contain lab data or try re-analyzing</p>
                                          </div>
                                        )}
                                      </motion.div>
                                    )}
                                    {detailTab === "precautions" && (
                                      <motion.div key="pre" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                                        <div className="space-y-4">
                                          {/* Precautions */}
                                          {(analysis.precautions || []).length > 0 && (
                                            <div>
                                              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Precautions
                                              </div>
                                              <div className="space-y-2">
                                                {(analysis.precautions || []).map((p, i) => (
                                                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                                    className="flex items-start gap-2.5 text-xs text-slate-300 bg-white/[0.02] rounded-xl border border-white/[0.05] p-3 hover:border-sky-500/15 transition-colors"
                                                  >
                                                    <div className="w-5 h-5 rounded-full bg-sky-500/15 flex items-center justify-center shrink-0 mt-0.5">
                                                      <AlertCircle className="w-3 h-3 text-sky-400" />
                                                    </div>
                                                    <span>{p}</span>
                                                  </motion.div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          {/* Medicine Suggestions */}
                                          {(analysis.medicine_suggestions || []).length > 0 && (
                                            <div>
                                              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
                                                <Pill className="w-3.5 h-3.5 text-purple-400" /> Medicine Suggestions
                                              </div>
                                              <div className="space-y-2">
                                                {analysis.medicine_suggestions.map((m, i) => {
                                                  const text = typeof m === "string" ? m : JSON.stringify(m);
                                                  return (
                                                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                                      className="flex items-start gap-2.5 text-xs text-slate-300 bg-purple-500/[0.04] rounded-xl border border-purple-500/10 p-3 hover:border-purple-500/20 transition-colors"
                                                    >
                                                      <div className="w-5 h-5 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0 mt-0.5">
                                                        <Pill className="w-3 h-3 text-purple-400" />
                                                      </div>
                                                      <span>{text}</span>
                                                    </motion.div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                          {/* Lifestyle Tips */}
                                          {(analysis.lifestyle_tips || []).length > 0 && (
                                            <div>
                                              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
                                                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Lifestyle Tips
                                              </div>
                                              <div className="space-y-2">
                                                {analysis.lifestyle_tips.map((tip, i) => (
                                                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                                    className="flex items-start gap-2.5 text-xs text-slate-300 bg-amber-500/[0.04] rounded-xl border border-amber-500/10 p-3 hover:border-amber-500/20 transition-colors"
                                                  >
                                                    <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                                                      <Lightbulb className="w-3 h-3 text-amber-400" />
                                                    </div>
                                                    <span>{tip}</span>
                                                  </motion.div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          {/* Empty state */}
                                          {(!analysis.precautions || analysis.precautions.length === 0) &&
                                           (!analysis.medicine_suggestions || analysis.medicine_suggestions.length === 0) &&
                                           (!analysis.lifestyle_tips || analysis.lifestyle_tips.length === 0) && (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                              <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
                                              <p className="text-sm text-slate-500">No advice available</p>
                                              <p className="text-xs text-slate-600 mt-1">Try re-analyzing the report</p>
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ═══════════ CHAT TAB ═══════════ */}
            {activeTab === "chat" && (
              <motion.div key="chat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}
                className="flex flex-col h-[calc(100vh-120px)]"
              >
                <div className="flex-1 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-sm border border-white/[0.06] flex flex-col overflow-hidden">
                  {/* Chat Header */}
                  <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Obvis AI Health Assistant</h3>
                      <p className="text-[10px] text-slate-500">Describe your symptoms for AI-powered insights</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {questionCount > 0 && (
                        <button onClick={resetChat}
                          className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                          New Chat (Q{questionCount}/5)
                        </button>
                      )}
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
                      <span className="text-[10px] text-emerald-400">Online</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 chat-scroll">
                    {chatMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <motion.div 
                          className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 relative"
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <div className="absolute inset-0 bio-scan-line opacity-30" />
                          <Sparkles className="w-10 h-10 text-purple-400" />
                        </motion.div>
                        <h4 className="text-lg font-bold text-white mb-2 glow-text-blue">Obvis Neural Assistant</h4>
                        <p className="text-xs text-slate-500 max-w-xs mb-8 leading-relaxed">Describe your symptoms or ask about your medical reports for real-time AI insights and health guidance.</p>
                        <div className="grid grid-cols-2 gap-3 max-w-md w-full">
                          {chatSuggestions.map((s, i) => (
                            <motion.button key={i} 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              whileHover={{ scale: 1.02, backgroundColor: "rgba(168, 85, 247, 0.1)" }} 
                              whileTap={{ scale: 0.98 }}
                              onClick={() => { setChatInput(s.text); }}
                              className="suggestion-chip flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 hover:text-white hover:border-purple-500/30 transition-all text-left group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                                <span className="text-purple-400">{s.icon}</span>
                              </div>
                              <span className="line-clamp-2 leading-snug">{s.text}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: msg.from === "user" ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
                        className={`flex gap-3 ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.from === "bot" && (
                          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/10 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-purple-500/10">
                            <Bot className="w-4.5 h-4.5 text-purple-400" />
                          </div>
                        )}
                        <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-xl ${
                          msg.from === "user"
                            ? "bg-gradient-to-br from-sky-500/20 to-sky-600/10 text-sky-100 border border-sky-500/20 rounded-br-md"
                            : "bg-slate-800/40 text-slate-200 border border-white/[0.06] rounded-bl-md backdrop-blur-md"
                        }`}>
                          {/* Question text */}
                          {msg.text && <div>{msg.text}</div>}

                          {/* Full analysis after 5 questions */}
                          {msg.from === "bot" && msg.analysis && (
                            <div className="mt-4 space-y-3 pt-3 border-t border-white/10">
                              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                                <FileText className="w-3.5 h-3.5" /> Analysis Complete
                              </div>
                              {msg.summary && (
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 text-xs">
                                  {msg.summary}
                                </div>
                              )}
                              {(msg.medicine_suggestions || []).length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400"><Pill className="w-3 h-3" /> Medicine</div>
                                  {(msg.medicine_suggestions || []).map((m: string, j: number) => (
                                    <div key={j} className="text-[11px] text-slate-300 bg-purple-500/[0.06] rounded-lg p-2">{m}</div>
                                  ))}
                                </div>
                              )}
                              {(msg.advice || []).length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400"><Stethoscope className="w-3 h-3" /> Advice</div>
                                  {(msg.advice || []).map((a: string, j: number) => (
                                    <div key={j} className="text-[11px] text-slate-300 bg-sky-500/[0.06] rounded-lg p-2">{a}</div>
                                  ))}
                                </div>
                              )}
                              {(msg.recommendations || []).length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400"><Lightbulb className="w-3 h-3" /> Recommendations</div>
                                  {(msg.recommendations || []).map((r: string, j: number) => (
                                    <div key={j} className="text-[11px] text-slate-300 bg-amber-500/[0.06] rounded-lg p-2">{r}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {msg.from === "user" && (
                          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/10 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-sky-500/10">
                            <User className="w-4.5 h-4.5 text-sky-400" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {chatLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/10 flex items-center justify-center shrink-0">
                          <Bot className="w-4.5 h-4.5 text-purple-400" />
                        </div>
                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl rounded-bl-md px-5 py-4 flex gap-1.5 backdrop-blur-md">
                          <motion.span animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          <motion.span animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          <motion.span animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        </div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input area */}
                  <div className="px-6 py-6 border-t border-white/[0.04] bg-white/[0.01]">
                    <div className="flex items-center gap-3 glass-pill p-1.5 rounded-2xl focus-within:border-sky-500/30 transition-all shadow-inner shadow-white/5">
                      <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendChat()}
                        placeholder="Inquire about your health sync..."
                        className="flex-1 px-4 py-2.5 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
                      />
                      <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(14, 165, 233, 0.4)" }} whileTap={{ scale: 0.95 }}
                        onClick={sendChat} disabled={!chatInput.trim() || chatLoading}
                        className="p-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20 disabled:opacity-40 transition-all group"
                      >
                        <Send className="w-4.5 h-4.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} className="hidden" />
    </div>
  );
}