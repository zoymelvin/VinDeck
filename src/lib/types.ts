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
  iconType: "emoji" | "lucide" | "image" | "url";
  iconSrc?: string;
  iconCustomized?: boolean;
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
  viewMode: ViewMode;
  openInNewTab: boolean;
  openLinksIn: "same-tab" | "new-tab";
  statusEnabled: boolean;
  statusCheckInterval: number;
  confirmBeforeOpen: boolean;
  animations: "full" | "reduced";
  backgroundEffects: boolean;
  profilePhoto?: string;
  profileName?: string;
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
  greetingName: "",
  dashboardTitle: "VinDeck",
  theme: "system",
  viewMode: "cards",
  openInNewTab: false,
  openLinksIn: "same-tab",
  statusEnabled: true,
  statusCheckInterval: 60,
  confirmBeforeOpen: true,
  animations: "full",
  backgroundEffects: true,
  profilePhoto: "",
  profileName: "",
  schemaVersion: 3,
};

export const BUILT_IN_CATEGORIES: Category[] = [
  { id: "media", name: "Media", isBuiltIn: true, sortOrder: 1 },
  { id: "security", name: "Security", isBuiltIn: true, sortOrder: 2 },
  { id: "system", name: "System", isBuiltIn: true, sortOrder: 3 },
  { id: "files", name: "Files", isBuiltIn: true, sortOrder: 4 },
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
  "Timer",
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
  "Briefcase",
  "Folder",
  "FolderOpen",
  "FolderPlus",
  "FolderMinus",
  "FilePlus",
  "FileMinus",
  "FileText",
  "FileSearch",
  "FileCode",
  "FileImage",
  "FileVideo",
  "FileAudio",
  "FileSpreadsheet",
  "Presentation",
  "FileArchive",
  "FileJson",
  "FileLock",
  "FileKey",
  "FileSignature",
  "FileBadge",
  "FileWarning",
  "FileQuestion",
  "FileCheck",
  "FileX",
  "FileHeart",
  "FileUser",
  "FileCog",
  "FileTerminal",
] as const;

export type LucideIconName = (typeof LUCIDE_ICONS)[number];

export const ACCENT_COLORS: { value: AccentColor; label: string; cssVar: string }[] = [
  { value: "blue", label: "Blue", cssVar: "--color-blue-500" },
  { value: "indigo", label: "Indigo", cssVar: "--color-indigo-500" },
  { value: "violet", label: "Violet", cssVar: "--color-violet-500" },
  { value: "pink", label: "Pink", cssVar: "--color-pink-500" },
  { value: "rose", label: "Rose", cssVar: "--color-rose-500" },
  { value: "amber", label: "Amber", cssVar: "--color-amber-500" },
  { value: "emerald", label: "Emerald", cssVar: "--color-emerald-500" },
];