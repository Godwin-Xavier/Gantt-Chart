
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X, Calendar, Edit2, ChevronDown, ChevronRight, Settings, Upload, Image as ImageIcon, FileJson, FileType, DollarSign, Sparkles, BookOpenCheck, BarChart3, FolderPlus, LogIn, Mail, Trash2, Cloud, Bell, BellRing, Clock } from 'lucide-react';
import DashboardView from './DashboardView';

const APP_STORAGE_KEY = 'gantt-chart:workspace:v3';
const LEGACY_APP_STORAGE_KEY = 'gantt-chart:workspace:v2';
const INTRO_BANNER_KEY = 'gantt-chart:intro-banner-seen:v2';
const TUTORIAL_DONE_KEY = 'gantt-chart:tutorial-done:v2';
const REMINDERS_STORAGE_KEY = 'gantt-chart:reminders:v1';
const DISMISSED_AUTO_ALERTS_KEY = 'gantt-chart:dismissed-auto-alerts:v1';
const REMINDER_NOTIFICATION_PREFS_KEY = 'gantt-chart:reminder-notification-prefs:v1';
const CLOUD_AUTH_ENABLED = import.meta.env.VITE_ENABLE_CLOUD_AUTH !== 'false';
const DEFAULT_PAGE_TITLE = 'Project Tracker | Gantt Planner';
const MANUAL_REMINDER_MATCH_WINDOW_MS = 90 * 1000;
const NOTIFICATION_DEDUPE_WINDOW_MS = 90 * 1000;
const NOTIFICATION_RETENTION_MS = 12 * 60 * 60 * 1000;
const MAX_ACTIVE_NOTIFICATIONS = 40;
const WELCOME_PREVIEW_INTERVAL_MS = 3400;

const STATUS_IN_PROGRESS = 'in_progress';
const STATUS_COMPLETED = 'completed';

const STATUS_OPTIONS = [
  { value: STATUS_IN_PROGRESS, label: 'In Progress' },
  { value: STATUS_COMPLETED, label: 'Completed' }
];

const TUTORIAL_TARGET_PANEL_MAP = {
  commandCenter: 'workspace',
  projectSwitcher: 'workspace',
  addProjectButton: 'workspace',
  deleteProjectButton: 'workspace',
  viewSwitch: 'utility',
  signInButton: 'utility',
  reminderBell: 'utility',
  signInPanel: 'utility',
  import: 'action',
  addTask: 'action',
  modifyMenu: 'action',
  settingsButton: 'action',
  companyUpload: 'action',
  holidayDate: 'action'
};

const TUTORIAL_TARGET_LABELS = {
  title: 'Project Title',
  commandCenter: 'Command Center',
  projectSwitcher: 'Project Selector',
  addProjectButton: 'Add Project',
  deleteProjectButton: 'Delete Project',
  viewSwitch: 'Planner Button',
  signInButton: 'Sign In (Optional)',
  reminderBell: 'Reminder Center',
  signInPanel: 'Cloud Sync Panel',
  import: 'Import',
  addTask: 'Add Task',
  statusColumn: 'Status Controls',
  modifyMenu: 'Modify Graph',
  settingsButton: 'Settings and Branding',
  companyUpload: 'Company Logo Upload',
  holidayDate: 'Holiday Date Picker',
  taskEditor: 'Tasks Editor',
  timeline: 'Timeline Chart',
  dashboardButton: 'Dashboard Button',
  dashboardPanel: 'Portfolio Dashboard',
  dashboardDownload: 'Download Snapshot'
};

const TUTORIAL_TARGET_ACTIONS = {
  title: 'Click the title text, type a new name, then press Enter.',
  commandCenter: 'Use these grouped controls to switch workspace, navigation, and planner actions.',
  projectSwitcher: 'Open the selector and choose a different project.',
  addProjectButton: 'Click Add Project to create a separate workspace timeline.',
  deleteProjectButton: 'Click Delete Project to remove the active project after confirmation.',
  viewSwitch: 'Click Planner to return to editing mode.',
  signInButton: 'Click Sign In (Optional) only if you need cloud sync.',
  reminderBell: 'Click the bell to open upcoming reminders and recent alerts.',
  signInPanel: 'Use Continue with Gmail for cloud sync or close to stay local.',
  import: 'Click Import and select a JSON export to restore data.',
  addTask: 'Click Add Task to create a new phase in the planner.',
  statusColumn: 'Change any row status between In Progress and Completed.',
  modifyMenu: 'Open Modify Graph to toggle view options and export formats.',
  settingsButton: 'Open Settings and Branding to manage logos and holidays.',
  companyUpload: 'Upload your company logo for branded exports.',
  holidayDate: 'Pick a date and add it as a holiday for business-day calculations.',
  taskEditor: 'Edit task names, dates, duration, colors, cost, and reminders here.',
  timeline: 'Review timeline bars to confirm plan timing and completion.',
  dashboardButton: 'Switch to Dashboard mode for portfolio-level tracking.',
  dashboardPanel: 'Expand projects and use filters to inspect progress.',
  dashboardDownload: 'Click Download Snapshot to export one share-ready dashboard image.'
};

const DEFAULT_TASK_BLUEPRINT = [
  {
    id: 1,
    name: 'Planning Phase',
    color: '#6366f1',
    cost: 1500,
    durationDays: 7,
    subTasks: [
      {
        id: 101,
        name: 'Requirements Gathering',
        color: '#818cf8',
        cost: 0,
        durationDays: 2
      },
      {
        id: 102,
        name: 'BRD Preparation',
        color: '#ec4899',
        cost: 0,
        durationDays: 4
      },
      {
        id: 103,
        name: 'BRD Signoff',
        color: '#3b82f6',
        cost: 0,
        durationDays: 1
      }
    ]
  },
  {
    id: 2,
    name: 'Development',
    color: '#8b5cf6',
    cost: 5000,
    durationDays: 21,
    subTasks: [
      {
        id: 201,
        name: 'Modules and fields configuration',
        color: '#22d3ee',
        cost: 0,
        durationDays: 4
      },
      {
        id: 202,
        name: 'Masters Set up',
        color: '#22c55e',
        cost: 0,
        durationDays: 4
      },
      {
        id: 203,
        name: 'Blueprints and automation configuration',
        color: '#84cc16',
        cost: 0,
        durationDays: 5
      },
      {
        id: 204,
        name: 'Notifications and SLA\'s',
        color: '#d9f99d',
        cost: 0,
        durationDays: 3
      },
      {
        id: 205,
        name: 'Reports & Dashboards',
        color: '#3b82f6',
        cost: 0,
        durationDays: 5
      }
    ]
  },
  {
    id: 3,
    name: 'Testing',
    color: '#ec4899',
    cost: 2000,
    durationDays: 2,
    subTasks: [
      {
        id: 301,
        name: 'Code Review',
        color: '#fda4af',
        cost: 0,
        durationDays: 1
      },
      {
        id: 302,
        name: 'Internal Testing and DEMO',
        color: '#fdba74',
        cost: 0,
        durationDays: 1
      }
    ]
  },
  {
    id: 4,
    name: 'UAT',
    color: '#6366f1',
    cost: 500,
    durationDays: 2,
    subTasks: []
  },
  {
    id: 5,
    name: 'GO-LIVE',
    color: '#4338ca',
    cost: 500,
    durationDays: 1,
    subTasks: []
  },
  {
    id: 6,
    name: 'Hyper Care Support',
    color: '#06b6d4',
    cost: 500,
    durationDays: 2,
    subTasks: []
  }
];

const readStorageFlag = (key) => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(key) === '1';
  } catch (error) {
    console.warn(`Failed to read storage key: ${key}`, error);
    return false;
  }
};

const writeStorageFlag = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value ? '1' : '0');
  } catch (error) {
    console.warn(`Failed to write storage key: ${key}`, error);
  }
};

const normalizeStatus = (value) => (value === STATUS_COMPLETED ? STATUS_COMPLETED : STATUS_IN_PROGRESS);

const areAllSubTasksCompleted = (subTasks = []) => (
  subTasks.length > 0 && subTasks.every((subTask) => normalizeStatus(subTask.status) === STATUS_COMPLETED)
);

const normalizeTaskTree = (tasks = []) => {
  if (!Array.isArray(tasks)) return [];

  return tasks.map((task) => {
    const normalizedSubTasks = Array.isArray(task.subTasks)
      ? task.subTasks.map((subTask) => ({
        ...subTask,
        status: normalizeStatus(subTask.status)
      }))
      : [];

    const normalizedTaskStatus = normalizedSubTasks.length > 0
      ? (areAllSubTasksCompleted(normalizedSubTasks) ? STATUS_COMPLETED : STATUS_IN_PROGRESS)
      : normalizeStatus(task.status);

    return {
      ...task,
      status: normalizedTaskStatus,
      subTasks: normalizedSubTasks
    };
  });
};

const getTaskCompletionStatus = (task) => {
  if (!task) return STATUS_IN_PROGRESS;
  if (Array.isArray(task.subTasks) && task.subTasks.length > 0) {
    return areAllSubTasksCompleted(task.subTasks) ? STATUS_COMPLETED : STATUS_IN_PROGRESS;
  }
  return normalizeStatus(task.status);
};

const getReminderTimestamp = (dateValue, timeValue) => {
  if (typeof dateValue !== 'string' || typeof timeValue !== 'string') return Number.NaN;
  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  return parsed.getTime();
};

