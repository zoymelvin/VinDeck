import { describe, it, expect, vi, beforeEach } from "vitest";
import { getGreetingPeriod, getGreetingText, formatDateTimeIndonesian } from "@/lib/greeting";
import { isValidUrl, isDangerousUrl, sanitizeUrl } from "@/lib/validation";
import { filterApps, sortAppsByOrder, getUniqueCategories } from "@/lib/search";
import type { App, Category, UserSettings, ExportData, AccentColor } from "@/lib/types";

describe("greeting", () => {
  it("returns malam for 04:00", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T04:00:00"))).toBe("malam");
  });
  it("returns pagi for 05:00", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T05:00:00"))).toBe("pagi");
  });
  it("returns pagi for 10:59", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T10:59:00"))).toBe("pagi");
  });
  it("returns siang for 11:00", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T11:00:00"))).toBe("siang");
  });
  it("returns siang for 14:59", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T14:59:00"))).toBe("siang");
  });
  it("returns sore for 15:00", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T15:00:00"))).toBe("sore");
  });
  it("returns sore for 17:59", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T17:59:00"))).toBe("sore");
  });
  it("returns malam for 18:00", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T18:00:00"))).toBe("malam");
  });
  it("returns malam for 04:59", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T04:59:00"))).toBe("malam");
  });

  it("formats greeting text correctly", () => {
    expect(getGreetingText("pagi", "Budi")).toBe("Selamat pagi, Budi");
    expect(getGreetingText("siang", "Siti")).toBe("Selamat siang, Siti");
    expect(getGreetingText("sore", "Ani")).toBe("Selamat sore, Ani");
    expect(getGreetingText("malam", "Dewi")).toBe("Selamat malam, Dewi");
  });

  it("formats date time in Indonesian", () => {
    const date = new Date("2024-01-15T14:30:45");
    const formatted = formatDateTimeIndonesian(date);
    expect(formatted).toMatch(/senin|selasa|rabu|kamis|jumat|sabtu|minggu/i);
    expect(formatted).toMatch(/januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember/i);
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/14\.30\.45/);
  });
});

describe("validation", () => {
  it("accepts valid http URLs", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(isValidUrl("http://192.168.1.1")).toBe(true);
  });

  it("accepts valid https URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("https://sub.domain.com/path")).toBe(true);
    expect(isValidUrl("https://example.com:8443/path?query=1")).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("ftp://example.com")).toBe(false);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("data:text/html,<script>")).toBe(false);
    expect(isValidUrl("file:///etc/passwd")).toBe(false);
  });

  it("detects dangerous URLs", () => {
    expect(isDangerousUrl("javascript:alert(1)")).toBe(true);
    expect(isDangerousUrl("data:text/html,test")).toBe(true);
    expect(isDangerousUrl("file:///etc/passwd")).toBe(true);
    expect(isDangerousUrl("vbscript:msgbox(1)")).toBe(true);
    expect(isDangerousUrl("https://example.com")).toBe(false);
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("sanitizes URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
    expect(sanitizeUrl("http://example.com/path")).toBe("http://example.com/path");
    expect(sanitizeUrl("example.com")).toBe("https://example.com/");
    expect(sanitizeUrl("  https://example.com  ")).toBe("https://example.com/");
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeUrl("")).toBe("");
  });
});

describe("search", () => {
  const mockApps: App[] = [
    {
      id: "1",
      name: "Immich",
      description: "Photo backup",
      url: "https://immich.example.com",
      icon: "📷",
      iconType: "emoji",
      accentColor: "blue",
      category: "media",
      tags: ["photo", "backup"],
      isBuiltIn: true,
      isHidden: false,
      isPinned: true,
      statusEnabled: true,
      sortOrder: 1,
      clickCount: 5,
      lastOpened: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "2",
      name: "Vaultwarden",
      description: "Password manager",
      url: "https://vault.example.com",
      icon: "🔐",
      iconType: "emoji",
      accentColor: "violet",
      category: "security",
      tags: ["password", "security"],
      isBuiltIn: true,
      isHidden: false,
      isPinned: true,
      statusEnabled: true,
      sortOrder: 2,
      clickCount: 10,
      lastOpened: Date.now() - 1000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "3",
      name: "Hidden App",
      description: "This is hidden",
      url: "https://hidden.example.com",
      icon: "👻",
      iconType: "emoji",
      accentColor: "blue",
      category: "media",
      tags: [],
      isBuiltIn: false,
      isHidden: true,
      isPinned: false,
      statusEnabled: true,
      sortOrder: 3,
      clickCount: 0,
      lastOpened: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  it("filters by query", () => {
    expect(filterApps(mockApps, "photo", null, true)).toHaveLength(1);
    expect(filterApps(mockApps, "photo", null, true)[0].id).toBe("1");
    expect(filterApps(mockApps, "password", null, true)).toHaveLength(1);
    expect(filterApps(mockApps, "manager", null, true)).toHaveLength(1);
    expect(filterApps(mockApps, "backup", null, true)).toHaveLength(1);
    expect(filterApps(mockApps, "nonexistent", null, true)).toHaveLength(0);
  });

  it("filters by category", () => {
    expect(filterApps(mockApps, "", "media", true)).toHaveLength(2);
    expect(filterApps(mockApps, "", "security", true)).toHaveLength(1);
  });

  it("hides hidden apps by default", () => {
    expect(filterApps(mockApps, "", null, false)).toHaveLength(2);
    expect(filterApps(mockApps, "", null, true)).toHaveLength(3);
  });

  it("sorts by sortOrder", () => {
    const unsorted = [...mockApps].sort(() => Math.random() - 0.5);
    const sorted = sortAppsByOrder(unsorted);
    expect(sorted[0].sortOrder).toBeLessThanOrEqual(sorted[1].sortOrder);
  });

  it("gets unique categories", () => {
    const cats = getUniqueCategories(mockApps);
    expect(cats).toContain("media");
    expect(cats).toContain("security");
    expect(cats.length).toBe(2);
  });
});

import { importAllData } from "@/lib/storage";

describe("import/export validation", () => {
  const validExportData: ExportData = {
    apps: [],
    categories: [],
    settings: {
      greetingName: "Test",
      dashboardTitle: "Test",
      theme: "system",
      accentColor: "blue",
      viewMode: "cards",
      openInNewTab: true,
      statusEnabled: true,
      schemaVersion: 1,
    },
    quickNotes: "",
    exportedAt: Date.now(),
    schemaVersion: 1,
  };

  it("rejects invalid schema version", () => {
    const badData = { ...validExportData, schemaVersion: 999 };
    const result = importAllData(badData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("skema tidak didukung");
  });

  it("rejects missing required fields", () => {
    const badData = { ...validExportData, apps: "not-an-array" as unknown as App[] };
    const result = importAllData(badData);
    expect(result.success).toBe(false);
  });

  it("rejects invalid app URL", () => {
    const badData = {
      ...validExportData,
      apps: [{ id: "1", name: "Test", description: "", url: "javascript:alert(1)", icon: "🔗", iconType: "emoji" as const, accentColor: "blue" as AccentColor, category: "media", tags: [], isBuiltIn: false, isHidden: false, isPinned: false, statusEnabled: true, sortOrder: 0, clickCount: 0, lastOpened: null, createdAt: Date.now(), updatedAt: Date.now() }],
    };
    const result = importAllData(badData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL tidak valid");
  });
});