import { describe, it, expect } from "vitest";
import { getGreetingPeriod, getGreetingText, formatDateTime } from "@/lib/greeting";
import { isValidUrl, isDangerousUrl, sanitizeUrl } from "@/lib/validation";
import { filterApps, sortAppsByOrder, getUniqueCategories } from "@/lib/search";
import type { App, Category, UserSettings, ExportData, AccentColor } from "@/lib/types";

describe("greeting", () => {
  it("returns evening for 04:00", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T04:00:00"))).toBe("evening");
  });
  it("returns morning for 05:00", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T05:00:00"))).toBe("morning");
  });
  it("returns morning for 10:59", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T10:59:00"))).toBe("morning");
  });
  it("returns afternoon for 12:00", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T12:00:00"))).toBe("afternoon");
  });
  it("returns afternoon for 14:59", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T14:59:00"))).toBe("afternoon");
  });
  it("returns afternoon for 15:00", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T15:00:00"))).toBe("afternoon");
  });
  it("returns afternoon for 17:59", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T17:59:00"))).toBe("afternoon");
  });
  it("returns evening for 18:00", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T18:00:00"))).toBe("evening");
  });
  it("returns evening for 04:59", () => {
    expect(getGreetingPeriod(new Date("2024-01-01T04:59:00"))).toBe("evening");
  });

  it("formats greeting text correctly", () => {
    expect(getGreetingText("morning", "Budi")).toBe("Good morning, Budi");
    expect(getGreetingText("afternoon", "Siti")).toBe("Good afternoon, Siti");
    expect(getGreetingText("evening", "Ani")).toBe("Good evening, Ani");
    expect(getGreetingText("morning", "")).toBe("Good morning");
  });

  it("formats date time in English", () => {
    const date = new Date("2024-01-15T14:30:45");
    const formatted = formatDateTime(date);
    expect(formatted).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/i);
    expect(formatted).toMatch(/January|February|March|April|May|June|July|August|September|October|November|December/i);
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/14:30:45/);
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
      viewMode: "cards",
      openInNewTab: false,
      openLinksIn: "same-tab",
      confirmBeforeOpen: true,
      animations: "full",
      backgroundEffects: true,
      profilePhoto: "",
      profileName: "",
      schemaVersion: 5,
    },
    quickNotes: "",
    exportedAt: Date.now(),
    schemaVersion: 5,
  };

  it("rejects invalid schema version", () => {
    const badData = { ...validExportData, schemaVersion: 999 };
    const result = importAllData(badData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Schema version not supported");
  });

  it("rejects missing required fields", () => {
    const badData = { ...validExportData, apps: "not-an-array" as unknown as App[] };
    const result = importAllData(badData);
    expect(result.success).toBe(false);
  });

  it("rejects invalid app URL", () => {
    const badData = {
      ...validExportData,
      schemaVersion: 5,
      apps: [{ id: "1", name: "Test", description: "", url: "javascript:alert(1)", icon: "🔗", iconType: "emoji" as const, accentColor: "blue" as AccentColor, category: "media", tags: [], isBuiltIn: false, isHidden: false, isPinned: false, sortOrder: 0, clickCount: 0, lastOpened: null, createdAt: Date.now(), updatedAt: Date.now() }],
    };
    const result = importAllData(badData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid URL");
  });
});