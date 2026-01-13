export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  downloadUrl: string;
}

export const checkForUpdate = async (currentVersion: string): Promise<UpdateInfo> => {
  try {
    // Check version.json from the repository
    // IMPORTANT: Verify this URL matches your repository structure.
    // If your project is in a subdirectory (e.g. react/fitgo), adjust the path accordingly.
    // Example: https://raw.githubusercontent.com/opl224/fitgo/main/react/fitgo/public/version.json
    const response = await fetch("https://raw.githubusercontent.com/opl224/fitgo/main/react/fitgo/public/version.json");

    if (!response.ok) {
      return { hasUpdate: false, latestVersion: currentVersion, downloadUrl: "" };
    }

    const data = await response.json();
    const latestVersion = data.version;
    const downloadUrl = data.downloadUrl;

    if (compareVersions(latestVersion, currentVersion) > 0) {
      return { hasUpdate: true, latestVersion, downloadUrl };
    }

    return { hasUpdate: false, latestVersion: currentVersion, downloadUrl: "" };
  } catch (error) {
    console.error("Error checking for update:", error);
    return { hasUpdate: false, latestVersion: currentVersion, downloadUrl: "" };
  }
};

// Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
function compareVersions(v1: string, v2: string): number {
  const p1 = v1.split(".").map(Number);
  const p2 = v2.split(".").map(Number);
  const len = Math.max(p1.length, p2.length);

  for (let i = 0; i < len; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}
