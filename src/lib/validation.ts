export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      try {
        return new URL(trimmed).toString();
      } catch {
        return "";
      }
    }
    try {
      return new URL(`https://${trimmed}`).toString();
    } catch {
      return "";
    }
  }
}

export function isDangerousUrl(url: string): boolean {
  const lower = url.toLowerCase().trim();
  return (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("about:") ||
    lower.startsWith("blob:") ||
    lower.startsWith("ws:") ||
    lower.startsWith("wss:")
  );
}