
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X, Calendar, Edit2, ChevronDown, ChevronRight, Settings, Upload, Image as ImageIcon, FileJson, FileType, DollarSign, Sparkles, BookOpenCheck, BarChart3, FolderPlus } from 'lucide-react';
import DashboardView from './DashboardView';

const APP_STORAGE_KEY = 'gantt-chart:workspace:v3';
const LEGACY_APP_STORAGE_KEY = 'gantt-chart:workspace:v2';
const INTRO_BANNER_KEY = 'gantt-chart:intro-banner-seen:v1';
const TUTORIAL_DONE_KEY = 'gantt-chart:tutorial-done:v1';

const STATUS_IN_PROGRESS = 'in_progress';
const STATUS_COMPLETED = 'completed';

const STATUS_OPTIONS = [
  { value: STATUS_IN_PROGRESS, label: 'In Progress' },
  { value: STATUS_COMPLETED, label: 'Completed' }
];

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
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => !readStorageFlag(INTRO_BANNER_KEY));
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
  const fileInputRef = useRef(null);
  const chartRef = useRef(null);
  const modifyMenuRef = useRef(null);
  const titleRef = useRef(null);
  const importButtonRef = useRef(null);
  const modifyButtonRef = useRef(null);
  const addTaskButtonRef = useRef(null);
  const settingsButtonRef = useRef(null);
  const companyUploadRef = useRef(null);
  const holidayDateRef = useRef(null);
  const taskEditorRef = useRef(null);
  const timelineChartRef = useRef(null);
  const settingsPanelRef = useRef(null);
  const scriptLoaderRef = useRef({});
  const lastHydratedProjectIdRef = useRef(null);
  const isHydratingProjectRef = useRef(false);

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

  const tutorialSteps = useMemo(() => ([
    {
      id: 'title',
      title: 'Name your project',
      body: 'Tap the title to rename your tracker for the project you are working on.',
      target: 'title',
      panel: null
    },
    {
      id: 'import',
      title: 'Import an existing plan',
      body: 'Use Import to load a previously exported JSON plan and continue from where you stopped.',
      target: 'import',
      panel: null
    },
    {
      id: 'add-task',
      title: 'Add task phases',
      body: 'Use Add Task to create major phases. Each phase can hold many subtasks.',
      target: 'addTask',
      panel: null
    },
    {
      id: 'modify-menu',
      title: 'Modify and export',
      body: 'Open Modify Graph to switch dates, quarters, totals, cost view, and export formats.',
      target: 'modifyMenu',
      panel: 'modify'
    },
    {
      id: 'settings-button',
      title: 'Open settings and branding',
      body: 'Use this button to manage logos and holiday calendars for your timeline calculations.',
      target: 'settingsButton',
      panel: null
    },
    {
      id: 'company-logo',
      title: 'Upload your company logo',
      body: 'Add your company logo so exports look professional and branded.',
      target: 'companyUpload',
      panel: 'settings'
    },
    {
      id: 'holiday-date',
      title: 'Set holidays for business days',
      body: 'Choose dates here to exclude non-working holidays from duration totals.',
      target: 'holidayDate',
      panel: 'settings'
    },
    {
      id: 'editor',
      title: 'Edit dates and duration',
      body: 'In the Tasks area, update durations, dates, colors, and optional costs.',
      target: 'taskEditor',
      panel: null
    },
    {
      id: 'timeline',
      title: 'Read the timeline',
      body: 'The timeline updates instantly as you edit tasks so you can track progress at a glance.',
      target: 'timeline',
      panel: null
    }
  ]), []);

  const activeTutorialStep = isTutorialActive ? tutorialSteps[tutorialStepIndex] : null;
  const activeTutorialTarget = activeTutorialStep?.target || null;

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
    setShowHolidayManager(false);
    setShowModifyMenu(false);
    setTutorialStepIndex(0);
    setIsTutorialActive(true);
  };

  const openGuideIntro = () => {
    navigateToView('planner');
    setIsTutorialActive(false);
    setShowModifyMenu(false);
    setShowHolidayManager(false);
    setShowWelcomeBanner(true);
  };

  const skipTutorial = () => {
    setShowWelcomeBanner(false);
    setShowHolidayManager(false);
    setShowModifyMenu(false);
    setIsTutorialActive(false);
    markIntroSeen();
  };

  const completeTutorial = () => {
    setIsTutorialActive(false);
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
      import: importButtonRef.current,
      addTask: addTaskButtonRef.current,
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

  useEffect(() => {
    if (!isTutorialActive || !activeTutorialStep) return;

    if (activeTutorialStep.panel === 'modify') {
      setShowHolidayManager(false);
      setShowModifyMenu(true);
    } else if (activeTutorialStep.panel === 'settings') {
      setShowModifyMenu(false);
      setShowHolidayManager(true);
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
    }, 140);

    return () => window.clearTimeout(timeoutId);
  }, [activeTutorialStep, isTutorialActive]);

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
  }, [isTutorialActive, activeTutorialTarget, showModifyMenu, showHolidayManager, isCompactLayout]);

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
    const snapshot = buildActiveProjectSnapshot();

    return collection.map((project) => (
      project.id === activeProjectId
        ? { ...project, ...snapshot }
        : project
    ));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(APP_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          const loadedProjects = parsed.projects.map((project) => createProjectRecord(project));
          const nextActiveId = loadedProjects.some((project) => project.id === parsed.activeProjectId)
            ? parsed.activeProjectId
            : loadedProjects[0].id;
          setProjects(loadedProjects);
          lastHydratedProjectIdRef.current = null;
          setActiveProjectId(nextActiveId);
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
          setProjects([migratedProject]);
          lastHydratedProjectIdRef.current = null;
          setActiveProjectId(migratedProject.id);
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
    setProjects([starterProject]);
    lastHydratedProjectIdRef.current = null;
    setActiveProjectId(starterProject.id);
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
        const projectsToPersist = saveActiveProjectIntoCollection(projects).map((project) => createProjectRecord(project));
        const payload = {
          schemaVersion: 3,
          activeProjectId,
          projects: projectsToPersist,
          savedAt: new Date().toISOString()
        };
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

  const switchProject = (projectId) => {
    if (!projectId || projectId === activeProjectId) return;
    setProjects((prevProjects) => saveActiveProjectIntoCollection(prevProjects));
    lastHydratedProjectIdRef.current = null;
    setIsEditingTitle(false);
    setActiveProjectId(projectId);
    setShowModifyMenu(false);
    setShowHolidayManager(false);
  };

  const addProject = () => {
    let newProjectId = null;

    setProjects((prevProjects) => {
      const withSnapshot = saveActiveProjectIntoCollection(prevProjects);
      const newProject = createProjectRecord({
        id: createProjectId(),
        projectTitle: createProjectName(withSnapshot),
        tasks: normalizeTaskTree(buildDefaultTasks(loginDateSeed))
      });
      newProjectId = newProject.id;
      return [...withSnapshot, newProject];
    });

    if (newProjectId) {
      lastHydratedProjectIdRef.current = null;
      setIsEditingTitle(false);
      setActiveProjectId(newProjectId);
      navigateToView('planner');
    }
  };

  const openProjectFromDashboard = (projectId) => {
    switchProject(projectId);
    navigateToView('planner');
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
  const savedAtLabel = lastSavedAt
    ? lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

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

  const editorGridColumns = isCompactLayout
    ? ['30px', 'minmax(0, 1fr)', '112px', '78px'].join(' ')
    : [
      '36px',
      'minmax(260px, 1fr)',
      '132px',
      '92px',
      ...(showDatesInEditor ? ['150px', '150px'] : []),
      ...(showCostInEditor ? ['140px'] : []),
      '54px',
      '44px'
    ].join(' ');

  const editorMinWidth = isCompactLayout
    ? 0
    : (showDatesInEditor
      ? (showCostInEditor ? 1160 : 1020)
      : (showCostInEditor ? 860 : 700));

  const chartGridMinWidth = isCompactLayout
    ? 0
    : (showDatesInChart
      ? (showCostInChart ? 1240 : 1140)
      : (showCostInChart ? 1040 : 940));

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
                  We will guide you through the main features in under two minutes: rename your plan,
                  import data, add tasks, upload logos, set holidays, and read the live timeline.
                </p>
              </div>

              <div className="welcome-feature-grid">
                <div>
                  <h4>Rename project</h4>
                  <p>Set your project name first so all exports and views stay aligned.</p>
                </div>
                <div>
                  <h4>Import JSON</h4>
                  <p>Load an existing timeline to continue work without re-entering data.</p>
                </div>
                <div>
                  <h4>Add tasks</h4>
                  <p>Create phases and subtasks with business-day planning controls.</p>
                </div>
                <div>
                  <h4>Upload company logo</h4>
                  <p>Brand your exported timeline with customer and company logos.</p>
                </div>
                <div>
                  <h4>Holiday calendar</h4>
                  <p>Exclude holidays so duration calculations reflect real working days.</p>
                </div>
                <div>
                  <h4>Live timeline + export</h4>
                  <p>Review bars instantly and export as PNG, JPEG, PDF, or JSON.</p>
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

            <div className="tutorial-actions">
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

        {/* Header */}
        <div className="top-header" style={{
          marginBottom: '2.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          position: 'relative',
          top: 'auto',
          zIndex: 1,
          padding: '1.1rem 1.25rem',
          borderRadius: '22px',
          background: '#ffffff',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          boxShadow: '0 12px 26px rgba(15, 23, 42, 0.07)'
        }}>
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
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#000000',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid #000000',
                outline: 'none',
                padding: '0.5rem 0',
                flex: 1
              }}
            />
          ) : (
            <h1
              ref={titleRef}
              className={`project-title ${activeTutorialTarget === 'title' ? 'tutorial-target-active' : ''}`}
              onClick={() => setIsEditingTitle(true)}
              style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#000000',
                margin: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'opacity 0.2s',
                flex: '1 1 auto',
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.1
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {projectTitle}
              <Edit2 size={28} style={{ opacity: 0.5 }} />
            </h1>
          )}

          <div
            className="header-controls"
            style={{
              display: isPhoneLayout ? 'grid' : 'flex',
              alignItems: isPhoneLayout ? 'stretch' : 'center',
              gap: '0.5rem',
              gridTemplateColumns: isPhoneLayout ? '1fr 1fr' : undefined,
              flexWrap: isPhoneLayout ? 'wrap' : 'nowrap',
              padding: '0.4rem',
              borderRadius: '18px',
              background: 'rgba(248, 250, 252, 0.92)',
              border: '1px solid rgba(226, 232, 240, 0.95)',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
              width: isPhoneLayout ? '100%' : 'auto',
              flex: isPhoneLayout ? '1 1 auto' : '0 0 auto',
              overflowX: isPhoneLayout ? 'visible' : 'visible',
              scrollbarWidth: 'none'
            }}
          >
            <div style={{ minWidth: isPhoneLayout ? '100%' : '220px', flex: isPhoneLayout ? '1 1 auto' : '0 0 auto' }}>
              <select
                value={activeProjectId || ''}
                onChange={(e) => switchProject(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '14px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  padding: '0 0.85rem',
                  cursor: 'pointer'
                }}
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
              onClick={addProject}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                color: '#ffffff',
                border: 'none',
                height: '46px',
                padding: '0 1rem',
                borderRadius: '14px',
                fontSize: '0.9rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: isPhoneLayout ? 'center' : 'flex-start',
                width: isPhoneLayout ? '100%' : 'auto',
                whiteSpace: 'nowrap'
              }}
              title="Add New Project"
            >
              <FolderPlus size={17} />
              Add Project
            </button>

            <button
              type="button"
              onClick={() => {
                setShowModifyMenu(false);
                setShowHolidayManager(false);
                navigateToView(isDashboardView ? 'planner' : 'dashboard');
              }}
              style={{
                background: isDashboardView ? 'linear-gradient(135deg, #334155 0%, #1e293b 100%)' : '#f8fafc',
                color: isDashboardView ? '#ffffff' : '#0f172a',
                border: `1px solid ${isDashboardView ? '#334155' : '#e2e8f0'}`,
                height: '46px',
                padding: '0 1rem',
                borderRadius: '14px',
                fontSize: '0.9rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: isPhoneLayout ? 'center' : 'flex-start',
                width: isPhoneLayout ? '100%' : 'auto',
                whiteSpace: 'nowrap'
              }}
              title={isDashboardView ? 'Back to Planner' : 'Open Dashboard'}
            >
              <BarChart3 size={17} />
              {isDashboardView ? 'Planner' : 'Dashboard'}
            </button>

            {!isPhoneLayout && savedAtLabel && (
              <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#64748b', padding: '0 0.35rem' }}>
                Auto-saved {savedAtLabel}
              </div>
            )}

            {!isDashboardView && (
              <>
            <button
              type="button"
              ref={importButtonRef}
              className={activeTutorialTarget === 'import' ? 'tutorial-target-active' : ''}
              onClick={() => {
                setShowModifyMenu(false);
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                height: '46px',
                padding: '0 1.15rem',
                borderRadius: '14px',
                fontSize: '0.98rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                justifyContent: isPhoneLayout ? 'center' : 'flex-start',
                width: isPhoneLayout ? '100%' : 'auto',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
                boxShadow: '0 10px 22px rgba(16, 185, 129, 0.22)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 14px 28px rgba(16, 185, 129, 0.26)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 22px rgba(16, 185, 129, 0.22)';
              }}
              title="Import JSON"
            >
              <Upload size={18} strokeWidth={2.5} />
              Import
            </button>

            <button
              type="button"
              onClick={openGuideIntro}
              style={{
                background: '#f8fafc',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                height: '46px',
                padding: '0 1.05rem',
                borderRadius: '14px',
                fontSize: '0.95rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                justifyContent: isPhoneLayout ? 'center' : 'flex-start',
                width: isPhoneLayout ? '100%' : 'auto',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
              title="Start guided tutorial"
            >
              <BookOpenCheck size={17} />
              Guide
            </button>

            <div ref={modifyMenuRef} style={{ position: 'relative', flex: isPhoneLayout ? '1 1 auto' : '0 0 auto', width: isPhoneLayout ? '100%' : 'auto' }}>
              <button
                type="button"
                ref={modifyButtonRef}
                className={activeTutorialTarget === 'modifyMenu' ? 'tutorial-target-active' : ''}
                onClick={() => {
                  setShowHolidayManager(false);
                  setShowModifyMenu((prev) => !prev);
                }}
                style={{
                  background: showModifyMenu ? '#eef2ff' : '#f8fafc',
                  border: `1px solid ${showModifyMenu ? 'rgba(99, 102, 241, 0.45)' : '#e2e8f0'}`,
                  color: '#0f172a',
                  height: '46px',
                  padding: '0 1.05rem',
                  borderRadius: '14px',
                  fontSize: '0.98rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  justifyContent: isPhoneLayout ? 'center' : 'flex-start',
                  width: isPhoneLayout ? '100%' : 'auto',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                  boxShadow: showModifyMenu ? '0 10px 24px rgba(99, 102, 241, 0.12)' : 'none',
                  transition: 'all 0.2s',
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = showModifyMenu ? '#eef2ff' : '#f1f5f9';
                  e.currentTarget.style.borderColor = showModifyMenu ? 'rgba(99, 102, 241, 0.55)' : '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = showModifyMenu ? '#eef2ff' : '#f8fafc';
                  e.currentTarget.style.borderColor = showModifyMenu ? 'rgba(99, 102, 241, 0.45)' : '#e2e8f0';
                }}
                aria-expanded={showModifyMenu}
              >
                <Settings size={18} />
                Modify Graph
                <ChevronDown size={16} />
              </button>

              {showModifyMenu && (
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
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                height: '46px',
                padding: '0 1.2rem',
                borderRadius: '14px',
                fontSize: '0.98rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                justifyContent: isPhoneLayout ? 'center' : 'flex-start',
                width: isPhoneLayout ? '100%' : 'auto',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
                boxShadow: '0 10px 22px rgba(37, 99, 235, 0.18)',
                transition: 'all 0.2s',
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 14px 28px rgba(37, 99, 235, 0.22)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 22px rgba(37, 99, 235, 0.18)';
              }}
              title="Add Task"
            >
              <Plus size={18} strokeWidth={2.5} />
              Add Task
            </button>

            <button
              type="button"
              ref={settingsButtonRef}
              className={activeTutorialTarget === 'settingsButton' ? 'tutorial-target-active' : ''}
              onClick={() => {
                setShowModifyMenu(false);
                setShowHolidayManager((prev) => !prev);
              }}
              style={{
                background: showHolidayManager ? '#eef2ff' : '#f8fafc',
                border: `1px solid ${showHolidayManager ? 'rgba(99, 102, 241, 0.45)' : '#e2e8f0'}`,
                height: '46px',
                width: isPhoneLayout ? '100%' : '46px',
                padding: isPhoneLayout ? '0 0.85rem' : 0,
                gridColumn: isPhoneLayout ? '1 / -1' : 'auto',
                borderRadius: '14px',
                cursor: 'pointer',
                color: showHolidayManager ? '#4f46e5' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isPhoneLayout ? '0.55rem' : 0,
                boxShadow: showHolidayManager ? '0 10px 24px rgba(99, 102, 241, 0.12)' : 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = showHolidayManager ? '#eef2ff' : '#f1f5f9';
                e.currentTarget.style.borderColor = showHolidayManager ? 'rgba(99, 102, 241, 0.55)' : '#cbd5e1';
                e.currentTarget.style.color = showHolidayManager ? '#4f46e5' : '#334155';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = showHolidayManager ? '#eef2ff' : '#f8fafc';
                e.currentTarget.style.borderColor = showHolidayManager ? 'rgba(99, 102, 241, 0.45)' : '#e2e8f0';
                e.currentTarget.style.color = showHolidayManager ? '#4f46e5' : '#64748b';
              }}
              title="Settings & Branding"
              aria-label="Settings & Branding"
            >
              <Settings size={20} />
              {isPhoneLayout && <span style={{ fontWeight: '800', fontSize: '0.92rem' }}>Settings & Branding</span>}
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={importChart}
              accept=".json"
              style={{ display: 'none' }}
            />
              </>
            )}
          </div>
        </div>

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

                      <label style={{
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
          <DashboardView
            projectSummaries={projectSummaries}
            overallCompletion={overallCompletion}
            totalProjects={dashboardProjects.length}
            completedProjects={completedProjects}
            onOpenProject={openProjectFromDashboard}
          />
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
                <div style={{ textAlign: 'center' }}>Status</div>
                <div style={{ textAlign: 'center' }}>Days</div>
                {showInlineEditorExtras && showDatesInEditor && (
                  <>
                    <div>Start</div>
                    <div>End</div>
                  </>
                )}
                {showInlineEditorExtras && showCostInEditor && <div>Cost</div>}
                {showInlineEditorExtras && <div style={{ textAlign: 'center' }}>Color</div>}
                {showInlineEditorExtras && <div />}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tasks.map((task, index) => {
                  const taskStatus = getTaskCompletionStatus(task);
                  const isTaskCompleted = taskStatus === STATUS_COMPLETED;
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
                          padding: isCompactLayout ? '0.85rem' : '1.25rem',
                          display: 'grid',
                          gridTemplateColumns: editorGridColumns,
                          gap: isCompactLayout ? '0.55rem' : '1rem',
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
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: isCompactLayout ? '0.65rem 0.7rem' : '0.75rem 1rem',
                            color: '#000000',
                            fontSize: isCompactLayout ? '0.95rem' : '1rem',
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

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <select
                            value={taskStatus}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            style={{
                              width: isCompactLayout ? '106px' : '124px',
                              height: isCompactLayout ? '38px' : '42px',
                              borderRadius: '9px',
                              border: taskStatus === STATUS_COMPLETED ? '1px solid #86efac' : '1px solid #cbd5e1',
                              background: taskStatus === STATUS_COMPLETED ? '#f0fdf4' : '#ffffff',
                              color: taskStatus === STATUS_COMPLETED ? '#166534' : '#0f172a',
                              fontSize: isCompactLayout ? '0.74rem' : '0.8rem',
                              fontWeight: '700',
                              padding: '0 0.5rem',
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
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.25rem',
                          width: isCompactLayout ? '70px' : '80px'
                        }}>
                          <input
                            type="number"
                            min="1"
                            value={parentDays}
                            onChange={(e) => updateTaskDuration(task.id, e.target.value)}
                            style={{
                              width: isCompactLayout ? '56px' : '60px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: isCompactLayout ? '0.6rem' : '0.75rem',
                              color: '#0f172a',
                              fontSize: isCompactLayout ? '0.82rem' : '0.875rem',
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
                                lineHeight: 1
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

                      {isCompactLayout && (showDates || showCost) && (
                        <div className="mobile-detail-card" style={{
                          marginTop: '0.6rem',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          display: 'grid',
                          gap: '0.6rem'
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
                                  fontSize: '0.82rem',
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
                                  fontSize: '0.82rem',
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
                                  fontSize: '0.84rem',
                                  outline: 'none',
                                  fontWeight: '600'
                                }}
                              />
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
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
                              onClick={() => removeTask(task.id)}
                              style={{
                                flex: 1,
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
                                    padding: isCompactLayout ? '0.75rem' : '1rem',
                                    marginBottom: '0.5rem',
                                    display: 'grid',
                                    gridTemplateColumns: editorGridColumns,
                                    gap: isCompactLayout ? '0.55rem' : '0.75rem',
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
                                      background: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      padding: isCompactLayout ? '0.55rem 0.65rem' : '0.625rem 0.875rem',
                                      color: '#0f172a',
                                      fontSize: isCompactLayout ? '0.84rem' : '0.9rem',
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

                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <select
                                      value={subTaskStatus}
                                      onChange={(e) => updateSubTaskStatus(task.id, subTask.id, e.target.value)}
                                      style={{
                                        width: isCompactLayout ? '102px' : '120px',
                                        height: isCompactLayout ? '34px' : '38px',
                                        borderRadius: '8px',
                                        border: subTaskStatus === STATUS_COMPLETED ? '1px solid #86efac' : '1px solid #cbd5e1',
                                        background: subTaskStatus === STATUS_COMPLETED ? '#f0fdf4' : '#ffffff',
                                        color: subTaskStatus === STATUS_COMPLETED ? '#166534' : '#0f172a',
                                        fontSize: isCompactLayout ? '0.72rem' : '0.78rem',
                                        fontWeight: '700',
                                        padding: '0 0.45rem',
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
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    width: isCompactLayout ? '68px' : '80px'
                                  }}>
                                    <input
                                      type="number"
                                      min="1"
                                      value={rollup.days}
                                      onChange={(e) => updateSubTaskDuration(task.id, subTask.id, e.target.value)}
                                      style={{
                                        width: isCompactLayout ? '54px' : '60px',
                                        background: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        padding: isCompactLayout ? '0.5rem' : '0.625rem',
                                        color: '#0f172a',
                                        fontSize: isCompactLayout ? '0.74rem' : '0.8rem',
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
                                        lineHeight: 1
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

                                {isCompactLayout && (showDates || showCost) && (
                                  <div className="mobile-detail-card" style={{
                                    marginTop: '0.5rem',
                                    background: '#ffffff',
                                    border: '1px solid #dbe4ef',
                                    borderRadius: '8px',
                                    padding: '0.6rem',
                                    display: 'grid',
                                    gap: '0.55rem'
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
                                            fontSize: '0.78rem',
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
                                            fontSize: '0.78rem',
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
                                            fontSize: '0.78rem',
                                            outline: 'none',
                                            fontWeight: '600'
                                          }}
                                        />
                                      </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                                        onClick={() => removeSubTask(task.id, subTask.id)}
                                        style={{
                                          flex: 1,
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
                              padding: '0.75rem 1rem',
                              marginTop: '0.25rem',
                              marginBottom: '0.5rem',
                              background: '#ffffff',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.85rem',
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
                  const taskCompleted = getTaskCompletionStatus(task) === STATUS_COMPLETED;

                  return (
                    <div key={task.id} style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff', opacity: taskCompleted ? 0.78 : 1 }}>
                      <div style={{
                        padding: '0.75rem 0.85rem 0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                          <span style={{ width: '4px', height: '18px', borderRadius: '999px', background: task.color, flex: '0 0 auto' }} />
                          <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: taskCompleted ? 'line-through' : 'none' }}>
                            {task.name}
                          </div>
                        </div>
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
                              ? `repeating-linear-gradient(135deg, ${task.color}88 0, ${task.color}88 8px, ${task.color}66 8px, ${task.color}66 14px)`
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
                            const subTaskCompleted = normalizeStatus(subTask.status) === STATUS_COMPLETED;
                            return (
                              <div key={subTask.id} style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '0.55rem',
                                opacity: subTaskCompleted ? 0.78 : 1
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                                    <span style={{ width: '3px', height: '14px', borderRadius: '999px', background: subTask.color, flex: '0 0 auto' }} />
                                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: subTaskCompleted ? 'line-through' : 'none' }}>
                                      {subTask.name}
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#475569', fontFamily: '"JetBrains Mono", monospace' }}>{subDuration}d</div>
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
                                      ? `repeating-linear-gradient(135deg, ${subTask.color}88 0, ${subTask.color}88 7px, ${subTask.color}66 7px, ${subTask.color}66 12px)`
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
                            fontSize: '0.95rem',
                            fontWeight: '800',
                            color: '#000000',
                            textDecoration: taskCompleted ? 'line-through' : 'none',
                            flex: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: '1.4'
                          }}>
                            {task.name}
                          </div>
                        </div>

                        {/* Sub-task Names */}
                        {task.expanded && task.subTasks.map((subTask, subIndex) => {
                          const subTaskCompleted = normalizeStatus(subTask.status) === STATUS_COMPLETED;

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
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color: '#0f172a',
                              textDecoration: subTaskCompleted ? 'line-through' : 'none',
                              flex: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: '1.4'
                            }}>
                              {subTask.name}
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
                                  ? `repeating-linear-gradient(135deg, ${task.color}88 0, ${task.color}88 9px, ${task.color}66 9px, ${task.color}66 16px)`
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
                                      ? `repeating-linear-gradient(135deg, ${subTask.color}88 0, ${subTask.color}88 8px, ${subTask.color}66 8px, ${subTask.color}66 14px)`
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

        .tutorial-actions {
          margin-top: 0.85rem;
          display: flex;
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
        }

        .header-controls,
        .header-controls > div,
        .header-controls button {
          pointer-events: auto;
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
          .top-header {
            position: static !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
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
        }

        @media (max-width: 760px) {
          .app-shell {
            padding: 1rem 0.55rem !important;
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
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            align-items: stretch;
          }

          .header-controls > div {
            width: 100%;
          }

          .header-controls button,
          .header-controls > div button {
            width: 100% !important;
            justify-content: center !important;
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