export default function GanttChart() {
  // Robust date helpers using Local Noon to avoid timezone/DST issues
  const getDateAtNoon = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getBusinessDays = (start, end, holidays = []) => {
    if (!start || !end) return 0;

    const curDate = getDateAtNoon(start);
    const endDate = getDateAtNoon(end);
    let count = 0;

    // Safety break for infinite loops if dates are way off
    let safety = 0;
    while (curDate <= endDate && safety < 3650) {
      const dayOfWeek = curDate.getDay();
      const dateString = formatDate(curDate);

      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateString)) {
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
      safety++;
    }
    return count;
  };

  const addBusinessDays = (startDateStr, days, holidays = []) => {
    if (!startDateStr) return startDateStr;
    // Standard Gantt: min 1 day duration. If 0 or less, arguably return start date.
    if (days <= 0) return startDateStr;

    let curDate = getDateAtNoon(startDateStr);
    let remaining = days;

    const isBusinessDay = (d) => {
      const day = d.getDay();
      const str = formatDate(d);
      return day !== 0 && day !== 6 && !holidays.includes(str);
    };

    // If start date is a business day, it counts as 1.
    if (isBusinessDay(curDate)) {
      remaining--;
    }

    let safety = 0;
    while (remaining > 0 && safety < 3650) {
      curDate.setDate(curDate.getDate() + 1);
      if (isBusinessDay(curDate)) {
        remaining--;
      }
      safety++;
    }

    return formatDate(curDate);
  };

  const addCalendarDays = (startDateStr, days) => {
    const date = getDateAtNoon(startDateStr);
    date.setDate(date.getDate() + days);
    return formatDate(date);
  };

  const isValidDateString = (value) => {
    if (typeof value !== 'string') return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = getDateAtNoon(value);
    return !Number.isNaN(date.getTime());
  };

  const getLoginDateString = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return formatDate(today);
  };

  const buildDefaultTasks = (loginDateStr = getLoginDateString()) => {
    let taskStartCursor = loginDateStr;

    return DEFAULT_TASK_BLUEPRINT.map((task) => {
      const startDate = taskStartCursor;
      const endDate = addBusinessDays(startDate, task.durationDays, []);

      let subTaskStartCursor = startDate;
      const builtSubTasks = task.subTasks.map((subTask) => {
        const subStartDate = subTaskStartCursor;
        const subEndDate = addBusinessDays(subStartDate, subTask.durationDays, []);
        subTaskStartCursor = addCalendarDays(subEndDate, 1);

        return {
          id: subTask.id,
          name: subTask.name,
          startDate: subStartDate,
          endDate: subEndDate,
          color: subTask.color,
          cost: subTask.cost,
          status: STATUS_IN_PROGRESS
        };
      });

      taskStartCursor = addCalendarDays(endDate, 1);

      return {
        id: task.id,
        name: task.name,
        startDate,
        endDate,
        color: task.color,
        cost: task.cost,
        status: STATUS_IN_PROGRESS,
        expanded: true,
        subTasks: builtSubTasks
      };
    });
  };



  // Internal ResizableImage Component
  const ResizableImage = ({ src, initialWidth, onResize, alt }) => {
    const [width, setWidth] = useState(initialWidth || 150);
    const [isResizing, setIsResizing] = useState(false);

    // Use refs for values needed inside event listeners to avoid stale closures
    const activeHandleRef = useRef(null);
    const activePointerIdRef = useRef(null);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const startWidthRef = useRef(0);
    const isResizingRef = useRef(false);
    const widthRef = useRef(width);

    useEffect(() => {
      if (initialWidth) setWidth(initialWidth);
    }, [initialWidth]);

    useEffect(() => {
      widthRef.current = width;
    }, [width]);

    const handlePointerDown = (e, handle) => {
      e.stopPropagation();
      e.preventDefault();

      setIsResizing(true);
      isResizingRef.current = true;
      activePointerIdRef.current = e.pointerId;
      activeHandleRef.current = handle;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      startWidthRef.current = width;

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);
    };

    const handlePointerMove = (e) => {
      if (!isResizingRef.current || !activeHandleRef.current) return;
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;
      let change = 0;

      const handle = activeHandleRef.current;

      // Calculate change based on handle direction (diagonal logic)
      if (handle === 'se') {
        change = dx + dy;
      } else if (handle === 'sw') {
        change = -dx + dy;
      } else if (handle === 'ne') {
        change = dx - dy;
      } else if (handle === 'nw') {
        change = -dx - dy;
      }

      const newWidth = Math.max(50, Math.min(800, startWidthRef.current + (change * 0.7)));
      setWidth(newWidth);
    };

    const handlePointerUp = (e) => {
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

      setIsResizing(false);
      isResizingRef.current = false;
      activeHandleRef.current = null;
      activePointerIdRef.current = null;

      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);

      if (onResize) onResize(widthRef.current);
    };

    const handleStyle = {
      position: 'absolute',
      width: '12px',
      height: '12px',
      background: 'rgba(99, 102, 241, 0.8)',
      zIndex: 20,
      borderRadius: '50%',
      border: '1px solid white'
    };

    return (
      <div style={{ position: 'relative', display: 'inline-block', width: width, zIndex: 10, lineHeight: 0 }}>
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none' }}
        />

        {/* Handles */}
        <div
          data-html2canvas-ignore="true"
          onPointerDown={(e) => handlePointerDown(e, 'nw')}
          style={{ ...handleStyle, top: -6, left: -6, cursor: 'nw-resize', touchAction: 'none' }}
          title="Resize"
        />
        <div
          data-html2canvas-ignore="true"
          onPointerDown={(e) => handlePointerDown(e, 'ne')}
          style={{ ...handleStyle, top: -6, right: -6, cursor: 'ne-resize', touchAction: 'none' }}
          title="Resize"
        />
        <div
          data-html2canvas-ignore="true"
          onPointerDown={(e) => handlePointerDown(e, 'sw')}
          style={{ ...handleStyle, bottom: -6, left: -6, cursor: 'sw-resize', touchAction: 'none' }}
          title="Resize"
        />
        <div
          data-html2canvas-ignore="true"
          onPointerDown={(e) => handlePointerDown(e, 'se')}
          style={{ ...handleStyle, bottom: -6, right: -6, cursor: 'se-resize', touchAction: 'none' }}
          title="Resize"
        />

        {isResizing && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            border: '1px dashed rgba(99, 102, 241, 0.5)',
            pointerEvents: 'none'
          }} />
        )}
      </div>
    );
  };


  const DEFAULT_PALETTE = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#84cc16', // Lime
    '#3b82f6', // Blue
    '#f97316'  // Orange
  ];

  const hexToRgb = (hex) => {
    if (typeof hex !== 'string') return null;
    let h = hex.trim();
    if (h.startsWith('#')) h = h.slice(1);
    if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
    if (h.length !== 6) return null;
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return null;
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255
    };
  };

  const relativeLuminance = ({ r, g, b }) => {
    const toLinear = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const R = toLinear(r);
    const G = toLinear(g);
    const B = toLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };

  const getDurationBadgeStyle = (barColor, size = 'main') => {
    const rgb = hexToRgb(barColor) || { r: 99, g: 102, b: 241 };
    const lum = relativeLuminance(rgb);
    const isDark = lum < 0.5;

    // Keep duration labels visually consistent across all bars.
    const textColor = 'rgba(15, 23, 42, 0.92)';
    const textShadow = '0 1px 0 rgba(255, 255, 255, 0.32), 0 1px 2px rgba(15, 23, 42, 0.10)';

    // For darker bars, increase the light layer so the ash text stays readable.
    const tintTop = 0.16;
    const tintBottom = 0.08;
    const highlightTop = isDark ? 0.46 : 0.30;
    const highlightBottom = isDark ? 0.18 : 0.12;

    const background = `linear-gradient(180deg, rgba(255, 255, 255, ${highlightTop}) 0%, rgba(255, 255, 255, ${highlightBottom}) 100%), linear-gradient(180deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${tintTop}) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${tintBottom}) 100%)`;

    const border = isDark
      ? `1px solid rgba(255, 255, 255, 0.36)`
      : `1px solid rgba(255, 255, 255, 0.55)`;

    const boxShadow = isDark
      ? `0 1px 0 rgba(255, 255, 255, 0.10) inset, 0 0 0 1px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.14) inset, 0 10px 20px rgba(15, 23, 42, 0.10)`
      : `0 1px 0 rgba(255, 255, 255, 0.28) inset, 0 0 0 1px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.10) inset, 0 10px 20px rgba(15, 23, 42, 0.08)`;

    const isSub = size === 'sub';

    return {
      color: textColor,
      fontSize: isSub ? '0.75rem' : '0.8rem',
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: '800',
      background,
      padding: isSub ? '0.22rem 0.5rem' : '0.3rem 0.6rem',
      borderRadius: isSub ? '6px' : '8px',
      textShadow,
      backdropFilter: 'blur(10px) saturate(1.2) brightness(1.06)',
      WebkitBackdropFilter: 'blur(10px) saturate(1.2) brightness(1.06)',
      border,
      boxShadow,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 2
    };
  };

  const loginDateSeed = useMemo(() => getLoginDateString(), []);

  const getRouteFromPath = () => {
    if (typeof window === 'undefined') return 'planner';
    const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
    return normalizedPath === '/dashboard' ? 'dashboard' : 'planner';
  };

  const navigateToView = (nextView) => {
    if (typeof window === 'undefined') return;
    const nextPath = nextView === 'dashboard' ? '/dashboard' : '/';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setCurrentView(nextView);
  };

  const createProjectId = () => `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const createProjectName = (existingProjects) => {
    const used = new Set((existingProjects || []).map((project) => project.projectTitle));
    let index = 1;
    while (used.has(`Project ${index}`)) {
      index += 1;
    }
    return `Project ${index}`;
  };

  const createProjectRecord = (overrides = {}) => {
    const projectLoginSeed = typeof overrides.loginDateSeed === 'string' ? overrides.loginDateSeed : loginDateSeed;
    const fallbackTasks = normalizeTaskTree(buildDefaultTasks(projectLoginSeed));
    const nextTasks = Array.isArray(overrides.tasks)
      ? normalizeTaskTree(overrides.tasks)
      : fallbackTasks;

    return {
      id: typeof overrides.id === 'string' && overrides.id.length > 0 ? overrides.id : createProjectId(),
      projectTitle: typeof overrides.projectTitle === 'string' && overrides.projectTitle.trim().length > 0
        ? overrides.projectTitle
        : 'My Project Timeline',
      tasks: nextTasks,
      holidays: Array.isArray(overrides.holidays) ? overrides.holidays : [],
      customerLogo: typeof overrides.customerLogo === 'string' || overrides.customerLogo === null ? overrides.customerLogo : null,
      customerLogoWidth: typeof overrides.customerLogoWidth === 'number' ? overrides.customerLogoWidth : 150,
      companyLogo: typeof overrides.companyLogo === 'string' || overrides.companyLogo === null ? overrides.companyLogo : null,
      companyLogoWidth: typeof overrides.companyLogoWidth === 'number' ? overrides.companyLogoWidth : 150,
      showDates: typeof overrides.showDates === 'boolean' ? overrides.showDates : true,
      showQuarters: typeof overrides.showQuarters === 'boolean' ? overrides.showQuarters : false,
      showCost: typeof overrides.showCost === 'boolean' ? overrides.showCost : false,
      showTotals: typeof overrides.showTotals === 'boolean' ? overrides.showTotals : true,
      currency: typeof overrides.currency === 'string' && overrides.currency.length > 0 ? overrides.currency : '$',
      loginDateSeed: projectLoginSeed,
      updatedAt: typeof overrides.updatedAt === 'string' ? overrides.updatedAt : new Date().toISOString()
    };
  };

  const [projectTitle, setProjectTitle] = useState('My Project Timeline');
  const [currentView, setCurrentView] = useState(() => getRouteFromPath());
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDates, setShowDates] = useState(true);
  const [showQuarters, setShowQuarters] = useState(false);
  const [showCost, setShowCost] = useState(false);
  const [showTotals, setShowTotals] = useState(true);
  const [currency, setCurrency] = useState('$');
  const [showHolidayManager, setShowHolidayManager] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [customerLogo, setCustomerLogo] = useState(null);
  const [customerLogoWidth, setCustomerLogoWidth] = useState(150);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [companyLogoWidth, setCompanyLogoWidth] = useState(150);
  const [showModifyMenu, setShowModifyMenu] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState('');
  const [authSession, setAuthSession] = useState({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    providers: {
      google: false,
      github: false
    }
  });
  const [cloudSyncState, setCloudSyncState] = useState({
    isSaving: false,
    lastSyncedAt: null,
    error: ''
  });
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => !readStorageFlag(INTRO_BANNER_KEY));
  const [welcomePreviewIndex, setWelcomePreviewIndex] = useState(0);
  const [isWelcomePreviewPlaying, setIsWelcomePreviewPlaying] = useState(true);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialFocusRect, setTutorialFocusRect] = useState(null);
  const [isCompactLayout, setIsCompactLayout] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 1024;
  });
  const [isPhoneLayout, setIsPhoneLayout] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 760;
  });
  const [tasks, setTasks] = useState(() => normalizeTaskTree(buildDefaultTasks(loginDateSeed)));

  // --- Reminder & Notification State ---
  const [reminders, setReminders] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(REMINDERS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [dismissedAutoAlerts, setDismissedAutoAlerts] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(DISMISSED_AUTO_ALERTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [reminderNotificationPrefs, setReminderNotificationPrefs] = useState(() => {
    const defaults = {
      soundEnabled: true,
      tabTitleFlashEnabled: true
    };

    if (typeof window === 'undefined') return defaults;

    try {
      const raw = window.localStorage.getItem(REMINDER_NOTIFICATION_PREFS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== 'object') return defaults;

      return {
        soundEnabled: parsed.soundEnabled !== false,
        tabTitleFlashEnabled: parsed.tabTitleFlashEnabled !== false
      };
    } catch {
      return defaults;
    }
  });
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [tabAttentionNotifications, setTabAttentionNotifications] = useState([]);
  const [showTabAttentionBanner, setShowTabAttentionBanner] = useState(false);
  const [isDocumentHidden, setIsDocumentHidden] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.visibilityState === 'hidden';
  });
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTarget, setReminderTarget] = useState(null);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderNote, setReminderNote] = useState('');
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [activeControlPanel, setActiveControlPanel] = useState('action');
  const notificationPanelRef = useRef(null);
  const reminderBellRef = useRef(null);
  const defaultDocumentTitleRef = useRef(DEFAULT_PAGE_TITLE);
  const tabAttentionTitleIntervalRef = useRef(null);
  const reminderSoundContextRef = useRef(null);
  const lastReminderSoundAtRef = useRef(0);
  const notificationKeyLedgerRef = useRef({});
  const toastDismissTimersRef = useRef({});
  const fileInputRef = useRef(null);
  const chartRef = useRef(null);
  const commandCenterRef = useRef(null);
  const modifyMenuRef = useRef(null);
  const titleRef = useRef(null);
  const signInButtonRef = useRef(null);
  const signInPanelRef = useRef(null);
  const projectSwitcherRef = useRef(null);
  const addProjectButtonRef = useRef(null);
  const deleteProjectButtonRef = useRef(null);
  const viewSwitchRef = useRef(null);
  const dashboardButtonRef = useRef(null);
  const dashboardDownloadButtonRef = useRef(null);
  const importButtonRef = useRef(null);
  const modifyButtonRef = useRef(null);
  const addTaskButtonRef = useRef(null);
  const settingsButtonRef = useRef(null);
  const companyUploadRef = useRef(null);
  const holidayDateRef = useRef(null);
  const statusColumnRef = useRef(null);
  const dashboardPanelRef = useRef(null);
  const taskEditorRef = useRef(null);
  const timelineChartRef = useRef(null);
  const settingsPanelRef = useRef(null);
  const scriptLoaderRef = useRef({});
  const lastHydratedProjectIdRef = useRef(null);
  const isHydratingProjectRef = useRef(false);
  const cloudRevisionRef = useRef(null);
  const cloudReadyRef = useRef(false);
  const skipCloudSaveRef = useRef(false);
  const cloudPollInFlightRef = useRef(false);

  useEffect(() => {
    if (!showHolidayManager) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowHolidayManager(false);
    };

    document.addEventListener('keydown', onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showHolidayManager]);

  useEffect(() => {
    if (!showModifyMenu) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowModifyMenu(false);
    };

    const onDocumentClick = (e) => {
      const el = modifyMenuRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setShowModifyMenu(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onDocumentClick);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onDocumentClick);
    };
  }, [showModifyMenu]);

  useEffect(() => {
    if (!showSignInPrompt) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowSignInPrompt(false);
    };

    document.addEventListener('keydown', onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showSignInPrompt]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onResize = () => {
      setIsCompactLayout(window.innerWidth <= 1024);
      setIsPhoneLayout(window.innerWidth <= 760);
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (activeControlPanel !== 'workspace' && activeControlPanel !== 'utility' && activeControlPanel !== 'action') {
      setActiveControlPanel('workspace');
      return;
    }

    if (activeControlPanel !== 'utility' && showNotificationPanel) {
      setShowNotificationPanel(false);
    }

    if (activeControlPanel !== 'action' && showModifyMenu) {
      setShowModifyMenu(false);
    }
  }, [activeControlPanel, showModifyMenu, showNotificationPanel]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onPopState = () => {
      setCurrentView(getRouteFromPath());
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Auto-scroll to bottom when a new task is added
  useEffect(() => {
    if (taskEditorRef.current) {
      const scrollContainer = taskEditorRef.current.querySelector('.task-editor-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [tasks.length]);

  const welcomePreviewFrames = useMemo(() => {
    const actionWord = isPhoneLayout ? 'Tap' : 'Click';

    return [
      {
        id: 'command-center',
        title: 'Command center controls',
        body: 'Workspace, navigation, and planner actions stay grouped and consistent across layouts.',
        cue: `${actionWord} Guide anytime to replay onboarding.`,
        icon: <Settings size={14} />,
        tone: 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)',
        border: '#bfdbfe',
        bullets: ['Workspace selector', 'Navigation + Sync panel', 'Planner actions card']
      },
      {
        id: 'projects',
        title: 'Multi-project workflow',
        body: 'Create, switch, and safely delete projects while keeping one active workspace available.',
        cue: `${actionWord} Add Project to start another timeline.`,
        icon: <FolderPlus size={14} />,
        tone: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)',
        border: '#c7d2fe',
        bullets: ['Project dropdown', 'Add Project', 'Delete with confirmation']
      },
      {
        id: 'reminders',
        title: 'Reminder center',
        body: 'Set reminders from task rows, monitor due alerts, and manage sound and tab-flash preferences with enterprise-grade toggle controls.',
        cue: `${actionWord} the bell to open the Reminder Center panel.`,
        icon: <Bell size={14} />,
        tone: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
        border: '#a5f3fc',
        bullets: ['Upcoming & due-today stats', 'Toggle sound & tab-flash', 'Manual + auto alert feed']
      },
      {
        id: 'planner',
        title: 'Planner editing and import',
        body: 'Import JSON plans, update status and durations, and keep task/sub-task timelines in sync.',
        cue: `${actionWord} Import or Add Task in planner actions.`,
        icon: <Upload size={14} />,
        tone: 'linear-gradient(135deg, #dcfce7 0%, #ecfccb 100%)',
        border: '#bbf7d0',
        bullets: ['Status controls', 'Business-day durations', 'Inline reminder badges']
      },
      {
        id: 'settings-branding',
        title: 'Branding and holidays',
        body: 'Upload customer and company logos, then add holidays used in business-day calculations.',
        cue: `${actionWord} Settings and Branding to open the drawer.`,
        icon: <Calendar size={14} />,
        tone: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)',
        border: '#fde68a',
        bullets: ['Logo uploads', 'Holiday manager', 'Export-ready header visuals']
      },
      {
        id: 'dashboard',
        title: 'Dashboard and snapshot sharing',
        body: 'Track portfolio completion, filter tasks, expand project cards, and download one snapshot image.',
        cue: `${actionWord} Dashboard, then Download Snapshot.`,
        icon: <BarChart3 size={14} />,
        tone: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        border: '#93c5fd',
        bullets: ['Portfolio progress cards', 'All / Completed / Pending filters', 'Share-ready dashboard snapshot']
      }
    ];
  }, [isPhoneLayout]);

  const tutorialSteps = useMemo(() => {
    const actionWord = isPhoneLayout ? 'Tap' : 'Click';

    return [
      {
        id: 'title',
        title: 'Name your project',
        body: `${actionWord} the title in the command center header to rename the active project. This name is used in planner, dashboard, and exports.`,
        target: 'title',
        panel: null,
        view: 'planner'
      },
      {
        id: 'top-command-center',
        title: 'Use the command center',
        body: 'This full area is your control hub. It groups workspace switching, navigation, reminders, and planner actions in one place.',
        target: 'commandCenter',
        panel: null,
        view: 'planner'
      },
      {
        id: 'project-switcher',
        title: 'Switch between projects',
        body: `${actionWord} the project selector to move between projects instantly. Each project keeps its own tasks, subtasks, status, and settings.`,
        target: 'projectSwitcher',
        panel: null,
        view: 'planner'
      },
      {
        id: 'add-project',
        title: 'Create another project',
        body: `${actionWord} Add Project to create a new workspace with its own plan and timeline.`,
        target: 'addProjectButton',
        panel: null,
        view: 'planner'
      },
      {
        id: 'delete-project',
        title: 'Delete a project safely',
        body: `${actionWord} Delete Project when you want to remove the selected project. The app asks for confirmation and protects your workspace by keeping at least one starter project.`,
        target: 'deleteProjectButton',
        panel: null,
        view: 'planner'
      },
      {
        id: 'view-switch',
        title: 'Switch views without layout jump',
        body: `${actionWord} Planner in Navigation + Sync to jump back into editing. Dashboard has its own dedicated button in the left command area for clearer mode control.`,
        target: 'viewSwitch',
        panel: null,
        view: 'planner'
      },
      {
        id: 'optional-signin',
        title: 'Optional cloud sign-in',
        body: `${actionWord} Sign In (Optional) only when you want cloud sync across devices. If you skip sign-in, local auto-save still keeps your plan on this device.`,
        target: 'signInButton',
        panel: null,
        view: 'planner'
      },
      {
        id: 'reminder-center',
        title: 'Use reminder center',
        body: `${actionWord} the bell button to review pending reminders and due alerts. Then use Set Reminder on any task or sub-task to schedule follow-ups.`,
        target: 'reminderBell',
        panel: null,
        view: 'planner'
      },
      {
        id: 'signin-providers',
        title: 'Connect Gmail when needed',
        body: 'This step is optional. Use Gmail sign-in only if you want one synced source of truth across devices.',
        target: 'signInPanel',
        panel: 'signin',
        view: 'planner'
      },
      {
        id: 'import',
        title: 'Import an existing plan',
        body: `${actionWord} Import to load a previously exported JSON file and continue where you left off.`,
        target: 'import',
        panel: null,
        view: 'planner'
      },
      {
        id: 'add-task',
        title: 'Add task phases',
        body: `${actionWord} Add Task to create major phases. Each phase can hold multiple subtasks with their own dates and status.`,
        target: 'addTask',
        panel: null,
        view: 'planner'
      },
      {
        id: 'status-controls',
        title: 'Update task and subtask status',
        body: 'Use Status selectors to mark work as In Progress or Completed. On phones, status is also easy to update from compact cards and timeline rows.',
        target: 'statusColumn',
        panel: null,
        view: 'planner'
      },
      {
        id: 'modify-menu',
        title: 'Modify graph and export',
        body: `${actionWord} Modify Graph to control dates, quarters, totals, cost view, and planner export formats.`,
        target: 'modifyMenu',
        panel: 'modify',
        view: 'planner'
      },
      {
        id: 'settings-button',
        title: 'Open settings and branding',
        body: `${actionWord} this settings button to manage logos and holiday calendars used in your business-day calculations and exports.`,
        target: 'settingsButton',
        panel: null,
        view: 'planner'
      },
      {
        id: 'company-logo',
        title: 'Upload your company logo',
        body: `${actionWord} the company logo uploader so exported visuals look branded and professional.`,
        target: 'companyUpload',
        panel: 'settings',
        view: 'planner'
      },
      {
        id: 'holiday-date',
        title: 'Set holidays for business days',
        body: `${actionWord} holiday dates to exclude non-working days from duration totals and planning calculations.`,
        target: 'holidayDate',
        panel: 'settings',
        view: 'planner'
      },
      {
        id: 'editor',
        title: 'Edit dates and duration',
        body: 'In the Tasks area, update names, durations, dates, status, colors, and optional costs with auto-save always on. Desktop shows full rows while phones auto-group fields for easy tapping.',
        target: 'taskEditor',
        panel: null,
        view: 'planner'
      },
      {
        id: 'timeline',
        title: 'Read the timeline',
        body: 'The timeline updates instantly as you edit. Completed tasks and subtasks are visually muted and struck through for clear progress tracking.',
        target: 'timeline',
        panel: null,
        view: 'planner'
      },
      {
        id: 'dashboard-action-state',
        title: 'Dashboard keeps controls consistent',
        body: 'Dashboard uses a dedicated button in the left command area across devices. When Dashboard is active, planner action buttons remain visible in their card but become disabled so mode changes are clear.',
        target: 'dashboardButton',
        panel: null,
        view: 'dashboard'
      },
      {
        id: 'dashboard-overview',
        title: 'Track cross-project completion',
        body: 'Dashboard combines every project into one completion view with overall metrics, filters, and expandable project breakdowns.',
        target: 'dashboardPanel',
        panel: null,
        view: 'dashboard'
      },
      {
        id: 'dashboard-download',
        title: 'Download one share-ready image',
        body: `${actionWord} Download Snapshot to export a single image that includes projects, tasks, subtasks, and statuses for quick sharing.`,
        target: 'dashboardDownload',
        panel: null,
        view: 'dashboard'
      }
    ];
  }, [isPhoneLayout]);

  const activeTutorialStep = isTutorialActive ? tutorialSteps[tutorialStepIndex] : null;
  const activeTutorialTarget = activeTutorialStep?.target || null;
  const activeWelcomePreview = welcomePreviewFrames[welcomePreviewIndex] || welcomePreviewFrames[0];

  const goToNextWelcomePreview = () => {
    if (welcomePreviewFrames.length === 0) return;
    setWelcomePreviewIndex((prev) => (prev + 1) % welcomePreviewFrames.length);
  };

  const goToPreviousWelcomePreview = () => {
    if (welcomePreviewFrames.length === 0) return;
    setWelcomePreviewIndex((prev) => (prev - 1 + welcomePreviewFrames.length) % welcomePreviewFrames.length);
  };

  useEffect(() => {
    if (!showWelcomeBanner) return;
    setWelcomePreviewIndex(0);
    setIsWelcomePreviewPlaying(true);
  }, [showWelcomeBanner]);

  useEffect(() => {
    if (!showWelcomeBanner || !isWelcomePreviewPlaying) return;
    if (welcomePreviewFrames.length <= 1) return;
    if (typeof window === 'undefined') return;

    const intervalId = window.setInterval(() => {
      setWelcomePreviewIndex((prev) => (prev + 1) % welcomePreviewFrames.length);
    }, WELCOME_PREVIEW_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [showWelcomeBanner, isWelcomePreviewPlaying, welcomePreviewFrames.length]);

  const markIntroSeen = () => {
    writeStorageFlag(INTRO_BANNER_KEY, true);
  };

  const markTutorialDone = () => {
    writeStorageFlag(TUTORIAL_DONE_KEY, true);
  };

  const startTutorial = () => {
    navigateToView('planner');
    setShowWelcomeBanner(false);
    markIntroSeen();
    setActiveControlPanel('workspace');
    setShowSignInPrompt(false);
    setShowNotificationPanel(false);
    setShowHolidayManager(false);
    setShowModifyMenu(false);
    setTutorialStepIndex(0);
    setIsTutorialActive(true);
  };

  const openGuideIntro = () => {
    navigateToView('planner');
    setIsTutorialActive(false);
    setShowSignInPrompt(false);
    setShowNotificationPanel(false);
    setShowModifyMenu(false);
    setShowHolidayManager(false);
    setShowWelcomeBanner(true);
  };

  const skipTutorial = () => {
    setShowWelcomeBanner(false);
    setShowSignInPrompt(false);
    setShowNotificationPanel(false);
    setShowHolidayManager(false);
    setShowModifyMenu(false);
    setIsTutorialActive(false);
    markIntroSeen();
  };

  const completeTutorial = () => {
    setIsTutorialActive(false);
    setShowSignInPrompt(false);
    setShowNotificationPanel(false);
    setShowModifyMenu(false);
    setShowHolidayManager(false);
    markIntroSeen();
    markTutorialDone();
  };

  const goToNextTutorialStep = () => {
    if (tutorialStepIndex >= tutorialSteps.length - 1) {
      completeTutorial();
      return;
    }
    setTutorialStepIndex((prev) => Math.min(prev + 1, tutorialSteps.length - 1));
  };

  const goToPreviousTutorialStep = () => {
    setTutorialStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const getTutorialTargetElement = () => {
    const elementMap = {
      title: titleRef.current,
      commandCenter: commandCenterRef.current,
      signInButton: signInButtonRef.current,
      signInPanel: signInPanelRef.current,
      projectSwitcher: projectSwitcherRef.current,
      addProjectButton: addProjectButtonRef.current,
      deleteProjectButton: deleteProjectButtonRef.current,
      viewSwitch: viewSwitchRef.current,
      dashboardButton: dashboardButtonRef.current,
      dashboardPanel: dashboardPanelRef.current,
      dashboardDownload: dashboardDownloadButtonRef.current,
      reminderBell: reminderBellRef.current,
      import: importButtonRef.current,
      addTask: addTaskButtonRef.current,
      statusColumn: statusColumnRef.current,
      modifyMenu: modifyButtonRef.current,
      settingsButton: settingsButtonRef.current,
      companyUpload: companyUploadRef.current,
      holidayDate: holidayDateRef.current,
      taskEditor: taskEditorRef.current,
      timeline: timelineChartRef.current,
      settingsPanel: settingsPanelRef.current
    };

    return elementMap[activeTutorialTarget] || null;
  };

  const activeTutorialTargetLabel = activeTutorialTarget
    ? (TUTORIAL_TARGET_LABELS[activeTutorialTarget] || 'Highlighted feature')
    : 'Highlighted feature';

  const activeTutorialTargetAction = activeTutorialTarget
    ? (TUTORIAL_TARGET_ACTIONS[activeTutorialTarget] || 'Use the highlighted feature to continue.')
    : 'Use the highlighted feature to continue.';

  const locateTutorialTarget = () => {
    const targetElement = getTutorialTargetElement();
    if (!targetElement) return;

    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  };

  useEffect(() => {
    if (!isTutorialActive || !activeTutorialStep) return;

    const targetView = activeTutorialStep.view === 'dashboard' ? 'dashboard' : 'planner';
    if (currentView !== targetView) {
      navigateToView(targetView);
    }

    const targetControlPanel = targetView === 'planner'
      ? TUTORIAL_TARGET_PANEL_MAP[activeTutorialStep.target] || null
      : null;

    if (targetControlPanel && activeControlPanel !== targetControlPanel) {
      setActiveControlPanel(targetControlPanel);
    }

    const shouldKeepSignInPromptOpen = activeTutorialStep.target === 'signInButton' || activeTutorialStep.panel === 'signin';
    if (!shouldKeepSignInPromptOpen) {
      setShowSignInPrompt(false);
    }

    if (activeTutorialStep.panel === 'modify') {
      setShowHolidayManager(false);
      setShowModifyMenu(true);
    } else if (activeTutorialStep.panel === 'settings') {
      setShowModifyMenu(false);
      setShowHolidayManager(true);
    } else if (activeTutorialStep.panel === 'signin') {
      setShowHolidayManager(false);
      setShowModifyMenu(false);
      setShowSignInPrompt(true);
    } else {
      setShowModifyMenu(false);
      setShowHolidayManager(false);
    }

    const timeoutId = window.setTimeout(() => {
      const targetElement = getTutorialTargetElement();
      if (!targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const isInView = rect.top >= 120 && rect.bottom <= window.innerHeight - 120;

      if (!isInView) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [activeTutorialStep, isTutorialActive, currentView, activeControlPanel]);

  useEffect(() => {
    if (!isTutorialActive) {
      setTutorialFocusRect(null);
      return;
    }

    let frameId = 0;

    const updateFocusRect = () => {
      const targetElement = getTutorialTargetElement();
      if (!targetElement) {
        setTutorialFocusRect(null);
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        setTutorialFocusRect(null);
        return;
      }

      const pad = 8;
      setTutorialFocusRect({
        top: Math.max(8, rect.top - pad),
        left: Math.max(8, rect.left - pad),
        width: rect.width + (pad * 2),
        height: rect.height + (pad * 2)
      });
    };

    const requestUpdate = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateFocusRect);
    };

    requestUpdate();

    window.addEventListener('resize', requestUpdate);
    window.addEventListener('scroll', requestUpdate, true);

    const intervalId = window.setInterval(requestUpdate, 220);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.clearInterval(intervalId);
      window.removeEventListener('resize', requestUpdate);
      window.removeEventListener('scroll', requestUpdate, true);
    };
  }, [isTutorialActive, activeTutorialTarget, showModifyMenu, showHolidayManager, showSignInPrompt, isCompactLayout]);

  const buildActiveProjectSnapshot = () => ({
    projectTitle,
    tasks: normalizeTaskTree(tasks),
    holidays,
    customerLogo,
    customerLogoWidth,
    companyLogo,
    companyLogoWidth,
    showDates,
    showQuarters,
    showCost,
    showTotals,
    currency,
    loginDateSeed,
    updatedAt: new Date().toISOString()
  });

  const saveActiveProjectIntoCollection = (collection = []) => {
    if (!activeProjectId) return collection;
    if (isHydratingProjectRef.current) return collection;
    if (lastHydratedProjectIdRef.current !== activeProjectId) return collection;
    const snapshot = buildActiveProjectSnapshot();

    return collection.map((project) => (
      project.id === activeProjectId
        ? { ...project, ...snapshot }
        : project
    ));
  };

  const buildWorkspacePayload = (collection = projects) => {
    const projectsToPersist = saveActiveProjectIntoCollection(collection).map((project) => createProjectRecord(project));
    return {
      schemaVersion: 3,
      activeProjectId,
      projects: projectsToPersist,
      reminders,
      dismissedAutoAlerts,
      savedAt: new Date().toISOString()
    };
  };

  const applyWorkspacePayload = (payload) => {
    if (!payload || typeof payload !== 'object') return false;
    if (!Array.isArray(payload.projects) || payload.projects.length === 0) return false;

    const loadedProjects = payload.projects.map((project) => createProjectRecord(project));
    const nextActiveId = loadedProjects.some((project) => project.id === payload.activeProjectId)
      ? payload.activeProjectId
      : loadedProjects[0].id;

    setProjects(loadedProjects);
    lastHydratedProjectIdRef.current = null;
    setActiveProjectId(nextActiveId);

    if (Array.isArray(payload.reminders)) {
      setReminders(payload.reminders);
    }

    if (Array.isArray(payload.dismissedAutoAlerts)) {
      setDismissedAutoAlerts(payload.dismissedAutoAlerts);
    }

    if (typeof payload.savedAt === 'string') {
      const parsedDate = new Date(payload.savedAt);
      if (!Number.isNaN(parsedDate.getTime())) {
        setLastSavedAt(parsedDate);
      }
    }

    return true;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(APP_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (applyWorkspacePayload(parsed)) {
          return;
        }
      }

      const legacyRaw = window.localStorage.getItem(LEGACY_APP_STORAGE_KEY);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (legacyParsed && typeof legacyParsed === 'object') {
          const migratedProject = createProjectRecord({
            ...legacyParsed,
            id: createProjectId(),
            tasks: Array.isArray(legacyParsed.tasks)
              ? normalizeTaskTree(legacyParsed.tasks)
              : normalizeTaskTree(buildDefaultTasks(loginDateSeed))
          });
          applyWorkspacePayload({
            schemaVersion: 3,
            activeProjectId: migratedProject.id,
            projects: [migratedProject],
            savedAt: new Date().toISOString()
          });
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to restore saved workspace', error);
    }

    const starterProject = createProjectRecord({
      projectTitle: 'Project 1',
      tasks: normalizeTaskTree(buildDefaultTasks(loginDateSeed))
    });
    applyWorkspacePayload({
      schemaVersion: 3,
      activeProjectId: starterProject.id,
      projects: [starterProject],
      savedAt: new Date().toISOString()
    });
  }, [loginDateSeed]);

  useEffect(() => {
    if (!activeProjectId || isHydratingProjectRef.current) return;
    if (lastHydratedProjectIdRef.current !== activeProjectId) return;

    setProjects((prevProjects) => {
      if (!Array.isArray(prevProjects) || prevProjects.length === 0) return prevProjects;
      return saveActiveProjectIntoCollection(prevProjects);
    });
  }, [
    activeProjectId,
    projectTitle,
    tasks,
    holidays,
    customerLogo,
    customerLogoWidth,
    companyLogo,
    companyLogoWidth,
    showDates,
    showQuarters,
    showCost,
    showTotals,
    currency,
    loginDateSeed
  ]);

  useEffect(() => {
    if (!activeProjectId || !Array.isArray(projects) || projects.length === 0) return;
    if (lastHydratedProjectIdRef.current === activeProjectId) return;

    const selectedProject = projects.find((project) => project.id === activeProjectId) || projects[0];
    if (!selectedProject) return;

    isHydratingProjectRef.current = true;
    setProjectTitle(selectedProject.projectTitle);
    setTasks(normalizeTaskTree(selectedProject.tasks));
    setHolidays(Array.isArray(selectedProject.holidays) ? selectedProject.holidays : []);
    setCustomerLogo(typeof selectedProject.customerLogo === 'string' || selectedProject.customerLogo === null ? selectedProject.customerLogo : null);
    setCustomerLogoWidth(typeof selectedProject.customerLogoWidth === 'number' ? selectedProject.customerLogoWidth : 150);
    setCompanyLogo(typeof selectedProject.companyLogo === 'string' || selectedProject.companyLogo === null ? selectedProject.companyLogo : null);
    setCompanyLogoWidth(typeof selectedProject.companyLogoWidth === 'number' ? selectedProject.companyLogoWidth : 150);
    setShowDates(typeof selectedProject.showDates === 'boolean' ? selectedProject.showDates : true);
    setShowQuarters(typeof selectedProject.showQuarters === 'boolean' ? selectedProject.showQuarters : false);
    setShowCost(typeof selectedProject.showCost === 'boolean' ? selectedProject.showCost : false);
    setShowTotals(typeof selectedProject.showTotals === 'boolean' ? selectedProject.showTotals : true);
    setCurrency(typeof selectedProject.currency === 'string' && selectedProject.currency.length > 0 ? selectedProject.currency : '$');
    setNewHoliday('');
    setShowHolidayManager(false);
    setShowModifyMenu(false);

    lastHydratedProjectIdRef.current = selectedProject.id;

    if (selectedProject.id !== activeProjectId) {
      setActiveProjectId(selectedProject.id);
    }

    window.setTimeout(() => {
      isHydratingProjectRef.current = false;
    }, 0);
  }, [activeProjectId, projects]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!Array.isArray(projects) || projects.length === 0) return;

    const timeoutId = window.setTimeout(() => {
      try {
        const payload = buildWorkspacePayload(projects);
        let persistedOwnerUserId = null;

        if (authSession.isAuthenticated && authSession.user?.id) {
          persistedOwnerUserId = authSession.user.id;
        } else {
          try {
            const existingRaw = window.localStorage.getItem(APP_STORAGE_KEY);
            if (existingRaw) {
              const existingPayload = JSON.parse(existingRaw);
              if (typeof existingPayload?._ownerUserId === 'string' && existingPayload._ownerUserId.length > 0) {
                persistedOwnerUserId = existingPayload._ownerUserId;
              }
            }
          } catch {
            persistedOwnerUserId = null;
          }
        }

        if (persistedOwnerUserId) {
          payload._ownerUserId = persistedOwnerUserId;
        }

        window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(payload));
        setLastSavedAt(new Date());
      } catch (error) {
        console.warn('Failed to persist workspace', error);
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [
    projects,
    activeProjectId,
    projectTitle,
    tasks,
    reminders,
    dismissedAutoAlerts,
    holidays,
    customerLogo,
    customerLogoWidth,
    companyLogo,
    companyLogoWidth,
    showDates,
    showQuarters,
    showCost,
    showTotals,
    currency,
    loginDateSeed,
    authSession.isAuthenticated,
    authSession.user?.id
  ]);

  const pullWorkspaceFromCloud = async (applyIfNewerOnly = true) => {
    const response = await fetch('/api/workspace', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 401) {
        return false;
      }
      throw new Error(`Cloud workspace fetch failed (${response.status})`);
    }

    const payload = await response.json();
    if (!payload?.workspace || !payload?.updatedAt) {
      cloudReadyRef.current = true;
      return false;
    }

    const remoteTimestamp = new Date(payload.updatedAt).getTime();
    const localTimestamp = cloudRevisionRef.current ? new Date(cloudRevisionRef.current).getTime() : 0;

    if (applyIfNewerOnly && Number.isFinite(remoteTimestamp) && Number.isFinite(localTimestamp) && remoteTimestamp <= localTimestamp) {
      cloudReadyRef.current = true;
      return false;
    }

    const applied = applyWorkspacePayload(payload.workspace);
    if (applied) {
      skipCloudSaveRef.current = true;
      cloudRevisionRef.current = payload.updatedAt;
      cloudReadyRef.current = true;
      setCloudSyncState((prev) => ({
        ...prev,
        lastSyncedAt: new Date(payload.updatedAt),
        error: ''
      }));
    }

    return applied;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const query = new URLSearchParams(window.location.search);
    const authResult = query.get('auth');
    const authDetail = query.get('detail');

    if (authResult === 'success') {
      setAuthPromptMessage('Signed in successfully. Cloud sync is now available across your devices.');
      setShowSignInPrompt(false);
    } else if (authResult === 'error') {
      setAuthPromptMessage(authDetail === 'state_mismatch'
        ? 'Could not verify sign-in request. Please try again.'
        : 'Sign-in failed. Please try again.');
      setShowSignInPrompt(true);
    }

    if (authResult) {
      query.delete('auth');
      query.delete('detail');
      const nextQueryString = query.toString();
      const nextUrl = `${window.location.pathname}${nextQueryString ? `?${nextQueryString}` : ''}`;
      window.history.replaceState({}, '', nextUrl);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const loadSessionAndCloud = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        });

        if (!sessionResponse.ok) {
          throw new Error(`Session lookup failed (${sessionResponse.status})`);
        }

        const sessionPayload = await sessionResponse.json();
        if (cancelled) return;

        const providers = sessionPayload?.providers || { google: false, github: false };
        const isAuthenticated = Boolean(sessionPayload?.authenticated && sessionPayload?.user);

        setAuthSession({
          isLoading: false,
          isAuthenticated,
          user: isAuthenticated ? sessionPayload.user : null,
          providers
        });

        if (isAuthenticated) {
          let localOwnerUserId = null;
          try {
            const raw = window.localStorage.getItem(APP_STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              localOwnerUserId = parsed?._ownerUserId || null;
            }
          } catch {}

          const currentUserId = sessionPayload.user?.id || null;
          const isUserSwitch = Boolean(localOwnerUserId && currentUserId && localOwnerUserId !== currentUserId);

          try {
            const cloudApplied = await pullWorkspaceFromCloud(false);

            if (cloudApplied) {
              // Cloud data was found and applied — this handles both fresh
              // logins and returning users on new devices.
            } else if (isUserSwitch) {
              // Brand-new account (no cloud data) on a device that has
              // another user's data in localStorage.  Reset to defaults
              // so the new user starts clean.
              skipCloudSaveRef.current = false;
              const starterLoginSeed = getLoginDateString();
              const starterProject = createProjectRecord({
                projectTitle: 'Project 1',
                loginDateSeed: starterLoginSeed,
                tasks: normalizeTaskTree(buildDefaultTasks(starterLoginSeed))
              });
              applyWorkspacePayload({
                schemaVersion: 3,
                activeProjectId: starterProject.id,
                projects: [starterProject],
                savedAt: new Date().toISOString()
              });
            }
            // else: returning user, same owner, no newer cloud data — keep
            // localStorage as-is (it's already loaded from the mount effect).
          } catch (cloudError) {
            if (!cancelled) {
              setCloudSyncState((prev) => ({
                ...prev,
                error: 'Signed in, but cloud workspace could not be loaded right now.'
              }));
            }
          } finally {
            cloudReadyRef.current = true;
          }
        } else {
          cloudReadyRef.current = false;
          cloudRevisionRef.current = null;
        }
      } catch (error) {
        if (cancelled) return;

        setAuthSession({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          providers: { google: false, github: false }
        });

        setCloudSyncState((prev) => ({
          ...prev,
          error: 'Cloud sign-in endpoints are not configured yet in this deployment.'
        }));
      }
    };

    loadSessionAndCloud();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authSession.isAuthenticated || !authSession.user) return;
    if (!cloudReadyRef.current) return;
    if (!activeProjectId) return;
    if (!Array.isArray(projects) || projects.length === 0) return;
    if (isHydratingProjectRef.current) return;

    if (skipCloudSaveRef.current) {
      skipCloudSaveRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setCloudSyncState((prev) => ({ ...prev, isSaving: true, error: '' }));

        const workspacePayload = buildWorkspacePayload(projects);
        const response = await fetch('/api/workspace', {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ workspace: workspacePayload })
        });

        if (!response.ok) {
          throw new Error(`Cloud save failed (${response.status})`);
        }

        const savePayload = await response.json();
        if (typeof savePayload?.updatedAt === 'string') {
          cloudRevisionRef.current = savePayload.updatedAt;
          setCloudSyncState((prev) => ({
            ...prev,
            isSaving: false,
            lastSyncedAt: new Date(savePayload.updatedAt),
            error: ''
          }));
        } else {
          setCloudSyncState((prev) => ({ ...prev, isSaving: false, error: '' }));
        }
      } catch (error) {
        setCloudSyncState((prev) => ({
          ...prev,
          isSaving: false,
          error: 'Local save succeeded, but cloud sync failed temporarily.'
        }));
      }
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [
    authSession.isAuthenticated,
    authSession.user,
    projects,
    activeProjectId,
    projectTitle,
    tasks,
    reminders,
    dismissedAutoAlerts,
    holidays,
    customerLogo,
    customerLogoWidth,
    companyLogo,
    companyLogoWidth,
    showDates,
    showQuarters,
    showCost,
    showTotals,
    currency,
    loginDateSeed
  ]);

  useEffect(() => {
    if (!authSession.isAuthenticated || !authSession.user) return;

    const pollForRemoteChanges = async () => {
      if (cloudPollInFlightRef.current) return;
      cloudPollInFlightRef.current = true;

      try {
        await pullWorkspaceFromCloud(true);
      } catch {
        // Silent by design; save path already surfaces persistent errors.
      } finally {
        cloudPollInFlightRef.current = false;
      }
    };

    pollForRemoteChanges();

    const intervalId = window.setInterval(pollForRemoteChanges, 7000);
    const onFocus = () => pollForRemoteChanges();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') pollForRemoteChanges();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [authSession.isAuthenticated, authSession.user]);

  // ─── Reminder & Notification Engine ────────────────────────────────────

  // Persist reminders to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders)); } catch {}
  }, [reminders]);

  // Persist dismissed auto-alert keys
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(DISMISSED_AUTO_ALERTS_KEY, JSON.stringify(dismissedAutoAlerts)); } catch {}
  }, [dismissedAutoAlerts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(REMINDER_NOTIFICATION_PREFS_KEY, JSON.stringify(reminderNotificationPrefs)); } catch {}
  }, [reminderNotificationPrefs]);

  // Close notification panel on outside click or Escape
  useEffect(() => {
    if (!showNotificationPanel) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowNotificationPanel(false); };
    const onClick = (e) => {
      const el = notificationPanelRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      if (reminderBellRef.current && reminderBellRef.current.contains(e.target)) return;
      setShowNotificationPanel(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, [showNotificationPanel]);

  // Close reminder modal on Escape
  useEffect(() => {
    if (!showReminderModal) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowReminderModal(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [showReminderModal]);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    defaultDocumentTitleRef.current = document.title || DEFAULT_PAGE_TITLE;

    return () => {
      if (tabAttentionTitleIntervalRef.current) {
        window.clearInterval(tabAttentionTitleIntervalRef.current);
        tabAttentionTitleIntervalRef.current = null;
      }

      Object.values(toastDismissTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      toastDismissTimersRef.current = {};

      if (reminderSoundContextRef.current && typeof reminderSoundContextRef.current.close === 'function') {
        reminderSoundContextRef.current.close().catch(() => {});
      }

      document.title = defaultDocumentTitleRef.current || DEFAULT_PAGE_TITLE;
    };
  }, []);

  const resetDocumentTitle = () => {
    if (typeof document === 'undefined') return;
    document.title = defaultDocumentTitleRef.current || DEFAULT_PAGE_TITLE;
  };

  const clearTabAttentionIndicators = () => {
    setTabAttentionNotifications([]);
    setShowTabAttentionBanner(false);
    resetDocumentTitle();
  };

  const playReminderSound = () => {
    if (!reminderNotificationPrefs.soundEnabled) return;
    if (typeof window === 'undefined') return;

    const nowMs = Date.now();
    if (nowMs - lastReminderSoundAtRef.current < 1400) return;
    lastReminderSoundAtRef.current = nowMs;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      if (!reminderSoundContextRef.current) {
        reminderSoundContextRef.current = new AudioContextClass();
      }

      const context = reminderSoundContextRef.current;
      const playChime = () => {
        const scheduleTone = (delaySeconds, frequency) => {
          const startAt = context.currentTime + delaySeconds;
          const oscillator = context.createOscillator();
          const gain = context.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequency, startAt);
          gain.gain.setValueAtTime(0.0001, startAt);
          gain.gain.exponentialRampToValueAtTime(0.09, startAt + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.2);

          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(startAt);
          oscillator.stop(startAt + 0.22);
        };

        scheduleTone(0, 880);
        scheduleTone(0.24, 1320);
      };

      if (context.state === 'suspended') {
        context.resume().then(playChime).catch(() => {});
        return;
      }

      playChime();
    } catch {}
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const syncVisibility = () => {
      const hidden = document.visibilityState === 'hidden';
      setIsDocumentHidden(hidden);

      if (!hidden && tabAttentionNotifications.length > 0) {
        setShowTabAttentionBanner(true);
      }
    };

    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    window.addEventListener('focus', syncVisibility);

    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
      window.removeEventListener('focus', syncVisibility);
    };
  }, [tabAttentionNotifications.length]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (tabAttentionTitleIntervalRef.current) {
      window.clearInterval(tabAttentionTitleIntervalRef.current);
      tabAttentionTitleIntervalRef.current = null;
    }

    if (!reminderNotificationPrefs.tabTitleFlashEnabled || !isDocumentHidden || tabAttentionNotifications.length === 0) {
      resetDocumentTitle();
      return;
    }

    const baseTitle = defaultDocumentTitleRef.current || DEFAULT_PAGE_TITLE;
    const alertTitle = tabAttentionNotifications.length === 1
      ? `Reminder due - ${baseTitle}`
      : `${tabAttentionNotifications.length} reminders due - ${baseTitle}`;

    let showBaseTitle = false;
    document.title = alertTitle;

    tabAttentionTitleIntervalRef.current = window.setInterval(() => {
      showBaseTitle = !showBaseTitle;
      document.title = showBaseTitle ? baseTitle : alertTitle;
    }, 1200);

    return () => {
      if (tabAttentionTitleIntervalRef.current) {
        window.clearInterval(tabAttentionTitleIntervalRef.current);
        tabAttentionTitleIntervalRef.current = null;
      }
    };
  }, [isDocumentHidden, reminderNotificationPrefs.tabTitleFlashEnabled, tabAttentionNotifications.length]);

  // Fire a notification (browser + in-app)
  const fireNotification = (title, body, key, metadata = {}) => {
    if (typeof window === 'undefined') return false;

    const timestamp = Date.now();
    const dedupeKey = typeof key === 'string' && key.length > 0 ? key : `${title}:${body}`;
    const previousFireAt = notificationKeyLedgerRef.current[dedupeKey];

    if (typeof previousFireAt === 'number' && (timestamp - previousFireAt) < NOTIFICATION_DEDUPE_WINDOW_MS) {
      return false;
    }

    notificationKeyLedgerRef.current[dedupeKey] = timestamp;
    Object.keys(notificationKeyLedgerRef.current).forEach((ledgerKey) => {
      if ((timestamp - notificationKeyLedgerRef.current[ledgerKey]) > NOTIFICATION_RETENTION_MS) {
        delete notificationKeyLedgerRef.current[ledgerKey];
      }
    });

    const id = `notif-${timestamp}-${Math.random().toString(36).slice(2, 6)}`;
    const nextNotification = {
      id,
      title,
      body,
      key: dedupeKey,
      timestamp,
      kind: metadata.kind || 'manual',
      scheduledAt: metadata.scheduledAt || null
    };

    setActiveNotifications((prev) => (
      [...prev, nextNotification]
        .filter((n) => (timestamp - n.timestamp) <= NOTIFICATION_RETENTION_MS)
        .slice(-MAX_ACTIVE_NOTIFICATIONS)
    ));

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      setTabAttentionNotifications((prev) => [...prev, nextNotification].slice(-MAX_ACTIVE_NOTIFICATIONS));
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(title, { body, icon: '/favicon.ico', tag: dedupeKey }); } catch {}
    }

    const timeoutId = window.setTimeout(() => {
      setActiveNotifications((prev) => prev.filter((n) => n.id !== id));
      setTabAttentionNotifications((prev) => prev.filter((n) => n.id !== id));
      delete toastDismissTimersRef.current[id];
    }, 14000);
    toastDismissTimersRef.current[id] = timeoutId;

    playReminderSound();
    return true;
  };

  const dismissNotification = (id) => {
    if (toastDismissTimersRef.current[id]) {
      window.clearTimeout(toastDismissTimersRef.current[id]);
      delete toastDismissTimersRef.current[id];
    }
    setActiveNotifications((prev) => prev.filter((n) => n.id !== id));
    setTabAttentionNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    Object.values(toastDismissTimersRef.current).forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    toastDismissTimersRef.current = {};
    setActiveNotifications([]);
    clearTabAttentionIndicators();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cleanupNotificationData = () => {
      const nowMs = Date.now();

      setActiveNotifications((prev) => prev.filter((n) => (nowMs - n.timestamp) <= NOTIFICATION_RETENTION_MS));
      setTabAttentionNotifications((prev) => prev.filter((n) => (nowMs - n.timestamp) <= NOTIFICATION_RETENTION_MS));

      Object.keys(notificationKeyLedgerRef.current).forEach((ledgerKey) => {
        if ((nowMs - notificationKeyLedgerRef.current[ledgerKey]) > NOTIFICATION_RETENTION_MS) {
          delete notificationKeyLedgerRef.current[ledgerKey];
        }
      });
    };

    cleanupNotificationData();
    const intervalId = window.setInterval(cleanupNotificationData, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const openReminderCenterFromBanner = () => {
    setShowModifyMenu(false);
    setShowHolidayManager(false);
    setActiveControlPanel('utility');
    setShowNotificationPanel(true);
    clearTabAttentionIndicators();
  };

  // Collect all items (tasks + subtasks across all projects) whose endDate === today
  const getTodaysDueItems = () => {
    const today = formatDate(new Date());
    const dueItems = [];

    const projectsToScan = Array.isArray(projects) ? projects : [];
    projectsToScan.forEach((project) => {
      const projectTasks = Array.isArray(project.tasks) ? project.tasks : [];
      projectTasks.forEach((task) => {
        if (task.endDate === today && normalizeStatus(task.status) !== STATUS_COMPLETED) {
          dueItems.push({ type: 'task', projectId: project.id, projectName: project.projectTitle, name: task.name, endDate: task.endDate, taskId: task.id });
        }
        if (Array.isArray(task.subTasks)) {
          task.subTasks.forEach((st) => {
            if (st.endDate === today && normalizeStatus(st.status) !== STATUS_COMPLETED) {
              dueItems.push({ type: 'subtask', projectId: project.id, projectName: project.projectTitle, name: st.name, parentName: task.name, endDate: st.endDate, taskId: task.id, subTaskId: st.id });
            }
          });
        }
      });
    });

    return dueItems;
  };

  // Check automatic due-date alerts (fires around 9 AM IST = 03:30 UTC)
  // Also checks manual reminders
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!Array.isArray(projects) || projects.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const today = formatDate(now);

      // --- Automatic due-date alerts at 9 AM IST ---
      // IST is UTC+5:30. 9 AM IST = 03:30 UTC.
      // We check if current IST hour is >= 9 and the alert hasn't been dismissed today
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffsetMs + now.getTimezoneOffset() * 60000);
      const istHour = istNow.getHours();

      if (istHour >= 9) {
        const dueItems = getTodaysDueItems();
        const alertKey = `auto-${today}-summary`;

        if (dueItems.length > 0 && !dismissedAutoAlerts.includes(alertKey)) {
          const projectCount = new Set(dueItems.map((item) => item.projectId)).size;
          const preview = dueItems
            .slice(0, 2)
            .map((item) => `"${item.name}"`)
            .join(', ');
          const remainingCount = Math.max(0, dueItems.length - 2);

          fireNotification(
            'Due Today Summary',
            `${dueItems.length} item${dueItems.length === 1 ? '' : 's'} due across ${projectCount} project${projectCount === 1 ? '' : 's'}${preview ? `: ${preview}` : ''}${remainingCount > 0 ? ` +${remainingCount} more` : ''}.`,
            alertKey,
            { kind: 'auto', scheduledAt: `${today}T09:00:00+05:30` }
          );

          setDismissedAutoAlerts((prev) => {
            const merged = new Set(prev);
            merged.add(alertKey);
            return Array.from(merged);
          });
        }
      }

      // --- Manual reminders ---
      const nowMs = now.getTime();
      setReminders((prev) => {
        return prev.map((r) => {
          if (r.fired) return r;

          const reminderMs = getReminderTimestamp(r.date, r.time);
          if (!Number.isFinite(reminderMs)) return r;

          const deltaMs = nowMs - reminderMs;

          if (deltaMs < 0) {
            return r;
          }

          if (deltaMs <= MANUAL_REMINDER_MATCH_WINDOW_MS) {
            const label = r.subTaskId
              ? `"${r.itemName}" (subtask)`
              : `"${r.itemName}"`;

            fireNotification(
              'Reminder',
              `${label} in project "${r.projectName}"${r.note ? ': ' + r.note : ''}`,
              `manual-${r.id}`,
              { kind: 'manual', scheduledAt: `${r.date}T${r.time}:00` }
            );

            return { ...r, fired: true, firedAt: new Date().toISOString() };
          }

          if (deltaMs > MANUAL_REMINDER_MATCH_WINDOW_MS) {
            return { ...r, fired: true, skipped: true, skippedAt: new Date().toISOString() };
          }

          return r;
        });
      });
    };

    // Check immediately and then every 30 seconds
    checkReminders();
    const intervalId = window.setInterval(checkReminders, 30000);
    return () => window.clearInterval(intervalId);
  }, [projects, dismissedAutoAlerts]);

  // Cleanup old dismissed alerts (more than 2 days old)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const today = new Date();
    setDismissedAutoAlerts((prev) => prev.filter((key) => {
      const dateMatch = key.match(/^auto-(\d{4}-\d{2}-\d{2})-/);
      if (!dateMatch) return true;
      const alertDate = getDateAtNoon(dateMatch[1]);
      const diffDays = (today - alertDate) / (1000 * 60 * 60 * 24);
      return diffDays < 2;
    }));
  }, []);

  // Cleanup fired manual reminders older than 1 day
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nowMs = Date.now();
    setReminders((prev) => prev.filter((r) => {
      if (!r.fired) return true;
      const reminderMs = new Date(`${r.date}T${r.time}:00`).getTime();
      return (nowMs - reminderMs) < 24 * 60 * 60 * 1000;
    }));
  }, []);

  // Reminder CRUD functions
  const openReminderModal = (taskId, subTaskId = null) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let itemName = task.name;
    if (subTaskId) {
      const st = Array.isArray(task.subTasks) ? task.subTasks.find((s) => s.id === subTaskId) : null;
      if (st) { itemName = st.name; }
    }

    const now = new Date();
    const nowDate = formatDate(now);
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setReminderTarget({ taskId, subTaskId, itemName, projectId: activeProjectId, projectName: projectTitle });
    setReminderDate(nowDate);
    setReminderTime(nowTime);
    setReminderNote('');
    setShowNotificationPanel(false);
    setShowReminderModal(true);
  };

  const saveReminder = () => {
    if (!reminderTarget || !reminderDate || !reminderTime) return;
    const newReminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      taskId: reminderTarget.taskId,
      subTaskId: reminderTarget.subTaskId || null,
      itemName: reminderTarget.itemName,
      projectId: reminderTarget.projectId || activeProjectId,
      projectName: reminderTarget.projectName,
      date: reminderDate,
      time: reminderTime,
      note: reminderNote,
      fired: false,
      createdAt: new Date().toISOString()
    };
    setReminders((prev) => [...prev, newReminder]);
    setShowReminderModal(false);
    setReminderTarget(null);
  };

  const deleteReminder = (reminderId) => {
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
  };

  const getRemindersForItem = (taskId, subTaskId = null) => {
    return reminders.filter((r) => {
      const matchesProject = r.projectId
        ? r.projectId === activeProjectId
        : r.projectName === projectTitle;
      return matchesProject && r.taskId === taskId && r.subTaskId === subTaskId && !r.fired;
    });
  };

  const formatReminderDateTimeLabel = (date, time) => {
    if (!date || !time) return 'Invalid date/time';
    const value = new Date(`${date}T${time}:00`);
    if (Number.isNaN(value.getTime())) return `${date} ${time}`;
    return value.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingReminders = useMemo(
    () => reminders
      .filter((r) => !r.fired)
      .sort((a, b) => {
        const aTime = getReminderTimestamp(a.date, a.time);
        const bTime = getReminderTimestamp(b.date, b.time);
        return aTime - bTime;
      }),
    [reminders]
  );

  const recentNotifications = useMemo(
    () => [...activeNotifications].sort((a, b) => b.timestamp - a.timestamp),
    [activeNotifications]
  );

  const upcomingReminders = useMemo(() => pendingReminders.slice(0, 7), [pendingReminders]);
  const nextPendingReminder = pendingReminders.length > 0 ? pendingReminders[0] : null;
  const autoNotificationCount = recentNotifications.filter((notification) => notification.kind === 'auto').length;
  const manualNotificationCount = recentNotifications.filter((notification) => notification.kind !== 'auto').length;
  const dueTodayReminderCount = useMemo(() => {
    const today = formatDate(new Date());
    return pendingReminders.filter((reminder) => reminder.date === today).length;
  }, [pendingReminders]);

  const pendingReminderCount = pendingReminders.length;
  const activeNotificationCount = activeNotifications.length;
  const notificationBadgeCount = activeNotificationCount + dueTodayReminderCount;
  const nextReminderLabel = nextPendingReminder
    ? formatReminderDateTimeLabel(nextPendingReminder.date, nextPendingReminder.time)
    : 'No reminder scheduled';
  const nextReminderDetail = nextPendingReminder
    ? nextPendingReminder.itemName
    : 'Set reminders from task rows';
  const toastNotifications = recentNotifications.slice(0, 2);
  const latestTabAttentionNotification = tabAttentionNotifications.length > 0
    ? tabAttentionNotifications[tabAttentionNotifications.length - 1]
    : null;
  const tabAttentionCount = tabAttentionNotifications.length;
  const browserNotificationPermission = typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'unsupported';
  const reminderTargetPending = reminderTarget
    ? getRemindersForItem(reminderTarget.taskId, reminderTarget.subTaskId || null)
    : [];

  const removeProjectReminderData = (projectId, projectName) => {
    setReminders((prev) => prev.filter((r) => {
      if (r.projectId) return r.projectId !== projectId;
      return projectName ? r.projectName !== projectName : true;
    }));
    setDismissedAutoAlerts((prev) => prev.filter((key) => !key.includes(`-${projectId}-`)));
  };

  const switchProject = (projectId) => {
    if (!projectId || projectId === activeProjectId) return;
    setProjects((prevProjects) => saveActiveProjectIntoCollection(prevProjects));
    lastHydratedProjectIdRef.current = null;
    setIsEditingTitle(false);
    setActiveProjectId(projectId);
    setShowModifyMenu(false);
    setShowHolidayManager(false);
    setShowNotificationPanel(false);
  };

  const addProject = () => {
    const newProjectId = createProjectId();
    const newProjectLoginSeed = getLoginDateString();

    setProjects((prevProjects) => {
      const withSnapshot = saveActiveProjectIntoCollection(prevProjects);
      const newProject = createProjectRecord({
        id: newProjectId,
        projectTitle: createProjectName(withSnapshot),
        loginDateSeed: newProjectLoginSeed,
        tasks: normalizeTaskTree(buildDefaultTasks(newProjectLoginSeed))
      });
      return [...withSnapshot, newProject];
    });

    lastHydratedProjectIdRef.current = null;
    setIsEditingTitle(false);
    setActiveProjectId(newProjectId);
    setShowModifyMenu(false);
    setShowHolidayManager(false);
    setShowNotificationPanel(false);
    navigateToView('planner');
  };

  const deleteActiveProject = () => {
    if (!activeProjectId || !Array.isArray(projects) || projects.length === 0) return;

    const targetProject = projects.find((project) => project.id === activeProjectId);
    const targetName = targetProject?.projectTitle || 'this project';

    if (projects.length === 1) {
      const shouldReplaceWithStarter = window.confirm(
        `Delete "${targetName}"? This is your last project, so a fresh Project 1 will be created automatically.`
      );
      if (!shouldReplaceWithStarter) return;

      removeProjectReminderData(activeProjectId, targetName);

      const starterLoginSeed = getLoginDateString();
      const starterProject = createProjectRecord({
        projectTitle: 'Project 1',
        loginDateSeed: starterLoginSeed,
        tasks: normalizeTaskTree(buildDefaultTasks(starterLoginSeed))
      });

      skipCloudSaveRef.current = false;
      applyWorkspacePayload({
        schemaVersion: 3,
        activeProjectId: starterProject.id,
        projects: [starterProject],
        savedAt: new Date().toISOString()
      });
      setIsEditingTitle(false);
      setShowModifyMenu(false);
      setShowHolidayManager(false);
      return;
    }

    const shouldDelete = window.confirm(`Delete project "${targetName}"? This action cannot be undone.`);
    if (!shouldDelete) return;

    removeProjectReminderData(activeProjectId, targetName);

    let nextActiveId = null;
    setProjects((prevProjects) => {
      const withSnapshot = saveActiveProjectIntoCollection(prevProjects);
      const currentIndex = withSnapshot.findIndex((project) => project.id === activeProjectId);
      const nextProjects = withSnapshot.filter((project) => project.id !== activeProjectId);

      if (nextProjects.length > 0) {
        const fallbackIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        nextActiveId = nextProjects[Math.min(fallbackIndex, nextProjects.length - 1)]?.id || nextProjects[0].id;
      }

      return nextProjects;
    });

    lastHydratedProjectIdRef.current = null;
    setIsEditingTitle(false);
    setShowModifyMenu(false);
    setShowHolidayManager(false);
    if (nextActiveId) {
      setActiveProjectId(nextActiveId);
    }
  };

  const openProjectFromDashboard = (projectId) => {
    switchProject(projectId);
    navigateToView('planner');
  };

  const openSignInPrompt = () => {
    setShowModifyMenu(false);
    setShowHolidayManager(false);
    setShowNotificationPanel(false);
    if (authSession.isAuthenticated && authSession.user?.email) {
      setAuthPromptMessage(`Signed in as ${authSession.user.email}. Your updates are syncing across devices.`);
    } else {
      setAuthPromptMessage('');
    }
    setShowSignInPrompt(true);
  };

  const closeSignInPrompt = () => {
    setShowSignInPrompt(false);
    setAuthPromptMessage('');
  };

  const signOutFromCloud = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // Ignore network errors and reset local auth state below.
    }

    setAuthSession((prev) => ({
      ...prev,
      isAuthenticated: false,
      user: null
    }));
    cloudReadyRef.current = false;
    cloudRevisionRef.current = null;
    setCloudSyncState({
      isSaving: false,
      lastSyncedAt: null,
      error: ''
    });
    setAuthPromptMessage('Signed out. Local auto-save remains active on this device.');
    setShowSignInPrompt(false);
  };

  const startOptionalSignIn = (provider) => {
    const providerRoute = provider === 'google'
      ? '/api/auth/signin/google'
      : '/api/auth/signin/github';

    if (!CLOUD_AUTH_ENABLED) {
      setAuthPromptMessage('Cloud sync is disabled for this deployment. Local auto-save remains active on this device.');
      return;
    }

    if (authSession.isLoading) {
      setAuthPromptMessage('Checking cloud sign-in availability. Please wait a moment and try again.');
      return;
    }

    const providerConfigured = provider === 'google'
      ? Boolean(authSession.providers.google)
      : Boolean(authSession.providers.github);

    if (!providerConfigured) {
      setAuthPromptMessage(`${provider === 'google' ? 'Gmail' : 'GitHub'} sign-in is not configured yet for this deployment.`);
      return;
    }

    if (typeof window === 'undefined') return;
    window.location.assign(providerRoute);
  };

  const addTask = () => {
    setTasks((prevTasks) => {
      const nextColor = DEFAULT_PALETTE[prevTasks.length % DEFAULT_PALETTE.length];
      const lastTask = prevTasks[prevTasks.length - 1];
      const baseStartDate =
        lastTask && isValidDateString(lastTask.endDate)
          ? addCalendarDays(lastTask.endDate, 1)
          : loginDateSeed;
      const startDate = isValidDateString(baseStartDate) ? baseStartDate : loginDateSeed;
      const endDate = addBusinessDays(startDate, 7, holidays);

      const newTask = {
        id: Date.now(),
        name: 'New Task',
        startDate,
        endDate,
        color: nextColor,
        cost: 0,
        status: STATUS_IN_PROGRESS,
        expanded: true,
        subTasks: []
      };

      return [...prevTasks, newTask];
    });
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    setReminders((prev) => prev.filter((r) => {
      const matchesProject = r.projectId
        ? r.projectId === activeProjectId
        : r.projectName === projectTitle;
      return !(matchesProject && r.taskId === id);
    }));
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(task => {
      if (task.id !== id) return task;

      return { ...task, [field]: value };
    }));
  };

  const updateTaskStatus = (id, status) => {
    const nextStatus = normalizeStatus(status);

    setTasks(tasks.map((task) => {
      if (task.id !== id) return task;

      if (Array.isArray(task.subTasks) && task.subTasks.length > 0) {
        return {
          ...task,
          status: nextStatus,
          subTasks: task.subTasks.map((subTask) => ({
            ...subTask,
            status: nextStatus
          }))
        };
      }

      return {
        ...task,
        status: nextStatus
      };
    }));
  };

  const updateTaskDuration = (id, duration) => {
    setTasks(tasks.map(task => {
      if (task.id !== id) return task;
      const newEndDate = addBusinessDays(task.startDate, parseInt(duration) || 1, holidays);
      return { ...task, endDate: newEndDate };
    }));
  };

  const updateSubTaskDuration = (parentId, subTaskId, duration) => {
    setTasks(tasks.map(task => {
      if (task.id !== parentId) return task;
      return {
        ...task,
        subTasks: task.subTasks.map(st => {
          if (st.id !== subTaskId) return st;
          const newEndDate = addBusinessDays(st.startDate, parseInt(duration) || 1, holidays);
          return { ...st, endDate: newEndDate };
        })
      };
    }));
  };

  const updateSubTaskStatus = (parentId, subTaskId, status) => {
    const nextStatus = normalizeStatus(status);

    setTasks(tasks.map((task) => {
      if (task.id !== parentId) return task;

      const nextSubTasks = task.subTasks.map((subTask) => (
        subTask.id === subTaskId
          ? { ...subTask, status: nextStatus }
          : subTask
      ));

      return {
        ...task,
        status: areAllSubTasksCompleted(nextSubTasks) ? STATUS_COMPLETED : STATUS_IN_PROGRESS,
        subTasks: nextSubTasks
      };
    }));
  };

  const toggleExpanded = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, expanded: !task.expanded } : task
    ));
  };

  const addHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      setHolidays([...holidays, newHoliday].sort());
      setNewHoliday('');
    }
  };

  const removeHoliday = (date) => {
    setHolidays(holidays.filter(h => h !== date));
  };

  const addSubTask = (parentId) => {
    setTasks((prevTasks) => {
      const parent = prevTasks.find((t) => t.id === parentId);
      if (!parent) return prevTasks;

      const subTaskColor = DEFAULT_PALETTE[(parent.subTasks.length + 1) % DEFAULT_PALETTE.length];
      const lastSubTask = parent.subTasks[parent.subTasks.length - 1];
      const baseStartDate =
        lastSubTask && isValidDateString(lastSubTask.endDate)
          ? addCalendarDays(lastSubTask.endDate, 1)
          : parent.startDate;
      const startDate = isValidDateString(baseStartDate)
        ? baseStartDate
        : (isValidDateString(parent.startDate) ? parent.startDate : loginDateSeed);
      const endDate = addBusinessDays(startDate, 1, holidays);

      const newSubTask = {
        id: Date.now(),
        name: 'New Sub-task',
        startDate,
        endDate,
        color: subTaskColor,
        cost: 0,
        status: STATUS_IN_PROGRESS
      };

      return prevTasks.map((task) =>
        task.id === parentId
          ? {
            ...task,
            status: STATUS_IN_PROGRESS,
            subTasks: [...task.subTasks, newSubTask],
            expanded: true
          }
          : task
      );
    });
  };

  const removeSubTask = (parentId, subTaskId) => {
    setTasks(tasks.map(task =>
      task.id === parentId
        ? (() => {
          const remainingSubTasks = task.subTasks.filter((subTask) => subTask.id !== subTaskId);
          const nextTaskStatus = remainingSubTasks.length > 0
            ? (areAllSubTasksCompleted(remainingSubTasks) ? STATUS_COMPLETED : STATUS_IN_PROGRESS)
            : normalizeStatus(task.status);
          return {
            ...task,
            status: nextTaskStatus,
            subTasks: remainingSubTasks
          };
        })()
        : task
    ));

    setReminders((prev) => prev.filter((r) => {
      const matchesProject = r.projectId
        ? r.projectId === activeProjectId
        : r.projectName === projectTitle;
      return !(matchesProject && r.taskId === parentId && r.subTaskId === subTaskId);
    }));
  };

  const updateSubTask = (parentId, subTaskId, field, value) => {
    setTasks(tasks.map(task =>
      task.id === parentId
        ? {
          ...task,
          subTasks: task.subTasks.map(st =>
            st.id === subTaskId ? { ...st, [field]: value } : st
          )
        }
        : task
    ));
  };

  const handleLogoUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'customer') setCustomerLogo(e.target.result);
        if (type === 'company') setCompanyLogo(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const importChart = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (Array.isArray(data.projects) && data.projects.length > 0) {
          const importedProjects = data.projects.map((project) => createProjectRecord(project));
          const nextActiveId = importedProjects.some((project) => project.id === data.activeProjectId)
            ? data.activeProjectId
            : importedProjects[0].id;

          setProjects(importedProjects);
          if (Array.isArray(data.reminders)) setReminders(data.reminders);
          if (Array.isArray(data.dismissedAutoAlerts)) setDismissedAutoAlerts(data.dismissedAutoAlerts);
          lastHydratedProjectIdRef.current = null;
          setActiveProjectId(nextActiveId);
          setShowModifyMenu(false);
          setShowHolidayManager(false);
          return;
        }

        if (Array.isArray(data.tasks)) setTasks(normalizeTaskTree(data.tasks));
        if (typeof data.projectTitle === 'string') setProjectTitle(data.projectTitle);
        if (Array.isArray(data.holidays)) setHolidays(data.holidays);
        if (typeof data.customerLogo === 'string' || data.customerLogo === null) setCustomerLogo(data.customerLogo);
        if (typeof data.customerLogoWidth === 'number') setCustomerLogoWidth(data.customerLogoWidth);
        if (typeof data.companyLogo === 'string' || data.companyLogo === null) setCompanyLogo(data.companyLogo);
        if (typeof data.companyLogoWidth === 'number') setCompanyLogoWidth(data.companyLogoWidth);
        if (typeof data.showDates === 'boolean') setShowDates(data.showDates);
        if (typeof data.showQuarters === 'boolean') setShowQuarters(data.showQuarters);
        if (typeof data.showCost === 'boolean') setShowCost(data.showCost);
        if (typeof data.showTotals === 'boolean') setShowTotals(data.showTotals);
        if (typeof data.currency === 'string' && data.currency.length > 0) setCurrency(data.currency);
        if (Array.isArray(data.reminders)) setReminders(data.reminders);
        if (Array.isArray(data.dismissedAutoAlerts)) setDismissedAutoAlerts(data.dismissedAutoAlerts);
      } catch (error) {
        console.error('Error importing chart:', error);
        alert('Failed to import chart. Invalid JSON file.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const loadExternalScript = (src, globalCheck) => {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Cannot load scripts outside browser context'));
    }

    const isReady = () => (typeof globalCheck === 'function' ? globalCheck() : false);
    if (isReady()) return Promise.resolve();

    if (scriptLoaderRef.current[src]) {
      return scriptLoaderRef.current[src];
    }

    scriptLoaderRef.current[src] = new Promise((resolve, reject) => {
      const existingScript =
        document.querySelector(`script[data-external-src="${src}"]`) ||
        Array.from(document.scripts).find((script) => script.src === src);

      if (existingScript) {
        if (isReady() || existingScript.dataset.loaded === '1') {
          resolve();
          return;
        }

        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.externalSrc = src;
      script.onload = () => {
        script.dataset.loaded = '1';
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    }).finally(() => {
      if (!isReady()) {
        delete scriptLoaderRef.current[src];
      }
    });

    return scriptLoaderRef.current[src];
  };

  const exportChart = async (format) => {
    if (!chartRef.current || isDownloading) return;

    setIsDownloading(true);
    setShowModifyMenu(false);

    try {
      if (format === 'json') {
        const projectsSnapshot = saveActiveProjectIntoCollection(projects);
        const activeProject = projectsSnapshot.find((project) => project.id === activeProjectId) || null;
        const data = {
          schemaVersion: 3,
          activeProjectId,
          projects: projectsSnapshot,
          projectTitle: activeProject ? activeProject.projectTitle : projectTitle,
          tasks: activeProject ? activeProject.tasks : normalizeTaskTree(tasks),
          holidays: activeProject ? activeProject.holidays : holidays,
          customerLogo: activeProject ? activeProject.customerLogo : customerLogo,
          customerLogoWidth: activeProject ? activeProject.customerLogoWidth : customerLogoWidth,
          companyLogo: activeProject ? activeProject.companyLogo : companyLogo,
          companyLogoWidth: activeProject ? activeProject.companyLogoWidth : companyLogoWidth,
          showDates: activeProject ? activeProject.showDates : showDates,
          showQuarters: activeProject ? activeProject.showQuarters : showQuarters,
          showCost: activeProject ? activeProject.showCost : showCost,
          showTotals: activeProject ? activeProject.showTotals : showTotals,
          currency: activeProject ? activeProject.currency : currency,
          reminders,
          dismissedAutoAlerts,
          exportedAt: new Date().toISOString()
        };
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
        const link = document.createElement('a');
        link.download = `${projectTitle.replace(/\s+/g, '_')}_gantt_data.json`;
        link.href = dataStr;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      await loadExternalScript(
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
        () => typeof window.html2canvas !== 'undefined'
      );

      await new Promise((resolve) => setTimeout(resolve, 120));

      if (typeof window.html2canvas === 'undefined') {
        throw new Error('html2canvas not loaded');
      }

      const canvas = await window.html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      if (format === 'pdf') {
        await loadExternalScript(
          'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
          () => typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF !== 'undefined'
        );

        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        const doc = new jsPDF('p', 'mm');
        let position = 0;

        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        doc.save(`${projectTitle.replace(/\s+/g, '_')}_gantt_chart.pdf`);
      } else {
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataUrl = canvas.toDataURL(mimeType, 1.0);
        const link = document.createElement('a');
        link.download = `${projectTitle.replace(/\s+/g, '_')}_gantt_chart.${format}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export chart: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const msPerDay = 1000 * 60 * 60 * 24;

  const getTimelineRange = () => {
    if (tasks.length === 0) {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      return { start: today, end: today };
    }

    const allDates = [];
    tasks.forEach(task => {
      allDates.push(getDateAtNoon(task.startDate), getDateAtNoon(task.endDate));
      task.subTasks.forEach(st => {
        allDates.push(getDateAtNoon(st.startDate), getDateAtNoon(st.endDate));
      });
    });

    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    minDate.setDate(1);
    minDate.setHours(12, 0, 0, 0);

    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setDate(0);
    maxDate.setHours(12, 0, 0, 0);

    return { start: minDate, end: maxDate };
  };

  const timelineRange = useMemo(() => getTimelineRange(), [tasks]);
  const timelineStart = timelineRange.start;
  const timelineEnd = timelineRange.end;

  const totalDays = useMemo(() => {
    const days = Math.ceil((timelineEnd - timelineStart) / msPerDay) + 1;
    return Math.max(1, days);
  }, [timelineEnd, timelineStart]);

  const getTaskPosition = (task) => {
    const taskStart = getDateAtNoon(task.startDate);
    const taskEnd = getDateAtNoon(task.endDate);

    const startOffset = Math.max(0, Math.floor((taskStart - timelineStart) / msPerDay));
    const duration = Math.max(1, Math.floor((taskEnd - taskStart) / msPerDay) + 1);

    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;

    return {
      left: `${Math.min(100, Math.max(0, leftPercent))}%`,
      width: `${Math.max(0.8, Math.min(100, widthPercent))}%`
    };
  };

  // Generate month markers
  const generateMonthMarkers = () => {
    const markers = [];
    const current = new Date(timelineStart);
    current.setDate(1); // Start of month

    while (current <= timelineEnd) {
      const offset = Math.ceil((current - timelineStart) / msPerDay);
      const position = (offset / totalDays) * 100;

      markers.push({
        date: new Date(current),
        position: position
      });

      current.setMonth(current.getMonth() + 1);
    }

    return markers;
  };

  const generateQuarterMarkers = () => {
    const markers = [];
    const getNextQuarterStart = (d) => {
      const y = d.getFullYear();
      const m = d.getMonth();
      const quarterStartMonth = Math.floor(m / 3) * 3;
      const nextStartMonth = quarterStartMonth + 3;
      return nextStartMonth >= 12 ? new Date(y + 1, 0, 1) : new Date(y, nextStartMonth, 1);
    };

    const startMarker = new Date(timelineStart);
    startMarker.setHours(0, 0, 0, 0);
    markers.push({
      date: new Date(startMarker),
      position: 0
    });

    let current = getNextQuarterStart(startMarker);
    current.setHours(0, 0, 0, 0);

    while (current <= timelineEnd) {
      const offset = Math.ceil((current - timelineStart) / msPerDay);
      const position = (offset / totalDays) * 100;

      markers.push({
        date: new Date(current),
        position
      });

      current.setMonth(current.getMonth() + 3);
      current.setDate(1);
      current.setHours(0, 0, 0, 0);
    }

    return markers;
  };

  const timelineMarkers = useMemo(
    () => (showQuarters ? generateQuarterMarkers() : generateMonthMarkers()),
    [showQuarters, timelineStart, timelineEnd, totalDays]
  );

  const totalTopLevelTaskDays = useMemo(
    () => tasks.reduce((acc, t) => acc + getBusinessDays(t.startDate, t.endDate, holidays), 0),
    [tasks, holidays]
  );
  const totalTopLevelTaskDaysLabel = tasks.length === 0 ? '-' : `${totalTopLevelTaskDays} Days`;

  const dashboardProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];

    return projects.map((project) => {
      if (project.id !== activeProjectId) return project;

      return {
        ...project,
        projectTitle,
        tasks: normalizeTaskTree(tasks),
        holidays,
        customerLogo,
        customerLogoWidth,
        companyLogo,
        companyLogoWidth,
        showDates,
        showQuarters,
        showCost,
        showTotals,
        currency,
        loginDateSeed
      };
    });
  }, [
    projects,
    activeProjectId,
    projectTitle,
    tasks,
    holidays,
    customerLogo,
    customerLogoWidth,
    companyLogo,
    companyLogoWidth,
    showDates,
    showQuarters,
    showCost,
    showTotals,
    currency,
    loginDateSeed
  ]);

  const getProjectCompletionStats = (projectTasks = []) => {
    if (!Array.isArray(projectTasks) || projectTasks.length === 0) {
      return {
        totalUnits: 0,
        completedUnits: 0,
        completionPercent: 0
      };
    }

    let totalUnits = 0;
    let completedUnits = 0;

    projectTasks.forEach((task) => {
      const subTasks = Array.isArray(task.subTasks) ? task.subTasks : [];
      if (subTasks.length > 0) {
        totalUnits += subTasks.length;
        completedUnits += subTasks.filter((subTask) => normalizeStatus(subTask.status) === STATUS_COMPLETED).length;
      } else {
        totalUnits += 1;
        completedUnits += getTaskCompletionStatus(task) === STATUS_COMPLETED ? 1 : 0;
      }
    });

    const completionPercent = totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0;

    return {
      totalUnits,
      completedUnits,
      completionPercent
    };
  };

  const projectSummaries = useMemo(() => (
    dashboardProjects.map((project) => ({
      id: project.id,
      projectTitle: project.projectTitle,
      ...getProjectCompletionStats(project.tasks)
    }))
  ), [dashboardProjects]);

  const totalPortfolioUnits = useMemo(
    () => projectSummaries.reduce((sum, summary) => sum + summary.totalUnits, 0),
    [projectSummaries]
  );

  const completedPortfolioUnits = useMemo(
    () => projectSummaries.reduce((sum, summary) => sum + summary.completedUnits, 0),
    [projectSummaries]
  );

  const overallCompletion = totalPortfolioUnits > 0
    ? (completedPortfolioUnits / totalPortfolioUnits) * 100
    : 0;

  const completedProjects = useMemo(
    () => projectSummaries.filter((summary) => summary.totalUnits > 0 && summary.completedUnits === summary.totalUnits).length,
    [projectSummaries]
  );

  const isDashboardView = currentView === 'dashboard';
  const isPlannerView = !isDashboardView;
  const actionControlsDisabled = isDashboardView;
  const savedAtLabel = lastSavedAt
    ? lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
  const cloudSyncedLabel = cloudSyncState.lastSyncedAt
    ? cloudSyncState.lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const openPlannerView = () => {
    setShowModifyMenu(false);
    setShowHolidayManager(false);
    setShowNotificationPanel(false);
    navigateToView('planner');
  };

  const openDashboardView = () => {
    setShowModifyMenu(false);
    setShowHolidayManager(false);
    setShowNotificationPanel(false);
    navigateToView('dashboard');
  };

  const showSinglePanelMode = true;
  const useVerticalCommandRail = !isPhoneLayout && !isCompactLayout;

  const openControlPanel = (panelId) => {
    setShowModifyMenu(false);
    if (panelId !== 'utility') {
      setShowNotificationPanel(false);
    }
    setActiveControlPanel(panelId);
  };

  const controlPanelTitles = {
    workspace: 'Workspace',
    utility: 'Navigation + Sync',
    action: 'Planner Actions'
  };

  const activeControlPanelTitle = controlPanelTitles[activeControlPanel] || controlPanelTitles.workspace;

  const showDatesInEditor = showDates && !isCompactLayout;
  const showCostInEditor = showCost && !isCompactLayout;
  const showDatesInChart = showDates && !isCompactLayout;
  const showCostInChart = showCost && !isCompactLayout;
  const showInlineEditorExtras = !isCompactLayout;
  const taskLabelColumnWidth = isPhoneLayout ? 200 : (isCompactLayout ? 240 : 320);

  const chartGridTemplateColumns = showDatesInChart
    ? (showCostInChart
      ? `${taskLabelColumnWidth}px 200px 100px minmax(0, 1fr)`
      : `${taskLabelColumnWidth}px 200px minmax(0, 1fr)`)
    : (showCostInChart
      ? `${taskLabelColumnWidth}px 100px minmax(0, 1fr)`
      : `${taskLabelColumnWidth}px minmax(0, 1fr)`);

  const compactEditorGridColumns = isPhoneLayout
    ? ['26px', 'minmax(0, 1fr)', '104px'].join(' ')
    : ['30px', 'minmax(0, 1fr)', '112px', '78px'].join(' ');

  const editorGridColumns = isCompactLayout
    ? compactEditorGridColumns
    : [
      '36px',
      'minmax(260px, 1fr)',
      '132px',
      '92px',
      ...(showDatesInEditor ? ['150px', '150px'] : []),
      ...(showCostInEditor ? ['140px'] : []),
      '54px',
      '36px',
      '44px'
    ].join(' ');

  const editorRowGap = isPhoneLayout ? '0.65rem' : (isCompactLayout ? '0.55rem' : '1rem');
  const editorStatusControlSize = {
    width: isPhoneLayout ? '102px' : (isCompactLayout ? '106px' : '124px'),
    height: isCompactLayout ? '38px' : '42px',
    fontSize: isPhoneLayout ? '0.76rem' : (isCompactLayout ? '0.74rem' : '0.8rem'),
    borderRadius: isCompactLayout ? '8px' : '9px',
    padding: isCompactLayout ? '0 0.5rem' : '0 0.55rem'
  };

  const editorMinWidth = isCompactLayout
    ? 0
    : (showDatesInEditor
      ? (showCostInEditor ? 1196 : 1056)
      : (showCostInEditor ? 896 : 736));

  const chartGridMinWidth = isCompactLayout
    ? 0
    : (showDatesInChart
      ? (showCostInChart ? 1240 : 1140)
      : (showCostInChart ? 1040 : 940));

  const toolbarGroupBaseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
    padding: '0.56rem',
    borderRadius: '18px',
    border: '1px solid rgba(203, 213, 225, 0.95)',
    background: 'linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.96) 68%, rgba(241, 245, 249, 0.92) 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 14px 26px rgba(15, 23, 42, 0.07)',
    transition: 'border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease'
  };

  const toolbarButtonBaseStyle = {
    height: '43px',
    borderRadius: '12px',
    padding: '0 0.95rem',
    fontSize: '0.84rem',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    whiteSpace: 'nowrap',
    transition: 'transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease, opacity 0.16s ease',
    letterSpacing: '0.01em',
    transform: 'translateY(0)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.72)'
  };

  const toolbarButtonNeutralStyle = {
    ...toolbarButtonBaseStyle,
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    color: '#0f172a',
    border: '1px solid #d1dbe8',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.84), 0 2px 10px rgba(15, 23, 42, 0.06)'
  };

  const toolbarButtonPrimaryStyle = {
    ...toolbarButtonBaseStyle,
    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 52%, #0ea5e9 100%)',
    color: '#ffffff',
    border: '1px solid rgba(29, 78, 216, 0.95)',
    boxShadow: '0 12px 24px rgba(37, 99, 235, 0.27), inset 0 1px 0 rgba(255, 255, 255, 0.28)'
  };

  const toolbarButtonSuccessSoftStyle = {
    ...toolbarButtonBaseStyle,
    background: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
    color: '#166534',
    border: '1px solid #86efac'
  };

  const toolbarButtonAccentSoftStyle = {
    ...toolbarButtonBaseStyle,
    background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)',
    color: '#1e40af',
    border: '1px solid #bfdbfe'
  };

  const toolbarButtonDangerSoftStyle = {
    ...toolbarButtonBaseStyle,
    background: 'linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)',
    color: '#b91c1c',
    border: '1px solid #fecdd3'
  };

  const toolbarSelectStyle = {
    width: '100%',
    height: '43px',
    borderRadius: '12px',
    border: '1px solid #d1dbe8',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    color: '#0f172a',
    fontSize: '0.84rem',
    fontWeight: '700',
    padding: '0 0.75rem',
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.84), 0 2px 10px rgba(15, 23, 42, 0.06)'
  };

  const viewSwitchShellStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.22rem',
    borderRadius: '13px',
    border: '1px solid #d1dbe8',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    padding: '0.2rem',
    minHeight: '43px',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.84)'
  };

  const getViewSwitchButtonStyle = (isActive) => ({
    border: isActive ? '1px solid #1d4ed8' : '1px solid rgba(203, 213, 225, 0.72)',
    background: isActive
      ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 52%, #0ea5e9 100%)'
      : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    color: isActive ? '#ffffff' : '#334155',
    boxShadow: isActive
      ? '0 10px 20px rgba(37, 99, 235, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.24)'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.82)',
    borderRadius: '10px',
    height: '37px',
    padding: '0 0.8rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.38rem',
    fontSize: '0.79rem',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.16s ease',
    minWidth: isPhoneLayout ? 'calc(50% - 0.12rem)' : '108px'
  });

  const toolbarSectionLabelStyle = {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.42rem',
    padding: '0.05rem 0.08rem',
    marginBottom: '0.06rem',
    fontSize: '0.66rem',
    fontWeight: '800',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#475569'
  };

  const toolbarSectionLabelIconStyle = {
    width: '18px',
    height: '18px',
    borderRadius: '999px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #cbd5e1',
    background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
    color: '#334155',
    flex: '0 0 auto'
  };

  const headerMetaPillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    borderRadius: '999px',
    border: '1px solid rgba(203, 213, 225, 0.95)',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    padding: '0.28rem 0.64rem',
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#334155',
    whiteSpace: 'nowrap',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)'
  };

  const syncPillStyle = {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#475569',
    padding: '0.42rem 0.75rem',
    borderRadius: '999px',
    border: '1px solid rgba(203, 213, 225, 0.95)',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.82)',
    whiteSpace: 'nowrap'
  };

  const commandCenterShellStyle = {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: useVerticalCommandRail ? '230px minmax(0, 1fr)' : '1fr',
    gap: '0.72rem',
    alignItems: 'start',
    minWidth: 0
  };

  const commandRailStyle = {
    borderRadius: '18px',
    border: '1px solid #dbe4ef',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.88), 0 12px 24px rgba(15, 23, 42, 0.08)',
    padding: '0.68rem',
    display: 'grid',
    gap: '0.5rem',
    position: 'sticky',
    top: '0.75rem'
  };

  const getCommandToggleStyle = (isActive) => ({
    height: isPhoneLayout ? '40px' : '44px',
    width: '100%',
    borderRadius: '12px',
    border: isActive ? '1px solid #1d4ed8' : '1px solid #d1dbe8',
    background: isActive
      ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 52%, #0ea5e9 100%)'
      : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    color: isActive ? '#ffffff' : '#334155',
    boxShadow: isActive
      ? '0 10px 20px rgba(37, 99, 235, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.24)'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.84)',
    fontSize: isPhoneLayout ? '0.76rem' : '0.78rem',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.42rem',
    transition: 'all 0.16s ease',
    padding: '0 0.72rem'
  });

  const getCommandPanelToggleStyle = (panelId) => getCommandToggleStyle(activeControlPanel === panelId);
  const getCommandViewToggleStyle = (isActive) => getCommandToggleStyle(isActive);

  const controlPanelCardStyle = {
    borderRadius: '20px',
    border: '1px solid #dbe4ef',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    boxShadow: '0 14px 28px rgba(15, 23, 42, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    padding: isPhoneLayout ? '0.75rem' : '0.9rem',
    display: 'grid',
    gap: '0.68rem',
    minWidth: 0
  };

  const controlPanelCardHeaderStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.7rem'
  };

  const controlPanelInnerGroupStyle = showSinglePanelMode
    ? {
      border: 'none',
      background: 'transparent',
      boxShadow: 'none',
      padding: 0,
      gap: isPhoneLayout ? '0.52rem' : '0.58rem',
      width: '100%'
    }
    : {};

  return (
    <div className="app-shell" style={{
      minHeight: '100vh',
      background: '#ffffff',
      padding: '3rem 2rem',
      fontFamily: '"Outfit", sans-serif',
      color: '#0f172a'
    }}>
      <div className="app-main" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        animation: 'fadeIn 0.6s ease-out'
      }}>
        {showWelcomeBanner && (
          <div className="welcome-overlay" role="dialog" aria-modal="true" aria-label="Welcome tutorial">
            <div className="welcome-card">
              <div className="welcome-card-header">
                <div className="welcome-badge">
                  <Sparkles size={16} />
                  New Workspace Tour
                </div>
                <h2>Welcome to your project tracker</h2>
                <p>
                  We will guide you through the polished command-center workflow: manage projects quickly,
                  switch smoothly between planner and dashboard on any device, and share progress with one snapshot.
                </p>
              </div>

              <div className="welcome-preview-shell">
                <div className="welcome-preview-toolbar">
                  <div className="welcome-preview-label">Updated Tutorial Reel</div>
                  <button
                    type="button"
                    onClick={() => setIsWelcomePreviewPlaying((prev) => !prev)}
                    className="welcome-preview-toggle"
                  >
                    {isWelcomePreviewPlaying ? 'Pause Reel' : 'Play Reel'}
                  </button>
                </div>

                {activeWelcomePreview && (
                  <div
                    className="welcome-preview-frame"
                    style={{
                      background: activeWelcomePreview.tone,
                      borderColor: activeWelcomePreview.border
                    }}
                  >
                    <div className="welcome-preview-frame-head">
                      <div className="welcome-preview-icon">{activeWelcomePreview.icon}</div>
                      <div>
                        <h3>{activeWelcomePreview.title}</h3>
                        <p>{activeWelcomePreview.body}</p>
                      </div>
                    </div>

                    <div className="welcome-preview-bullets">
                      {activeWelcomePreview.bullets.map((bullet) => (
                        <span key={bullet}>{bullet}</span>
                      ))}
                    </div>

                    <div className="welcome-preview-cue">{activeWelcomePreview.cue}</div>
                  </div>
                )}

                <div className="welcome-preview-controls">
                  <button
                    type="button"
                    onClick={goToPreviousWelcomePreview}
                    className="welcome-preview-nav"
                  >
                    Previous
                  </button>

                  <div className="welcome-preview-dots" role="tablist" aria-label="Tutorial preview frames">
                    {welcomePreviewFrames.map((frame, index) => {
                      const isActive = index === welcomePreviewIndex;
                      return (
                        <button
                          key={frame.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          aria-label={`Preview frame ${index + 1}: ${frame.title}`}
                          onClick={() => setWelcomePreviewIndex(index)}
                          className="welcome-preview-dot"
                        >
                          <span
                            style={{
                              width: isActive ? '32px' : '11px',
                              background: isActive ? '#1e3a8a' : '#cbd5e1'
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={goToNextWelcomePreview}
                    className="welcome-preview-nav"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="welcome-feature-grid">
                <div>
                  <h4>Command-center header</h4>
                  <p>Use grouped controls for workspace, view switch, actions, and sync with a stable layout on desktop and mobile.</p>
                </div>
                <div>
                  <h4>Status tracking</h4>
                  <p>Set each task and subtask to In Progress or Completed with automatic strike-through updates.</p>
                </div>
                <div>
                  <h4>Project lifecycle control</h4>
                  <p>Add, switch, and safely delete projects while keeping one active workspace always available.</p>
                </div>
                <div>
                  <h4>Dashboard + snapshot sharing</h4>
                  <p>Monitor completion across all projects and export a single image with tasks, subtasks, and statuses.</p>
                </div>
                <div>
                  <h4>Branding and holidays</h4>
                  <p>Upload logos and configure holidays so timelines and exports reflect real business plans.</p>
                </div>
                <div>
                  <h4>Optional sign-in sync</h4>
                  <p>Sign in with Gmail only when you want one live source of truth across multiple devices.</p>
                </div>
              </div>

              <div className="welcome-actions">
                <button
                  onClick={startTutorial}
                  style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    height: '46px',
                    padding: '0 1.25rem',
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.55rem'
                  }}
                >
                  <BookOpenCheck size={17} />
                  Start Guided Tutorial
                </button>

                <button
                  onClick={skipTutorial}
                  style={{
                    background: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    height: '46px',
                    padding: '0 1.1rem',
                    fontSize: '0.92rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        )}

        {isTutorialActive && activeTutorialStep && (
          <div className="tutorial-coachmark" role="dialog" aria-live="polite">
            <div className="tutorial-step-count">
              Step {tutorialStepIndex + 1} of {tutorialSteps.length}
            </div>
            <h4>{activeTutorialStep.title}</h4>
            <p>{activeTutorialStep.body}</p>

            <div className="tutorial-highlight-meta">
              <div className="tutorial-highlight-chip">Highlighting: {activeTutorialTargetLabel}</div>
              <div className="tutorial-highlight-tip">Do this now: {activeTutorialTargetAction}</div>
            </div>

            <div className="tutorial-actions">
              <button onClick={locateTutorialTarget} className="tutorial-secondary-btn">
                Locate
              </button>

              <button
                onClick={goToPreviousTutorialStep}
                disabled={tutorialStepIndex === 0}
                className="tutorial-secondary-btn"
              >
                Back
              </button>

              <button onClick={skipTutorial} className="tutorial-secondary-btn">
                Skip
              </button>

              <button onClick={goToNextTutorialStep} className="tutorial-primary-btn">
                {tutorialStepIndex === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {isTutorialActive && tutorialFocusRect && (
          <div
            className="tutorial-focus-ring"
            style={{
              top: `${tutorialFocusRect.top}px`,
              left: `${tutorialFocusRect.left}px`,
              width: `${tutorialFocusRect.width}px`,
              height: `${tutorialFocusRect.height}px`
            }}
          />
        )}

        {showTabAttentionBanner && tabAttentionCount > 0 && (
          <div
            role="status"
            aria-live="polite"
            style={{
              marginBottom: '0.95rem',
              borderRadius: '16px',
              border: '1px solid #fcd34d',
              background: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)',
              boxShadow: '0 14px 30px rgba(146, 64, 14, 0.16)',
              padding: isPhoneLayout ? '0.72rem' : '0.75rem 0.85rem',
              display: 'flex',
              flexDirection: isPhoneLayout ? 'column' : 'row',
              alignItems: isPhoneLayout ? 'stretch' : 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div style={{ minWidth: 0, display: 'grid', gap: '0.22rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', fontWeight: '800', color: '#92400e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <BellRing size={14} />
                Reminder Alert
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#78350f', lineHeight: 1.35 }}>
                {tabAttentionCount > 1
                  ? `${tabAttentionCount} reminders fired while this tab was in the background.`
                  : (latestTabAttentionNotification?.body || 'A reminder just fired.')}
              </div>
              {tabAttentionCount > 1 && latestTabAttentionNotification?.body && (
                <div style={{ fontSize: '0.77rem', fontWeight: '700', color: '#92400e', lineHeight: 1.4 }}>
                  Latest: {latestTabAttentionNotification.body}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: isPhoneLayout ? 'flex-start' : 'flex-end' }}>
              <button
                type="button"
                onClick={openReminderCenterFromBanner}
                style={{
                  height: '34px',
                  borderRadius: '9px',
                  border: '1px solid #d97706',
                  background: '#f59e0b',
                  color: '#ffffff',
                  padding: '0 0.68rem',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Open Reminder Center
              </button>
              <button
                type="button"
                onClick={clearTabAttentionIndicators}
                style={{
                  height: '34px',
                  borderRadius: '9px',
                  border: '1px solid #fcd34d',
                  background: '#ffffff',
                  color: '#92400e',
                  padding: '0 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="top-header" style={{
          marginBottom: '2.05rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: '0.9rem',
          position: 'relative',
          top: 'auto',
          zIndex: 1,
          overflow: 'visible',
          padding: isPhoneLayout ? '0.9rem' : '1.2rem 1.25rem',
          borderRadius: '24px',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 64%, #f1f5f9 100%)',
          border: '1px solid rgba(203, 213, 225, 0.82)',
          boxShadow: '0 22px 42px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.92)'
        }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-85px',
              right: '-70px',
              width: '220px',
              height: '220px',
              borderRadius: '999px',
              background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(14, 165, 233, 0) 72%)',
              pointerEvents: 'none'
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '-100px',
              left: '-80px',
              width: '250px',
              height: '250px',
              borderRadius: '999px',
              background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0) 72%)',
              pointerEvents: 'none'
            }}
          />

          <div className="top-header-meta" style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.42rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              ...headerMetaPillStyle,
              background: 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)',
              border: '1px solid rgba(147, 197, 253, 0.9)',
              color: '#1e3a8a'
            }}>
              <Sparkles size={13} />
              Command Center
            </div>
            <div style={headerMetaPillStyle}>
              <BarChart3 size={13} />
              {isDashboardView ? 'Dashboard Mode' : 'Planner Mode'}
            </div>
            {!isPhoneLayout && (
            <div style={{ ...headerMetaPillStyle, maxWidth: isCompactLayout ? '300px' : '360px' }}>
              <Clock size={13} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Next reminder: {nextReminderLabel}
              </span>
            </div>
            )}
            {!isCompactLayout && !isPhoneLayout && (
            <div style={{ ...headerMetaPillStyle, maxWidth: '320px' }}>
              <Bell size={13} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nextReminderDetail}
              </span>
            </div>
            )}
          </div>

          {isEditingTitle ? (
            <input
              ref={titleRef}
              className={activeTutorialTarget === 'title' ? 'tutorial-target-active' : ''}
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyPress={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
              style={{
                fontSize: 'clamp(1.35rem, 2.1vw, 2.35rem)',
                fontWeight: '800',
                color: '#020617',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid rgba(15, 23, 42, 0.75)',
                outline: 'none',
                padding: '0.35rem 0',
                width: '100%',
                position: 'relative',
                zIndex: 1
              }}
            />
          ) : (
            <h1
              ref={titleRef}
              className={`project-title ${activeTutorialTarget === 'title' ? 'tutorial-target-active' : ''}`}
              onClick={() => setIsEditingTitle(true)}
              style={{
                fontSize: 'clamp(1.35rem, 2.1vw, 2.35rem)',
                fontWeight: '800',
                color: '#020617',
                margin: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'opacity 0.2s',
                flex: '0 1 auto',
                minWidth: 0,
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.1,
                letterSpacing: '-0.015em',
                position: 'relative',
                zIndex: 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {projectTitle}
              <Edit2 size={28} style={{ opacity: 0.5 }} />
            </h1>
          )}

          <div style={{
            position: 'relative',
            zIndex: 1,
            fontSize: '0.8rem',
            fontWeight: '700',
            color: '#64748b',
            lineHeight: 1.35
          }}>
            Premium workflow: manage projects, switch views, and keep reminders focused without clutter.
          </div>

          <div ref={commandCenterRef} className="command-center-shell" style={commandCenterShellStyle}>
            {!isPhoneLayout && useVerticalCommandRail && (
              <div className="command-rail" style={commandRailStyle}>
                <div style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', padding: '0 0.15rem' }}>
                  Quick Access
                </div>

                <button
                  type="button"
                  onClick={() => {
                    openPlannerView();
                    openControlPanel('action');
                  }}
                  style={{
                    ...getCommandPanelToggleStyle('action'),
                    minWidth: '100%'
                  }}
                  title="Open planner actions"
                >
                  <Settings size={15} />
                  Planner Actions
                </button>

                <div style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', padding: '0 0.15rem' }}>
                  Control Panels
                </div>

                <button type="button" onClick={() => openControlPanel('workspace')} style={getCommandPanelToggleStyle('workspace')}>
                  <FolderPlus size={15} />
                  Workspace
                </button>
                <button type="button" onClick={() => openControlPanel('utility')} style={getCommandPanelToggleStyle('utility')}>
                  <Bell size={15} />
                  Navigation + Sync
                </button>
                <button
                  type="button"
                  ref={dashboardButtonRef}
                  className={activeTutorialTarget === 'dashboardButton' ? 'tutorial-target-active' : ''}
                  onClick={openDashboardView}
                  style={getCommandViewToggleStyle(isDashboardView)}
                  title="Open dashboard view"
                >
                  <BarChart3 size={15} />
                  Dashboard
                </button>

                <div style={{
                  marginTop: '0.28rem',
                  borderRadius: '12px',
                  border: '1px solid #dbe4ef',
                  background: '#f8fafc',
                  padding: '0.55rem 0.6rem',
                  fontSize: '0.72rem',
                  color: '#64748b',
                  fontWeight: '700',
                  lineHeight: 1.35
                }}>
                  {savedAtLabel ? `Saved ${savedAtLabel}` : 'Auto-save active'}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: '0.62rem', minWidth: 0 }}>
              {(isPhoneLayout || !useVerticalCommandRail) && (
                <div style={{ display: 'grid', gap: '0.45rem', minWidth: 0 }}>

                <button
                  type="button"
                  onClick={() => {
                    openPlannerView();
                    openControlPanel('action');
                  }}
                  style={{
                    ...getCommandPanelToggleStyle('action'),
                    width: '100%',
                    minWidth: '100%'
                  }}
                  title="Open planner actions"
                >
                  <Settings size={15} />
                  Planner Actions
                </button>

                <div className="command-panel-tabs" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '0.45rem',
                  minWidth: 0
                }}>
                  <button type="button" onClick={() => openControlPanel('workspace')} style={getCommandPanelToggleStyle('workspace')}>
                    <FolderPlus size={14} />
                    Workspace
                  </button>
                  <button type="button" onClick={() => openControlPanel('utility')} style={getCommandPanelToggleStyle('utility')}>
                    <Bell size={14} />
                    Navigation
                  </button>
                  <button
                    type="button"
                    ref={dashboardButtonRef}
                    className={activeTutorialTarget === 'dashboardButton' ? 'tutorial-target-active' : ''}
                    onClick={openDashboardView}
                    style={getCommandViewToggleStyle(isDashboardView)}
                    title="Open dashboard view"
                  >
                    <BarChart3 size={14} />
                    Dashboard
                  </button>
                </div>
                </div>
              )}

              <div
                className="header-controls command-panel-host"
                style={{
                  display: 'block',
                  padding: 0,
                  borderRadius: 0,
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  width: '100%',
                  flex: '1 1 auto',
                  overflowX: 'visible',
                  scrollbarWidth: 'none',
                  minWidth: 0
                }}
              >
            {(!showSinglePanelMode || activeControlPanel === 'workspace') && (
            <div className="command-panel-card workspace-panel" style={controlPanelCardStyle}>
              <div style={controlPanelCardHeaderStyle}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.71rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#1e3a8a' }}>
                    <FolderPlus size={13} />
                    Workspace
                  </div>
                  <div style={{ marginTop: '0.2rem', fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>
                    Switch projects and manage your active workspace.
                  </div>
                </div>
                {showSinglePanelMode && (
                  <div style={{
                    borderRadius: '999px',
                    border: '1px solid #dbe4ef',
                    background: '#ffffff',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    color: '#64748b',
                    whiteSpace: 'nowrap'
                  }}>
                    {activeControlPanelTitle}
                  </div>
                )}
              </div>

              <div
                className="toolbar-group workspace-group"
                style={{
                  ...toolbarGroupBaseStyle,
                  ...controlPanelInnerGroupStyle,
                  flex: showSinglePanelMode ? '1 1 auto' : (isPhoneLayout ? '1 1 100%' : '1.5 1 360px'),
                  minWidth: showSinglePanelMode ? '100%' : (isPhoneLayout ? '100%' : '320px')
                }}
              >
              {!showSinglePanelMode && (
              <div style={toolbarSectionLabelStyle}>
                <span style={toolbarSectionLabelIconStyle}>
                  <FolderPlus size={11} />
                </span>
                Workspace
              </div>
              )}

              <div
                style={{ minWidth: isPhoneLayout ? '100%' : '220px', flex: isPhoneLayout ? '1 1 auto' : '1 1 220px' }}
                className={`toolbar-select-wrap ${activeTutorialTarget === 'projectSwitcher' ? 'tutorial-target-active' : ''}`}
              >
              <select
                ref={projectSwitcherRef}
                value={activeProjectId || ''}
                onChange={(e) => switchProject(e.target.value)}
                style={toolbarSelectStyle}
                aria-label="Select project"
              >
                {dashboardProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectTitle}
                  </option>
                ))}
              </select>
              </div>

              <button
                type="button"
                ref={addProjectButtonRef}
                className={activeTutorialTarget === 'addProjectButton' ? 'tutorial-target-active' : ''}
                onClick={addProject}
                style={{
                  ...toolbarButtonAccentSoftStyle,
                  width: isPhoneLayout ? '100%' : 'auto'
                }}
                title="Add New Project"
              >
                <FolderPlus size={16} />
                Add Project
              </button>

              <button
                type="button"
                ref={deleteProjectButtonRef}
                className={activeTutorialTarget === 'deleteProjectButton' ? 'tutorial-target-active' : ''}
                onClick={deleteActiveProject}
                disabled={!activeProjectId}
                style={{
                  ...toolbarButtonDangerSoftStyle,
                  width: isPhoneLayout ? '100%' : 'auto',
                  opacity: activeProjectId ? 1 : 0.6,
                  cursor: activeProjectId ? 'pointer' : 'not-allowed'
                }}
                title="Delete selected project"
              >
                <Trash2 size={16} />
                Delete Project
              </button>
              </div>
            </div>
            )}

            {(!showSinglePanelMode || activeControlPanel === 'utility') && (
            <div className="command-panel-card utility-panel" style={controlPanelCardStyle}>
              <div style={controlPanelCardHeaderStyle}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.71rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#1e3a8a' }}>
                    <Bell size={13} />
                    Navigation + Sync
                  </div>
                  <div style={{ marginTop: '0.2rem', fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>
                    Jump back to Planner, manage reminders, and monitor cloud sync status.
                  </div>
                </div>
                <div style={{
                  borderRadius: '999px',
                  border: '1px solid #dbe4ef',
                  background: '#ffffff',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  color: '#64748b',
                  whiteSpace: 'nowrap'
                }}>
                  {activeControlPanelTitle}
                </div>
              </div>

              <div
                className="toolbar-group utility-group"
                style={{
                  ...toolbarGroupBaseStyle,
                  ...controlPanelInnerGroupStyle,
                  flex: showSinglePanelMode ? '1 1 auto' : (isPhoneLayout ? '1 1 100%' : '1.05 1 330px'),
                  minWidth: showSinglePanelMode ? '100%' : (isPhoneLayout ? '100%' : '280px'),
                  marginLeft: showSinglePanelMode ? 0 : (isPhoneLayout ? 0 : 'auto')
                }}
              >
              {!showSinglePanelMode && (
              <div style={toolbarSectionLabelStyle}>
                <span style={toolbarSectionLabelIconStyle}>
                  <BarChart3 size={11} />
                </span>
                Navigation + Sync
              </div>
              )}

              <button
                type="button"
                ref={viewSwitchRef}
                className={activeTutorialTarget === 'viewSwitch' ? 'tutorial-target-active' : ''}
                onClick={openPlannerView}
                style={{
                  ...getViewSwitchButtonStyle(isPlannerView),
                  width: isPhoneLayout ? '100%' : 'auto',
                  minWidth: isPhoneLayout ? '100%' : '120px'
                }}
                title="Open planner view"
              >
                <Calendar size={15} />
                Planner
              </button>

              <button
                type="button"
                ref={signInButtonRef}
                className={activeTutorialTarget === 'signInButton' ? 'tutorial-target-active' : ''}
                onClick={openSignInPrompt}
                style={{
                  ...(authSession.isAuthenticated ? toolbarButtonSuccessSoftStyle : toolbarButtonNeutralStyle),
                  width: isPhoneLayout ? '100%' : 'auto'
                }}
                title={authSession.isAuthenticated ? 'Cloud sync connected' : 'Optional sign-in for cloud sync'}
              >
                {authSession.isAuthenticated ? <Cloud size={16} /> : <LogIn size={16} />}
                {authSession.isAuthenticated ? 'Cloud Sync On' : 'Sign In (Optional)'}
              </button>

              <div style={{ position: 'relative', flex: isPhoneLayout ? '1 1 100%' : '0 0 auto', width: isPhoneLayout ? '100%' : 'auto' }}>
                <button
                  type="button"
                  ref={reminderBellRef}
                  className={activeTutorialTarget === 'reminderBell' ? 'tutorial-target-active' : ''}
                  onClick={() => {
                    setShowHolidayManager(false);
                    openControlPanel('utility');
                    setShowNotificationPanel((prev) => {
                      const nextPanelState = !prev;
                      if (nextPanelState) {
                        clearTabAttentionIndicators();
                      }
                      return nextPanelState;
                    });
                  }}
                  style={{
                    ...toolbarButtonNeutralStyle,
                    width: isPhoneLayout ? '100%' : '46px',
                    padding: isPhoneLayout ? '0 0.85rem' : 0,
                    background: showNotificationPanel ? '#eef2ff' : toolbarButtonNeutralStyle.background,
                    border: showNotificationPanel ? '1px solid rgba(99, 102, 241, 0.45)' : toolbarButtonNeutralStyle.border,
                    color: showNotificationPanel ? '#3730a3' : toolbarButtonNeutralStyle.color,
                    boxShadow: showNotificationPanel ? '0 8px 18px rgba(99, 102, 241, 0.14)' : 'none',
                    position: 'relative',
                    gap: isPhoneLayout ? '0.5rem' : 0
                  }}
                  title="Reminder center"
                  aria-label="Reminder center"
                >
                  {notificationBadgeCount > 0 ? <BellRing size={17} /> : <Bell size={17} />}
                  {isPhoneLayout && <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>Reminders</span>}
                  {notificationBadgeCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: isPhoneLayout ? '6px' : '-6px',
                      right: isPhoneLayout ? '10px' : '-6px',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '999px',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 0.3rem',
                      border: '2px solid #ffffff',
                      lineHeight: 1
                    }}>
                      {notificationBadgeCount > 99 ? '99+' : notificationBadgeCount}
                    </span>
                  )}
                </button>

                {showNotificationPanel && (
                  <div
                    ref={notificationPanelRef}
                    style={{
                      position: 'absolute',
                      top: '110%',
                      right: isPhoneLayout ? 'auto' : 0,
                      left: isPhoneLayout ? 0 : 'auto',
                      width: isPhoneLayout ? '100%' : 'min(480px, calc(100vw - 3rem))',
                      maxHeight: isPhoneLayout ? 'min(70vh, 640px)' : 'min(80vh, 720px)',
                      overflowY: 'auto',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '20px',
                      boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18), 0 4px 16px rgba(15, 23, 42, 0.08)',
                      zIndex: 85,
                      animation: 'popIn 0.16s ease-out both',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Panel Header */}
                    <div style={{
                      padding: '1rem 1.1rem 0.75rem',
                      borderBottom: '1px solid #f1f5f9',
                      background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '10px',
                          background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                          border: '1px solid #c7d2fe',
                          display: 'grid', placeItems: 'center', flexShrink: 0
                        }}>
                          <BellRing size={16} style={{ color: '#4f46e5' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>
                            Reminder Center
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', marginTop: '0.1rem' }}>
                            {pendingReminderCount} scheduled &nbsp;·&nbsp; {activeNotificationCount} live alert{activeNotificationCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNotificationPanel(false)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '9px',
                          border: '1px solid #e2e8f0', background: '#f8fafc',
                          color: '#64748b', display: 'inline-flex',
                          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          flexShrink: 0, transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                        aria-label="Close reminder center"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div style={{ padding: '0.85rem 1.1rem', display: 'grid', gap: '1rem', overflowY: 'auto', maxHeight: isPhoneLayout ? 'calc(min(70vh, 640px) - 72px)' : 'calc(min(80vh, 720px) - 72px)' }}>

                    {/* Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.55rem' }}>
                      {[
                        { label: 'Upcoming', value: pendingReminderCount, bg: '#eef2ff', border: '#c7d2fe', valueColor: '#3730a3', dotColor: '#6366f1' },
                        { label: 'Due Today', value: dueTodayReminderCount, bg: '#fffbeb', border: '#fde68a', valueColor: '#92400e', dotColor: '#f59e0b' },
                        { label: 'Live Alerts', value: activeNotificationCount, bg: '#fef2f2', border: '#fecaca', valueColor: '#991b1b', dotColor: '#ef4444' }
                      ].map((item) => (
                        <div key={item.label} style={{
                          borderRadius: '12px', border: `1px solid ${item.border}`,
                          background: item.bg, padding: '0.62rem 0.7rem',
                          display: 'flex', flexDirection: 'column', gap: '0.25rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: item.dotColor, flexShrink: 0 }} />
                            <span style={{ fontSize: '0.62rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
                              {item.label}
                            </span>
                          </div>
                          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: item.valueColor, lineHeight: 1, letterSpacing: '-0.02em' }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Next Reminder Highlight */}
                    <div style={{
                      borderRadius: '12px', border: '1px solid #e2e8f0',
                      background: '#f8fafc', padding: '0.75rem 0.85rem',
                      display: 'flex', alignItems: 'flex-start', gap: '0.65rem'
                    }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: nextPendingReminder ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : '#f1f5f9',
                        border: nextPendingReminder ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                        display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: '1px'
                      }}>
                        <Clock size={14} style={{ color: nextPendingReminder ? '#1d4ed8' : '#94a3b8' }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>
                          Next Scheduled
                        </div>
                        <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>
                          {nextReminderLabel}
                        </div>
                        <div style={{ fontSize: '0.73rem', fontWeight: '600', color: '#64748b', marginTop: '0.18rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {nextReminderDetail}
                        </div>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div style={{
                      borderRadius: '12px', border: '1px solid #e2e8f0',
                      background: '#ffffff', overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '0.55rem 0.85rem',
                        borderBottom: '1px solid #f1f5f9',
                        background: '#f8fafc',
                        fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8',
                        textTransform: 'uppercase', letterSpacing: '0.1em'
                      }}>
                        Preferences
                      </div>
                      <div style={{ padding: '0.15rem 0' }}>
                        {/* Browser Notifications Row */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: '0.75rem', padding: '0.6rem 0.85rem',
                          borderBottom: '1px solid #f8fafc'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>Browser Notifications</div>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '600', marginTop: '0.06rem' }}>
                              System alerts when tab is inactive
                            </div>
                          </div>
                          <span style={{
                            padding: '0.22rem 0.6rem', borderRadius: '999px',
                            border: browserNotificationPermission === 'granted' ? '1px solid #86efac' : '1px solid #e2e8f0',
                            background: browserNotificationPermission === 'granted' ? '#f0fdf4' : '#f8fafc',
                            color: browserNotificationPermission === 'granted' ? '#166534' : '#64748b',
                            textTransform: 'capitalize', fontSize: '0.68rem', fontWeight: '800', flexShrink: 0
                          }}>
                            {browserNotificationPermission === 'unsupported' ? 'Not Supported' : browserNotificationPermission}
                          </span>
                        </div>
                        {/* Sound Toggle */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: '0.75rem', padding: '0.6rem 0.85rem',
                          borderBottom: '1px solid #f8fafc'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>Reminder Sound</div>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '600', marginTop: '0.06rem' }}>
                              Play audio cue when reminders fire
                            </div>
                          </div>
                          <label className="ent-toggle" aria-label="Toggle reminder sound">
                            <input
                              type="checkbox"
                              checked={reminderNotificationPrefs.soundEnabled}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setReminderNotificationPrefs((prev) => ({ ...prev, soundEnabled: checked }));
                              }}
                            />
                            <span className="ent-toggle-track" />
                          </label>
                        </div>
                        {/* Tab Flash Toggle */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: '0.75rem', padding: '0.6rem 0.85rem'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>Tab Title Flashing</div>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '600', marginTop: '0.06rem' }}>
                              Flash browser tab on new alerts
                            </div>
                          </div>
                          <label className="ent-toggle" aria-label="Toggle tab title flashing">
                            <input
                              type="checkbox"
                              checked={reminderNotificationPrefs.tabTitleFlashEnabled}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setReminderNotificationPrefs((prev) => ({ ...prev, tabTitleFlashEnabled: checked }));
                              }}
                            />
                            <span className="ent-toggle-track" />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Upcoming Reminders */}
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Upcoming Reminders
                        </div>
                        {pendingReminderCount > upcomingReminders.length && (
                          <div style={{
                            fontSize: '0.65rem', fontWeight: '800', color: '#6366f1',
                            background: '#eef2ff', border: '1px solid #c7d2fe',
                            borderRadius: '999px', padding: '0.1rem 0.42rem'
                          }}>
                            +{pendingReminderCount - upcomingReminders.length} more
                          </div>
                        )}
                      </div>

                      <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'grid', gap: '0.38rem' }}>
                        {upcomingReminders.length === 0 ? (
                          <div style={{
                            border: '1.5px dashed #e2e8f0', borderRadius: '12px',
                            padding: '1rem', textAlign: 'center',
                            display: 'grid', gap: '0.35rem', placeItems: 'center'
                          }}>
                            <Clock size={20} style={{ color: '#cbd5e1' }} />
                            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8' }}>
                              No scheduled reminders yet
                            </div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#cbd5e1' }}>
                              Use the bell icon on any task row
                            </div>
                          </div>
                        ) : upcomingReminders.map((reminder) => (
                          <div key={reminder.id} style={{
                            borderRadius: '12px', border: '1px solid #f1f5f9',
                            background: '#ffffff', padding: '0.7rem 0.8rem',
                            display: 'grid', gap: '0.3rem',
                            boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
                            transition: 'box-shadow 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.08)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.04)'}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {reminder.itemName}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', marginTop: '0.1rem' }}>
                                  {reminder.projectName}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => deleteReminder(reminder.id)}
                                style={{
                                  width: '26px', height: '26px', borderRadius: '8px',
                                  border: '1px solid #fee2e2', background: '#fff5f5',
                                  color: '#ef4444', display: 'inline-flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', flex: '0 0 auto', transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.color = '#ef4444'; }}
                                title="Delete reminder"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.32rem' }}>
                              <Clock size={11} style={{ color: '#6366f1', flexShrink: 0 }} />
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4f46e5', fontFamily: '"JetBrains Mono", monospace' }}>
                                {formatReminderDateTimeLabel(reminder.date, reminder.time)}
                              </span>
                            </div>
                            {reminder.note && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', lineHeight: 1.35, borderTop: '1px solid #f8fafc', paddingTop: '0.28rem' }}>
                                {reminder.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Alerts */}
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Recent Alerts
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.28rem' }}>
                            <span style={{ fontSize: '0.63rem', fontWeight: '800', color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '999px', padding: '0.08rem 0.38rem' }}>
                              Manual {manualNotificationCount}
                            </span>
                            <span style={{ fontSize: '0.63rem', fontWeight: '800', color: '#0369a1', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '999px', padding: '0.08rem 0.38rem' }}>
                              Auto {autoNotificationCount}
                            </span>
                          </div>
                        </div>
                        {recentNotifications.length > 0 && (
                          <button
                            type="button"
                            onClick={clearAllNotifications}
                            style={{
                              border: '1px solid #e2e8f0', background: '#f8fafc',
                              borderRadius: '8px', height: '26px', padding: '0 0.6rem',
                              fontSize: '0.68rem', fontWeight: '800', color: '#64748b',
                              cursor: 'pointer', transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'grid', gap: '0.38rem' }}>
                        {recentNotifications.length === 0 ? (
                          <div style={{
                            border: '1.5px dashed #e2e8f0', borderRadius: '12px',
                            padding: '1rem', textAlign: 'center',
                            display: 'grid', gap: '0.35rem', placeItems: 'center'
                          }}>
                            <BellRing size={20} style={{ color: '#cbd5e1' }} />
                            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8' }}>
                              No alerts yet
                            </div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#cbd5e1' }}>
                              Alerts appear when reminders fire in their scheduled window
                            </div>
                          </div>
                        ) : recentNotifications.slice(0, 8).map((notification) => (
                          <div key={notification.id} style={{
                            borderRadius: '12px', border: '1px solid #f1f5f9',
                            background: '#ffffff', padding: '0.65rem 0.8rem',
                            display: 'grid', gap: '0.22rem',
                            boxShadow: '0 1px 4px rgba(15,23,42,0.04)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.45rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
                                <span style={{
                                  padding: '0.14rem 0.42rem', borderRadius: '999px', flexShrink: 0,
                                  border: notification.kind === 'auto' ? '1px solid #bae6fd' : '1px solid #c7d2fe',
                                  background: notification.kind === 'auto' ? '#e0f2fe' : '#eef2ff',
                                  color: notification.kind === 'auto' ? '#0369a1' : '#4f46e5',
                                  fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em'
                                }}>
                                  {notification.kind === 'auto' ? 'Auto' : 'Manual'}
                                </span>
                                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {notification.title}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => dismissNotification(notification.id)}
                                style={{
                                  width: '24px', height: '24px', borderRadius: '7px',
                                  border: '1px solid #e2e8f0', background: '#f8fafc',
                                  color: '#94a3b8', display: 'inline-flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', flex: '0 0 auto', transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#94a3b8'; }}
                                title="Dismiss alert"
                              >
                                <X size={11} />
                              </button>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: '600', lineHeight: 1.4 }}>{notification.body}</div>
                            <div style={{ fontSize: '0.65rem', color: '#cbd5e1', fontWeight: '700', fontFamily: '"JetBrains Mono", monospace' }}>
                              {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Precision delivery note */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.38rem',
                      padding: '0.5rem 0.7rem', borderRadius: '10px',
                      background: '#f8fafc', border: '1px solid #f1f5f9',
                      fontSize: '0.69rem', fontWeight: '600', color: '#94a3b8', lineHeight: 1.35
                    }}>
                      <Clock size={12} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                      Reminders fire at the exact scheduled window — missed times are skipped to prevent alert pile-up.
                    </div>

                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={openGuideIntro}
                style={{
                  ...toolbarButtonNeutralStyle,
                  width: isPhoneLayout ? '100%' : 'auto'
                }}
                title="Start guided tutorial"
              >
                <BookOpenCheck size={16} />
                Guide
              </button>

              {!isPhoneLayout && (
                <div className="toolbar-sync-pill" style={syncPillStyle}>
                  {savedAtLabel ? `Auto-saved ${savedAtLabel}` : 'Auto-save active'}
                  {authSession.isAuthenticated && cloudSyncState.isSaving && ' • Syncing cloud...'}
                  {authSession.isAuthenticated && !cloudSyncState.isSaving && cloudSyncedLabel && ` • Cloud ${cloudSyncedLabel}`}
                </div>
              )}
              </div>
            </div>
            )}

            {(!showSinglePanelMode || activeControlPanel === 'action') && (
            <div className="command-panel-card action-panel" style={controlPanelCardStyle}>
              <div style={controlPanelCardHeaderStyle}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.71rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#1e3a8a' }}>
                    <Settings size={13} />
                    Planner Actions
                  </div>
                  <div style={{ marginTop: '0.2rem', fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>
                    Import, configure, and update tasks from one focused action card.
                  </div>
                </div>
                <div style={{
                  borderRadius: '999px',
                  border: '1px solid #dbe4ef',
                  background: '#ffffff',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  color: '#64748b',
                  whiteSpace: 'nowrap'
                }}>
                  {activeControlPanelTitle}
                </div>
              </div>

              <div
                className="toolbar-group action-group"
                style={{
                  ...toolbarGroupBaseStyle,
                  ...controlPanelInnerGroupStyle,
                  flex: showSinglePanelMode ? '1 1 auto' : (isPhoneLayout ? '1 1 100%' : '2 1 540px'),
                  minWidth: showSinglePanelMode ? '100%' : (isPhoneLayout ? '100%' : '460px'),
                  opacity: actionControlsDisabled ? 0.76 : 1,
                  background: actionControlsDisabled
                    ? 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
                    : controlPanelInnerGroupStyle.background || toolbarGroupBaseStyle.background,
                  border: actionControlsDisabled
                    ? '1px solid #e2e8f0'
                    : (controlPanelInnerGroupStyle.border || toolbarGroupBaseStyle.border)
                }}
              >
            {!showSinglePanelMode && (
            <div style={toolbarSectionLabelStyle}>
              <span style={toolbarSectionLabelIconStyle}>
                <Settings size={11} />
              </span>
              Planner Actions
            </div>
            )}

            <button
              type="button"
              ref={importButtonRef}
              className={activeTutorialTarget === 'import' ? 'tutorial-target-active' : ''}
              onClick={() => {
                setShowModifyMenu(false);
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              disabled={actionControlsDisabled}
              style={{
                ...toolbarButtonSuccessSoftStyle,
                width: isPhoneLayout ? '100%' : 'auto',
                opacity: actionControlsDisabled ? 0.62 : 1,
                cursor: actionControlsDisabled ? 'not-allowed' : 'pointer'
              }}
              title="Import JSON"
            >
              <Upload size={16} />
              Import
            </button>

            <div ref={modifyMenuRef} style={{ position: 'relative', flex: isPhoneLayout ? '1 1 auto' : '0 0 auto', width: isPhoneLayout ? '100%' : 'auto' }}>
              <button
                type="button"
                ref={modifyButtonRef}
                className={activeTutorialTarget === 'modifyMenu' ? 'tutorial-target-active' : ''}
                onClick={() => {
                  if (actionControlsDisabled) return;
                  setShowHolidayManager(false);
                  setShowModifyMenu((prev) => !prev);
                }}
                disabled={actionControlsDisabled}
                style={{
                  ...toolbarButtonNeutralStyle,
                  background: showModifyMenu ? '#eef2ff' : toolbarButtonNeutralStyle.background,
                  border: showModifyMenu ? '1px solid rgba(99, 102, 241, 0.45)' : toolbarButtonNeutralStyle.border,
                  color: showModifyMenu ? '#3730a3' : toolbarButtonNeutralStyle.color,
                  width: isPhoneLayout ? '100%' : 'auto',
                  boxShadow: showModifyMenu ? '0 8px 18px rgba(99, 102, 241, 0.14)' : 'none',
                  opacity: actionControlsDisabled ? 0.62 : 1,
                  cursor: actionControlsDisabled ? 'not-allowed' : 'pointer'
                }}
                aria-expanded={showModifyMenu && !actionControlsDisabled}
              >
                <Settings size={16} />
                Modify Graph
                <ChevronDown size={16} />
              </button>

              {showModifyMenu && !actionControlsDisabled && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: isPhoneLayout ? 'auto' : 0,
                  left: isPhoneLayout ? 0 : 'auto',
                  background: '#ffffff',
                  borderRadius: '14px',
                  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
                  padding: '0.6rem',
                  minWidth: isPhoneLayout ? '100%' : '280px',
                  width: isPhoneLayout ? '100%' : 'auto',
                  border: '1px solid #e2e8f0',
                  zIndex: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  transformOrigin: 'top right',
                  animation: 'popIn 0.16s ease-out both'
                }}>
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em'
                  }}>
                    View
                  </div>

                  {[
                    { id: 'menuShowDates', label: 'Show Dates', checked: showDates, onChange: (v) => setShowDates(v) },
                    { id: 'menuShowQuarters', label: 'Show in Quarters', checked: showQuarters, onChange: (v) => setShowQuarters(v) },
                    { id: 'menuShowTotals', label: 'Show Total', checked: showTotals, onChange: (v) => setShowTotals(v) }
                  ].map((item) => (
                    <label
                      key={item.id}
                      htmlFor={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        padding: '0.7rem 0.75rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                      <input
                        id={item.id}
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => item.onChange(e.target.checked)}
                        style={{ width: '1.15rem', height: '1.15rem', cursor: 'pointer', accentColor: '#6366f1' }}
                      />
                    </label>
                  ))}

                  <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }} />

                  <div style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em'
                  }}>
                    Cost
                  </div>

                  <label
                    htmlFor="menuShowCost"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      padding: '0.7rem 0.75rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                      Add Cost
                    </span>
                    <input
                      id="menuShowCost"
                      type="checkbox"
                      checked={showCost}
                      onChange={(e) => setShowCost(e.target.checked)}
                      style={{ width: '1.15rem', height: '1.15rem', cursor: 'pointer', accentColor: '#6366f1' }}
                    />
                  </label>

                  <div style={{ padding: '0 0.75rem 0.35rem 0.75rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>Currency</span>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        disabled={!showCost}
                        style={{
                          height: '34px',
                          padding: '0 0.6rem',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.9rem',
                          background: showCost ? '#ffffff' : '#f1f5f9',
                          color: showCost ? '#0f172a' : '#94a3b8',
                          cursor: showCost ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <option value="$">Dollars ($)</option>
                        <option value="₹">Rupees (₹)</option>
                        <option value="€">Euros (€)</option>
                        <option value="£">Pounds (£)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }} />

                  <div style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em'
                  }}>
                    Export
                  </div>

                  {[
                    { type: 'png', label: 'Image (PNG)', icon: <ImageIcon size={16} /> },
                    { type: 'jpeg', label: 'Image (JPEG)', icon: <ImageIcon size={16} /> },
                    { type: 'pdf', label: 'Document (PDF)', icon: <FileType size={16} /> },
                    { type: 'json', label: 'Data (JSON)', icon: <FileJson size={16} /> }
                  ].map(option => (
                    <button
                      type="button"
                      key={option.type}
                      onClick={() => exportChart(option.type)}
                      disabled={isDownloading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.75rem',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '10px',
                        cursor: isDownloading ? 'not-allowed' : 'pointer',
                        color: '#0f172a',
                        fontWeight: '600',
                        fontSize: '0.92rem',
                        opacity: isDownloading ? 0.6 : 1,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isDownloading) e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}

                </div>
              )}
            </div>

            <button
              type="button"
              ref={addTaskButtonRef}
              className={activeTutorialTarget === 'addTask' ? 'tutorial-target-active' : ''}
              onClick={() => {
                setShowModifyMenu(false);
                addTask();
              }}
              disabled={actionControlsDisabled}
              style={{
                ...toolbarButtonPrimaryStyle,
                width: isPhoneLayout ? '100%' : 'auto',
                opacity: actionControlsDisabled ? 0.62 : 1,
                cursor: actionControlsDisabled ? 'not-allowed' : 'pointer',
                boxShadow: actionControlsDisabled ? 'none' : toolbarButtonPrimaryStyle.boxShadow
              }}
              title="Add Task"
            >
              <Plus size={16} />
              Add Task
            </button>

            <button
              type="button"
              ref={settingsButtonRef}
              className={activeTutorialTarget === 'settingsButton' ? 'tutorial-target-active' : ''}
              onClick={() => {
                if (actionControlsDisabled) return;
                setShowModifyMenu(false);
                setShowHolidayManager((prev) => !prev);
              }}
              disabled={actionControlsDisabled}
              style={{
                ...toolbarButtonNeutralStyle,
                background: showHolidayManager ? '#eef2ff' : toolbarButtonNeutralStyle.background,
                border: showHolidayManager ? '1px solid rgba(99, 102, 241, 0.45)' : toolbarButtonNeutralStyle.border,
                color: showHolidayManager ? '#3730a3' : toolbarButtonNeutralStyle.color,
                width: isPhoneLayout ? '100%' : '46px',
                padding: isPhoneLayout ? '0 0.85rem' : 0,
                gridColumn: isPhoneLayout ? '1 / -1' : 'auto',
                gap: isPhoneLayout ? '0.55rem' : 0,
                boxShadow: showHolidayManager ? '0 8px 18px rgba(99, 102, 241, 0.14)' : 'none',
                opacity: actionControlsDisabled ? 0.62 : 1,
                cursor: actionControlsDisabled ? 'not-allowed' : 'pointer'
              }}
              title="Settings & Branding"
              aria-label="Settings & Branding"
            >
              <Settings size={18} />
              {isPhoneLayout && <span style={{ fontWeight: '800', fontSize: '0.92rem' }}>Settings & Branding</span>}
            </button>

            {actionControlsDisabled && (
              <div
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  border: '1px solid #dbe4ef',
                  background: '#f8fafc',
                  color: '#64748b',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  padding: '0.48rem 0.62rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.6rem',
                  flexWrap: 'wrap',
                  textAlign: isPhoneLayout ? 'center' : 'left'
                }}
              >
                <span style={{ flex: '1 1 280px' }}>
                  Planner tools are locked in Dashboard mode. Switch to Planner to edit tasks or export the planner chart.
                </span>
                <button
                  type="button"
                  onClick={openPlannerView}
                  style={{
                    ...toolbarButtonPrimaryStyle,
                    height: '34px',
                    borderRadius: '9px',
                    fontSize: '0.74rem',
                    padding: '0 0.72rem',
                    width: isPhoneLayout ? '100%' : 'auto',
                    boxShadow: 'none',
                    flexShrink: 0
                  }}
                  title="Switch to planner mode"
                >
                  <Calendar size={14} />
                  Switch to Planner
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={importChart}
              accept=".json"
              style={{ display: 'none' }}
            />
            </div>

            {isPhoneLayout && (
              <div className="toolbar-sync-pill" style={{ ...syncPillStyle, width: '100%', textAlign: 'center' }}>
                {savedAtLabel ? `Auto-saved ${savedAtLabel}` : 'Auto-save active'}
                {authSession.isAuthenticated && cloudSyncState.isSaving && ' • Syncing cloud...'}
                {authSession.isAuthenticated && !cloudSyncState.isSaving && cloudSyncedLabel && ` • Cloud ${cloudSyncedLabel}`}
              </div>
            )}
            </div>
            )}
              </div>
            </div>
          </div>
        </div>

        {showSignInPrompt && (
          <div
            onClick={closeSignInPrompt}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(5px) saturate(1.08)',
              WebkitBackdropFilter: 'blur(5px) saturate(1.08)',
              zIndex: 90,
              display: 'grid',
              placeItems: 'center',
              padding: '1.1rem',
              animation: 'overlayFade 0.18s ease-out both'
            }}
          >
            <div
              ref={signInPanelRef}
              className={activeTutorialTarget === 'signInPanel' ? 'tutorial-target-active' : ''}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '560px',
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 35px 80px rgba(15, 23, 42, 0.22)',
                padding: '1.25rem',
                animation: 'popIn 0.2s ease-out both'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.9rem' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', fontWeight: '800', color: '#0f766e', background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: '999px', padding: '0.25rem 0.6rem' }}>
                    <Cloud size={14} />
                    Optional Cloud Sync
                  </div>
                  <h3 style={{ margin: '0.7rem 0 0.25rem 0', fontSize: '1.22rem', fontWeight: '800', color: '#0f172a' }}>
                    Sign in only if you want cross-device sync
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '600', lineHeight: 1.55 }}>
                    Stay in guest mode and continue with local auto-save, or sign in with Gmail to sync updates across devices in real time.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeSignInPrompt}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label="Close sign-in options"
                >
                  <X size={18} />
                </button>
              </div>

              {authSession.isAuthenticated && authSession.user ? (
                <div style={{ marginTop: '1rem', border: '1px solid #c7d2fe', borderRadius: '12px', background: '#eef2ff', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4338ca' }}>
                    Connected Account
                  </div>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.95rem', fontWeight: '800', color: '#1e1b4b' }}>
                    {authSession.user.displayName || authSession.user.email}
                  </div>
                  <div style={{ marginTop: '0.1rem', fontSize: '0.82rem', fontWeight: '700', color: '#4c1d95' }}>
                    {authSession.user.email}
                  </div>

                  <div style={{ marginTop: '0.7rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={signOutFromCloud}
                      style={{
                        height: '40px',
                        borderRadius: '10px',
                        border: '1px solid #a5b4fc',
                        background: '#ffffff',
                        color: '#312e81',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        padding: '0 0.8rem'
                      }}
                    >
                      Sign out from cloud sync
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => startOptionalSignIn('google')}
                    disabled={authSession.isLoading || !authSession.providers.google}
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '12px',
                      border: authSession.providers.google ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                      background: authSession.providers.google ? '#ffffff' : '#f8fafc',
                      color: authSession.providers.google ? '#0f172a' : '#94a3b8',
                      fontSize: '0.9rem',
                      fontWeight: '800',
                      cursor: authSession.providers.google ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Mail size={17} />
                    Continue with Gmail
                  </button>
                </div>
              )}

              {authSession.isLoading && (
                <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '0.83rem', fontWeight: '700' }}>
                  Checking sign-in providers...
                </div>
              )}

              {(authPromptMessage || cloudSyncState.error) && (
                <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.83rem', fontWeight: '700' }}>
                  {authPromptMessage || cloudSyncState.error}
                </div>
              )}

              <div style={{ marginTop: '0.9rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeSignInPrompt}
                  style={{
                    height: '42px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '0.86rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    padding: '0 0.9rem'
                  }}
                >
                  {authSession.isAuthenticated ? 'Close' : 'Continue without sign-in'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showReminderModal && reminderTarget && (
          <div
            onClick={() => setShowReminderModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(5px) saturate(1.06)',
              WebkitBackdropFilter: 'blur(5px) saturate(1.06)',
              zIndex: 96,
              display: 'grid',
              placeItems: 'center',
              padding: '1rem',
              animation: 'overlayFade 0.18s ease-out both'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '560px',
                maxHeight: 'calc(100vh - 2rem)',
                overflowY: 'auto',
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #dbe4ef',
                borderRadius: '20px',
                boxShadow: '0 30px 70px rgba(15, 23, 42, 0.25)',
                padding: '1rem',
                display: 'grid',
                gap: '0.9rem',
                animation: 'popIn 0.18s ease-out both'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <Bell size={14} />
                    Set Reminder
                  </div>
                  <h3 style={{ margin: '0.45rem 0 0.2rem 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                    {reminderTarget.itemName}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '700' }}>
                    {reminderTarget.projectName}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    border: '1px solid #dbe4ef',
                    background: '#ffffff',
                    color: '#64748b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  aria-label="Close reminder modal"
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{
                border: '1px solid #dbe4ef',
                borderRadius: '12px',
                background: '#ffffff',
                padding: '0.75rem',
                display: 'grid',
                gap: '0.7rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: isPhoneLayout ? '1fr' : '1fr 1fr', gap: '0.7rem' }}>
                  <label style={{ display: 'grid', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Date
                    </span>
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      style={{
                        height: '40px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        padding: '0 0.7rem',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: '#0f172a',
                        background: '#ffffff',
                        colorScheme: 'light'
                      }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Time
                    </span>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      style={{
                        height: '40px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        padding: '0 0.7rem',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: '#0f172a',
                        background: '#ffffff'
                      }}
                    />
                  </label>
                </div>

                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Note (Optional)
                  </span>
                  <textarea
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    rows={3}
                    placeholder="What should this reminder mention?"
                    style={{
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      padding: '0.65rem 0.7rem',
                      fontSize: '0.84rem',
                      color: '#0f172a',
                      resize: 'vertical',
                      minHeight: '84px',
                      fontFamily: 'inherit'
                    }}
                  />
                </label>
              </div>

              {reminderTargetPending.length > 0 && (
                <div style={{ border: '1px solid #dbe4ef', borderRadius: '12px', background: '#ffffff', padding: '0.7rem', display: 'grid', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Existing reminders for this item
                  </div>
                  <div style={{ display: 'grid', gap: '0.42rem', maxHeight: '150px', overflowY: 'auto' }}>
                    {reminderTargetPending.map((reminder) => (
                      <div key={reminder.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.5rem 0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0f172a' }}>
                            {formatReminderDateTimeLabel(reminder.date, reminder.time)}
                          </div>
                          {reminder.note && (
                            <div style={{ marginTop: '0.1rem', fontSize: '0.72rem', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {reminder.note}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteReminder(reminder.id)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '7px',
                            border: '1px solid #fecaca',
                            background: '#fff1f2',
                            color: '#dc2626',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flex: '0 0 auto'
                          }}
                          aria-label="Delete existing reminder"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  style={{
                    height: '40px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    padding: '0 0.85rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveReminder}
                  disabled={!reminderDate || !reminderTime}
                  style={{
                    height: '40px',
                    borderRadius: '10px',
                    border: '1px solid #1d4ed8',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    cursor: !reminderDate || !reminderTime ? 'not-allowed' : 'pointer',
                    opacity: !reminderDate || !reminderTime ? 0.7 : 1,
                    padding: '0 0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Clock size={14} />
                  Save Reminder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings & Branding Drawer */}
        {!isDashboardView && showHolidayManager && (
          <div
            className="settings-overlay"
            onClick={() => setShowHolidayManager(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.42)',
              backdropFilter: 'blur(6px) saturate(1.1)',
              WebkitBackdropFilter: 'blur(6px) saturate(1.1)',
              zIndex: 80,
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'stretch',
              animation: 'overlayFade 0.18s ease-out both'
            }}
          >
            <div
              ref={settingsPanelRef}
              className={`settings-panel ${activeTutorialTarget === 'settingsPanel' ? 'tutorial-target-active' : ''}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '24px',
                padding: '1.25rem',
                border: '1px solid rgba(226, 232, 240, 0.95)',
                boxShadow: '0 35px 80px rgba(15, 23, 42, 0.22)',
                width: '480px',
                maxWidth: 'calc(100vw - 2.5rem)',
                height: 'calc(100vh - 2.5rem)',
                overflowY: 'auto',
                animation: 'drawerIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) both'
              }}
            >
              <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.90) 100%)',
                backdropFilter: 'blur(10px) saturate(1.1)',
                WebkitBackdropFilter: 'blur(10px) saturate(1.1)',
                margin: '-1.25rem -1.25rem 1rem -1.25rem',
                padding: '1.1rem 1.25rem 0.9rem 1.25rem',
                borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>
                      Settings & Branding
                    </h3>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                      Logos, holidays, and export options
                    </div>
                  </div>

                  <button
                    onClick={() => setShowHolidayManager(false)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      color: '#64748b',
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e2e8f0';
                      e.currentTarget.style.color = '#334155';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.color = '#64748b';
                    }}
                    aria-label="Close settings"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1rem',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ImageIcon size={16} style={{ color: '#64748b' }} />
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                        Logos
                      </h4>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Export Header
                    </div>
                  </div>

                  <div className="logos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#334155' }}>Customer</div>
                        {customerLogo && (
                          <button
                            onClick={() => setCustomerLogo(null)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '10px',
                              width: '30px',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#ef4444',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fee2e2';
                              e.currentTarget.style.borderColor = '#fecaca';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ffffff';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                            title="Remove"
                            aria-label="Remove customer logo"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <label
                        className="tutorial-settings-target"
                        style={{
                          cursor: 'pointer',
                          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                          border: '1px dashed rgba(148, 163, 184, 0.7)',
                          borderRadius: '12px',
                          padding: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          color: '#64748b',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          transition: 'all 0.2s'
                        }}>
                        <Upload size={16} />
                        {customerLogo ? 'Change Logo' : 'Upload Logo'}
                        <input type="file" onChange={(e) => handleLogoUpload(e, 'customer')} accept="image/*" style={{ display: 'none' }} />
                      </label>

                      {customerLogo && (
                        <img
                          src={customerLogo}
                          alt="Customer Logo Preview"
                          style={{
                            marginTop: '0.75rem',
                            width: '100%',
                            maxHeight: '56px',
                            objectFit: 'contain',
                            borderRadius: '12px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            padding: '0.35rem'
                          }}
                        />
                      )}
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#334155' }}>Company</div>
                        {companyLogo && (
                          <button
                            onClick={() => setCompanyLogo(null)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '10px',
                              width: '30px',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#ef4444',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fee2e2';
                              e.currentTarget.style.borderColor = '#fecaca';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ffffff';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                            title="Remove"
                            aria-label="Remove company logo"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <label
                        ref={companyUploadRef}
                        className={activeTutorialTarget === 'companyUpload' ? 'tutorial-target-active tutorial-settings-target' : 'tutorial-settings-target'}
                        style={{
                        cursor: 'pointer',
                        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px dashed rgba(148, 163, 184, 0.7)',
                        borderRadius: '12px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: '#64748b',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        transition: 'all 0.2s'
                      }}>
                        <Upload size={16} />
                        {companyLogo ? 'Change Logo' : 'Upload Logo'}
                        <input type="file" onChange={(e) => handleLogoUpload(e, 'company')} accept="image/*" style={{ display: 'none' }} />
                      </label>

                      {companyLogo && (
                        <img
                          src={companyLogo}
                          alt="Company Logo Preview"
                          style={{
                            marginTop: '0.75rem',
                            width: '100%',
                            maxHeight: '56px',
                            objectFit: 'contain',
                            borderRadius: '12px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            padding: '0.35rem'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1rem',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} style={{ color: '#64748b' }} />
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                        Holidays
                      </h4>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Business Days
                    </div>
                  </div>

                  <div className="holiday-input-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'center', marginBottom: '0.9rem' }}>
                    <input
                      ref={holidayDateRef}
                      className={activeTutorialTarget === 'holidayDate' ? 'tutorial-target-active' : ''}
                      type="date"
                      value={newHoliday}
                      onChange={(e) => setNewHoliday(e.target.value)}
                      style={{
                        height: '42px',
                        padding: '0 0.9rem',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#0f172a',
                        background: '#ffffff'
                      }}
                    />

                    <button
                      onClick={addHoliday}
                      style={{
                        height: '42px',
                        background: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '0 1rem',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: '800',
                        letterSpacing: '0.01em',
                        cursor: 'pointer',
                        boxShadow: '0 10px 20px rgba(15, 23, 42, 0.18)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 14px 26px rgba(15, 23, 42, 0.22)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(15, 23, 42, 0.18)';
                      }}
                    >
                      Add Holiday
                    </button>
                  </div>

                  {holidays.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                      {holidays.map(date => (
                        <div key={date} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.85rem',
                          color: '#334155',
                          fontWeight: '700'
                        }}>
                          {new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          <button
                            onClick={() => removeHoliday(date)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                              color: '#94a3b8',
                              width: '24px',
                              height: '24px',
                              padding: 0,
                              borderRadius: '999px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fee2e2';
                              e.currentTarget.style.borderColor = '#fecaca';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ffffff';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.color = '#94a3b8';
                            }}
                            aria-label="Remove holiday"
                            title="Remove"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      No holidays added yet. Weekends are excluded automatically.
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: '600', padding: '0 0.25rem' }}>
                  Tip: Use Modify Graph to toggle dates, totals, quarters, cost, and export options.
                </div>
              </div>
            </div>
          </div>
        )}

        {isDashboardView ? (
          <div
            ref={dashboardPanelRef}
            className={activeTutorialTarget === 'dashboardPanel' ? 'tutorial-target-active' : ''}
          >
            <DashboardView
              projectSummaries={projectSummaries}
              dashboardProjects={dashboardProjects}
              overallCompletion={overallCompletion}
              totalProjects={dashboardProjects.length}
              completedProjects={completedProjects}
              onOpenProject={openProjectFromDashboard}
              isPhoneLayout={isPhoneLayout}
              isCompactLayout={isCompactLayout}
              downloadButtonRef={dashboardDownloadButtonRef}
            />
          </div>
        ) : (
          <>
        {/* Task List */}
        <div
          ref={taskEditorRef}
          className={`task-list-card ${activeTutorialTarget === 'taskEditor' ? 'tutorial-target-active' : ''}`}
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '2rem',
            marginBottom: '2rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '1.5rem',
            opacity: 1
          }}>
            Tasks
          </h2>

          <div className="task-editor-scroll" style={{ overflowX: 'auto', paddingBottom: '0.25rem' }}>
            <div style={isCompactLayout
              ? { width: '100%', minWidth: '100%' }
              : { width: 'max-content', minWidth: `max(100%, ${editorMinWidth}px)` }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: editorGridColumns,
                gap: '1rem',
                alignItems: 'center',
                padding: '0.75rem 1.25rem',
                marginBottom: '0.75rem',
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                color: '#64748b',
                fontSize: '0.72rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap'
              }}>
                <div />
                <div>Task</div>
                <div
                  ref={statusColumnRef}
                  className={activeTutorialTarget === 'statusColumn' ? 'tutorial-target-active' : ''}
                  style={{ textAlign: 'center' }}
                >
                  Status
                </div>
                <div style={{ textAlign: 'center' }}>Days</div>
                {showInlineEditorExtras && showDatesInEditor && (
                  <>
                    <div>Start</div>
                    <div>End</div>
                  </>
                )}
                {showInlineEditorExtras && showCostInEditor && <div>Cost</div>}
                {showInlineEditorExtras && <div style={{ textAlign: 'center' }}>Color</div>}
                {showInlineEditorExtras && (
                  <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center' }} title="Reminder">
                    <Bell size={13} />
                  </div>
                )}
                {showInlineEditorExtras && <div />}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tasks.map((task, index) => {
                  const taskStatus = getTaskCompletionStatus(task);
                  const isTaskCompleted = taskStatus === STATUS_COMPLETED;
                  const taskReminderCount = getRemindersForItem(task.id).length;
                  const parentDays = getBusinessDays(task.startDate, task.endDate, holidays);
                  const parentCost = Number(task.cost) || 0;

                  let runningSubDays = 0;
                  let runningSubCost = 0;
                  const subTaskRollups = (task.subTasks || []).map((st) => {
                    const days = getBusinessDays(st.startDate, st.endDate, holidays);
                    const cost = Number(st.cost) || 0;
                    runningSubDays += days;
                    runningSubCost += cost;
                    return {
                      days,
                      cost,
                      runningDays: runningSubDays,
                      runningCost: runningSubCost
                    };
                  });

                  const totalSubDays = runningSubDays;
                  const totalSubCost = runningSubCost;
                  const daysOver = task.subTasks.length > 0 && totalSubDays > parentDays;
                  const costOver = task.subTasks.length > 0 && totalSubCost > parentCost;
                  const anyOver = daysOver || (showCost && costOver);

                  return (
                    <div key={task.id} style={{ animation: `slideIn 0.3s ease-out ${index * 0.05}s both` }}>
                      {/* Main Task */}
                      <div
                        className="task-row"
                        style={{
                          background: '#f8fafc',
                          borderRadius: '12px',
                          padding: isPhoneLayout ? '0.72rem' : (isCompactLayout ? '0.85rem' : '1.25rem'),
                          display: 'grid',
                          gridTemplateColumns: editorGridColumns,
                          gap: editorRowGap,
                          alignItems: 'center',
                          border: '1px solid #e2e8f0',
                          borderLeft: `4px solid ${task.color}`
                        }}
                      >
                        <button
                          onClick={() => toggleExpanded(task.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: task.subTasks.length > 0 ? 1 : 0.3,
                            pointerEvents: task.subTasks.length > 0 ? 'auto' : 'none'
                          }}
                        >
                          {task.expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </button>

                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                          style={{
                            gridColumn: isPhoneLayout ? '2 / 4' : 'auto',
                            width: '100%',
                            minWidth: 0,
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: isPhoneLayout ? '0.62rem 0.68rem' : (isCompactLayout ? '0.65rem 0.7rem' : '0.75rem 1rem'),
                            color: '#000000',
                            fontSize: isPhoneLayout ? '0.9rem' : (isCompactLayout ? '0.95rem' : '1rem'),
                            fontWeight: '700',
                            textDecoration: isTaskCompleted ? 'line-through' : 'none',
                            opacity: isTaskCompleted ? 0.7 : 1,
                            outline: 'none',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = task.color;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                          }}
                        />

                        <div style={{
                          display: 'flex',
                          justifyContent: isPhoneLayout ? 'flex-start' : 'center',
                          gridColumn: isPhoneLayout ? '2 / 3' : 'auto',
                          gridRow: isPhoneLayout ? '2' : 'auto',
                          width: isPhoneLayout ? '100%' : 'auto'
                        }}>
                          <select
                            value={taskStatus}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            style={{
                              width: editorStatusControlSize.width,
                              height: editorStatusControlSize.height,
                              borderRadius: editorStatusControlSize.borderRadius,
                              border: taskStatus === STATUS_COMPLETED ? '1px solid #86efac' : '1px solid #cbd5e1',
                              background: taskStatus === STATUS_COMPLETED ? '#f0fdf4' : '#ffffff',
                              color: taskStatus === STATUS_COMPLETED ? '#166534' : '#0f172a',
                              fontSize: editorStatusControlSize.fontSize,
                              fontWeight: '700',
                              padding: editorStatusControlSize.padding,
                              cursor: 'pointer'
                            }}
                            title="Task status"
                          >
                            {STATUS_OPTIONS.map((statusOption) => (
                              <option key={statusOption.value} value={statusOption.value}>
                                {statusOption.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{
                          display: 'flex',
                          flexDirection: isPhoneLayout ? 'row' : 'column',
                          alignItems: 'center',
                          justifyContent: isPhoneLayout ? 'flex-end' : 'center',
                          gap: isPhoneLayout ? '0.45rem' : '0.25rem',
                          width: isPhoneLayout ? '100%' : (isCompactLayout ? '70px' : '80px'),
                          gridColumn: isPhoneLayout ? '3 / 4' : 'auto',
                          gridRow: isPhoneLayout ? '2' : 'auto'
                        }}>
                          <input
                            type="number"
                            min="1"
                            value={parentDays}
                            onChange={(e) => updateTaskDuration(task.id, e.target.value)}
                            style={{
                              width: isPhoneLayout ? '64px' : (isCompactLayout ? '56px' : '60px'),
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: isPhoneLayout ? '0.52rem' : (isCompactLayout ? '0.6rem' : '0.75rem'),
                              color: '#0f172a',
                              fontSize: isPhoneLayout ? '0.8rem' : (isCompactLayout ? '0.82rem' : '0.875rem'),
                              textAlign: 'center',
                              fontWeight: '600',
                              outline: 'none'
                            }}
                            title="Duration (Business Days)"
                          />
                          {task.subTasks.length > 0 && (
                            <div
                              title="Subtask days total"
                              style={{
                                fontSize: '0.7rem',
                                fontFamily: '"JetBrains Mono", monospace',
                                fontWeight: '700',
                                color: daysOver ? '#ef4444' : '#64748b',
                                lineHeight: 1,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              sum {totalSubDays}d
                            </div>
                          )}
                        </div>

                        {showDatesInEditor && (
                          <>
                            <input
                              type="date"
                              value={task.startDate}
                              onChange={(e) => updateTask(task.id, 'startDate', e.target.value)}
                              style={{
                                width: '100%',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                color: '#0f172a',
                                fontSize: '0.875rem',
                                fontFamily: '"JetBrains Mono", monospace',
                                outline: 'none',
                                colorScheme: 'light'
                              }}
                            />

                            <input
                              type="date"
                              value={task.endDate}
                              onChange={(e) => updateTask(task.id, 'endDate', e.target.value)}
                              style={{
                                width: '100%',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                color: '#0f172a',
                                fontSize: '0.875rem',
                                fontFamily: '"JetBrains Mono", monospace',
                                outline: 'none',
                                colorScheme: 'light'
                              }}
                            />
                          </>
                        )}

                        {showCostInEditor && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.85rem' }}>{currency}</span>
                              <input
                                type="number"
                                min="0"
                                value={task.cost || ''}
                                onChange={(e) => updateTask(task.id, 'cost', e.target.value)}
                                placeholder="Cost"
                                style={{
                                  width: '100%',
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '8px',
                                  padding: '0.75rem 0.5rem 0.75rem 2rem',
                                  color: '#0f172a',
                                  fontSize: '0.875rem',
                                  outline: 'none',
                                  fontWeight: '600'
                                }}
                              />
                            </div>
                            {task.subTasks.length > 0 && (
                              <div
                                title="Subtask cost total"
                                style={{
                                  fontSize: '0.7rem',
                                  fontFamily: '"JetBrains Mono", monospace',
                                  fontWeight: '700',
                                  color: costOver ? '#ef4444' : '#64748b',
                                  lineHeight: 1
                                }}
                              >
                                sum {currency}{totalSubCost.toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}

                        {showInlineEditorExtras && (
                          <>
                            <input
                              type="color"
                              value={task.color}
                              onChange={(e) => updateTask(task.id, 'color', e.target.value)}
                              style={{
                                width: '50px',
                                height: '42px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: task.color
                              }}
                            />

                            <button
                              type="button"
                              onClick={() => openReminderModal(task.id)}
                              title={taskReminderCount > 0 ? `${taskReminderCount} reminder(s) set` : 'Set reminder'}
                              style={{
                                background: taskReminderCount > 0 ? '#ecfdf5' : '#f8fafc',
                                border: taskReminderCount > 0 ? '1px solid #86efac' : '1px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '0.65rem',
                                cursor: 'pointer',
                                color: taskReminderCount > 0 ? '#166534' : '#475569',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                              }}
                            >
                              <Bell size={15} />
                              {taskReminderCount > 0 && (
                                <span style={{
                                  position: 'absolute',
                                  top: '-5px',
                                  right: '-5px',
                                  minWidth: '16px',
                                  height: '16px',
                                  borderRadius: '999px',
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  fontSize: '0.62rem',
                                  fontWeight: '800',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '2px solid #ffffff',
                                  lineHeight: 1
                                }}>
                                  {taskReminderCount > 9 ? '9+' : taskReminderCount}
                                </span>
                              )}
                            </button>

                            <button
                              onClick={() => removeTask(task.id)}
                              style={{
                                background: '#fee2e2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                cursor: 'pointer',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#fecaca';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fee2e2';
                              }}
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                      </div>

                      {isCompactLayout && (
                        <div className="mobile-detail-card" style={{
                          marginTop: '0.65rem',
                          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                          border: '1px solid #dbe4ef',
                          borderRadius: '12px',
                          padding: isPhoneLayout ? '0.7rem' : '0.75rem',
                          display: 'grid',
                          gap: '0.65rem',
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                        }}>
                          {showDates && (
                            <div className="mobile-date-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                              <input
                                type="date"
                                value={task.startDate}
                                onChange={(e) => updateTask(task.id, 'startDate', e.target.value)}
                                style={{
                                  width: '100%',
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '8px',
                                  padding: '0.65rem',
                                  color: '#0f172a',
                                  fontSize: '0.84rem',
                                  fontFamily: '"JetBrains Mono", monospace',
                                  outline: 'none',
                                  colorScheme: 'light'
                                }}
                              />
                              <input
                                type="date"
                                value={task.endDate}
                                onChange={(e) => updateTask(task.id, 'endDate', e.target.value)}
                                style={{
                                  width: '100%',
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '8px',
                                  padding: '0.65rem',
                                  color: '#0f172a',
                                  fontSize: '0.84rem',
                                  fontFamily: '"JetBrains Mono", monospace',
                                  outline: 'none',
                                  colorScheme: 'light'
                                }}
                              />
                            </div>
                          )}

                          {showCost && (
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.82rem' }}>{currency}</span>
                              <input
                                type="number"
                                min="0"
                                value={task.cost || ''}
                                onChange={(e) => updateTask(task.id, 'cost', e.target.value)}
                                placeholder="Cost"
                                style={{
                                  width: '100%',
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '8px',
                                  padding: '0.65rem 0.55rem 0.65rem 1.9rem',
                                  color: '#0f172a',
                                  fontSize: '0.86rem',
                                  outline: 'none',
                                  fontWeight: '600'
                                }}
                              />
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.35rem 0.45rem',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff'
                            }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>Color</span>
                              <input
                                type="color"
                                value={task.color}
                                onChange={(e) => updateTask(task.id, 'color', e.target.value)}
                                style={{
                                  width: '36px',
                                  height: '30px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: task.color
                                }}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => openReminderModal(task.id)}
                              style={{
                                flex: '1 1 170px',
                                background: taskReminderCount > 0 ? '#ecfdf5' : '#ffffff',
                                border: taskReminderCount > 0 ? '1px solid #86efac' : '1px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '0.55rem 0.75rem',
                                cursor: 'pointer',
                                color: taskReminderCount > 0 ? '#166534' : '#334155',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                fontSize: '0.82rem',
                                fontWeight: '700'
                              }}
                            >
                              <Bell size={14} />
                              {taskReminderCount > 0 ? `${taskReminderCount} Reminder${taskReminderCount > 1 ? 's' : ''}` : 'Set Reminder'}
                            </button>

                            <button
                              onClick={() => removeTask(task.id)}
                              style={{
                                flex: '1 1 170px',
                                background: '#fee2e2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                padding: '0.55rem 0.75rem',
                                cursor: 'pointer',
                                color: '#ef4444',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                fontSize: '0.82rem',
                                fontWeight: '700'
                              }}
                            >
                              <X size={14} />
                              Remove Task
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Sub-tasks */}
                      {task.expanded && (
                        <div style={{ marginTop: '0.75rem' }}>
                          {task.subTasks.map((subTask, subIndex) => {
                            const subTaskStatus = normalizeStatus(subTask.status);
                            const isSubTaskCompleted = subTaskStatus === STATUS_COMPLETED;
                            const subTaskReminderCount = getRemindersForItem(task.id, subTask.id).length;
                            const rollup = subTaskRollups[subIndex] || {
                              days: getBusinessDays(subTask.startDate, subTask.endDate, holidays),
                              runningDays: 0,
                              runningCost: 0
                            };
                            const runningDaysOver = rollup.runningDays > parentDays;
                            const runningCostOver = rollup.runningCost > parentCost;

                            return (
                              <React.Fragment key={subTask.id}>
                                <div
                                  className="subtask-row"
                                  style={{
                                    background: isSubTaskCompleted ? '#f8fafc' : '#f1f5f9',
                                    borderRadius: '10px',
                                    padding: isPhoneLayout ? '0.66rem' : (isCompactLayout ? '0.75rem' : '1rem'),
                                    marginBottom: '0.5rem',
                                    display: 'grid',
                                    gridTemplateColumns: editorGridColumns,
                                    gap: editorRowGap,
                                    alignItems: 'center',
                                    border: '1px solid #e2e8f0',
                                    borderLeft: `4px solid ${subTask.color}`,
                                    opacity: isSubTaskCompleted ? 0.78 : 1,
                                    animation: `slideIn 0.2s ease-out ${subIndex * 0.03}s both`
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{
                                      position: 'relative',
                                      width: '22px',
                                      height: '22px'
                                    }}>
                                      <div style={{
                                        position: 'absolute',
                                        left: '10px',
                                        top: '2px',
                                        bottom: '8px',
                                        width: '2px',
                                        background: 'rgba(148, 163, 184, 0.85)',
                                        borderRadius: '2px'
                                      }} />
                                      <div style={{
                                        position: 'absolute',
                                        left: '10px',
                                        bottom: '8px',
                                        right: '2px',
                                        height: '2px',
                                        background: 'rgba(148, 163, 184, 0.85)',
                                        borderRadius: '2px'
                                      }} />
                                      <div style={{
                                        position: 'absolute',
                                        right: 0,
                                        bottom: '4px',
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '999px',
                                        background: subTask.color,
                                        boxShadow: '0 0 0 2px #ffffff, 0 0 0 3px rgba(226, 232, 240, 1)'
                                      }} />
                                    </div>
                                  </div>

                                  <input
                                    type="text"
                                    value={subTask.name}
                                    onChange={(e) => updateSubTask(task.id, subTask.id, 'name', e.target.value)}
                                    placeholder="Sub-task name"
                                    style={{
                                      gridColumn: isPhoneLayout ? '2 / 4' : 'auto',
                                      width: '100%',
                                      minWidth: 0,
                                      background: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      padding: isPhoneLayout ? '0.58rem 0.64rem' : (isCompactLayout ? '0.55rem 0.65rem' : '0.625rem 0.875rem'),
                                      color: '#0f172a',
                                      fontSize: isPhoneLayout ? '0.88rem' : (isCompactLayout ? '0.84rem' : '0.9rem'),
                                      fontWeight: '600',
                                      textDecoration: isSubTaskCompleted ? 'line-through' : 'none',
                                      outline: 'none',
                                      transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => {
                                      e.currentTarget.style.background = '#ffffff';
                                      e.currentTarget.style.borderColor = subTask.color;
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.background = '#ffffff';
                                      e.currentTarget.style.borderColor = '#cbd5e1';
                                    }}
                                  />

                                  <div style={{
                                    display: 'flex',
                                    justifyContent: isPhoneLayout ? 'flex-start' : 'center',
                                    gridColumn: isPhoneLayout ? '2 / 3' : 'auto',
                                    gridRow: isPhoneLayout ? '2' : 'auto',
                                    width: isPhoneLayout ? '100%' : 'auto'
                                  }}>
                                    <select
                                      value={subTaskStatus}
                                      onChange={(e) => updateSubTaskStatus(task.id, subTask.id, e.target.value)}
                                      style={{
                                        width: editorStatusControlSize.width,
                                        height: editorStatusControlSize.height,
                                        borderRadius: editorStatusControlSize.borderRadius,
                                        border: subTaskStatus === STATUS_COMPLETED ? '1px solid #86efac' : '1px solid #cbd5e1',
                                        background: subTaskStatus === STATUS_COMPLETED ? '#f0fdf4' : '#ffffff',
                                        color: subTaskStatus === STATUS_COMPLETED ? '#166534' : '#0f172a',
                                        fontSize: editorStatusControlSize.fontSize,
                                        fontWeight: '700',
                                        padding: editorStatusControlSize.padding,
                                        cursor: 'pointer'
                                      }}
                                      title="Sub-task status"
                                    >
                                      {STATUS_OPTIONS.map((statusOption) => (
                                        <option key={statusOption.value} value={statusOption.value}>
                                          {statusOption.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div style={{
                                    display: 'flex',
                                    flexDirection: isPhoneLayout ? 'row' : 'column',
                                    alignItems: 'center',
                                    justifyContent: isPhoneLayout ? 'flex-end' : 'center',
                                    gap: isPhoneLayout ? '0.45rem' : '0.25rem',
                                    width: isPhoneLayout ? '100%' : (isCompactLayout ? '68px' : '80px'),
                                    gridColumn: isPhoneLayout ? '3 / 4' : 'auto',
                                    gridRow: isPhoneLayout ? '2' : 'auto'
                                  }}>
                                    <input
                                      type="number"
                                      min="1"
                                      value={rollup.days}
                                      onChange={(e) => updateSubTaskDuration(task.id, subTask.id, e.target.value)}
                                      style={{
                                        width: isPhoneLayout ? '62px' : (isCompactLayout ? '54px' : '60px'),
                                        background: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        padding: isPhoneLayout ? '0.48rem' : (isCompactLayout ? '0.5rem' : '0.625rem'),
                                        color: '#0f172a',
                                        fontSize: isPhoneLayout ? '0.78rem' : (isCompactLayout ? '0.74rem' : '0.8rem'),
                                        textAlign: 'center',
                                        fontWeight: '600',
                                        outline: 'none'
                                      }}
                                      title="Duration (Business Days)"
                                    />
                                    <div
                                      title="Running total (subtasks)"
                                      style={{
                                        fontSize: '0.68rem',
                                        fontFamily: '"JetBrains Mono", monospace',
                                        fontWeight: '800',
                                        color: runningDaysOver ? '#ef4444' : '#64748b',
                                        lineHeight: 1,
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      run {rollup.runningDays}d
                                    </div>
                                  </div>

                                  {showDatesInEditor && (
                                    <>
                                      <input
                                        type="date"
                                        value={subTask.startDate}
                                        onChange={(e) => updateSubTask(task.id, subTask.id, 'startDate', e.target.value)}
                                        style={{
                                          width: '100%',
                                          background: '#ffffff',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '8px',
                                          padding: '0.75rem',
                                          color: '#0f172a',
                                          fontSize: '0.875rem',
                                          fontFamily: '"JetBrains Mono", monospace',
                                          outline: 'none',
                                          colorScheme: 'light'
                                        }}
                                      />

                                      <input
                                        type="date"
                                        value={subTask.endDate}
                                        onChange={(e) => updateSubTask(task.id, subTask.id, 'endDate', e.target.value)}
                                        style={{
                                          width: '100%',
                                          background: '#ffffff',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '8px',
                                          padding: '0.75rem',
                                          color: '#0f172a',
                                          fontSize: '0.875rem',
                                          fontFamily: '"JetBrains Mono", monospace',
                                          outline: 'none',
                                          colorScheme: 'light'
                                        }}
                                      />
                                    </>
                                  )}

                                  {showCostInEditor && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.75rem' }}>{currency}</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={subTask.cost || ''}
                                          onChange={(e) => updateSubTask(task.id, subTask.id, 'cost', e.target.value)}
                                          style={{
                                            width: '100%',
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            padding: '0.625rem 0.5rem 0.625rem 1.5rem',
                                            color: '#0f172a',
                                            fontSize: '0.8rem',
                                            outline: 'none',
                                            fontWeight: '600'
                                          }}
                                        />
                                      </div>
                                      <div
                                        title="Running total (subtasks)"
                                        style={{
                                          fontSize: '0.68rem',
                                          fontFamily: '"JetBrains Mono", monospace',
                                          fontWeight: '800',
                                          color: runningCostOver ? '#ef4444' : '#64748b',
                                          lineHeight: 1
                                        }}
                                      >
                                        run {currency}{rollup.runningCost.toLocaleString()}
                                      </div>
                                    </div>
                                  )}

                                  {showInlineEditorExtras && (
                                    <>
                                      <input
                                        type="color"
                                        value={subTask.color}
                                        onChange={(e) => updateSubTask(task.id, subTask.id, 'color', e.target.value)}
                                        style={{
                                          width: '40px',
                                          height: '36px',
                                          border: '2px solid #e2e8f0',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          background: subTask.color
                                        }}
                                      />

                                      <button
                                        type="button"
                                        onClick={() => openReminderModal(task.id, subTask.id)}
                                        title={subTaskReminderCount > 0 ? `${subTaskReminderCount} reminder(s) set` : 'Set reminder'}
                                        style={{
                                          background: subTaskReminderCount > 0 ? '#ecfdf5' : '#f8fafc',
                                          border: subTaskReminderCount > 0 ? '1px solid #86efac' : '1px solid #cbd5e1',
                                          borderRadius: '6px',
                                          padding: '0.55rem',
                                          cursor: 'pointer',
                                          color: subTaskReminderCount > 0 ? '#166534' : '#475569',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          position: 'relative'
                                        }}
                                      >
                                        <Bell size={14} />
                                        {subTaskReminderCount > 0 && (
                                          <span style={{
                                            position: 'absolute',
                                            top: '-5px',
                                            right: '-5px',
                                            minWidth: '15px',
                                            height: '15px',
                                            borderRadius: '999px',
                                            background: '#16a34a',
                                            color: '#ffffff',
                                            fontSize: '0.6rem',
                                            fontWeight: '800',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '2px solid #ffffff',
                                            lineHeight: 1
                                          }}>
                                            {subTaskReminderCount > 9 ? '9+' : subTaskReminderCount}
                                          </span>
                                        )}
                                      </button>

                                      <button
                                        onClick={() => removeSubTask(task.id, subTask.id)}
                                        style={{
                                          background: '#fee2e2',
                                          border: '1px solid #fecaca',
                                          borderRadius: '6px',
                                          padding: '0.625rem',
                                          cursor: 'pointer',
                                          color: '#ef4444',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = '#fecaca';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = '#fee2e2';
                                        }}
                                      >
                                        <X size={16} />
                                      </button>
                                    </>
                                  )}
                                </div>

                                {isCompactLayout && (
                                  <div className="mobile-detail-card" style={{
                                    marginTop: '0.55rem',
                                    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                                    border: '1px solid #dbe4ef',
                                    borderRadius: '10px',
                                    padding: isPhoneLayout ? '0.64rem' : '0.6rem',
                                    display: 'grid',
                                    gap: '0.58rem',
                                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                                  }}>
                                    {showDates && (
                                      <div className="mobile-date-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <input
                                          type="date"
                                          value={subTask.startDate}
                                          onChange={(e) => updateSubTask(task.id, subTask.id, 'startDate', e.target.value)}
                                          style={{
                                            width: '100%',
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '7px',
                                            padding: '0.55rem',
                                            color: '#0f172a',
                                            fontSize: '0.8rem',
                                            fontFamily: '"JetBrains Mono", monospace',
                                            outline: 'none',
                                            colorScheme: 'light'
                                          }}
                                        />
                                        <input
                                          type="date"
                                          value={subTask.endDate}
                                          onChange={(e) => updateSubTask(task.id, subTask.id, 'endDate', e.target.value)}
                                          style={{
                                            width: '100%',
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '7px',
                                            padding: '0.55rem',
                                            color: '#0f172a',
                                            fontSize: '0.8rem',
                                            fontFamily: '"JetBrains Mono", monospace',
                                            outline: 'none',
                                            colorScheme: 'light'
                                          }}
                                        />
                                      </div>
                                    )}

                                    {showCost && (
                                      <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.72rem' }}>{currency}</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={subTask.cost || ''}
                                          onChange={(e) => updateSubTask(task.id, subTask.id, 'cost', e.target.value)}
                                          style={{
                                            width: '100%',
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '7px',
                                            padding: '0.55rem 0.5rem 0.55rem 1.35rem',
                                            color: '#0f172a',
                                            fontSize: '0.8rem',
                                            outline: 'none',
                                            fontWeight: '600'
                                          }}
                                        />
                                      </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.45rem',
                                        padding: '0.3rem 0.42rem',
                                        borderRadius: '7px',
                                        border: '1px solid #cbd5e1',
                                        background: '#ffffff'
                                      }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>Color</span>
                                        <input
                                          type="color"
                                          value={subTask.color}
                                          onChange={(e) => updateSubTask(task.id, subTask.id, 'color', e.target.value)}
                                          style={{
                                            width: '32px',
                                            height: '26px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            background: subTask.color
                                          }}
                                        />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => openReminderModal(task.id, subTask.id)}
                                        style={{
                                          flex: '1 1 160px',
                                          background: subTaskReminderCount > 0 ? '#ecfdf5' : '#ffffff',
                                          border: subTaskReminderCount > 0 ? '1px solid #86efac' : '1px solid #cbd5e1',
                                          borderRadius: '7px',
                                          padding: '0.48rem 0.6rem',
                                          cursor: 'pointer',
                                          color: subTaskReminderCount > 0 ? '#166534' : '#334155',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '0.35rem',
                                          fontSize: '0.76rem',
                                          fontWeight: '700'
                                        }}
                                      >
                                        <Bell size={13} />
                                        {subTaskReminderCount > 0 ? `${subTaskReminderCount} Reminder${subTaskReminderCount > 1 ? 's' : ''}` : 'Set Reminder'}
                                      </button>

                                      <button
                                        onClick={() => removeSubTask(task.id, subTask.id)}
                                        style={{
                                          flex: '1 1 160px',
                                          background: '#fee2e2',
                                          border: '1px solid #fecaca',
                                          borderRadius: '7px',
                                          padding: '0.48rem 0.6rem',
                                          cursor: 'pointer',
                                          color: '#ef4444',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '0.35rem',
                                          fontSize: '0.76rem',
                                          fontWeight: '700'
                                        }}
                                      >
                                        <X size={13} />
                                        Remove Sub-task
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}

                          {task.subTasks.length > 0 && (
                            <div style={{
                              padding: isPhoneLayout ? '0.65rem 0.75rem' : '0.75rem 1rem',
                              marginTop: '0.25rem',
                              marginBottom: '0.5rem',
                              background: '#ffffff',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              flexDirection: isPhoneLayout ? 'column' : 'row',
                              justifyContent: 'space-between',
                              alignItems: isPhoneLayout ? 'flex-start' : 'center',
                              gap: isPhoneLayout ? '0.45rem' : '0.75rem',
                              fontSize: isPhoneLayout ? '0.8rem' : '0.85rem',
                              fontWeight: '700'
                            }}>
                              <>
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                  <div style={{ color: daysOver ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={14} />
                                    <span>Subtasks Days: <span style={{ color: daysOver ? '#ef4444' : '#0f172a' }}>{totalSubDays} / {parentDays}</span></span>
                                    {daysOver && <span style={{ fontSize: '0.7rem', background: '#fee2e2', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Exceeded</span>}
                                  </div>
                                  {showCost && (
                                    <div style={{ color: costOver ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <DollarSign size={14} />
                                      <span>Subtasks Cost: <span style={{ color: costOver ? '#ef4444' : '#0f172a' }}>{currency}{totalSubCost.toLocaleString()} / {currency}{parentCost.toLocaleString()}</span></span>
                                      {costOver && <span style={{ fontSize: '0.7rem', background: '#fee2e2', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Exceeded</span>}
                                    </div>
                                  )}
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                  {anyOver ? 'Limits exceeded' : 'Within plan'}
                                </div>
                              </>
                            </div>
                          )}

                          <button
                            onClick={() => addSubTask(task.id)}
                            style={{
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px dashed rgba(99, 102, 241, 0.3)',
                              borderRadius: '8px',
                              padding: '0.75rem',
                              color: '#6366f1',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              width: '100%',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
                              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                            }}
                          >
                            <Plus size={16} />
                            Add Sub-task
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div
          ref={(node) => {
            timelineChartRef.current = node;
            chartRef.current = node;
          }}
          className={`chart-card ${activeTutorialTarget === 'timeline' ? 'tutorial-target-active' : ''}`}
          data-chart-export="true"
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '2.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}
        >
          {/* Logo Header Row */}
          <div className="chart-logo-row" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem',
            position: 'relative',
            zIndex: 30
          }}>
            <div style={{ minWidth: '150px', minHeight: '60px' }}>
              {customerLogo && (
                <ResizableImage
                  src={customerLogo}
                  initialWidth={customerLogoWidth}
                  onResize={setCustomerLogoWidth}
                  alt="Customer Logo"
                />
              )}
            </div>

            <div style={{ minWidth: '150px', minHeight: '60px', display: 'flex', justifyContent: 'flex-end' }}>
              {companyLogo && (
                <ResizableImage
                  src={companyLogo}
                  initialWidth={companyLogoWidth}
                  onResize={setCompanyLogoWidth}
                  alt="Company Logo"
                />
              )}
            </div>
          </div>
          <div className="chart-title-wrap" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '2.5rem',
            flexDirection: 'column',
            gap: '0.5rem',
            textAlign: 'center',
            marginTop: '-2rem' // Pull up slightly to sit between logos nicely
          }}>
            <div>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                color: '#000000',
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em'
              }}>
                {projectTitle}
              </h2>
              <p style={{
                fontSize: '0.9rem',
                color: '#0f172a',
                fontWeight: '600'
              }}>
                Timeline Visualization
              </p>
            </div>
            <div style={{
              background: '#f1f5f9',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              boxShadow: 'none'
            }}>
              {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
            </div>
          </div>

          {/* Grid Layout: Tasks Column + Timeline */}
          {isCompactLayout ? (
            <div className="mobile-timeline-board" style={{
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              background: '#f8fafc',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '0.85rem 0.9rem',
                background: '#f1f5f9',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Mobile Timeline
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', fontFamily: '"JetBrains Mono", monospace' }}>
                  {timelineStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {timelineEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {tasks.map((task, index) => {
                  const position = getTaskPosition(task);
                  const duration = getBusinessDays(task.startDate, task.endDate, holidays);
                  const taskStatus = getTaskCompletionStatus(task);
                  const taskCompleted = getTaskCompletionStatus(task) === STATUS_COMPLETED;

                  return (
                    <div key={task.id} style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff', opacity: taskCompleted ? 0.78 : 1 }}>
                      <div style={{
                        padding: '0.75rem 0.85rem 0.5rem',
                        display: 'grid',
                        gridTemplateColumns: isPhoneLayout ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) auto',
                        rowGap: isPhoneLayout ? '0.45rem' : 0,
                        columnGap: '0.75rem',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: isPhoneLayout ? 'flex-start' : 'center',
                          gap: '0.55rem',
                          minWidth: 0,
                          gridColumn: isPhoneLayout ? '1 / -1' : '1 / 2'
                        }}>
                          <span style={{ width: '4px', height: '18px', borderRadius: '999px', background: task.color, flex: '0 0 auto' }} />
                          <div style={{
                            fontSize: isPhoneLayout ? '0.82rem' : '0.86rem',
                            fontWeight: '800',
                            color: '#0f172a',
                            whiteSpace: isPhoneLayout ? 'normal' : 'nowrap',
                            overflow: isPhoneLayout ? 'visible' : 'hidden',
                            textOverflow: isPhoneLayout ? 'clip' : 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: isPhoneLayout ? 3 : 1,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.35,
                            wordBreak: 'break-word',
                            textDecoration: taskCompleted ? 'line-through' : 'none'
                          }}>
                            {task.name}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          flex: '0 0 auto',
                          width: isPhoneLayout ? '100%' : 'auto',
                          gridColumn: isPhoneLayout ? '1 / -1' : '2 / 3',
                          justifyContent: isPhoneLayout ? 'flex-end' : 'flex-start'
                        }}>
                          {isPhoneLayout ? (
                            <select
                              value={taskStatus}
                              onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                              style={{
                                width: '108px',
                                height: '28px',
                                borderRadius: '999px',
                                border: taskStatus === STATUS_COMPLETED ? '1px solid #86efac' : '1px solid #cbd5e1',
                                background: taskStatus === STATUS_COMPLETED ? '#f0fdf4' : '#ffffff',
                                color: taskStatus === STATUS_COMPLETED ? '#166534' : '#334155',
                                padding: '0 0.5rem',
                                fontSize: '0.65rem',
                                fontWeight: '800',
                                cursor: 'pointer'
                              }}
                              aria-label={`Status for ${task.name}`}
                            >
                              {STATUS_OPTIONS.map((statusOption) => (
                                <option key={statusOption.value} value={statusOption.value}>
                                  {statusOption.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div
                              style={{
                                height: '26px',
                                borderRadius: '999px',
                                border: taskStatus === STATUS_COMPLETED ? '1px solid #86efac' : '1px solid #cbd5e1',
                                background: taskStatus === STATUS_COMPLETED ? '#f0fdf4' : '#ffffff',
                                color: taskStatus === STATUS_COMPLETED ? '#166534' : '#334155',
                                padding: '0 0.5rem',
                                fontSize: '0.67rem',
                                fontWeight: '800',
                                display: 'inline-flex',
                                alignItems: 'center',
                                whiteSpace: 'nowrap'
                              }}
                              aria-label={`Status badge for ${task.name}`}
                            >
                              {taskStatus === STATUS_COMPLETED ? 'Completed' : 'In Progress'}
                            </div>
                          )}

                          <div style={{
                            fontSize: '0.74rem',
                            fontWeight: '800',
                            color: '#334155',
                            background: '#e2e8f0',
                            borderRadius: '999px',
                            padding: '0.2rem 0.5rem',
                            fontFamily: '"JetBrains Mono", monospace',
                            flex: '0 0 auto'
                          }}>
                            {duration}d
                          </div>
                        </div>
                      </div>

                      <div style={{ padding: '0 0.85rem 0.78rem 0.85rem' }}>
                        <div style={{
                          position: 'relative',
                          height: '12px',
                          borderRadius: '999px',
                          background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            position: 'absolute',
                            left: position.left,
                            width: position.width,
                            minWidth: '8px',
                            height: '100%',
                            borderRadius: '999px',
                            background: taskCompleted
                              ? `linear-gradient(135deg, ${task.color}b3 0%, ${task.color}80 100%)`
                              : `linear-gradient(135deg, ${task.color} 0%, ${task.color}cc 100%)`,
                            boxShadow: taskCompleted ? 'none' : `0 3px 10px ${task.color}40`
                          }} />
                        </div>

                        <div style={{
                          marginTop: '0.4rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.72rem',
                          color: '#64748b',
                          fontFamily: '"JetBrains Mono", monospace'
                        }}>
                          <span>{new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span>{new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>

                      {task.expanded && task.subTasks.length > 0 && (
                        <div style={{ padding: '0 0.85rem 0.75rem 0.85rem', display: 'grid', gap: '0.45rem' }}>
                          {task.subTasks.map((subTask) => {
                            const subPosition = getTaskPosition(subTask);
                            const subDuration = getBusinessDays(subTask.startDate, subTask.endDate, holidays);
                            const subTaskStatus = normalizeStatus(subTask.status);
                            const subTaskCompleted = normalizeStatus(subTask.status) === STATUS_COMPLETED;
                            return (
                              <div key={subTask.id} style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '0.55rem',
                                opacity: subTaskCompleted ? 0.78 : 1
                              }}>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: isPhoneLayout ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) auto',
                                  rowGap: isPhoneLayout ? '0.35rem' : 0,
                                  columnGap: '0.5rem',
                                  alignItems: 'center',
                                  marginBottom: '0.35rem'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: isPhoneLayout ? 'flex-start' : 'center',
                                    gap: '0.45rem',
                                    minWidth: 0,
                                    gridColumn: isPhoneLayout ? '1 / -1' : '1 / 2'
                                  }}>
                                    <span style={{ width: '3px', height: '14px', borderRadius: '999px', background: subTask.color, flex: '0 0 auto' }} />
                                    <div style={{
                                      fontSize: isPhoneLayout ? '0.74rem' : '0.78rem',
                                      fontWeight: '700',
                                      color: '#0f172a',
                                      whiteSpace: isPhoneLayout ? 'normal' : 'nowrap',
                                      overflow: isPhoneLayout ? 'visible' : 'hidden',
                                      textOverflow: isPhoneLayout ? 'clip' : 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: isPhoneLayout ? 3 : 1,
                                      WebkitBoxOrient: 'vertical',
                                      lineHeight: 1.35,
                                      wordBreak: 'break-word',
                                      textDecoration: subTaskCompleted ? 'line-through' : 'none'
                                    }}>
                                      {subTask.name}
                                    </div>
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    flex: '0 0 auto',
                                    width: isPhoneLayout ? '100%' : 'auto',
                                    gridColumn: isPhoneLayout ? '1 / -1' : '2 / 3',
                                    justifyContent: isPhoneLayout ? 'flex-end' : 'flex-start'
                                  }}>
                                    {isPhoneLayout ? (
                                      <select
                                        value={subTaskStatus}
                                        onChange={(event) => updateSubTaskStatus(task.id, subTask.id, event.target.value)}
                                        style={{
                                          width: '104px',
                                          height: '26px',
                                          borderRadius: '999px',
                                          border: subTaskStatus === STATUS_COMPLETED ? '1px solid #86efac' : '1px solid #cbd5e1',
                                          background: subTaskStatus === STATUS_COMPLETED ? '#f0fdf4' : '#ffffff',
                                          color: subTaskStatus === STATUS_COMPLETED ? '#166534' : '#334155',
                                          padding: '0 0.45rem',
                                          fontSize: '0.62rem',
                                          fontWeight: '800',
                                          cursor: 'pointer'
                                        }}
                                        aria-label={`Status for ${subTask.name}`}
                                      >
                                        {STATUS_OPTIONS.map((statusOption) => (
                                          <option key={statusOption.value} value={statusOption.value}>
                                            {statusOption.label}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <div
                                        style={{
                                          height: '24px',
                                          borderRadius: '999px',
                                          border: subTaskStatus === STATUS_COMPLETED ? '1px solid #86efac' : '1px solid #cbd5e1',
                                          background: subTaskStatus === STATUS_COMPLETED ? '#f0fdf4' : '#ffffff',
                                          color: subTaskStatus === STATUS_COMPLETED ? '#166534' : '#334155',
                                          padding: '0 0.45rem',
                                          fontSize: '0.64rem',
                                          fontWeight: '800',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          whiteSpace: 'nowrap'
                                        }}
                                        aria-label={`Status badge for ${subTask.name}`}
                                      >
                                        {subTaskStatus === STATUS_COMPLETED ? 'Completed' : 'In Progress'}
                                      </div>
                                    )}

                                    <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#475569', fontFamily: '"JetBrains Mono", monospace' }}>{subDuration}d</div>
                                  </div>
                                </div>
                                <div style={{
                                  position: 'relative',
                                  height: '8px',
                                  borderRadius: '999px',
                                  background: '#dbe3ee',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    position: 'absolute',
                                    left: subPosition.left,
                                    width: subPosition.width,
                                    minWidth: '6px',
                                    height: '100%',
                                    borderRadius: '999px',
                                    background: subTaskCompleted
                                      ? `linear-gradient(135deg, ${subTask.color}aa 0%, ${subTask.color}78 100%)`
                                      : `linear-gradient(135deg, ${subTask.color} 0%, ${subTask.color}bf 100%)`
                                  }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {showTotals && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.8rem 0.9rem',
                  background: '#ffffff',
                  borderTop: '2px solid #e2e8f0',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  color: '#0f172a'
                }}>
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</span>
                  <span>{totalTopLevelTaskDaysLabel}</span>
                </div>
              )}

              <div style={{
                textAlign: 'center',
                borderTop: '1px solid #e2e8f0',
                padding: '0.8rem',
                background: '#ffffff'
              }}>
                <p style={{
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  fontWeight: '800',
                  margin: 0
                }}>
                  Note: Prepared by Zoho SMBS Team
                </p>
              </div>
            </div>
          ) : (
            <div className="timeline-grid-scroll" style={{ overflowX: 'auto' }}>
              <div
                className="timeline-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: chartGridTemplateColumns,
                  gap: '0',
                  background: '#f8fafc',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  minWidth: chartGridMinWidth ? `${chartGridMinWidth}px` : '100%'
                }}
              >
                {/* Tasks Column */}
                <div style={{
                  background: '#f8fafc',
                  borderRight: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    height: '70px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 1.5rem',
                    background: '#f1f5f9'
                  }}>
                    <h3 style={{
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      color: '#000000',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      margin: 0,
                      textAlign: 'center'
                    }}>
                      Tasks
                    </h3>
                  </div>

                  {/* Task Names */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0',
                    padding: '1rem 0 0 0'
                  }}>
                    {tasks.map((task, index) => {
                      const taskCompleted = getTaskCompletionStatus(task) === STATUS_COMPLETED;
                      const taskStatus = getTaskCompletionStatus(task);

                      return (
                      <div key={task.id}>
                        {/* Main Task Name */}
                        <div
                          style={{
                            minHeight: '56px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.5rem 1.5rem',
                            background: '#ffffff',
                            borderBottom: '1px solid #e2e8f0',
                            opacity: taskCompleted ? 0.78 : 1,
                            animation: `slideIn 0.4s ease-out ${index * 0.1}s both`,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f1f5f9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                          }}
                        >
                          <div style={{
                            width: '4px',
                            minHeight: '24px',
                            background: `linear-gradient(to bottom, ${task.color}, ${task.color}dd)`,
                            borderRadius: '2px',
                            marginRight: '1rem',
                            boxShadow: `0 2px 8px ${task.color}40`,
                            alignSelf: 'flex-start',
                            marginTop: '0.25rem'
                          }}></div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            flex: 1,
                            minWidth: 0
                          }}>
                            <div style={{
                              fontSize: '0.95rem',
                              fontWeight: '800',
                              color: '#000000',
                              textDecoration: taskCompleted ? 'line-through' : 'none',
                              flex: 1,
                              minWidth: 0,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: '1.4'
                            }}>
                              {task.name}
                            </div>

                            <div
                              style={{
                                height: '28px',
                                borderRadius: '999px',
                                border: taskStatus === STATUS_COMPLETED ? '1px solid #86efac' : '1px solid #cbd5e1',
                                background: taskStatus === STATUS_COMPLETED ? '#f0fdf4' : '#ffffff',
                                color: taskStatus === STATUS_COMPLETED ? '#166534' : '#334155',
                                padding: '0 0.55rem',
                                fontSize: '0.66rem',
                                fontWeight: '800',
                                display: 'inline-flex',
                                alignItems: 'center',
                                whiteSpace: 'nowrap',
                                flex: '0 0 auto'
                              }}
                              aria-label={`Status badge for ${task.name}`}
                            >
                              {taskStatus === STATUS_COMPLETED ? 'Completed' : 'In Progress'}
                            </div>
                          </div>
                        </div>

                        {/* Sub-task Names */}
                        {task.expanded && task.subTasks.map((subTask, subIndex) => {
                          const subTaskCompleted = normalizeStatus(subTask.status) === STATUS_COMPLETED;
                          const subTaskStatus = normalizeStatus(subTask.status);

                          return (
                          <div
                            key={subTask.id}
                            style={{
                              minHeight: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.5rem 1.5rem 0.5rem 3.5rem',
                              background: '#f8fafc',
                              borderBottom: '1px solid #e2e8f0',
                              opacity: subTaskCompleted ? 0.78 : 1,
                              animation: `slideIn 0.3s ease-out ${subIndex * 0.05}s both`,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f1f5f9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f8fafc';
                            }}
                          >
                            <div style={{
                              width: '3px',
                              minHeight: '18px',
                              background: `linear-gradient(to bottom, ${subTask.color}, ${subTask.color}cc)`,
                              borderRadius: '1.5px',
                              marginRight: '0.75rem',
                              opacity: 0.8,
                              alignSelf: 'flex-start',
                              marginTop: '0.25rem'
                            }}></div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.65rem',
                              flex: 1,
                              minWidth: 0
                            }}>
                              <div style={{
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                color: '#0f172a',
                                textDecoration: subTaskCompleted ? 'line-through' : 'none',
                                flex: 1,
                                minWidth: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: '1.4'
                              }}>
                                {subTask.name}
                              </div>

                              <div
                                style={{
                                  height: '24px',
                                  borderRadius: '999px',
                                  border: subTaskStatus === STATUS_COMPLETED ? '1px solid #86efac' : '1px solid #cbd5e1',
                                  background: subTaskStatus === STATUS_COMPLETED ? '#f0fdf4' : '#ffffff',
                                  color: subTaskStatus === STATUS_COMPLETED ? '#166534' : '#334155',
                                  padding: '0 0.45rem',
                                  fontSize: '0.62rem',
                                  fontWeight: '800',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  whiteSpace: 'nowrap',
                                  flex: '0 0 auto'
                                }}
                                aria-label={`Status badge for ${subTask.name}`}
                              >
                                {subTaskStatus === STATUS_COMPLETED ? 'Completed' : 'In Progress'}
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dates Column */}
                {showDatesInChart && (
                  <div style={{
                    background: '#f8fafc',
                    borderRight: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      height: '70px',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 1rem',
                      background: '#f1f5f9'
                    }}>
                      <h3 style={{
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        color: '#000000',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        margin: 0,
                        textAlign: 'center'
                      }}>
                        Dates
                      </h3>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0',
                      padding: '1rem 0 0 0'
                    }}>
                      {tasks.map((task, index) => (
                        <div key={task.id}>
                          {/* Main Task Dates */}
                          <div
                            style={{
                              minHeight: '56px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.5rem 1rem',
                              background: '#ffffff',
                              borderBottom: '1px solid #e2e8f0',
                              animation: `slideIn 0.4s ease-out ${index * 0.1}s both`,
                              transition: 'all 0.2s',
                              fontSize: '0.85rem',
                              fontFamily: '"JetBrains Mono", monospace',
                              fontWeight: '600',
                              color: '#0f172a'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f1f5f9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ffffff';
                            }}
                          >
                            {new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>

                          {/* Sub-task Dates */}
                          {task.expanded && task.subTasks.map((subTask, subIndex) => (
                            <div
                              key={subTask.id}
                              style={{
                                minHeight: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.5rem 1rem',
                                background: '#f8fafc',
                                borderBottom: '1px solid #e2e8f0',
                                animation: `slideIn 0.3s ease-out ${subIndex * 0.05}s both`,
                                transition: 'all 0.2s',
                                fontSize: '0.8rem',
                                fontFamily: '"JetBrains Mono", monospace',
                                fontWeight: '500',
                                color: '#475569'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                              }}
                            >
                              {new Date(subTask.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(subTask.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost Column */}
                {showCostInChart && (
                  <div style={{
                    background: '#f8fafc',
                    borderRight: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      height: '70px',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 1rem',
                      background: '#f1f5f9'
                    }}>
                      <h3 style={{
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        color: '#000000',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        margin: 0,
                        textAlign: 'center'
                      }}>
                        Cost
                      </h3>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0',
                      padding: '1rem 0 0 0'
                    }}>
                      {tasks.map((task, index) => (
                        <div key={task.id}>
                          {/* Main Task Cost */}
                          <div
                            style={{
                              minHeight: '56px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.5rem 1rem',
                              background: '#ffffff',
                              borderBottom: '1px solid #e2e8f0',
                              animation: `slideIn 0.4s ease-out ${index * 0.1}s both`,
                              transition: 'all 0.2s',
                              fontSize: '0.85rem',
                              fontFamily: '"JetBrains Mono", monospace',
                              fontWeight: '600',
                              color: '#0f172a'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f1f5f9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ffffff';
                            }}
                          >
                            {task.cost > 0 ? `${currency}${Number(task.cost).toLocaleString()}` : '-'}
                          </div>

                          {/* Sub-task Cost */}
                          {task.expanded && task.subTasks.map((subTask, subIndex) => (
                            <div
                              key={subTask.id}
                              style={{
                                minHeight: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.5rem 1rem',
                                background: '#f8fafc',
                                borderBottom: '1px solid #e2e8f0',
                                animation: `slideIn 0.3s ease-out ${subIndex * 0.05}s both`,
                                transition: 'all 0.2s',
                                fontSize: '0.8rem',
                                fontFamily: '"JetBrains Mono", monospace',
                                fontWeight: '500',
                                color: '#475569'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                              }}
                            >
                              {subTask.cost > 0 ? `${currency}${Number(subTask.cost).toLocaleString()}` : '-'}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline Column */}
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  {/* Timeline Header */}
                  <div style={{
                    position: 'relative',
                    height: '70px',
                    borderBottom: '1px solid #e2e8f0',
                    background: '#f1f5f9',
                    overflow: 'hidden',
                    paddingLeft: '0'
                  }}>
                    {timelineMarkers.map((marker, idx) => {
                      const nextMarker = timelineMarkers[idx + 1];
                      const nextPosition = nextMarker ? nextMarker.position : 100;
                      const width = nextPosition - marker.position;

                      return (
                        <div
                          key={idx}
                          style={{
                            position: 'absolute',
                            left: `${marker.position}%`,
                            width: `${width}%`,
                            top: 0,
                            bottom: 0,
                            borderLeft: idx === 0 ? 'none' : '1px solid #cbd5e1',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden'
                          }}
                        >
                          <div style={{
                            color: '#000000',
                            fontSize: '0.85rem',
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            textAlign: 'center'
                          }}>
                            {showQuarters ? `Q${Math.floor(marker.date.getMonth() / 3) + 1}` : marker.date.toLocaleDateString('en', { month: 'short' })}
                          </div>
                          <div style={{
                            color: '#000000',
                            fontSize: '0.9rem',
                            fontFamily: '"JetBrains Mono", monospace',
                            fontWeight: '800',
                            marginTop: '0.15rem',
                            textAlign: 'center'
                          }}>
                            {marker.date.getFullYear()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vertical Grid Lines */}
                  <div style={{
                    position: 'absolute',
                    top: '70px',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    overflow: 'hidden'
                  }}>
                    {timelineMarkers.map((marker, idx) => {
                      return (
                        <div
                          key={idx}
                          style={{
                            position: 'absolute',
                            left: `${marker.position}%`,
                            top: 0,
                            bottom: 0,
                            borderLeft: idx === 0 ? 'none' : '1px solid #e2e8f0'
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Gantt Bars */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0',
                    padding: '1rem 0 0 0',
                    position: 'relative'
                  }}>
                    {tasks.map((task, index) => {
                      const position = getTaskPosition(task);
                      const duration = getBusinessDays(task.startDate, task.endDate, holidays);
                      const taskCompleted = getTaskCompletionStatus(task) === STATUS_COMPLETED;

                      return (
                        <div key={task.id}>
                          {/* Main Task Bar */}
                          <div
                            style={{
                              position: 'relative',
                              width: '100%',
                              minHeight: '56px',
                              background: '#ffffff',
                              borderBottom: '1px solid #e2e8f0',
                              opacity: taskCompleted ? 0.76 : 1,
                              animation: `slideIn 0.4s ease-out ${index * 0.1}s both`,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <div
                              title={`${task.name} (${duration} days)`}
                              style={{
                                position: 'absolute',
                                left: position.left,
                                width: position.width,
                                height: '36px',
                                background: taskCompleted
                                  ? `linear-gradient(135deg, ${task.color}b3 0%, ${task.color}80 100%)`
                                  : `linear-gradient(135deg, ${task.color} 0%, ${task.color}dd 100%)`,
                                borderRadius: '12px',
                                boxShadow: taskCompleted ? 'none' : `0 4px 16px ${task.color}35, 0 2px 4px ${task.color}20`,
                                border: `1.5px solid ${task.color}`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'visible'
                              }}
                              onMouseEnter={(e) => {
                                if (taskCompleted) return;
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = `0 8px 24px ${task.color}45, 0 4px 8px ${task.color}30`;
                                e.currentTarget.style.zIndex = '10';
                              }}
                              onMouseLeave={(e) => {
                                if (taskCompleted) return;
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = `0 4px 16px ${task.color}35, 0 2px 4px ${task.color}20`;
                                e.currentTarget.style.zIndex = '1';
                              }}
                            >

                              <div style={getDurationBadgeStyle(task.color, 'main')}>
                                {duration}d
                              </div>
                            </div>
                          </div>

                          {/* Sub-task Bars */}
                          {task.expanded && task.subTasks.map((subTask, subIndex) => {
                            const subPosition = getTaskPosition(subTask);
                            const subDuration = getBusinessDays(subTask.startDate, subTask.endDate, holidays);
                            const subTaskCompleted = normalizeStatus(subTask.status) === STATUS_COMPLETED;

                            return (
                              <div
                                key={subTask.id}
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                  minHeight: '44px',
                                  background: '#f8fafc',
                                  borderBottom: '1px solid #e2e8f0',
                                  opacity: subTaskCompleted ? 0.76 : 1,
                                  animation: `slideIn 0.3s ease-out ${subIndex * 0.05}s both`,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <div
                                  title={`${subTask.name} (${subDuration} days)`}
                                  style={{
                                    position: 'absolute',
                                    left: subPosition.left,
                                    width: subPosition.width,
                                    height: '28px',
                                    background: subTaskCompleted
                                      ? `linear-gradient(135deg, ${subTask.color}aa 0%, ${subTask.color}78 100%)`
                                      : `linear-gradient(135deg, ${subTask.color}dd 0%, ${subTask.color}bb 100%)`,
                                    borderRadius: '10px',
                                    boxShadow: subTaskCompleted ? 'none' : `0 3px 12px ${subTask.color}30, 0 1px 3px ${subTask.color}20`,
                                    border: `1.5px solid ${subTask.color}cc`,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'default',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'visible'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (subTaskCompleted) return;
                                    e.currentTarget.style.transform = 'scale(1.08)';
                                    e.currentTarget.style.boxShadow = `0 6px 18px ${subTask.color}40, 0 2px 6px ${subTask.color}25`;
                                    e.currentTarget.style.zIndex = '10';
                                  }}
                                  onMouseLeave={(e) => {
                                    if (subTaskCompleted) return;
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = `0 3px 12px ${subTask.color}30, 0 1px 3px ${subTask.color}20`;
                                    e.currentTarget.style.zIndex = '1';
                                  }}
                                >
                                  <div style={getDurationBadgeStyle(subTask.color, 'sub')}>
                                    {subDuration}d
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {showTotals && (
                  <div style={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    background: '#ffffff',
                    borderTop: '2px solid #e2e8f0',
                    fontWeight: '800',
                    zIndex: 50,
                    position: 'relative'
                  }}>
                    {/* Label Column - Matches Task Column Width (320px) */}
                    <div style={{
                      flex: `0 0 ${taskLabelColumnWidth}px`,
                      padding: '1rem 1.5rem',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      borderRight: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Total
                    </div>

                    {/* Duration Column - Matches Date Column Width (200px) */}
                    {showDatesInChart && (
                      <div style={{
                        flex: '0 0 200px',
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#64748b',
                        borderRight: '1px solid #e2e8f0',
                        fontSize: '0.9rem',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {totalTopLevelTaskDaysLabel}
                      </div>
                    )}

                    {/* Cost Column - Matches Cost Column Width (100px) */}
                    {showCostInChart && (
                      <div style={{
                        flex: '0 0 100px',
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#0f172a',
                        borderRight: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {currency}
                        {tasks.reduce((acc, t) => acc + (Number(t.cost) || 0), 0).toLocaleString()}
                      </div>
                    )}

                    {/* Spacer for Timeline */}
                    <div style={{
                      flex: 1,
                      background: '#f8fafc',
                      borderBottom: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 1rem',
                      color: '#64748b',
                      fontSize: '0.9rem'
                    }}>
                      {!showDatesInChart && totalTopLevelTaskDaysLabel}
                    </div>
                  </div>
                )}

                {/* Footer Note - Now inside the grid at the very bottom */}
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  borderTop: '1px solid #e2e8f0',
                  padding: '1rem',
                  background: '#ffffff'
                }}>
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#94a3b8',
                    fontWeight: '800',
                    margin: 0
                  }}>
                    Note: Prepared by Zoho SMBS Team
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
          </>
        )}

        {toastNotifications.length > 0 && (
          <div style={{
            position: 'fixed',
            right: isPhoneLayout ? '0.55rem' : '1rem',
            left: isPhoneLayout ? '0.55rem' : 'auto',
            bottom: isPhoneLayout ? '0.6rem' : '1rem',
            zIndex: 92,
            display: 'grid',
            gap: '0.55rem',
            width: isPhoneLayout ? 'auto' : 'min(360px, calc(100vw - 2rem))',
            pointerEvents: 'none'
          }}>
            {toastNotifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  pointerEvents: 'auto',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 18px 35px rgba(15, 23, 42, 0.16)',
                  padding: '0.65rem 0.7rem',
                  display: 'grid',
                  gap: '0.2rem',
                  animation: 'popIn 0.18s ease-out both'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ minWidth: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{
                      padding: '0.1rem 0.35rem',
                      borderRadius: '999px',
                      border: notification.kind === 'auto' ? '1px solid #bfdbfe' : '1px solid #fdba74',
                      background: notification.kind === 'auto' ? '#eff6ff' : '#fffbeb',
                      color: notification.kind === 'auto' ? '#1e40af' : '#92400e',
                      fontSize: '0.62rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      flexShrink: 0
                    }}>
                      {notification.kind === 'auto' ? 'Auto' : 'Manual'}
                    </span>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {notification.title}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissNotification(notification.id)}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '7px',
                      border: '1px solid #dbe4ef',
                      background: '#ffffff',
                      color: '#64748b',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flex: '0 0 auto'
                    }}
                    aria-label="Dismiss notification"
                  >
                    <X size={11} />
                  </button>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: '600', lineHeight: 1.35 }}>
                  {notification.body}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '700' }}>
                  {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {recentNotifications.length > toastNotifications.length && (
              <button
                type="button"
                onClick={() => setShowNotificationPanel(true)}
                style={{
                  pointerEvents: 'auto',
                  height: '34px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  color: '#334155',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                View {recentNotifications.length - toastNotifications.length} more alert{recentNotifications.length - toastNotifications.length === 1 ? '' : 's'}
              </button>
            )}
          </div>
        )}



        <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes popIn {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes overlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ── Enterprise Toggle Switch ──────────────────────────────── */
        .ent-toggle {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .ent-toggle input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
          pointer-events: none;
        }
        .ent-toggle-track {
          display: inline-block;
          width: 40px;
          height: 22px;
          border-radius: 999px;
          background: #cbd5e1;
          transition: background 0.22s ease, box-shadow 0.22s ease;
          position: relative;
          box-shadow: inset 0 1px 3px rgba(15, 23, 42, 0.14);
        }
        .ent-toggle input:checked + .ent-toggle-track {
          background: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18), inset 0 1px 3px rgba(15, 23, 42, 0.08);
        }
        .ent-toggle-track::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.25);
          transition: transform 0.22s ease;
        }
        .ent-toggle input:checked + .ent-toggle-track::after {
          transform: translateX(18px);
        }
        .ent-toggle:hover .ent-toggle-track {
          filter: brightness(0.95);
        }

        /* ── Notification panel scrollbar ─────────────────────────── */
        .notif-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .notif-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .notif-scroll::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 999px;
        }

        @keyframes drawerIn {
          from {
            opacity: 0;
            transform: translateX(18px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        input[type="text"]:focus,
        input[type="number"]:focus,
        input[type="date"]:focus,
        select:focus {
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.16);
        }

        button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.18);
        }

        .task-row,
        .subtask-row {
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .task-row:hover {
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
        }

        .subtask-row:hover {
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
        }

        .tutorial-target-active {
          position: relative;
          z-index: 190;
          box-shadow: 0 0 0 5px rgba(14, 165, 233, 0.35), 0 20px 40px rgba(15, 23, 42, 0.2) !important;
          outline: 3px solid rgba(14, 165, 233, 0.92);
          outline-offset: 2px;
          border-radius: 14px;
          animation: tutorialPulse 1.6s ease-in-out infinite;
        }

        .tutorial-focus-ring {
          position: fixed;
          pointer-events: none;
          z-index: 330;
          border-radius: 16px;
          box-shadow:
            0 0 0 2px rgba(255, 255, 255, 0.92),
            0 0 0 6px rgba(14, 165, 233, 0.45),
            0 0 0 9999px rgba(15, 23, 42, 0.5),
            0 26px 60px rgba(2, 6, 23, 0.55);
          transition: top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease;
        }

        .tutorial-settings-target {
          width: 100%;
        }

        @keyframes tutorialPulse {
          0%,
          100% {
            box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2), 0 14px 30px rgba(15, 23, 42, 0.14);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(14, 165, 233, 0.12), 0 18px 36px rgba(15, 23, 42, 0.18);
          }
        }

        .welcome-overlay {
          position: fixed;
          inset: 0;
          z-index: 320;
          background: linear-gradient(160deg, rgba(15, 23, 42, 0.62), rgba(30, 41, 59, 0.5));
          backdrop-filter: blur(10px) saturate(1.1);
          -webkit-backdrop-filter: blur(10px) saturate(1.1);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          overflow-y: auto;
        }

        .welcome-card {
          width: min(760px, 100%);
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(226, 232, 240, 0.95);
          border-radius: 24px;
          box-shadow: 0 35px 80px rgba(15, 23, 42, 0.34);
          padding: 1.5rem;
          max-height: calc(100vh - 2rem);
          overflow-y: auto;
        }

        .welcome-card-header h2 {
          margin: 0.5rem 0 0.45rem;
          font-size: 1.8rem;
          line-height: 1.1;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .welcome-card-header p {
          margin: 0;
          font-size: 0.96rem;
          line-height: 1.55;
          color: #475569;
          font-weight: 600;
        }

        .welcome-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 800;
          color: #1e293b;
          padding: 0.38rem 0.6rem;
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          background: #f8fafc;
        }

        .welcome-preview-shell {
          margin-top: 1rem;
          border: 1px solid #dbe4ef;
          border-radius: 16px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          padding: 0.78rem;
          display: grid;
          gap: 0.6rem;
        }

        .welcome-preview-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.65rem;
        }

        .welcome-preview-label {
          font-size: 0.72rem;
          font-weight: 800;
          color: #1e3a8a;
          text-transform: uppercase;
          letter-spacing: 0.11em;
        }

        .welcome-preview-toggle {
          height: 30px;
          border-radius: 9px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0 0.58rem;
          cursor: pointer;
        }

        .welcome-preview-frame {
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          padding: 0.75rem;
          display: grid;
          gap: 0.62rem;
        }

        .welcome-preview-frame-head {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.62rem;
          align-items: flex-start;
        }

        .welcome-preview-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(148, 163, 184, 0.45);
          background: rgba(255, 255, 255, 0.75);
          color: #1e3a8a;
          flex: 0 0 auto;
        }

        .welcome-preview-frame h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        .welcome-preview-frame p {
          margin: 0.2rem 0 0;
          font-size: 0.82rem;
          line-height: 1.45;
          font-weight: 600;
          color: #334155;
        }

        .welcome-preview-bullets {
          display: flex;
          flex-wrap: wrap;
          gap: 0.38rem;
        }

        .welcome-preview-bullets span {
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.45);
          background: rgba(255, 255, 255, 0.82);
          padding: 0.17rem 0.48rem;
          font-size: 0.69rem;
          font-weight: 800;
          color: #334155;
          letter-spacing: 0.02em;
        }

        .welcome-preview-cue {
          font-size: 0.75rem;
          font-weight: 700;
          color: #1e3a8a;
          line-height: 1.4;
          border-radius: 10px;
          border: 1px solid rgba(191, 219, 254, 0.95);
          background: rgba(239, 246, 255, 0.9);
          padding: 0.46rem 0.55rem;
        }

        .welcome-preview-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.55rem;
        }

        .welcome-preview-nav {
          height: 30px;
          border-radius: 9px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0 0.62rem;
          cursor: pointer;
        }

        .welcome-preview-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.28rem;
          flex: 1;
        }

        .welcome-preview-dot {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          line-height: 0;
        }

        .welcome-preview-dot span {
          display: inline-flex;
          height: 7px;
          border-radius: 999px;
          transition: width 0.2s ease, background 0.2s ease;
        }

        .welcome-feature-grid {
          margin-top: 1.15rem;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .welcome-feature-grid > div {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 0.85rem;
          background: #ffffff;
        }

        .welcome-feature-grid h4 {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 800;
          color: #0f172a;
        }

        .welcome-feature-grid p {
          margin: 0.35rem 0 0;
          font-size: 0.82rem;
          color: #64748b;
          line-height: 1.45;
          font-weight: 600;
        }

        .welcome-actions {
          margin-top: 1.1rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          justify-content: flex-end;
        }

        .tutorial-coachmark {
          position: fixed;
          right: 1.1rem;
          bottom: 1.1rem;
          width: min(360px, calc(100vw - 2.2rem));
          z-index: 340;
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid rgba(100, 116, 139, 0.45);
          border-radius: 16px;
          box-shadow: 0 24px 50px rgba(2, 6, 23, 0.45);
          color: #e2e8f0;
          padding: 0.95rem;
          max-height: min(48vh, 340px);
          overflow-y: auto;
        }

        .tutorial-step-count {
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #93c5fd;
          font-weight: 800;
          margin-bottom: 0.45rem;
        }

        .tutorial-coachmark h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 800;
          color: #f8fafc;
        }

        .tutorial-coachmark p {
          margin: 0.55rem 0 0;
          font-size: 0.88rem;
          line-height: 1.48;
          color: #cbd5e1;
          font-weight: 600;
        }

        .tutorial-highlight-meta {
          margin-top: 0.72rem;
          display: grid;
          gap: 0.36rem;
        }

        .tutorial-highlight-chip {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #93c5fd;
        }

        .tutorial-highlight-tip {
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.34);
          background: rgba(15, 23, 42, 0.62);
          color: #e2e8f0;
          font-size: 0.78rem;
          font-weight: 700;
          line-height: 1.4;
          padding: 0.48rem 0.55rem;
        }

        .tutorial-actions {
          margin-top: 0.85rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          justify-content: flex-end;
        }

        .tutorial-secondary-btn,
        .tutorial-primary-btn {
          height: 36px;
          border-radius: 10px;
          border: 1px solid transparent;
          font-size: 0.83rem;
          font-weight: 800;
          padding: 0 0.8rem;
          cursor: pointer;
        }

        .tutorial-secondary-btn {
          background: rgba(148, 163, 184, 0.16);
          border-color: rgba(148, 163, 184, 0.26);
          color: #e2e8f0;
        }

        .tutorial-secondary-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .tutorial-primary-btn {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: #ffffff;
        }

        @media (prefers-reduced-motion: reduce) {
          .tutorial-target-active {
            animation: none !important;
          }

          .settings-overlay,
          .settings-panel,
          .tutorial-coachmark,
          .welcome-card,
          .tutorial-focus-ring {
            animation: none !important;
            transition: none !important;
          }
        }

        .header-controls::-webkit-scrollbar {
          display: none;
        }

        .header-controls {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .header-controls,
        .header-controls > div,
        .header-controls button {
          pointer-events: auto;
        }

        .command-panel-host {
          display: block !important;
        }

        .command-panel-host > .command-panel-card,
        .command-panel-host > div {
          width: 100%;
          min-width: 0;
        }

        .command-panel-host .toolbar-group {
          width: 100%;
          min-width: 0;
        }

        .command-panel-tabs button,
        .command-rail button {
          min-height: 42px;
        }

        .top-header-meta > div {
          max-width: 100%;
        }

        .header-controls .toolbar-group {
          backdrop-filter: blur(8px) saturate(1.05);
          -webkit-backdrop-filter: blur(8px) saturate(1.05);
        }

        .header-controls .toolbar-group:hover {
          border-color: #bfdbfe;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.96), 0 18px 30px rgba(15, 23, 42, 0.12);
        }

        .header-controls .toolbar-group button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .header-controls .toolbar-group button:active:not(:disabled) {
          transform: translateY(0);
        }

        .header-controls .toolbar-group button:disabled {
          box-shadow: none !important;
        }

        .view-switch-shell {
          overflow: hidden;
        }

        .view-switch-shell button {
          flex: 1 1 0;
        }

        /* Touch-friendly targets for mobile */
        @media (pointer: coarse) {
          button, select, input[type="date"] {
            min-height: 44px;
          }
        }

        /* Smooth transitions on interactive elements */
        .chart-card, .task-list-card {
          transition: box-shadow 0.25s ease;
        }

        /* Dashboard responsive adjustments */
        @media (max-width: 480px) {
          .app-shell {
            padding: 0.65rem 0.35rem !important;
          }
        }

        @media (max-width: 1150px) {
          .app-shell {
            padding: 1.8rem 0.9rem !important;
          }

          .project-title {
            font-size: 2rem !important;
          }

          .chart-card {
            padding: 1.5rem !important;
          }
        }

        @media (max-width: 980px) {
          .command-center-shell {
            grid-template-columns: 1fr !important;
          }

          .top-header {
            position: static !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
          }

          .top-header-meta {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.42rem !important;
          }

          .top-header-meta > div {
            width: 100%;
            justify-content: flex-start;
          }

          .project-title {
            font-size: 1.7rem !important;
            white-space: normal !important;
            line-height: 1.2 !important;
          }

          .header-controls {
            width: 100% !important;
            justify-content: flex-start !important;
            flex-wrap: wrap !important;
            overflow-x: visible !important;
          }

          .header-controls.command-panel-host {
            display: block !important;
          }

          .header-controls .toolbar-group {
            width: 100%;
          }

          .task-list-card,
          .chart-card {
            border-radius: 18px !important;
            padding: 1rem !important;
          }

          .settings-overlay {
            padding: 0.8rem !important;
            justify-content: center !important;
            align-items: flex-end !important;
          }

          .settings-panel {
            width: min(100%, 680px) !important;
            max-width: 100% !important;
            height: calc(100vh - 1.6rem) !important;
            border-radius: 20px !important;
          }

          .logos-grid {
            grid-template-columns: 1fr !important;
          }

          .welcome-feature-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .welcome-preview-frame-head {
            grid-template-columns: 1fr;
          }

          .welcome-preview-icon {
            width: 32px;
            height: 32px;
          }
        }

        @media (min-width: 761px) and (max-width: 980px) {
          .header-controls {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.6rem !important;
          }

          .header-controls.command-panel-host {
            display: block !important;
            grid-template-columns: 1fr !important;
          }

          .header-controls.command-panel-host .workspace-group,
          .header-controls.command-panel-host .utility-group,
          .header-controls.command-panel-host .action-group {
            grid-column: auto !important;
          }

          .header-controls .workspace-group {
            grid-column: 1 / -1;
          }

          .header-controls .utility-group,
          .header-controls .action-group {
            min-width: 0 !important;
          }

          .header-controls .toolbar-group button {
            min-width: 0;
          }
        }

        @media (max-width: 760px) {
          .app-shell {
            padding: 1rem 0.55rem !important;
          }

          .command-center-shell {
            gap: 0.55rem !important;
          }

          .command-panel-tabs {
            grid-template-columns: 1fr !important;
          }

          .top-header-meta {
            grid-template-columns: 1fr !important;
          }

          .project-title {
            font-size: 1.45rem !important;
          }

          .header-controls button {
            height: 42px !important;
            font-size: 0.86rem !important;
            padding: 0 0.8rem !important;
            border-radius: 12px !important;
          }

          .header-controls {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.55rem !important;
            align-items: stretch !important;
          }

          .header-controls.command-panel-host {
            display: block !important;
          }

          .header-controls > div,
          .header-controls .toolbar-group {
            width: 100%;
          }

          .header-controls .toolbar-group {
            padding: 0.34rem !important;
            border-radius: 12px !important;
          }

          .header-controls .toolbar-group .toolbar-select-wrap {
            flex: 1 1 100% !important;
          }

          .header-controls .toolbar-group button,
          .header-controls .toolbar-group > div button,
          .header-controls button,
          .header-controls > div button {
            width: 100% !important;
            justify-content: center !important;
          }

          .header-controls .view-switch-shell {
            width: 100% !important;
          }

          .header-controls .view-switch-shell button {
            width: calc(50% - 0.12rem) !important;
          }

          .task-row,
          .subtask-row {
            box-shadow: none !important;
            transform: none !important;
          }

          .task-row input[type="text"],
          .subtask-row input[type="text"] {
            width: 100% !important;
            min-width: 0 !important;
          }

          .toolbar-sync-pill {
            text-align: center;
            font-size: 0.72rem !important;
          }

          .mobile-detail-card {
            border-radius: 12px !important;
          }

          .welcome-card {
            padding: 1rem;
            border-radius: 18px;
            max-height: calc(100vh - 1rem);
          }

          .welcome-card-header h2 {
            font-size: 1.32rem;
          }

          .welcome-feature-grid {
            grid-template-columns: 1fr;
          }

          .welcome-preview-toolbar,
          .welcome-preview-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .welcome-preview-toggle,
          .welcome-preview-nav {
            width: 100%;
          }

          .welcome-preview-dots {
            justify-content: flex-start;
          }

          .welcome-actions {
            justify-content: stretch;
          }

          .welcome-actions button {
            width: 100%;
          }

          .tutorial-coachmark {
            right: 0.6rem;
            left: 0.6rem;
            top: calc(env(safe-area-inset-top, 0px) + 0.6rem);
            bottom: auto;
            width: auto;
            max-height: min(52vh, 360px);
          }

          .chart-logo-row {
            flex-direction: column;
            align-items: stretch !important;
            gap: 0.75rem;
          }

          .chart-title-wrap {
            margin-top: 0 !important;
            margin-bottom: 1.4rem !important;
          }

          .holiday-input-row {
            grid-template-columns: 1fr !important;
          }

          .mobile-date-row {
            grid-template-columns: 1fr !important;
          }

          .settings-overlay {
            padding: 0 !important;
          }

          .settings-panel {
            width: 100vw !important;
            max-width: 100vw !important;
            height: 92vh !important;
            border-top-left-radius: 20px !important;
            border-top-right-radius: 20px !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
          }
        }
       `}</style>
      </div>
    </div>
  );
}
