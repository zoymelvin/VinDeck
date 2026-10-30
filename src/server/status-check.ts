import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type StatusState = "online" | "degraded" | "offline" | "unsupported";

export interface StatusResult {
  url: string;
  state: StatusState;
  httpStatus: number | null;
  latencyMs: number;
  method: "server";
  checkedAt: string;
}

const PRIVATE_RANGES = [
  // IPv4
  (ip: string) => {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4) return false;
    const [a, b] = parts;
    if (a === 127) return true; // 127.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10
    return false;
  },
  // IPv6
  (ip: string) => {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
    if (lower.startsWith("fe80")) return true; // fe80::/10
    return false;
  },
];

function isPrivateIP(ip: string): boolean {
  if (isIP(ip) === 4) return PRIVATE_RANGES[0](ip);
  if (isIP(ip) === 6) return PRIVATE_RANGES[1](ip);
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost") return true;
  if (lower.endsWith(".local")) return true;
  if (lower.endsWith(".internal")) return true;
  return false;
}

export async function isUrlAllowed(urlStr: string): Promise<boolean> {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.port && url.port !== "80" && url.port !== "443") return false;

    const hostname = url.hostname;
    if (isBlockedHostname(hostname)) return false;

    // Check if hostname is an IP
    if (isIP(hostname)) {
      return !isPrivateIP(hostname);
    }

    // DNS resolution
    const addresses = await lookup(hostname, { all: true });
    for (const addr of addresses) {
      if (isPrivateIP(addr.address)) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function classifyStatus(httpStatus: number | null, latencyMs: number, cfMitigated: boolean): StatusState {
  if (cfMitigated) return "online";
  if (httpStatus === null) return "offline";
  if (latencyMs > 2000) return "degraded";

  // 1xx-4xx (including redirects, auth errors, not found, rate limit) = online
  if (httpStatus >= 100 && httpStatus < 500) return "online";

  // 5xx
  if (httpStatus === 500 || httpStatus === 501 || httpStatus === 505) return "degraded";
  if (httpStatus === 502 || httpStatus === 504) return "offline";
  if (httpStatus >= 520 && httpStatus <= 530) return "offline";
  if (httpStatus === 503) return "degraded";

  return "online";
}

export async function checkUrl(urlStr: string): Promise<StatusResult> {
  const checkedAt = new Date().toISOString();

  // SSRF check
  if (!(await isUrlAllowed(urlStr))) {
    return { url: urlStr, state: "unsupported", httpStatus: null, latencyMs: 0, method: "server", checkedAt };
  }

  const startTime = Date.now();
  let httpStatus: number | null = null;
  let cfMitigated = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let currentUrl = urlStr;
    let redirects = 0;

    while (redirects < 3) {
      const response = await fetch(currentUrl, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "manual",
        headers: { "User-Agent": "VinDeck-Status/1.0" },
      });

      httpStatus = response.status;
      cfMitigated = response.headers.has("cf-mitigated");

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (location) {
          const nextUrl = new URL(location, currentUrl).href;
          if (!(await isUrlAllowed(nextUrl))) {
            clearTimeout(timeoutId);
            return { url: urlStr, state: "unsupported", httpStatus, latencyMs: Date.now() - startTime, method: "server", checkedAt };
          }
          currentUrl = nextUrl;
          redirects++;
          continue;
        }
      }

      // If 405 or 501, retry with GET
      if (response.status === 405 || response.status === 501) {
        const getResponse = await fetch(currentUrl, {
          method: "GET",
          signal: controller.signal,
          redirect: "manual",
          headers: { "User-Agent": "VinDeck-Status/1.0", "Range": "bytes=0-0" },
        });
        httpStatus = getResponse.status;
        cfMitigated = getResponse.headers.has("cf-mitigated");
      }

      clearTimeout(timeoutId);
      break;
    }

    const latencyMs = Date.now() - startTime;
    const state = classifyStatus(httpStatus, latencyMs, cfMitigated);
    return { url: urlStr, state, httpStatus, latencyMs, method: "server", checkedAt };
  } catch {
    const latencyMs = Date.now() - startTime;
    return { url: urlStr, state: "offline", httpStatus: null, latencyMs, method: "server", checkedAt };
  }
}