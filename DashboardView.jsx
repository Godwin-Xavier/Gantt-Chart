import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Mail, Filter, CheckCircle2, Clock, BarChart3, FolderOpen, Send, X, ListChecks, AlertCircle } from 'lucide-react';

const STATUS_COMPLETED = 'completed';

const clampPercent = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const percentLabel = (value) => `${Math.round(clampPercent(value))}%`;

const normalizeStatus = (value) => {
  if (typeof value !== 'string') return 'in_progress';
  const lower = value.toLowerCase().trim();
  if (lower === 'completed' || lower === 'complete' || lower === 'done') return 'completed';
  return 'in_progress';
};

const flattenTasksFromProject = (project) => {
  if (!project || !Array.isArray(project.tasks)) return [];
  const items = [];
  project.tasks.forEach((task) => {
    const subs = Array.isArray(task.subTasks) ? task.subTasks : [];
    if (subs.length > 0) {
      subs.forEach((sub) => {
        items.push({
          id: sub.id,
          name: sub.name,
          parentName: task.name,
          parentColor: task.color,
          color: sub.color || task.color,
          status: normalizeStatus(sub.status),
          startDate: sub.startDate,
          endDate: sub.endDate,
          cost: sub.cost || 0,
          isSubTask: true
        });
      });
    } else {
      items.push({
        id: task.id,
        name: task.name,
        parentName: null,
        parentColor: null,
        color: task.color,
        status: normalizeStatus(task.status),
        startDate: task.startDate,
        endDate: task.endDate,
        cost: task.cost || 0,
        isSubTask: false
      });
    }
  });
  return items;
};

const buildEmailBody = (projectSummaries, overallCompletion, totalProjects, completedProjects, dashboardProjects) => {
  let body = `Portfolio Dashboard Summary\n`;
  body += `${'='.repeat(40)}\n\n`;
  body += `Overall Completion: ${percentLabel(overallCompletion)}\n`;
  body += `Total Projects: ${totalProjects}\n`;
  body += `Completed Projects: ${completedProjects}\n`;
  body += `In Progress: ${totalProjects - completedProjects}\n\n`;
  body += `${'='.repeat(40)}\n`;
  body += `PROJECT DETAILS\n`;
  body += `${'='.repeat(40)}\n\n`;

  (dashboardProjects || []).forEach((project) => {
    const tasks = flattenTasksFromProject(project);
    const completed = tasks.filter(t => t.status === STATUS_COMPLETED);
    const pending = tasks.filter(t => t.status !== STATUS_COMPLETED);
    const pct = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;

    body += `${project.projectTitle}\n`;
    body += `${'-'.repeat(30)}\n`;
    body += `Progress: ${percentLabel(pct)} (${completed.length}/${tasks.length} items)\n\n`;

    if (completed.length > 0) {
      body += `  Completed Tasks:\n`;
      completed.forEach(t => {
        body += `    [DONE] ${t.parentName ? `${t.parentName} > ` : ''}${t.name}\n`;
      });
      body += '\n';
    }

    if (pending.length > 0) {
      body += `  Pending Tasks:\n`;
      pending.forEach(t => {
        body += `    [TODO] ${t.parentName ? `${t.parentName} > ` : ''}${t.name}\n`;
      });
      body += '\n';
    }
    body += '\n';
  });

  body += `${'='.repeat(40)}\n`;
  body += `Sent from Gantt Chart Planner\n`;
  return body;
};

