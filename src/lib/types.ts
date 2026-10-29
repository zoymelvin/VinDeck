export type ThemeMode = "light" | "dark" | "system";
export type ViewMode = "cards" | "list" | "compact";
export type AccentColor =
  | "blue"
  | "indigo"
  | "violet"
  | "pink"
  | "rose"
  | "amber"
  | "emerald";

export interface App {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  iconType: "emoji" | "lucide";
  accentColor: AccentColor;
  category: string;
  tags: string[];
  isBuiltIn: boolean;
  isHidden: boolean;
  isPinned: boolean;
  statusEnabled: boolean;
  sortOrder: number;
  clickCount: number;
  lastOpened: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  isBuiltIn: boolean;
  sortOrder: number;
}

export interface UserSettings {
  greetingName: string;
  dashboardTitle: string;
  theme: ThemeMode;
  accentColor: AccentColor;
  viewMode: ViewMode;
  openInNewTab: boolean;
  statusEnabled: boolean;
  schemaVersion: number;
}

export interface ExportData {
  apps: App[];
  categories: Category[];
  settings: UserSettings;
  quickNotes: string;
  exportedAt: number;
  schemaVersion: number;
}

export interface ClickTracking {
  [appId: string]: { count: number; lastOpened: number };
}

export interface LoginAttempt {
  count: number;
  resetAt: number;
}

export interface SessionPayload {
  sub: string;
  iat: number;
  exp: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  greetingName: "Pengguna",
  dashboardTitle: "VinDeck",
  theme: "system",
  accentColor: "blue",
  viewMode: "cards",
  openInNewTab: true,
  statusEnabled: true,
  schemaVersion: 1,
};

export const BUILT_IN_CATEGORIES: Category[] = [
  { id: "media", name: "Media", isBuiltIn: true, sortOrder: 1 },
  { id: "security", name: "Keamanan", isBuiltIn: true, sortOrder: 2 },
  { id: "system", name: "Sistem", isBuiltIn: true, sortOrder: 3 },
  { id: "files", name: "File", isBuiltIn: true, sortOrder: 4 },
];

export const LUCIDE_ICONS = [
  "Monitor",
  "Server",
  "Database",
  "HardDrive",
  "Cpu",
  "MemoryStick",
  "Wifi",
  "Router",
  "Shield",
  "Lock",
  "Key",
  "User",
  "Users",
  "Mail",
  "MessageSquare",
  "Phone",
  "Video",
  "Music",
  "Film",
  "Image",
  "FileText",
  "Folder",
  "Archive",
  "Download",
  "Upload",
  "Cloud",
  "Globe",
  "Link",
  "ExternalLink",
  "Terminal",
  "Code",
  "GitBranch",
  "GitCommit",
  "GitMerge",
  "GitPullRequest",
  "Container",
  "Box",
  "Package",
  "Droplet",
  "Flame",
  "Zap",
  "Battery",
  "Plug",
  "Cpu",
  "Activity",
  "Heart",
  "Stethoscope",
  "Pill",
  "Syringe",
  "Bone",
  "Brain",
  "Dna",
  "Microscope",
  "Telescope",
  "Satellite",
  "Rocket",
  "Anchor",
  "Compass",
  "MapPin",
  "Navigation",
  "Map",
  "Globe",
  "Earth",
  "Sun",
  "Moon",
  "Cloud",
  "CloudRain",
  "CloudSnow",
  "CloudLightning",
  "Wind",
  "Droplets",
  "Umbrella",
  "Thermometer",
  "Gauge",
  "Speedometer",
  "Clock",
  "Calendar",
  "Timer",
  "Stopwatch",
  "AlarmClock",
  "Hourglass",
  "Bell",
  "AlertTriangle",
  "AlertCircle",
  "AlertOctagon",
  "CheckCircle",
  "XCircle",
  "PlusCircle",
  "MinusCircle",
  "HelpCircle",
  "Info",
  "Search",
  "Filter",
  "SortAsc",
  "SortDesc",
  "Grid",
  "List",
  "Layout",
  "Sidebar",
  "Menu",
  "X",
  "ChevronLeft",
  "ChevronRight",
  "ChevronUp",
  "ChevronDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "Settings",
  "Cog",
  "Wrench",
  "Hammer",
  "Screwdriver",
  "Tool",
  "Scissors",
  "Pen",
  "Edit",
  "Trash",
  "Trash2",
  "RotateCcw",
  "RefreshCw",
  "Copy",
  "Clipboard",
  "Save",
  "Download",
  "Upload",
  "Share",
  "Share2",
  "Link",
  "Unlink",
  "Lock",
  "Unlock",
  "Eye",
  "EyeOff",
  "User",
  "UserPlus",
  "UserMinus",
  "UserCheck",
  "UserX",
  "Users",
  "Group",
  "Team",
  "Briefcase",
  "Folder",
  "FolderOpen",
  "FolderPlus",
  "FolderMinus",
  "File",
  "FilePlus",
  "FileMinus",
  "FileText",
  "FileSearch",
  "FileCode",
  "FileImage",
  "FileVideo",
  "FileAudio",
  "FileSpreadsheet",
  "FilePresentation",
  "FilePdf",
  "FileArchive",
  "FileJson",
  "FileCsv",
  "FileXml",
  "FileYaml",
  "FileToml",
  "FileIni",
  "FileLog",
  "FileLock",
  "FileKey",
  "FileSignature",
  "FileBadge",
  "FileWarning",
  "FileQuestion",
  "FileCheck",
  "FileX",
  "FileHeart",
  "FileStar",
  "FileTag",
  "FileUser",
  "FileCog",
  "FileTerminal",
  "FileCode2",
  "FileCode3",
  "FileCode4",
  "FileCode5",
  "FileCode6",
  "FileCode7",
  "FileCode8",
  "FileCode9",
  "FileCode10",
] as const;

export type LucideIconName = (typeof LUCIDE_ICONS)[number];

export const ACCENT_COLORS: { value: AccentColor; label: string; cssVar: string }[] = [
  { value: "blue", label: "Biru", cssVar: "--color-blue-500" },
  { value: "indigo", label: "Indigo", cssVar: "--color-indigo-500" },
  { value: "violet", label: "Violet", cssVar: "--color-violet-500" },
  { value: "pink", label: "Pink", cssVar: "--color-pink-500" },
  { value: "rose", label: "Rose", cssVar: "--color-rose-500" },
  { value: "amber", label: "Amber", cssVar: "--color-amber-500" },
  { value: "emerald", label: "Emerald", cssVar: "--color-emerald-500" },
];