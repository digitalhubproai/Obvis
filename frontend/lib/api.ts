const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ===== Auth ===== */

export async function apiSignUp(name: string, email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error("Signup failed");
  return res.json();
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function apiGetMe(token: string): Promise<{ id: string; name: string; email: string }> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

/* ===== Reports ===== */

export async function apiGetReports(token: string) {
  const res = await fetch(`${API_URL}/reports`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json() as Promise<Report[]>;
}

export type UploadProgress = {
  status: "reading" | "analyzing" | "generating" | "completed" | "failed";
  message: string;
  progress: number;
  analysis?: Analysis;
};

export async function apiUploadReportSSE(
  token: string,
  file: File,
  onProgress: (data: UploadProgress) => void,
): Promise<Analysis | null> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/reports/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: Analysis | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data) as UploadProgress & { analysis?: Analysis };
          onProgress(parsed);
          if (parsed.status === "completed" && parsed.analysis) {
            result = parsed.analysis;
          }
        } catch {
          // skip malformed
        }
      }
    }
  }

  return result;
}

export async function apiAnalyzeReport(token: string, reportId: string) {
  const res = await fetch(`${API_URL}/reports/${reportId}/analyze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Analysis failed");
  return res.json() as Promise<Analysis>;
}

/** Download original uploaded file */
export async function apiDownloadOriginal(token: string, reportId: string, originalName: string) {
  const res = await fetch(`${API_URL}/reports/${reportId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Download original failed:", res.status, text);
    throw new Error(`Download failed: ${res.status} - ${text}`);
  }
  const blob = await res.blob();
  console.log("Download original OK, size:", blob.size);
  triggerDownload(blob, originalName);
}

/** Download AI-generated analysis as PDF */
export async function apiDownloadAnalysis(token: string, reportId: string, fileName: string) {
  const res = await fetch(`${API_URL}/reports/${reportId}/download-analysis`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Download analysis failed:", res.status, text);
    throw new Error(`Analysis download failed: ${res.status} - ${text}`);
  }
  const blob = await res.blob();
  console.log("Download analysis OK, size:", blob.size);
  const safeName = fileName.replace(/\.[^.]+$/, "");
  triggerDownload(blob, `Analysis_${safeName}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Delay revocation so browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ===== Symptom Chat ===== */

export async function apiSymptomChat(token: string, message: string, history: { from: string; text: string }[]) {
  const res = await fetch(`${API_URL}/chat/symptom`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error("Chat failed");
  return res.json() as Promise<{ text: string; question_count: number; analysis?: string; summary?: string; medicine_suggestions?: string[]; advice?: string[]; recommendations?: string[] }>;
}

/* ===== Types ===== */

export type Report = {
  id: string;
  name: string;
  status: "pending" | "completed" | "failed";
  uploaded_at: string;
  analyzed: boolean;
  file_name?: string;
};

export type Analysis = {
  summary: string;
  values: { name: string; value: string; unit: string; normal_range: string; flag: string }[];
  precautions: string[];
  lifestyle_tips: string[];
  medicine_suggestions: string[];
};