// --- Stat Card ---
const StatCard = ({ icon, label, value, accent }) => (
  <div
    style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '1rem 1.1rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      cursor: 'default'
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
  >
    <div style={{
      width: '40px', height: '40px', borderRadius: '12px',
      background: accent || '#f1f5f9', border: '1px solid #e2e8f0',
      display: 'grid', placeItems: 'center', flexShrink: 0
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800, color: '#64748b' }}>
        {label}
      </div>
      <div style={{ marginTop: '0.25rem', fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  </div>
);

// --- Filter Tab Button ---
const FilterTab = ({ label, count, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      height: '36px',
      borderRadius: '10px',
      border: active ? '1px solid #6366f1' : '1px solid #e2e8f0',
      background: active ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#ffffff',
      color: active ? '#ffffff' : '#475569',
      fontSize: '0.8rem',
      fontWeight: 800,
      cursor: 'pointer',
      padding: '0 0.85rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s ease'
    }}
  >
    {label}
    <span style={{
      background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
      borderRadius: '6px',
      padding: '0.1rem 0.4rem',
      fontSize: '0.72rem',
      fontWeight: 800,
      color: active ? '#ffffff' : '#64748b'
    }}>
      {count}
    </span>
  </button>
);

// --- Task Item Row ---
const TaskItem = ({ task, isPhone }) => {
  const isCompleted = task.status === STATUS_COMPLETED;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: isPhone ? 'flex-start' : 'center',
        gap: '0.6rem',
        padding: '0.5rem 0.65rem',
        borderRadius: '10px',
        background: isCompleted ? '#f0fdf4' : '#fefce8',
        border: isCompleted ? '1px solid #bbf7d0' : '1px solid #fef08a',
        transition: 'all 0.15s ease',
        flexDirection: isPhone ? 'column' : 'row'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flex: 1,
        minWidth: 0,
        width: isPhone ? '100%' : 'auto'
      }}>
        <span style={{
          width: '4px', height: '16px', borderRadius: '999px',
          background: task.color, flexShrink: 0
        }} />
        {isCompleted ? (
          <CheckCircle2 size={15} style={{ color: '#16a34a', flexShrink: 0 }} />
        ) : (
          <Clock size={15} style={{ color: '#ca8a04', flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: '0.82rem', fontWeight: 700, color: '#0f172a',
            textDecoration: isCompleted ? 'line-through' : 'none',
            opacity: isCompleted ? 0.75 : 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {task.name}
          </div>
          {task.parentName && (
            <div style={{
              fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              marginTop: '0.1rem'
            }}>
              {task.parentName}
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        flexShrink: 0,
        width: isPhone ? '100%' : 'auto',
        justifyContent: isPhone ? 'flex-end' : 'flex-start'
      }}>
        {task.startDate && task.endDate && (
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#64748b',
            fontFamily: '"JetBrains Mono", monospace',
            whiteSpace: 'nowrap'
          }}>
            {new Date(task.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' - '}
            {new Date(task.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
        <div style={{
          height: '22px', borderRadius: '999px',
          border: isCompleted ? '1px solid #86efac' : '1px solid #fde68a',
          background: isCompleted ? '#dcfce7' : '#fef9c3',
          color: isCompleted ? '#166534' : '#854d0e',
          padding: '0 0.45rem',
          fontSize: '0.65rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          whiteSpace: 'nowrap'
        }}>
          {isCompleted ? 'Done' : 'Pending'}
        </div>
      </div>
    </div>
  );
};

// --- Project Expandable Card ---
const ProjectCard = ({ project, summary, onOpen, isPhone, globalFilter }) => {
  const [expanded, setExpanded] = useState(false);
  const allTasks = useMemo(() => flattenTasksFromProject(project), [project]);
  const completedTasks = useMemo(() => allTasks.filter(t => t.status === STATUS_COMPLETED), [allTasks]);
  const pendingTasks = useMemo(() => allTasks.filter(t => t.status !== STATUS_COMPLETED), [allTasks]);
  const completion = clampPercent(summary.completionPercent);

  const visibleTasks = useMemo(() => {
    if (globalFilter === 'completed') return completedTasks;
    if (globalFilter === 'pending') return pendingTasks;
    return allTasks;
  }, [globalFilter, allTasks, completedTasks, pendingTasks]);

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        background: '#ffffff',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease'
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.07)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Project Header */}
      <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: isPhone ? 'column' : 'row', gap: '0.65rem', alignItems: isPhone ? 'stretch' : 'center' }}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0,
            textAlign: 'left'
          }}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} task details for ${summary.projectTitle}`}
        >
          {expanded ? <ChevronDown size={18} style={{ color: '#6366f1', flexShrink: 0 }} /> : <ChevronRight size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: '0.95rem', fontWeight: 800, color: '#0f172a',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {summary.projectTitle}
            </div>
            <div style={{
              marginTop: '0.15rem', fontSize: '0.74rem', color: '#64748b', fontWeight: 700,
              display: 'flex', gap: '0.6rem', flexWrap: 'wrap'
            }}>
              <span style={{ color: '#16a34a' }}>{completedTasks.length} completed</span>
              <span style={{ color: '#ca8a04' }}>{pendingTasks.length} pending</span>
              <span>{summary.totalUnits} total</span>
            </div>
          </div>
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          justifyContent: isPhone ? 'space-between' : 'flex-end',
          flexShrink: 0
        }}>
          <div style={{
            fontSize: '1.1rem', fontWeight: 800,
            color: completion >= 100 ? '#16a34a' : completion >= 50 ? '#2563eb' : '#0f172a'
          }}>
            {percentLabel(completion)}
          </div>
          <button
            type="button"
            onClick={() => onOpen(project.id)}
            style={{
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '10px',
              height: '34px',
              padding: '0 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
          >
            <FolderOpen size={14} /> Open
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ padding: '0 1rem 0.75rem 1rem' }}>
        <div style={{
          position: 'relative', height: '8px', borderRadius: '999px',
          background: '#e2e8f0', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            width: `${completion}%`,
            minWidth: completion > 0 ? '8px' : 0,
            borderRadius: '999px',
            background: completion >= 100
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Expanded Task List */}
      {expanded && (
        <div style={{
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          padding: '0.75rem',
          animation: 'fadeIn 0.15s ease-out both'
        }}>
          {visibleTasks.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '1rem',
              color: '#94a3b8', fontSize: '0.82rem', fontWeight: 700
            }}>
              <AlertCircle size={18} style={{ marginBottom: '0.3rem', display: 'inline-block' }} />
              <div>No {globalFilter !== 'all' ? globalFilter : ''} tasks in this project.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              {visibleTasks.map((task) => (
                <TaskItem key={task.id} task={task} isPhone={isPhone} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Share via Email Modal ---
const ShareEmailModal = ({ onClose, emailBody, subject, isPhone }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const handleMailTo = () => {
    const mailto = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailto, '_blank');
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = emailBody;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 100,
        display: 'grid', placeItems: 'center',
        padding: '1rem',
        animation: 'overlayFade 0.18s ease-out both'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '540px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 35px 80px rgba(15, 23, 42, 0.22)',
          padding: '1.25rem',
          animation: 'popIn 0.2s ease-out both',
          maxHeight: 'calc(100vh - 2rem)',
          overflow: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.72rem', fontWeight: 800, color: '#6366f1',
              background: '#eef2ff', border: '1px solid #c7d2fe',
              borderRadius: '999px', padding: '0.22rem 0.55rem'
            }}>
              <Send size={12} /> Share Dashboard
            </div>
            <h3 style={{ margin: '0.55rem 0 0 0', fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>
              Share via Email
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            style={{
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              width: '36px', height: '36px', borderRadius: '10px',
              color: '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
            Recipient Email (optional)
          </label>
          <input
            type="email"
            value={recipientEmail}
            onChange={e => setRecipientEmail(e.target.value)}
            placeholder="colleague@company.com"
            style={{
              width: '100%', height: '42px', borderRadius: '10px',
              border: '1px solid #cbd5e1', background: '#ffffff',
              padding: '0 0.75rem', fontSize: '0.88rem', fontWeight: 600,
              color: '#0f172a', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Preview */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: '10px', padding: '0.65rem',
          maxHeight: '220px', overflowY: 'auto',
          marginBottom: '0.75rem'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
            Preview
          </div>
          <pre style={{
            margin: 0, fontSize: '0.72rem', fontWeight: 600, color: '#334155',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55,
            fontFamily: '"JetBrains Mono", monospace'
          }}>
            {emailBody}
          </pre>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr',
          gap: '0.55rem'
        }}>
          <button
            type="button"
            onClick={handleCopyToClipboard}
            style={{
              height: '42px', borderRadius: '10px',
              border: '1px solid #cbd5e1', background: '#ffffff',
              color: '#0f172a', fontSize: '0.85rem', fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <ListChecks size={16} />
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            type="button"
            onClick={handleMailTo}
            style={{
              height: '42px', borderRadius: '10px',
              border: '1px solid #6366f1',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff', fontSize: '0.85rem', fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.4rem'
            }}
          >
            <Mail size={16} /> Open Email Client
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Main Dashboard Component
// ==========================================
export default function DashboardView({
  projectSummaries,
  dashboardProjects,
  overallCompletion,
  totalProjects,
  completedProjects,
  onOpenProject,
  isPhoneLayout,
  isCompactLayout
}) {
  const [taskFilter, setTaskFilter] = useState('all');
  const [showShareModal, setShowShareModal] = useState(false);

  const isPhone = Boolean(isPhoneLayout);
  const safeOverall = clampPercent(overallCompletion);
  const inProgressProjects = totalProjects - completedProjects;

  const allFlatTasks = useMemo(() => {
    if (!Array.isArray(dashboardProjects)) return [];
    return dashboardProjects.flatMap(flattenTasksFromProject);
  }, [dashboardProjects]);

  const totalTaskCount = allFlatTasks.length;
  const completedTaskCount = allFlatTasks.filter(t => t.status === STATUS_COMPLETED).length;
  const pendingTaskCount = totalTaskCount - completedTaskCount;

  const emailSubject = `Portfolio Dashboard - ${percentLabel(safeOverall)} Complete (${completedProjects}/${totalProjects} projects)`;
  const emailBody = useMemo(
    () => buildEmailBody(projectSummaries, overallCompletion, totalProjects, completedProjects, dashboardProjects),
    [projectSummaries, overallCompletion, totalProjects, completedProjects, dashboardProjects]
  );

  if (!Array.isArray(projectSummaries) || projectSummaries.length === 0) {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 16px 35px rgba(15, 23, 42, 0.10)',
        padding: '2.5rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '0.8rem' }}>
          <BarChart3 size={40} style={{ color: '#cbd5e1' }} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          Dashboard
        </h2>
        <p style={{ marginTop: '0.6rem', color: '#64748b', fontWeight: 600, maxWidth: '340px', marginInline: 'auto', lineHeight: 1.5 }}>
          No projects yet. Add your first project to see portfolio progress, task breakdowns, and completion tracking.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>

      {/* Header Row */}
      <div style={{
        display: 'flex',
        alignItems: isPhone ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: '0.6rem',
        flexDirection: isPhone ? 'column' : 'row'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isPhone ? '1.18rem' : '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            Portfolio Dashboard
          </h2>
          <p style={{ margin: '0.3rem 0 0 0', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>
            Track progress across all projects and tasks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          style={{
            height: '40px', borderRadius: '12px',
            border: '1px solid #cbd5e1', background: '#ffffff',
            color: '#0f172a', fontSize: '0.84rem', fontWeight: 800,
            cursor: 'pointer', padding: '0 1rem',
            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
            whiteSpace: 'nowrap', transition: 'all 0.15s ease',
            alignSelf: isPhone ? 'stretch' : 'auto',
            justifyContent: 'center'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#6366f1'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        >
          <Mail size={16} /> Share via Email
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isPhone
          ? 'repeat(2, minmax(0, 1fr))'
          : `repeat(${isCompactLayout ? 2 : 4}, minmax(0, 1fr))`,
        gap: '0.65rem'
      }}>
        <StatCard
          icon={<BarChart3 size={18} style={{ color: '#6366f1' }} />}
          label="Overall"
          value={percentLabel(safeOverall)}
          accent="#eef2ff"
        />
        <StatCard
          icon={<FolderOpen size={18} style={{ color: '#0ea5e9' }} />}
          label="Projects"
          value={totalProjects}
          accent="#f0f9ff"
        />
        <StatCard
          icon={<CheckCircle2 size={18} style={{ color: '#10b981' }} />}
          label="Completed"
          value={completedProjects}
          accent="#f0fdf4"
        />
        <StatCard
          icon={<Clock size={18} style={{ color: '#f59e0b' }} />}
          label="In Progress"
          value={inProgressProjects}
          accent="#fffbeb"
        />
      </div>

      {/* Donut + Filter Section */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        padding: '1.15rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isPhone ? '1fr' : 'auto 1fr',
          gap: '1.25rem',
          alignItems: 'center'
        }}>
          {/* Donut Chart */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              aria-label={`Overall completion ${percentLabel(safeOverall)}`}
              role="img"
              style={{
                width: isPhone ? '140px' : '170px',
                height: isPhone ? '140px' : '170px',
                borderRadius: '999px',
                background: `conic-gradient(#10b981 0deg ${safeOverall * 3.6}deg, #e2e8f0 ${safeOverall * 3.6}deg 360deg)`,
                display: 'grid', placeItems: 'center',
                border: '1px solid #cbd5e1',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                width: isPhone ? '90px' : '110px',
                height: isPhone ? '90px' : '110px',
                borderRadius: '999px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'grid', placeItems: 'center'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: isPhone ? '1.3rem' : '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                    {percentLabel(safeOverall)}
                  </div>
                  <div style={{
                    marginTop: '0.2rem', fontSize: '0.65rem', fontWeight: 800,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b'
                  }}>
                    Complete
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Task summary breakdown */}
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#10b981' }} />
              {completedTaskCount} tasks completed
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#e2e8f0' }} />
              {pendingTaskCount} tasks pending
            </div>
            <div style={{
              marginTop: '0.25rem', padding: '0.5rem 0.65rem',
              background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0',
              fontSize: '0.78rem', fontWeight: 700, color: '#475569'
            }}>
              {totalTaskCount} total items across {totalProjects} project{totalProjects !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        flexWrap: 'wrap'
      }}>
        <Filter size={16} style={{ color: '#94a3b8', marginRight: '0.15rem' }} />
        <FilterTab label="All Tasks" count={totalTaskCount} active={taskFilter === 'all'} onClick={() => setTaskFilter('all')} />
        <FilterTab label="Completed" count={completedTaskCount} active={taskFilter === 'completed'} onClick={() => setTaskFilter('completed')} />
        <FilterTab label="Pending" count={pendingTaskCount} active={taskFilter === 'pending'} onClick={() => setTaskFilter('pending')} />
      </div>

      {/* Project Cards with Task Breakdowns */}
      <div style={{ display: 'grid', gap: '0.65rem' }}>
        {projectSummaries.map((summary) => {
          const project = (dashboardProjects || []).find(p => p.id === summary.id);
          return (
            <ProjectCard
              key={summary.id}
              project={project}
              summary={summary}
              onOpen={onOpenProject}
              isPhone={isPhone}
              globalFilter={taskFilter}
            />
          );
        })}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareEmailModal
          onClose={() => setShowShareModal(false)}
          emailBody={emailBody}
          subject={emailSubject}
          isPhone={isPhone}
        />
      )}
    </div>
  );
}
