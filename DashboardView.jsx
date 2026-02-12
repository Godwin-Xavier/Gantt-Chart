import React from 'react';

const clampPercent = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const percentLabel = (value) => `${Math.round(clampPercent(value))}%`;

export default function DashboardView({
  projectSummaries,
  overallCompletion,
  totalProjects,
  completedProjects,
  onOpenProject
}) {
  const safeOverall = clampPercent(overallCompletion);

  if (!Array.isArray(projectSummaries) || projectSummaries.length === 0) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 16px 35px rgba(15, 23, 42, 0.10)',
          padding: '2rem'
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Dashboard</h2>
        <p style={{ marginTop: '0.6rem', color: '#64748b', fontWeight: 600 }}>No projects yet. Add your first project to see portfolio progress.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.1rem' }}>
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 16px 35px rgba(15, 23, 42, 0.10)',
          padding: '1.25rem'
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.28rem', fontWeight: 800, color: '#0f172a' }}>Portfolio Dashboard</h2>
          <p style={{ margin: '0.45rem 0 0 0', color: '#64748b', fontWeight: 600 }}>
            Unified project completion view across all tracked timelines.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.8rem'
          }}
        >
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800, color: '#64748b' }}>
              Overall Completion
            </div>
            <div style={{ marginTop: '0.45rem', fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>{percentLabel(safeOverall)}</div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800, color: '#64748b' }}>
              Total Projects
            </div>
            <div style={{ marginTop: '0.45rem', fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>{totalProjects}</div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800, color: '#64748b' }}>
              Completed Projects
            </div>
            <div style={{ marginTop: '0.45rem', fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>{completedProjects}</div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 16px 35px rgba(15, 23, 42, 0.10)',
          padding: '1.25rem'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              aria-label={`Overall completion ${percentLabel(safeOverall)}`}
              role="img"
              style={{
                width: '190px',
                height: '190px',
                borderRadius: '999px',
                background: `conic-gradient(#10b981 0deg ${safeOverall * 3.6}deg, #e2e8f0 ${safeOverall * 3.6}deg 360deg)`,
                display: 'grid',
                placeItems: 'center',
                border: '1px solid #cbd5e1'
              }}
            >
              <div
                style={{
                  width: '122px',
                  height: '122px',
                  borderRadius: '999px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{percentLabel(safeOverall)}</div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
                    Completed
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.55rem' }}>
            {projectSummaries.map((project) => {
              const completion = clampPercent(project.completionPercent);
              return (
                <div
                  key={project.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    padding: '0.7rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {project.projectTitle}
                      </div>
                      <div style={{ marginTop: '0.1rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                        {project.completedUnits} / {project.totalUnits} items completed
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenProject(project.id)}
                      style={{
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        borderRadius: '10px',
                        height: '34px',
                        padding: '0 0.65rem',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Open
                    </button>
                  </div>

                  <div style={{ position: 'relative', height: '10px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${completion}%`,
                        minWidth: completion > 0 ? '10px' : 0,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      }}
                    />
                  </div>

                  <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', fontWeight: 800, color: '#334155', textAlign: 'right' }}>
                    {percentLabel(completion)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
