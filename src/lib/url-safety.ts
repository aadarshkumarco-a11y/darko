import { isIP } from "net";
import { lookup } from "dns/promises";
import { URL } from "url";

const PRIVATE_IP_PATTERNS = [
  /^127\./, // loopback v4
  /^10\./, // private
  /^172\.(1[6-9]|2\d|3[01])\./, // private
  /^192\.168\./, // private
  /^169\.254\./, // link-local
  /^0\./, // current network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT
];

function isPrivateIPv4(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some((p) => p.test(ip));
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower.startsWith("fe80::") || // link-local
    lower.startsWith("fc") || // unique-local
    lower.startsWith("fd") ||
    lower.startsWith("::ffff:") // IPv4-mapped (could be private v4)
  );
}

function isPrivateIP(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  if (isIP(ip) === 6) return isPrivateIPv6(ip);
  return true; // unknown → treat as private (deny by default)
}

export interface UrlSafetyResult {
  safe: boolean;
  reason?: string;
  resolvedIp?: string;
}

/**
 * Validate a URL for safe server-side fetching.
 * - Must be HTTPS
 * - Must not resolve to a private IP
 * - Must not be on an allowlist of blocked domains
 */
export async function checkUrlSafety(rawUrl: string): Promise<UrlSafetyResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "Invalid URL" };
  }

  if (parsed.protocol !== "https:") {
    return { safe: false, reason: "Only HTTPS URLs are allowed" };
  }

  const hostname = parsed.hostname;

  // Block obvious metadata endpoints
  const BLOCKED_HOSTS = [
    "localhost",
    "ipify.org",
    "metadata.google.internal",
    "169.254.169.254", // AWS/GCP metadata
  ];
  if (BLOCKED_HOSTS.includes(hostname)) {
    return { safe: false, reason: "Blocked host" };
  }

  // If hostname is already an IP, check it directly
  if (isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      return { safe: false, reason: "IP is private/loopback", resolvedIp: hostname };
    }
    return { safe: true, resolvedIp: hostname };
  }

  // Otherwise resolve DNS
  try {
    const result = await lookup(hostname, { all: true });
    if (result.length === 0) {
      return { safe: false, reason: "DNS lookup returned no results" };
    }
    for (const r of result) {
      if (isPrivateIP(r.address)) {
        return { safe: false, reason: "DNS resolves to private IP", resolvedIp: r.address };
      }
    }
    return { safe: true, resolvedIp: result[0].address };
  } catch {
    return { safe: false, reason: "DNS lookup failed" };
  }
}

export interface UrlMetadata {
  url: string;
  title: string | null;
  description: string | null;
  favicon: string | null;
}

/**
 * Fetch safe metadata (title, description, favicon) for a URL.
 * Enforces SSRF protection via checkUrlSafety first.
 */
export async function fetchUrlMetadata(rawUrl: string): Promise<UrlMetadata> {
  const safety = await checkUrlSafety(rawUrl);
  if (!safety.safe) {
    throw new Error(safety.reason ?? "URL failed safety check");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(rawUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "DARKO-LinkPreview/1.0",
        Accept: "text/html",
      },
    });

    if (!res.ok) {
      return { url: rawUrl, title: null, description: null, favicon: null };
    }

    // Cap body size at 1MB to prevent abuse
    const reader = res.body?.getReader();
    if (!reader) return { url: rawUrl, title: null, description: null, favicon: null };

    const MAX_BYTES = 1_000_000;
    let receivedLength = 0;
    const chunks: Uint8Array[] = [];
    while (receivedLength < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        receivedLength += value.length;
        chunks.push(value);
      }
    }
    reader.cancel();
    const html = new TextDecoder().decode(Buffer.concat(chunks));

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().slice(0, 200) : null;

    // Extract meta description
    const descMatch = html.match(
      /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']+)["']/i
    );
    const description = descMatch ? descMatch[1].trim().slice(0, 300) : null;

    // Extract favicon URL
    let favicon: string | null = null;
    const faviconMatch = html.match(
      /<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i
    );
    if (faviconMatch) {
      try {
        favicon = new URL(faviconMatch[1], rawUrl).toString();
      } catch {
        favicon = null;
      }
    } else {
      // Default favicon location
      try {
        favicon = new URL("/favicon.ico", rawUrl).toString();
      } catch {
        favicon = null;
      }
    }

    return { url: rawUrl, title, description, favicon };
  } finally {
    clearTimeout(timeout);
  }
}
