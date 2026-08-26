export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  downloadUrl: string;
  releaseDate?: string;
  fileSize?: string;
  changelog?: {
    newFeatures: string[];
    bugFixes: string[];
    improvements: string[];
  };
  priority?: "critical" | "optional";
  error?: string;
  isFetchSuccess?: boolean;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // Ensure dot is used as decimal separator
  const val = (bytes / Math.pow(k, i)).toFixed(2);
  // Remove trailing zeros if needed (optional, but cleaner)
  const formatted = parseFloat(val).toString().replace(',', '.'); 
  return formatted + " " + sizes[i];
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const months = [
      "JAN", "FEB", "MAR", "APR", "MEI", "JUN", 
      "JUL", "AGU", "SEP", "OKT", "NOV", "DES"
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateString;
  }
};

export const checkForUpdate = async (currentVersion: string): Promise<UpdateInfo> => {
  try {
    const ts = Date.now();
    const urls = [
      `https://raw.githubusercontent.com/opl224/fitgo-updates/fitgo-updates/version.json?t=${ts}`,
      `https://raw.githubusercontent.com/opl224/fitgo-updates/gh-pages/version.json?t=${ts}`,
      `https://raw.githubusercontent.com/opl224/fitgo-updates/main/version.json?t=${ts}`,
      `https://raw.githubusercontent.com/opl224/fitgo-updates/master/version.json?t=${ts}`,
      `https://api.github.com/repos/opl224/fitgo-updates/contents/version.json?ref=fitgo-updates&t=${ts}`
    ];
    let data: any = null;
    let selectedUrl = "";
    let lastStatus = 0;
    for (const url of urls) {
      selectedUrl = url;
      try {
        const res = await fetch(url, { cache: "no-store" });
        lastStatus = res.status;
        if (!res.ok) continue;
        if (url.includes("/contents/")) {
          const apiJson = await res.json();
          if (apiJson && apiJson.content) {
            const decoded = atob(apiJson.content.replace(/\n/g, ""));
            data = JSON.parse(decoded);
            break;
          }
        } else {
          data = await res.json();
          break;
        }
      } catch (e) {
        console.warn(`[UpdateService] Failed to fetch from ${url}:`, e);
      }
    }
    // GitHub Releases fallback (authoritative source)
    let releaseInfo: any = null;
    try {
      const rel = await fetch(`https://api.github.com/repos/opl224/fitgo-updates/releases/latest?t=${ts}`, { cache: "no-store" });
      if (rel.ok) {
        releaseInfo = await rel.json();
      }
    } catch (e) {
      console.warn(`[UpdateService] Failed to fetch releases:`, e);
    }

    if (!data && !releaseInfo) {
      return { 
        hasUpdate: false, 
        latestVersion: currentVersion, 
        downloadUrl: "", 
        error: `No version.json or releases found (status ${lastStatus})`,
        isFetchSuccess: false 
      };
    }
    // Resolve latest version preference:
    const preferSemantic = isSemantic(currentVersion);
    let latestVersion: string | null = null;
    let downloadUrl: string = "";
    let releaseDate: string = "";
    let fileSize: string = "";
    let changelog = data?.changelog || { newFeatures: [], bugFixes: [], improvements: [] };
    let priority = data?.priority || "optional";

    // Extract asset info from release
    const apkAsset = (releaseInfo?.assets || []).find((a: any) =>
      String(a?.name || "").toLowerCase().includes(".apk")
    );

    if (releaseInfo) {
      releaseDate = formatDate(releaseInfo.published_at);
      if (apkAsset) {
        fileSize = formatSize(apkAsset.size);
      }
    }

    if (preferSemantic) {
      const semanticRaw =
        data?.version ??
        data?.android?.versionName ??
        data?.android?.version ??
        data?.versionName ??
        null;
      const tagName = releaseInfo?.tag_name || null; // e.g., v1.1.0
      const tagVer = normalizeVersion(tagName);
      const semNorm = normalizeVersion(semanticRaw);
      latestVersion = tagVer || semNorm || normalizeVersion(currentVersion);
      
      const relDl = apkAsset?.browser_download_url || "";
      downloadUrl = relDl || data?.downloadUrl || data?.android?.downloadUrl || "";
    } else {
      const codeRaw =
        data?.android?.versionCode ??
        data?.versionCode ??
        releaseInfo?.id ?? // fallback numeric
        null;
      latestVersion = normalizeVersion(codeRaw) || normalizeVersion(currentVersion);
      downloadUrl = data?.downloadUrl || data?.android?.downloadUrl || "";
    }
    const currNorm = normalizeVersion(currentVersion) ?? currentVersion;
    const cmp = compareVersions(latestVersion ?? undefined, currNorm);
    
    console.info(`[UpdateService] Final comparison - Latest: ${latestVersion}, Current: ${currNorm}, Result: ${cmp}`);
    
    let finalFileSize = fileSize || data?.fileSize || "Unknown size";
    // Ensure consistent dot separator
    if (finalFileSize && typeof finalFileSize === 'string') {
      finalFileSize = finalFileSize.replace(',', '.');
    }

    return { 
      hasUpdate: cmp > 0, 
      latestVersion: latestVersion ?? currentVersion, 
      downloadUrl, 
      releaseDate: releaseDate || data?.releaseDate || "Baru saja",
      fileSize: finalFileSize,
      changelog,
      priority,
      isFetchSuccess: true 
    };
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error("[Update] check failed:", msg);
    return { hasUpdate: false, latestVersion: currentVersion, downloadUrl: "", error: msg };
  }
};

// Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
function compareVersions(v1?: string, v2?: string): number {
  if (!v1 || !v2) return 0;
  const p1 = v1.replace(/^v/i, "").split(".").map((x) => Number(x));
  const p2 = v2.replace(/^v/i, "").split(".").map((x) => Number(x));
  const len = Math.max(p1.length, p2.length);

  for (let i = 0; i < len; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

function normalizeVersion(input: any): string | null {
  if (input == null) return null;
  if (typeof input === "number") return String(input);
  if (typeof input === "string") {
    const trimmed = input.trim();
    const match = trimmed.match(/v?(\d+(?:\.\d+)*)/i);
    return match ? match[1] : trimmed;
  }
  return null;
}

function isSemantic(v: string): boolean {
  return /\d+\.\d+/.test(v);
}
