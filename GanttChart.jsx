import React, { useState, useRef } from 'react';
import { Plus, X, Calendar, Edit2, Download, ChevronDown, ChevronRight } from 'lucide-react';

export default function GanttChart() {
  const currentYear = new Date().getFullYear();
  const [projectTitle, setProjectTitle] = useState('My Project Timeline');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const chartRef = useRef(null);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      name: 'Planning Phase',
      startDate: `${currentYear}-03-01`,
      endDate: `${currentYear}-03-15`,
      color: '#6366f1',
      expanded: true,
      subTasks: [
        {
          id: 101,
          name: 'Requirements Gathering',
          startDate: `${currentYear}-03-01`,
          endDate: `${currentYear}-03-08`,
          color: '#818cf8'
        }
      ]
    },
    {
      id: 2,
      name: 'Development',
      startDate: `${currentYear}-03-10`,
      endDate: `${currentYear}-04-20`,
      color: '#8b5cf6',
      expanded: true,
      subTasks: []
    },
    {
      id: 3,
      name: 'Testing',
      startDate: `${currentYear}-04-15`,
      endDate: `${currentYear}-05-05`,
      color: '#ec4899',
      expanded: true,
      subTasks: []
    }
  ]);

  const addTask = () => {
    const newTask = {
      id: Date.now(),
      name: 'New Task',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      color: '#6366f1',
      expanded: true,
      subTasks: []
    };
    setTasks([...tasks, newTask]);
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const toggleExpanded = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, expanded: !task.expanded } : task
    ));
  };

  const addSubTask = (parentId) => {
    const parent = tasks.find(t => t.id === parentId);
    const newSubTask = {
      id: Date.now(),
      name: 'New Sub-task',
      startDate: parent.startDate,
      endDate: parent.endDate,
      color: parent.color + 'cc' // Slightly transparent
    };

    setTasks(tasks.map(task =>
      task.id === parentId
        ? { ...task, subTasks: [...task.subTasks, newSubTask], expanded: true }
        : task
    ));
  };

  const removeSubTask = (parentId, subTaskId) => {
    setTasks(tasks.map(task =>
      task.id === parentId
        ? { ...task, subTasks: task.subTasks.filter(st => st.id !== subTaskId) }
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

  const downloadChart = async () => {
    if (!chartRef.current || isDownloading) return;

    setIsDownloading(true);

    try {
      // Try to load html2canvas from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load html2canvas'));
        document.head.appendChild(script);
      });

      // Wait a bit for script to be ready
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check if html2canvas is available
      if (typeof window.html2canvas === 'undefined') {
        throw new Error('html2canvas not loaded');
      }

      // Capture the chart
      const canvas = await window.html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: false
      });

      // Convert to image and trigger download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${projectTitle.replace(/\s+/g, '_')}_gantt_chart.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up script
      document.head.removeChild(script);

      setIsDownloading(false);

    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download chart: ${error.message}. Please try again or check your browser console for details.`);
      setIsDownloading(false);
    }
  };

  // Calculate timeline range
  const getTimelineRange = () => {
    if (tasks.length === 0) return { start: new Date(), end: new Date() };

    const allDates = [];
    tasks.forEach(task => {
      allDates.push(new Date(task.startDate), new Date(task.endDate));
      task.subTasks.forEach(st => {
        allDates.push(new Date(st.startDate), new Date(st.endDate));
      });
    });

    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    // Set to start of month for min date
    minDate.setDate(1);
    minDate.setHours(0, 0, 0, 0);

    // Set to end of month for max date
    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setDate(0);
    maxDate.setHours(23, 59, 59, 999);

    return { start: minDate, end: maxDate };
  };

  const { start: timelineStart, end: timelineEnd } = getTimelineRange();
  const totalDays = (timelineEnd - timelineStart) / (1000 * 60 * 60 * 24);

  const getTaskPosition = (task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    const startOffset = (taskStart - timelineStart) / (1000 * 60 * 60 * 24);
    const duration = (taskEnd - taskStart) / (1000 * 60 * 60 * 24);

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`
    };
  };

  // Generate month markers
  const generateMonthMarkers = () => {
    const markers = [];
    const current = new Date(timelineStart);
    current.setDate(1); // Start of month

    while (current <= timelineEnd) {
      const offset = Math.ceil((current - timelineStart) / (1000 * 60 * 60 * 24));
      const position = (offset / totalDays) * 100;

      markers.push({
        date: new Date(current),
        position: position
      });

      current.setMonth(current.getMonth() + 1);
    }

    return markers;
  };

  const monthMarkers = generateMonthMarkers();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      padding: '3rem 2rem',
      fontFamily: '"Outfit", sans-serif',
      color: '#0f172a'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        animation: 'fadeIn 0.6s ease-out'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem'
        }}>
          {isEditingTitle ? (
            <input
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
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {projectTitle}
              <Edit2 size={28} style={{ opacity: 0.5 }} />
            </h1>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={downloadChart}
              disabled={isDownloading}
              style={{
                background: isDownloading
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                padding: '0.875rem 1.75rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: isDownloading
                  ? '0 4px 20px rgba(107, 114, 128, 0.3)'
                  : '0 4px 20px rgba(16, 185, 129, 0.3)',
                opacity: isDownloading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isDownloading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDownloading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              <Download size={20} />
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>

            <button
              onClick={addTask}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                border: 'none',
                padding: '0.875rem 1.75rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(99, 102, 241, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.3)';
              }}
            >
              <Plus size={20} />
              Add Task
            </button>
          </div>
        </div>

        {/* Task List */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '1.5rem',
            opacity: 1
          }}>
            Tasks
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tasks.map((task, index) => (
              <div key={task.id} style={{ animation: `slideIn 0.3s ease-out ${index * 0.05}s both` }}>
                {/* Main Task */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto auto auto auto',
                    gap: '1rem',
                    alignItems: 'center',
                    border: '1px solid #e2e8f0'
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
                      padding: '0.75rem 1rem',
                      color: '#000000',
                      fontSize: '1rem',
                      fontWeight: '700',
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} style={{ color: '#64748b' }} />
                    <input
                      type="date"
                      value={task.startDate}
                      onChange={(e) => updateTask(task.id, 'startDate', e.target.value)}
                      style={{
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
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>→</span>
                    <input
                      type="date"
                      value={task.endDate}
                      onChange={(e) => updateTask(task.id, 'endDate', e.target.value)}
                      style={{
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
                  </div>

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
                </div>

                {/* Sub-tasks */}
                {task.expanded && (
                  <div style={{ marginTop: '0.5rem', marginLeft: '2.5rem' }}>
                    {task.subTasks.map((subTask, subIndex) => (
                      <div
                        key={subTask.id}
                        style={{
                          background: '#f1f5f9',
                          borderRadius: '10px',
                          padding: '1rem',
                          marginBottom: '0.5rem',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto auto auto auto',
                          gap: '0.75rem',
                          alignItems: 'center',
                          border: '1px solid #e2e8f0',
                          animation: `slideIn 0.2s ease-out ${subIndex * 0.03}s both`
                        }}
                      >
                        <input
                          type="text"
                          value={subTask.name}
                          onChange={(e) => updateSubTask(task.id, subTask.id, 'name', e.target.value)}
                          placeholder="Sub-task name"
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '0.625rem 0.875rem',
                            color: '#0f172a',
                            fontSize: '0.9rem',
                            fontWeight: '600',
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

                        <input
                          type="date"
                          value={subTask.startDate}
                          onChange={(e) => updateSubTask(task.id, subTask.id, 'startDate', e.target.value)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '0.625rem',
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
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '0.625rem',
                            color: '#0f172a',
                            fontSize: '0.8rem',
                            fontFamily: '"JetBrains Mono", monospace',
                            outline: 'none',
                            colorScheme: 'light'
                          }}
                        />

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
                      </div>
                    ))}

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
            ))}
          </div>
        </div>

        {/* Gantt Chart */}
        <div
          ref={chartRef}
          data-chart-export="true"
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '2.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '2.5rem',
            flexDirection: 'column',
            gap: '0.5rem',
            textAlign: 'center'
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            gap: '0',
            background: '#f8fafc',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
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
                padding: '1rem 0'
              }}>
                {tasks.map((task, index) => (
                  <div key={task.id}>
                    {/* Main Task Name */}
                    <div
                      style={{
                        minHeight: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.5rem 1.5rem',
                        background: index % 2 === 0 ? '#ffffff' : 'transparent',
                        borderBottom: '1px solid #e2e8f0',
                        animation: `slideIn 0.4s ease-out ${index * 0.1}s both`,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : 'transparent';
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
                        flex: 1,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        lineHeight: '1.4'
                      }}>
                        {task.name}
                      </div>
                    </div>

                    {/* Sub-task Names */}
                    {task.expanded && task.subTasks.map((subTask, subIndex) => (
                      <div
                        key={subTask.id}
                        style={{
                          minHeight: '44px',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem 1.5rem 0.5rem 3.5rem',
                          background: '#f8fafc',
                          borderBottom: '1px solid #e2e8f0',
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
                          flex: 1,
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          lineHeight: '1.4'
                        }}>
                          {subTask.name}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

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
                {monthMarkers.map((marker, idx) => {
                  const nextMarker = monthMarkers[idx + 1];
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
                        {marker.date.toLocaleDateString('en', { month: 'short' })}
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
                {monthMarkers.map((marker, idx) => {
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
                padding: '1rem 0',
                position: 'relative'
              }}>
                {tasks.map((task, index) => {
                  const position = getTaskPosition(task);
                  const duration = Math.ceil((new Date(task.endDate) - new Date(task.startDate)) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={task.id}>
                      {/* Main Task Bar */}
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          minHeight: '56px',
                          background: index % 2 === 0 ? '#ffffff' : 'transparent',
                          borderBottom: '1px solid #e2e8f0',
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
                            background: `linear-gradient(135deg, ${task.color} 0%, ${task.color}dd 100%)`,
                            borderRadius: '12px',
                            boxShadow: `0 4px 16px ${task.color}35, 0 2px 4px ${task.color}20`,
                            border: `1.5px solid ${task.color}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = `0 8px 24px ${task.color}45, 0 4px 8px ${task.color}30`;
                            e.currentTarget.style.zIndex = '10';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = `0 4px 16px ${task.color}35, 0 2px 4px ${task.color}20`;
                            e.currentTarget.style.zIndex = '1';
                          }}
                        >
                          {/* Shine effect */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '50%',
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)',
                            borderRadius: '12px 12px 0 0'
                          }}></div>

                          <div style={{
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontFamily: '"JetBrains Mono", monospace',
                            fontWeight: '800',
                            background: 'rgba(0, 0, 0, 0.25)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            position: 'relative',
                            zIndex: 2
                          }}>
                            {duration}d
                          </div>
                        </div>
                      </div>

                      {/* Sub-task Bars */}
                      {task.expanded && task.subTasks.map((subTask, subIndex) => {
                        const subPosition = getTaskPosition(subTask);
                        const subDuration = Math.ceil((new Date(subTask.endDate) - new Date(subTask.startDate)) / (1000 * 60 * 60 * 24));

                        return (
                          <div
                            key={subTask.id}
                            style={{
                              position: 'relative',
                              width: '100%',
                              minHeight: '44px',
                              background: 'rgba(241, 245, 249, 0.4)',
                              borderBottom: '1px solid #f8fafc',
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
                                background: `linear-gradient(135deg, ${subTask.color}dd 0%, ${subTask.color}bb 100%)`,
                                borderRadius: '10px',
                                boxShadow: `0 3px 12px ${subTask.color}30, 0 1px 3px ${subTask.color}20`,
                                border: `1.5px solid ${subTask.color}cc`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.08)';
                                e.currentTarget.style.boxShadow = `0 6px 18px ${subTask.color}40, 0 2px 6px ${subTask.color}25`;
                                e.currentTarget.style.zIndex = '10';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = `0 3px 12px ${subTask.color}30, 0 1px 3px ${subTask.color}20`;
                                e.currentTarget.style.zIndex = '1';
                              }}
                            >
                              {/* Shine effect */}
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '50%',
                                background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)',
                                borderRadius: '10px 10px 0 0'
                              }}></div>

                              <div style={{
                                color: '#fff',
                                fontSize: '0.75rem',
                                fontFamily: '"JetBrains Mono", monospace',
                                fontWeight: '800',
                                background: 'rgba(0, 0, 0, 0.2)',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '6px',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                position: 'relative',
                                zIndex: 2
                              }}>
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
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
      `}</style>
    </div>
  );
}