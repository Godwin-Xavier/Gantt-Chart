
import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Calendar, Edit2, Download, ChevronDown, ChevronRight, Settings, Upload, Image as ImageIcon, FileJson, FileType, DollarSign } from 'lucide-react';

export default function GanttChart() {
  const currentYear = new Date().getFullYear();

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



  // Internal ResizableImage Component
  const ResizableImage = ({ src, initialWidth, onResize, alt }) => {
    const [width, setWidth] = useState(initialWidth || 150);
    const [isResizing, setIsResizing] = useState(false);
    const [activeHandle, setActiveHandle] = useState(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    useEffect(() => {
      if (initialWidth) setWidth(initialWidth);
    }, [initialWidth]);

    const handleMouseDown = (e, handle) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      setActiveHandle(handle);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
      if (!isResizing || !activeHandle) return;

      const dx = e.clientX - startXRef.current;
      let change = 0;

      // Determine direction of resize based on handle
      if (activeHandle.includes('w')) {
        // West: dragging left increases width
        change = -dx;
      } else {
        // East: dragging right increases width
        change = dx;
      }

      const newWidth = Math.max(50, Math.min(800, startWidthRef.current + change));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setActiveHandle(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (onResize) onResize(width);
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
          onMouseDown={(e) => handleMouseDown(e, 'nw')}
          style={{ ...handleStyle, top: -6, left: -6, cursor: 'nw-resize' }}
          title="Resize"
        />
        <div
          onMouseDown={(e) => handleMouseDown(e, 'ne')}
          style={{ ...handleStyle, top: -6, right: -6, cursor: 'ne-resize' }}
          title="Resize"
        />
        <div
          onMouseDown={(e) => handleMouseDown(e, 'sw')}
          style={{ ...handleStyle, bottom: -6, left: -6, cursor: 'sw-resize' }}
          title="Resize"
        />
        <div
          onMouseDown={(e) => handleMouseDown(e, 'se')}
          style={{ ...handleStyle, bottom: -6, right: -6, cursor: 'se-resize' }}
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

  const [projectTitle, setProjectTitle] = useState('My Project Timeline');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDates, setShowDates] = useState(true);
  const [showCost, setShowCost] = useState(false);
  const [currency, setCurrency] = useState('$');
  const [showHolidayManager, setShowHolidayManager] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [customerLogo, setCustomerLogo] = useState(null);
  const [customerLogoWidth, setCustomerLogoWidth] = useState(150);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [companyLogoWidth, setCompanyLogoWidth] = useState(150);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef(null);
  const chartRef = useRef(null);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      name: 'Planning Phase',
      startDate: `${currentYear}-03-01`,
      endDate: `${currentYear}-03-15`,
      color: '#6366f1',
      cost: 1000,
      expanded: true,
      subTasks: [
        {
          id: 101,
          name: 'Requirements Gathering',
          startDate: `${currentYear}-03-01`,
          endDate: `${currentYear}-03-08`,
          color: '#818cf8',
          cost: 500
        }
      ]
    },
    {
      id: 2,
      name: 'Development',
      startDate: `${currentYear}-03-10`,
      endDate: `${currentYear}-04-20`,
      color: '#8b5cf6',
      cost: 5000,
      expanded: true,
      subTasks: []
    },
    {
      id: 3,
      name: 'Testing',
      startDate: `${currentYear}-04-15`,
      endDate: `${currentYear}-05-05`,
      color: '#ec4899',
      cost: 2000,
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
      cost: 0,
      expanded: true,
      subTasks: []
    };
    setTasks([...tasks, newTask]);
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(task => {
      if (task.id !== id) return task;

      let updates = { [field]: value };

      // If start date changes, we might want to keep duration? 
      // Or if end date changes, duration updates automatically by render logic.
      // But if we want to support "Duration" Input, we need to handle it specifically.

      return { ...task, ...updates };
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
    const parent = tasks.find(t => t.id === parentId);
    const newSubTask = {
      id: Date.now(),
      name: 'New Sub-task',
      startDate: parent.startDate,
      endDate: parent.endDate,
      color: parent.color + 'cc', // Slightly transparent
      cost: 0
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
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.tasks) setTasks(data.tasks);
          if (data.projectTitle) setProjectTitle(data.projectTitle);
          if (data.holidays) setHolidays(data.holidays);
          if (data.customerLogo) setCustomerLogo(data.customerLogo);
          if (data.customerLogoWidth) setCustomerLogoWidth(data.customerLogoWidth);
          if (data.companyLogo) setCompanyLogo(data.companyLogo);
          if (data.companyLogoWidth) setCompanyLogoWidth(data.companyLogoWidth);
          if (data.showDates !== undefined) setShowDates(data.showDates);
          if (data.showCost !== undefined) setShowCost(data.showCost);
          if (data.currency) setCurrency(data.currency);
        } catch (error) {
          console.error('Error importing chart:', error);
          alert('Failed to import chart. Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const exportChart = async (format) => {
    if (!chartRef.current || isDownloading) return;

    setIsDownloading(true);
    setShowExportMenu(false);

    try {
      if (format === 'json') {
        const data = {
          projectTitle,
          tasks,
          holidays,
          customerLogo,
          customerLogoWidth,
          companyLogo,
          companyLogoWidth,
          showDates,
          showCost,
          currency,
          exportedAt: new Date().toISOString()
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const link = document.createElement('a');
        link.download = `${projectTitle.replace(/\s+/g, '_')}_gantt_data.json`;
        link.href = dataStr;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDownloading(false);
        return;
      }

      // Load html2canvas
      const canvasScript = document.createElement('script');
      canvasScript.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

      await new Promise((resolve, reject) => {
        canvasScript.onload = resolve;
        canvasScript.onerror = () => reject(new Error('Failed to load html2canvas'));
        document.head.appendChild(canvasScript);
      });

      await new Promise(resolve => setTimeout(resolve, 200));

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
        // Load jsPDF
        const pdfScript = document.createElement('script');
        pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

        await new Promise((resolve, reject) => {
          pdfScript.onload = resolve;
          pdfScript.onerror = () => reject(new Error('Failed to load jsPDF'));
          document.head.appendChild(pdfScript);
        });

        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
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
        document.head.removeChild(pdfScript);

      } else {
        // PNG or JPEG
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataUrl = canvas.toDataURL(mimeType, 1.0);
        const link = document.createElement('a');
        link.download = `${projectTitle.replace(/\s+/g, '_')}_gantt_chart.${format}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      document.head.removeChild(canvasScript);
      setIsDownloading(false);

    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export chart: ${error.message}`);
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
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
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
              >
                <Download size={20} />
                {isDownloading ? '... ' : 'Export / Import'}
                <ChevronDown size={16} />
              </button>

              {showExportMenu && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  padding: '0.5rem',
                  minWidth: '200px',
                  border: '1px solid #e2e8f0',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
                    Export As
                  </div>
                  {[
                    { type: 'png', label: 'Image (PNG)', icon: <ImageIcon size={16} /> },
                    { type: 'jpeg', label: 'Image (JPEG)', icon: <ImageIcon size={16} /> },
                    { type: 'pdf', label: 'Document (PDF)', icon: <FileType size={16} /> },
                    { type: 'json', label: 'Data (JSON)', icon: <FileJson size={16} /> }
                  ].map(option => (
                    <button
                      key={option.type}
                      onClick={() => exportChart(option.type)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.75rem',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#0f172a',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}

                  <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }} />

                  <button
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      width: '100%',
                      padding: '0.75rem',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#4f46e5',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#eef2ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Upload size={16} />
                    Import JSON
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={importChart}
                    accept=".json"
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <input
                type="checkbox"
                id="showCost"
                checked={showCost}
                onChange={(e) => setShowCost(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: '#6366f1' }}
              />
              <label htmlFor="showCost" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer' }}>
                Add Cost
              </label>
              {showCost && (
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{ marginLeft: '0.5rem', padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="$">Dollars ($)</option>
                  <option value="₹">Rupees (₹)</option>
                  <option value="€">Euros (€)</option>
                  <option value="£">Pounds (£)</option>
                </select>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <input
                type="checkbox"
                id="showDates"
                checked={showDates}
                onChange={(e) => setShowDates(e.target.checked)}
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  cursor: 'pointer',
                  accentColor: '#6366f1'
                }}
              />
              <label htmlFor="showDates" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer' }}>
                Show Dates
              </label>
            </div>

            <button
              onClick={addTask}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                padding: '0.875rem 1.75rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
              }}
            >
              <Plus size={18} strokeWidth={2.5} />
              Add Task
            </button>

            <button
              onClick={() => setShowHolidayManager(!showHolidayManager)}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.875rem',
                borderRadius: '12px',
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Settings & Branding"
            >
              <Settings size={20} />
            </button>
          </div>

          {/* Holiday Manager Panel */}
          {showHolidayManager && (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>Settings & Branding</h3>
                <button onClick={() => setShowHolidayManager(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '1rem' }}>Logos</h4>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>Customer Logo</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <label style={{
                        flex: 1,
                        cursor: 'pointer',
                        background: '#f1f5f9',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: '#64748b',
                        fontSize: '0.85rem'
                      }}>
                        <Upload size={16} />
                        {customerLogo ? 'Change Logo' : 'Upload'}
                        <input type="file" onChange={(e) => handleLogoUpload(e, 'customer')} accept="image/*" style={{ display: 'none' }} />
                      </label>
                      {customerLogo && (
                        <button onClick={() => setCustomerLogo(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Remove">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>Company Logo</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <label style={{
                        flex: 1,
                        cursor: 'pointer',
                        background: '#f1f5f9',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: '#64748b',
                        fontSize: '0.85rem'
                      }}>
                        <Upload size={16} />
                        {companyLogo ? 'Change Logo' : 'Upload'}
                        <input type="file" onChange={(e) => handleLogoUpload(e, 'company')} accept="image/*" style={{ display: 'none' }} />
                      </label>
                      {companyLogo && (
                        <button onClick={() => setCompanyLogo(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Remove">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', background: '#e2e8f0', margin: '2rem 0' }} />

              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '1rem' }}>Holidays</h4>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <input
                  type="date"
                  value={newHoliday}
                  onChange={(e) => setNewHoliday(e.target.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontSize: '0.9rem',
                    color: '#0f172a'
                  }}
                />
                <button
                  onClick={addHoliday}
                  style={{
                    background: '#0f172a',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Add Holiday
                </button>
              </div>

              {holidays.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {holidays.map(date => (
                    <div key={date} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: '#f1f5f9',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      color: '#475569',
                      fontWeight: '500'
                    }}>
                      {new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      <button
                        onClick={() => removeHoliday(date)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          padding: 0,
                          display: 'flex'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {holidays.length === 0 && (
                <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  No holidays added yet. Weekends are automatically excluded.
                </div>
              )}
            </div>
          )}
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
                    gridTemplateColumns: `auto 1fr 80px ${showDates ? 'auto auto' : ''} ${showCost ? '100px' : ''} auto auto`,
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

                  <input
                    type="number"
                    min="1"
                    value={getBusinessDays(task.startDate, task.endDate, holidays)}
                    onChange={(e) => updateTaskDuration(task.id, e.target.value)}
                    style={{
                      width: '60px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: '#0f172a',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                    title="Duration (Days)"
                  />

                  {showDates && (
                    <>
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
                    </>
                  )}

                  {showCost && (
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
                  )}

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
                          display: 'grid',
                          gridTemplateColumns: `1fr 80px ${showDates ? 'auto auto' : ''} ${showCost ? '100px' : ''} auto auto`,
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
                          type="number"
                          min="1"
                          value={getBusinessDays(subTask.startDate, subTask.endDate, holidays)}
                          onChange={(e) => updateSubTaskDuration(task.id, subTask.id, e.target.value)}
                          style={{
                            width: '60px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '0.625rem',
                            color: '#0f172a',
                            fontSize: '0.8rem',
                            textAlign: 'center',
                            fontWeight: '600',
                            outline: 'none'
                          }}
                          title="Duration (Days)"
                        />

                        {showDates && (
                          <>
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
                          </>
                        )}

                        {showCost && (
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
                        )}

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
            padding: '2.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}
        >
          {/* Logo Header Row */}
          <div style={{
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
          <div style={{
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: showDates
              ? (showCost ? '320px 200px 100px 1fr' : '320px 200px 1fr')
              : (showCost ? '320px 100px 1fr' : '320px 1fr'),
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
                        background: '#ffffff',
                        borderBottom: '1px solid #e2e8f0',
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

            {/* Dates Column */}
            {showDates && (
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
                  padding: '1rem 0'
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
            {showCost && (
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
                  padding: '1rem 0'
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
                  const duration = getBusinessDays(task.startDate, task.endDate, holidays);

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
                        const subDuration = getBusinessDays(subTask.startDate, subTask.endDate, holidays);

                        return (
                          <div
                            key={subTask.id}
                            style={{
                              position: 'relative',
                              width: '100%',
                              minHeight: '44px',
                              background: '#f8fafc',
                              borderBottom: '1px solid #e2e8f0',
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

          {/* Footer Note */}
          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1rem'
          }}>
            <p style={{
              fontSize: '0.85rem',
              color: '#94a3b8',
              fontWeight: '500',
              margin: 0
            }}>
              Note: Prepared by Zoho SMBS Team
            </p>
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