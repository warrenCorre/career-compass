// frontend-web/src/pages/admin/Reports.js - Professional PDF with embedded charts + newest-first daily table

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ChartBarIcon, DocumentArrowDownIcon, PrinterIcon, ArrowPathIcon,
  ExclamationTriangleIcon, FolderIcon, AcademicCapIcon, UserGroupIcon,
  TrophyIcon, StarIcon, ClipboardDocumentListIcon, FireIcon,
  ArrowTrendingUpIcon, SparklesIcon, UsersIcon, UserPlusIcon, CalendarIcon,
  ClockIcon, BellAlertIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Area, Legend, ComposedChart, Line } from 'recharts';
import { format, parse, isValid } from 'date-fns';
import LoadingSpinner from '../../components/LoadingSpinner';

const CATEGORY_COLORS = {
  'Technology': '#3B82F6', 'Health & Medical Science': '#EF4444',
  'Education': '#10B981', 'Engineering': '#F59E0B',
  'Arts, Media, & Communication': '#8B5CF6', 'Social Sciences': '#F97316',
  'Hospitality & Tourism': '#EC4899', 'Business & Management': '#6366F1'
};

const getCategoryColor = (categoryName) => CATEGORY_COLORS[categoryName] || '#9CA3AF';

const formatShortDate = (dateString) => {
  if (!dateString) return '';
  const parsedDate = parse(dateString, 'MMM dd', new Date());
  return isValid(parsedDate) ? format(parsedDate, 'MMM d') : dateString;
};

const SimpleStatCard = ({ icon: Icon, title, value, subText, iconColor = 'text-gray-500', iconBg = 'bg-gray-100' }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {subText && <p className="text-[10px] text-gray-400 mt-0.5">{subText}</p>}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, cardColor, description }) => {
  const cardColors = {
    emerald: 'from-emerald-600 to-emerald-700', blue: 'from-blue-600 to-blue-700',
    purple: 'from-purple-600 to-purple-700', amber: 'from-amber-600 to-amber-700',
    yellow: 'from-yellow-500 to-yellow-600', red: 'from-red-500 to-red-600',
  };
  const gradientClass = cardColors[cardColor] || 'from-primary-600 to-primary-700';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-md hover:shadow-lg transition-all cursor-pointer">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`}></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:translate-x-12 transition-transform duration-500"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 group-hover:-translate-x-8 transition-transform duration-500"></div>
      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <motion.div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl" whileHover={{ scale: 1.05 }}>
            <Icon className="h-5 w-5 text-white" />
          </motion.div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white drop-shadow-md">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
          </div>
        </div>
        <h3 className="text-white font-semibold text-sm opacity-90">{title}</h3>
        {description && <p className="text-white/70 text-xs mt-1">{description}</p>}
      </div>
    </motion.div>
  );
};

const CategoryTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const category = Object.entries(CATEGORY_COLORS).find(([name]) => name === label) || ['Unknown', '#6B7280'];
    return (
      <div className="bg-white rounded-lg shadow-lg p-2 border border-gray-100">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category[1] }}></div>
          <p className="text-xs font-semibold text-gray-700">{category[0]}</p>
        </div>
        <p className="text-lg font-bold" style={{ color: category[1] }}>{payload[0].value}</p>
        <p className="text-[10px] text-gray-400">assessments</p>
      </div>
    );
  }
  return null;
};

const GrowthTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-100">
        <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
            <span className="text-xs text-gray-600">{item.name}:</span>
            <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const [categoryReports, setCategoryReports] = useState([]);
  const [courseReports, setCourseReports] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [newUsersStats, setNewUsersStats] = useState({ today: 0, thisWeek: 0, thisMonth: 0, total: 0 });
  const [activityStats, setActivityStats] = useState({ total: 0, active: 0, not_active_7d: 0, inactive_30d: 0 });
  const [summaryStats, setSummaryStats] = useState({ totalAssessments: 0, activeCategories: 0, averageScore: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [growthDays, setGrowthDays] = useState(30);

  const categoryChartRef = useRef(null);
  const growthChartRef   = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { fetchReports(); }, [growthDays]);

  const fetchReports = async () => {
    try {
      setError('');
      if (refreshing) setRefreshing(true); else setLoading(true);

      const [categoryRes, courseRes, growthRes, newUsersRes, countsRes] = await Promise.all([
        axios.get('/api/admin/reports/categories'),
        axios.get('/api/admin/reports/courses'),
        axios.get('/api/admin/reports/daily-growth', { params: { days: growthDays } }),
        axios.get('/api/admin/users/new-users-stats'),
        axios.get('/api/admin/users/counts'),
      ]);

      setCategoryReports(categoryRes.data);
      setCourseReports(courseRes.data);

      const dailyData = growthRes.data.daily_data || [];
      const formattedGrowthData = dailyData.map(day => ({
        date: day.date, users: day.users, assessments: day.assessments, cumulativeUsers: day.cumulative_users || 0
      }));
      formattedGrowthData.sort((a, b) => new Date(a.date) - new Date(b.date));
      setUserGrowthData(formattedGrowthData);

      if (newUsersRes.data) {
        setNewUsersStats({
          today: newUsersRes.data.today || 0, thisWeek: newUsersRes.data.this_week || 0,
          thisMonth: newUsersRes.data.this_month || 0, total: newUsersRes.data.total || 0,
        });
      }

      if (countsRes.data) {
        setActivityStats({
          total: countsRes.data.total || 0, active: countsRes.data.active || 0,
          not_active_7d: countsRes.data.not_active_7d || 0, inactive_30d: countsRes.data.inactive_30d || 0,
        });
      }

      const totalAssessments = categoryRes.data.reduce((sum, cat) => sum + (cat.total_assessments || 0), 0);
      const activeCategories = categoryRes.data.filter(cat => cat.total_assessments > 0).length;
      const avgScoreSum = categoryRes.data.reduce((sum, cat) => sum + (cat.avg_score || 0), 0);
      const averageScore = categoryRes.data.length > 0 ? avgScoreSum / categoryRes.data.length : 0;

      setSummaryStats({ totalAssessments, activeCategories, averageScore: averageScore.toFixed(1) });
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.msg || 'Failed to load reports');
    } finally { setLoading(false); setRefreshing(false); }
  };

  const handleRefresh = () => { setRefreshing(true); fetchReports(); };

  const captureChart = async (ref) => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (!ref?.current) return null;
      const canvas = await html2canvas(ref.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('html2canvas not available – skipping chart capture.', err);
      return null;
    }
  };

  // ─── PDF EXPORT ────────────────────────────────────────────────────────────
  const exportToPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pw   = doc.internal.pageSize.getWidth();   // 210
      const ph   = doc.internal.pageSize.getHeight();  // 297
      const ml   = 18;   // left margin
      const mr   = 18;   // right margin
      const cw   = pw - ml - mr; // 174

      // ── Design tokens (muted, professional) ──────────────────────────────
      const C = {
        brand:      [55, 90, 45],    // deep forest green
        brandMid:   [74, 106, 59],
        brandLight: [236, 244, 233],
        ink:        [22, 30, 22],
        inkMid:     [55, 65, 55],
        inkSoft:    [110, 120, 110],
        inkFaint:   [190, 197, 190],
        rule:       [220, 227, 220],
        bg:         [248, 250, 248],
        bgCard:     [255, 255, 255],
        accent1:    [59, 100, 180],   // slate blue
        accent2:    [160, 90, 30],    // warm amber
        accent3:    [150, 60, 60],    // muted red
        accent4:    [80, 130, 120],   // teal
      };

      // ── Font helpers ──────────────────────────────────────────────────────
      const setH1 = () => { doc.setFont('helvetica','bold');   doc.setFontSize(20); doc.setTextColor(...C.brand); };
      const setH2 = () => { doc.setFont('helvetica','bold');   doc.setFontSize(13); doc.setTextColor(...C.ink); };
      const setH3 = () => { doc.setFont('helvetica','bold');   doc.setFontSize(10); doc.setTextColor(...C.inkMid); };
      const setBody= () => { doc.setFont('helvetica','normal'); doc.setFontSize(9);  doc.setTextColor(...C.inkMid); };
      const setCaption=()=>{ doc.setFont('helvetica','normal'); doc.setFontSize(7.5);doc.setTextColor(...C.inkSoft); };
      const setLabel = ()=>{ doc.setFont('helvetica','bold');   doc.setFontSize(7);  doc.setTextColor(...C.inkSoft); };

      // ── Shared draw helpers ───────────────────────────────────────────────
      const hRule = (y, lw=0.25) => {
        doc.setDrawColor(...C.rule); doc.setLineWidth(lw);
        doc.line(ml, y, pw-mr, y);
      };
      const brandRule = (y, lw=0.6) => {
        doc.setDrawColor(...C.brand); doc.setLineWidth(lw);
        doc.line(ml, y, pw-mr, y);
      };

      // ── Header / Footer helpers ───────────────────────────────────────────
      let pageNum = 0;

      const drawHeader = (sectionLabel='') => {
        // Subtle top bar
        doc.setFillColor(...C.bg);
        doc.rect(0, 0, pw, 18, 'F');
        brandRule(18, 0.5);

        doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...C.brand);
        doc.text('CareerCompass', ml, 11);

        doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...C.inkSoft);
        doc.text('Reports & Analytics', ml + 44, 11);

        if (sectionLabel) {
          doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...C.inkSoft);
          doc.text(sectionLabel.toUpperCase(), pw - mr, 11, { align: 'right' });
        }
      };

      const drawFooter = () => {
        hRule(ph - 14, 0.25);
        setCaption();
        doc.text(`Page ${pageNum}  ·  Confidential — Internal Use Only`, ml, ph - 9);
        doc.text(`Generated ${format(new Date(),'MMM d, yyyy  h:mm a')}`, pw - mr, ph - 9, { align:'right' });
      };

      const addPage = (label='') => {
        doc.addPage();
        pageNum++;
        drawHeader(label);
        drawFooter();
        return 26; // starting yPos after header
      };

      // ─────────────────────────────────────────────────────────────────────
      // PAGE 0  COVER
      // ─────────────────────────────────────────────────────────────────────
      pageNum = 1;

      // Full-page muted bg
      doc.setFillColor(...C.bg);
      doc.rect(0, 0, pw, ph, 'F');

      // Left accent strip
      doc.setFillColor(...C.brand);
      doc.rect(0, 0, 7, ph, 'F');

      // Brand block (vertically centered ~40%)
      const cy = ph * 0.40;

      doc.setFont('helvetica','bold'); doc.setFontSize(28); doc.setTextColor(...C.brand);
      doc.text('CareerCompass', ml + 4, cy);

      doc.setFont('helvetica','normal'); doc.setFontSize(12); doc.setTextColor(...C.inkSoft);
      doc.text('Reports & Analytics', ml + 4, cy + 10);

      // Thin rule under title
      doc.setDrawColor(...C.brand); doc.setLineWidth(0.5);
      doc.line(ml + 4, cy + 15, ml + 4 + 80, cy + 15);

      // Meta block
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...C.inkMid);
      doc.text(`Report date: ${format(new Date(),'MMMM d, yyyy')}`, ml + 4, cy + 24);
      doc.text('Classification: Confidential  ·  Internal use only', ml + 4, cy + 32);

      // Summary snapshot box (bottom right quadrant)
      const bx = ml + 4, by = ph * 0.62, bw = cw, bh = 62;
      doc.setFillColor(255,255,255);
      doc.setDrawColor(...C.rule); doc.setLineWidth(0.3);
      doc.roundedRect(bx, by, bw, bh, 3, 3, 'FD');

      // Box header bar
      doc.setFillColor(...C.brand);
      doc.roundedRect(bx, by, bw, 9, 3, 3, 'F');
      doc.rect(bx, by + 4, bw, 5, 'F'); // square off bottom of header bar
      doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(255,255,255);
      doc.text('REPORT SNAPSHOT', bx + 5, by + 6.5);

      const snapItems = [
        { label:'Total Assessments', val: summaryStats.totalAssessments.toLocaleString() },
        { label:'Registered Users',  val: activityStats.total.toLocaleString() },
        { label:'Active Users',      val: activityStats.active.toLocaleString() },
        { label:'New Users (30d)',   val: newUsersStats.thisMonth.toLocaleString() },
        { label:'Average Score',     val: `${summaryStats.averageScore}%` },
        { label:'Active Categories', val: summaryStats.activeCategories.toString() },
      ];
      const cols = 3;
      const cellW = bw / cols;
      snapItems.forEach((item, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = bx + col * cellW + 5;
        const y = by + 16 + row * 20;
        doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...C.ink);
        doc.text(item.val, x, y + 8);
        doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...C.inkSoft);
        doc.text(item.label, x, y + 14);
        if (col < cols - 1) {
          doc.setDrawColor(...C.rule); doc.setLineWidth(0.2);
          doc.line(bx + (col+1)*cellW, by+12, bx + (col+1)*cellW, by+bh-4);
        }
      });

      // Footer strip
      doc.setFillColor(...C.brand);
      doc.rect(0, ph - 10, pw, 10, 'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(255,255,255);
      doc.text(`Generated ${format(new Date(),'MMMM d, yyyy  ·  h:mm a')}`, pw/2, ph - 5, { align:'center' });

      // ─────────────────────────────────────────────────────────────────────
      // Capture charts (async, before building pages)
      // ─────────────────────────────────────────────────────────────────────
      const [categoryChartImg, growthChartImg] = await Promise.all([
        captureChart(categoryChartRef),
        captureChart(growthChartRef),
      ]);

      // ─────────────────────────────────────────────────────────────────────
      // PAGE 1 — KEY METRICS
      // ─────────────────────────────────────────────────────────────────────
      let y = addPage('Key Metrics');

      // Section title
      setH1(); doc.text('Key Metrics', ml, y + 4); y += 12;
      setCaption(); doc.text('System-wide overview at the time of report generation', ml, y); y += 8;

      // 4-up metric cards
      const cardW = (cw - 9) / 4;
      const metricCards = [
        { label:'Total Assessments', val: summaryStats.totalAssessments.toLocaleString(), accent: C.brand },
        { label:'Registered Users',  val: activityStats.total.toLocaleString(),           accent: C.accent1 },
        { label:'New Users (30d)',   val: newUsersStats.thisMonth.toLocaleString(),        accent: C.accent4 },
        { label:'Average Score',     val: `${summaryStats.averageScore}%`,                accent: C.accent2 },
      ];
      metricCards.forEach((mc, i) => {
        const x = ml + i * (cardW + 3);
        // Card bg
        doc.setFillColor(255,255,255);
        doc.setDrawColor(...C.rule); doc.setLineWidth(0.2);
        doc.roundedRect(x, y, cardW, 30, 2, 2, 'FD');
        // Top accent line
        doc.setFillColor(...mc.accent);
        doc.roundedRect(x, y, cardW, 2.5, 1, 1, 'F');
        doc.rect(x, y+1.5, cardW, 1, 'F');
        // Value
        doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(...C.ink);
        doc.text(mc.val, x + cardW/2, y + 17, { align:'center' });
        // Label
        doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...C.inkSoft);
        doc.text(mc.label.toUpperCase(), x + cardW/2, y + 25, { align:'center' });
      });
      y += 38;

      // User Activity — 3-up cards
      setH2(); doc.text('User Activity Breakdown', ml, y); y += 8;

      const actW2 = (cw - 6) / 3;
      const actCards = [
        { label:'Active Users',      sub:'Active within 7 days',  val: activityStats.active.toLocaleString(),        accent: [30,140,90] },
        { label:'Inactive (7d+)',    sub:'7–29 days without login',val: activityStats.not_active_7d.toLocaleString(), accent: [180,140,40] },
        { label:'Dormant (30d+)',    sub:'30+ days without login', val: activityStats.inactive_30d.toLocaleString(),  accent: [180,70,60]  },
      ];
      actCards.forEach((ac, i) => {
        const x = ml + i * (actW2 + 3);
        doc.setFillColor(255,255,255);
        doc.setDrawColor(...C.rule); doc.setLineWidth(0.2);
        doc.roundedRect(x, y, actW2, 26, 2, 2, 'FD');
        doc.setFillColor(...ac.accent);
        doc.roundedRect(x, y, actW2, 2, 1, 1, 'F');
        doc.rect(x, y+1, actW2, 1, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...C.ink);
        doc.text(ac.val, x + 5, y + 14);
        doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...C.inkMid);
        doc.text(ac.label, x + 5, y + 20);
        doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...C.inkSoft);
        doc.text(ac.sub, x + 5, y + 25);
      });
      y += 34;

      // New registrations row
      setH2(); doc.text('New Registrations', ml, y); y += 8;
      const regCards = [
        { label:'Today',       val: newUsersStats.today.toString()     },
        { label:'This Week',   val: newUsersStats.thisWeek.toString()  },
        { label:'This Month',  val: newUsersStats.thisMonth.toString() },
      ];
      const regW = (cw - 6) / 3;
      regCards.forEach((rc, i) => {
        const x = ml + i * (regW + 3);
        doc.setFillColor(...C.bg);
        doc.setDrawColor(...C.rule); doc.setLineWidth(0.2);
        doc.roundedRect(x, y, regW, 22, 2, 2, 'FD');
        doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(...C.brand);
        doc.text(rc.val, x + regW/2, y + 13, { align:'center' });
        doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...C.inkSoft);
        doc.text(rc.label.toUpperCase(), x + regW/2, y + 20, { align:'center' });
      });
      y += 30;

      // Category Distribution Chart
      setH2(); doc.text('Category Distribution', ml, y); y += 4;
      setCaption(); doc.text('Total assessments taken per career category', ml, y); y += 6;

      if (categoryChartImg) {
        const imgH = Math.round(cw * 0.52);
        doc.addImage(categoryChartImg, 'PNG', ml, y, cw, imgH);
        y += imgH + 4;
      } else {
        // Fallback minimal table
        const catRows = categoryReports.map(cat => [
          cat.category_name,
          cat.total_assessments?.toString() || '0',
          `${cat.avg_score}%`,
        ]);
        autoTable(doc, {
          startY: y,
          head: [['Category', 'Assessments', 'Avg Score']],
          body: catRows,
          headStyles: { fillColor: C.brand, textColor:[255,255,255], fontStyle:'bold', fontSize:8 },
          bodyStyles: { fontSize:8, textColor:C.inkMid },
          alternateRowStyles: { fillColor: C.bg },
          margin: { left:ml, right:mr }, tableWidth: cw,
          theme: 'plain',
        });
        y = doc.lastAutoTable.finalY + 6;
      }

      // ─────────────────────────────────────────────────────────────────────
      // PAGE 2 — USER GROWTH
      // ─────────────────────────────────────────────────────────────────────
      y = addPage('User Growth Analysis');

      setH1(); doc.text('User Growth Analysis', ml, y + 4); y += 12;
      setCaption(); doc.text(`Daily user registrations and assessment activity over the last ${growthDays} days`, ml, y); y += 10;

      // Growth chart
      if (growthChartImg) {
        const imgH = Math.round(cw * 0.50);
        doc.addImage(growthChartImg, 'PNG', ml, y, cw, imgH);
        y += imgH + 8;
      }

      // Daily breakdown table — newest first
      setH2(); doc.text('Daily Registration Details', ml, y); y += 4;
      setCaption(); doc.text('Sorted newest first', ml, y); y += 5;

      const sortedDesc = [...userGrowthData].sort((a,b) => new Date(b.date) - new Date(a.date));

      // Highlight today's row if present
      const todayStr = format(new Date(), 'MMM dd');
      const dailyRows = sortedDesc.map(day => [
        day.date,
        day.users?.toString()          || '0',
        day.assessments?.toString()    || '0',
        day.cumulativeUsers?.toString()|| '0',
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Date', 'New Users', 'Assessments', 'Cumulative Users']],
        body: dailyRows,
        headStyles: {
          fillColor: C.ink,
          textColor: [255,255,255],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: { top:4, bottom:4, left:5, right:5 },
        },
        bodyStyles: {
          fontSize: 8,
          textColor: C.inkMid,
          cellPadding: { top:3, bottom:3, left:5, right:5 },
        },
        alternateRowStyles: { fillColor: C.bg },
        columnStyles: {
          0: { cellWidth: 36 },
          1: { cellWidth: 32, halign:'right' },
          2: { cellWidth: 36, halign:'right' },
          3: { halign:'right' },
        },
        margin: { left:ml, right:mr },
        tableWidth: cw,
        theme: 'plain',
        // Highlight first row (most recent / today)
        didParseCell: (data) => {
          if (data.section === 'body' && data.row.index === 0) {
            data.cell.styles.fillColor = C.brandLight;
            data.cell.styles.textColor = C.brand;
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      const tableEnd2 = doc.lastAutoTable.finalY + 8;

      // Summary callout
      const avgDU = userGrowthData.length > 0
        ? Math.round(userGrowthData.reduce((s,d)=>s+d.users,0) / userGrowthData.length) : 0;
      const avgDA = userGrowthData.length > 0
        ? Math.round(userGrowthData.reduce((s,d)=>s+d.assessments,0) / userGrowthData.length) : 0;

      if (tableEnd2 + 22 < ph - 20) {
        doc.setFillColor(...C.brandLight);
        doc.setDrawColor(...C.brandMid); doc.setLineWidth(0.3);
        doc.roundedRect(ml, tableEnd2, cw, 20, 2, 2, 'FD');
        doc.setFillColor(...C.brand);
        doc.roundedRect(ml, tableEnd2, 3, 20, 1, 1, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...C.brand);
        doc.text('Period Summary', ml + 7, tableEnd2 + 7);
        doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...C.inkMid);
        doc.text(
          `Avg. daily registrations: ${avgDU}  ·  Avg. daily assessments: ${avgDA}  ·  Period: ${growthDays} days`,
          ml + 7, tableEnd2 + 14
        );
      }

      // ─────────────────────────────────────────────────────────────────────
      // PAGE 3 — TOP COURSES
      // ─────────────────────────────────────────────────────────────────────
      y = addPage('Top Recommended Courses');

      setH1(); doc.text('Top Recommended Courses', ml, y + 4); y += 12;
      setCaption(); doc.text('Ranked by number of student recommendations', ml, y); y += 8;

      const topCoursesData = [...courseReports]
        .filter(c => c.recommendation_count > 0)
        .sort((a,b) => b.recommendation_count - a.recommendation_count)
        .slice(0, 20);

      const courseRows = topCoursesData.map((course, idx) => [
        (idx + 1).toString(),
        course.course_code || '',
        course.course_name || '',
        course.category_name || '',
        course.recommendation_count?.toString() || '0',
        `${course.avg_score || 0}%`,
      ]);

      autoTable(doc, {
        startY: y,
        head: [['#', 'Code', 'Course Name', 'Category', 'Recs', 'Avg Score']],
        body: courseRows,
        headStyles: {
          fillColor: C.ink,
          textColor: [255,255,255],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: { top:4, bottom:4, left:5, right:5 },
        },
        bodyStyles: {
          fontSize: 8,
          textColor: C.inkMid,
          cellPadding: { top:3.5, bottom:3.5, left:5, right:5 },
        },
        alternateRowStyles: { fillColor: C.bg },
        columnStyles: {
          0: { cellWidth: 10, halign:'center', textColor: C.inkSoft, fontStyle:'bold' },
          1: { cellWidth: 28, fontStyle:'bold', textColor: C.ink },
          2: { cellWidth: 58 },
          3: { cellWidth: 38 },
          4: { cellWidth: 18, halign:'right' },
          5: { cellWidth: 22, halign:'right' },
        },
        margin: { left:ml, right:mr },
        tableWidth: cw,
        theme: 'plain',
        // Medal colors for top 3
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            const ri = data.row.index;
            if (ri === 0) { data.cell.styles.textColor = [180,140,30]; }
            else if (ri === 1) { data.cell.styles.textColor = [110,120,130]; }
            else if (ri === 2) { data.cell.styles.textColor = [160,100,60]; }
          }
          // Colour the avg score column by performance
          if (data.section === 'body' && data.column.index === 5) {
            const score = parseFloat(data.cell.raw);
            if (score >= 70) data.cell.styles.textColor = [30,130,80];
            else if (score >= 50) data.cell.styles.textColor = [170,130,30];
            else data.cell.styles.textColor = C.inkSoft;
          }
        },
      });

      // ─────────────────────────────────────────────────────────────────────
      // PAGE 4 — CATEGORY PERFORMANCE
      // ─────────────────────────────────────────────────────────────────────
      y = addPage('Category Performance');

      setH1(); doc.text('Category Performance', ml, y + 4); y += 12;
      setCaption(); doc.text('Assessment counts and average scores per career category', ml, y); y += 8;

      const catRows = categoryReports.map(cat => {
        const catCourses = courseReports.filter(c => c.category_name === cat.category_name);
        const topCourse = catCourses.length > 0
          ? catCourses.reduce((mx,c) => (c.avg_score > mx.avg_score ? c : mx), catCourses[0])
          : null;
        return [
          cat.category_name,
          cat.total_assessments?.toString() || '0',
          `${cat.avg_score}%`,
          topCourse ? `${topCourse.course_code}` : '—',
        ];
      });

      autoTable(doc, {
        startY: y,
        head: [['Category', 'Assessments', 'Avg Score', 'Top Course']],
        body: catRows,
        headStyles: {
          fillColor: C.ink,
          textColor: [255,255,255],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: { top:4, bottom:4, left:5, right:5 },
        },
        bodyStyles: {
          fontSize: 8,
          textColor: C.inkMid,
          cellPadding: { top:4, bottom:4, left:5, right:5 },
        },
        alternateRowStyles: { fillColor: C.bg },
        columnStyles: {
          0: { cellWidth: 65, fontStyle:'bold', textColor: C.ink },
          1: { cellWidth: 30, halign:'right' },
          2: { cellWidth: 28, halign:'right' },
          3: { },
        },
        margin: { left:ml, right:mr },
        tableWidth: cw,
        theme: 'plain',
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const score = parseFloat(data.cell.raw);
            if (score >= 70) data.cell.styles.textColor = [30,130,80];
            else if (score >= 50) data.cell.styles.textColor = [170,130,30];
          }
        },
      });

      // ─────────────────────────────────────────────────────────────────────
      doc.save(`careercompass-report-${format(new Date(),'yyyy-MM-dd')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally { setExporting(false); }
  };

  const printReport = () => { window.print(); };

  const allCategoriesForBar = categoryReports.map(cat => ({
    name: cat.category_name, assessments: cat.total_assessments, color: getCategoryColor(cat.category_name)
  }));
  const topCategoriesByAssessments = [...categoryReports]
    .filter(cat => cat.total_assessments > 0).sort((a, b) => b.total_assessments - a.total_assessments).slice(0, 5);
  const topCourses = [...courseReports]
    .filter(course => course.recommendation_count > 0).sort((a, b) => b.recommendation_count - a.recommendation_count).slice(0, 10);
  const totalAssessments = summaryStats.totalAssessments;
  const getTickInterval = (dataLength) => {
    if (dataLength <= 7) return 0; if (dataLength <= 14) return 1;
    if (dataLength <= 30) return 2; if (dataLength <= 60) return 5; return 8;
  };
  const sortedDescData = [...userGrowthData].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">{format(currentTime, 'EEEE, MMMM d, yyyy • h:mm a')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600 font-medium">System Online</span>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-all text-sm">
            <ArrowPathIcon className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /><span>Refresh</span>
          </motion.button>
          <button onClick={exportToPDF} disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all text-sm disabled:opacity-50">
            <DocumentArrowDownIcon className="h-3.5 w-3.5" /><span>{exporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
          <button onClick={printReport}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-all text-sm">
            <PrinterIcon className="h-3.5 w-3.5" /><span>Print</span>
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-l-4 border-red-400 p-3 rounded-lg flex">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-400" /><p className="ml-2 text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardDocumentListIcon} title="Total Assessments" value={summaryStats.totalAssessments} cardColor="emerald" description="Completed assessments" />
        <StatCard icon={UsersIcon} title="Total Users" value={activityStats.total} cardColor="blue" description="Registered accounts" />
        <StatCard icon={UserPlusIcon} title="New Users (30d)" value={newUsersStats.thisMonth} cardColor="purple" description="New registrations" />
        <StatCard icon={StarIcon} title="Average Score" value={`${summaryStats.averageScore}%`} cardColor="amber" description="Across all assessments" />
      </div>

      {/* Activity Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SimpleStatCard icon={UserGroupIcon} title="Active users" value={activityStats.active} subText="Active within 7 days" iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <SimpleStatCard icon={ClockIcon} title="Not active (7d+)" value={activityStats.not_active_7d} subText="7–29 days inactive" iconColor="text-yellow-600" iconBg="bg-yellow-50" />
        <SimpleStatCard icon={BellAlertIcon} title="Inactive (30d+)" value={activityStats.inactive_30d} subText="30+ days inactive" iconColor="text-red-500" iconBg="bg-red-50" />
      </div>

      {/* Today + This Week */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl"><CalendarIcon className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-sm font-medium text-gray-600">Today's New Users</p><p className="text-xs text-gray-400 mt-0.5">Registrations in the last 24 hours</p></div>
            </div>
            <span className="text-3xl font-bold text-gray-800">{newUsersStats.today}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl"><ArrowTrendingUpIcon className="h-5 w-5 text-emerald-600" /></div>
              <div><p className="text-sm font-medium text-gray-600">This Week</p><p className="text-xs text-gray-400 mt-0.5">New users in the last 7 days</p></div>
            </div>
            <span className="text-3xl font-bold text-gray-800">{newUsersStats.thisWeek}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-xl max-w-2xl">
        {['overview', 'users', 'categories', 'courses'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            {tab === 'overview' ? 'Overview' : tab === 'users' ? 'User Growth' : tab === 'categories' ? 'By Category' : 'Top Courses'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div><h2 className="text-base font-semibold text-gray-800 flex items-center"><ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />Total Assessments by Category</h2><p className="text-sm text-gray-500 mt-0.5">Distribution across career fields</p></div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200"><SparklesIcon className="h-3.5 w-3.5 text-gray-500" /><span className="text-xs font-medium text-gray-600">{totalAssessments} total</span></div>
              </div>
            </div>
            <div className="p-5">
              <div ref={categoryChartRef} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allCategoriesForBar} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={65} tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <Tooltip content={<CategoryTooltip />} cursor={{ fill: '#F9FAFB' }} />
                    <Bar dataKey="assessments" name="Assessments" radius={[6, 6, 0, 0]}>
                      {allCategoriesForBar.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800 flex items-center"><FireIcon className="h-5 w-5 mr-2 text-amber-500" />Most Active Categories</h2>
              <p className="text-sm text-gray-500 mt-0.5">Ranked by total number of assessments</p>
            </div>
            <div className="p-5">
              {topCategoriesByAssessments.length > 0 ? (
                <div className="space-y-3">
                  {topCategoriesByAssessments.map((cat, idx) => {
                    const color = getCategoryColor(cat.category_name);
                    const maxAssessments = topCategoriesByAssessments[0]?.total_assessments || 1;
                    const percentage = (cat.total_assessments / maxAssessments) * 100;
                    return (
                      <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200">
                        <div className="w-8 text-center"><span className={`text-sm font-bold ${idx === 0 ? 'text-amber-600' : idx === 1 ? 'text-gray-500' : idx === 2 ? 'text-orange-500' : 'text-gray-400'}`}>#{idx + 1}</span></div>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <div className="flex-1"><p className="font-medium text-gray-800">{cat.category_name}</p>
                          <div className="flex items-center gap-3 mt-1.5"><div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }}></div></div><span className="text-xs font-medium text-gray-600">{cat.total_assessments}</span></div></div>
                        <div className="text-right"><span className="text-base font-bold text-gray-800">{cat.avg_score}%</span><p className="text-xs text-gray-400">avg score</p></div>
                      </div>
                    );
                  })}
                </div>
              ) : (<div className="text-center py-12 text-gray-400">No category data available</div>)}
            </div>
          </div>
        </div>
      )}

      {/* User Growth */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div><h2 className="text-base font-semibold text-gray-800 flex items-center"><ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-emerald-600" />Assessment & User Growth</h2><p className="text-sm text-gray-500 mt-0.5">Daily assessments and cumulative user growth over the last {growthDays} days</p></div>
                <select value={growthDays} onChange={(e) => setGrowthDays(Number(e.target.value))}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option><option value={60}>Last 60 days</option><option value={90}>Last 90 days</option>
                </select>
              </div>
            </div>
            <div className="p-5">
              <div ref={growthChartRef} className="h-[380px]">
                {userGrowthData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">No user growth data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} interval={getTickInterval(userGrowthData.length)} tickFormatter={(value) => formatShortDate(value)} />
                      <YAxis yAxisId="left" tick={{ fill: '#6B7280', fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280', fontSize: 11 }} />
                      <Tooltip content={<GrowthTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 20 }} formatter={(value) => <span className="text-sm text-gray-700">{value}</span>} />
                      <Area yAxisId="left" type="monotone" dataKey="assessments" stroke="#059669" fill="#D1FAE5" strokeWidth={2} name="Daily Assessments" />
                      <Line yAxisId="right" type="monotone" dataKey="cumulativeUsers" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3, fill: '#7C3AED' }} name="Total Users" />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">Daily Activity Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">New users and assessments by day (most recent first)</p>
            </div>
            <div className="overflow-x-auto max-h-80">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">New Users</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assessments</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedDescData.length === 0 ? (
                    <tr><td colSpan="4" className="px-5 py-12 text-center text-gray-400">No data available</td></tr>
                  ) : (
                    sortedDescData.map((day, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm text-gray-800 font-medium">{day.date}</td>
                        <td className="px-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{day.users}</span></td>
                        <td className="px-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">{day.assessments}</span></td>
                        <td className="px-5 py-3 text-sm text-gray-800 font-medium">{day.cumulativeUsers || day.users}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200"><h2 className="text-base font-semibold text-gray-800">Category Performance Details</h2><p className="text-sm text-gray-500 mt-0.5">Detailed metrics per career category</p></div>
          <div className="overflow-x-auto"><table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200"><tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Assessments</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Score</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Top Course</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {categoryReports.map((cat) => {
                const color = getCategoryColor(cat.category_name);
                const categoryCourses = courseReports.filter(c => c.category_name === cat.category_name);
                const topCourse = categoryCourses.length > 0 ? categoryCourses.reduce((max, c) => (c.avg_score > max.avg_score ? c : max), categoryCourses[0]) : null;
                return (
                  <tr key={cat.category_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3"><div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full mr-3" style={{ backgroundColor: color }} /><span className="text-sm font-medium text-gray-800">{cat.category_name}</span></div></td>
                    <td className="px-5 py-3 text-sm text-gray-600">{cat.total_assessments}</td>
                    <td className="px-5 py-3"><span className={`text-sm font-semibold ${cat.avg_score >= 70 ? 'text-emerald-600' : cat.avg_score >= 50 ? 'text-amber-600' : 'text-gray-600'}`}>{cat.avg_score}%</span></td>
                    <td className="px-5 py-3">{topCourse ? (<div><span className="text-sm font-medium text-gray-800">{topCourse.course_code}</span><p className="text-xs text-gray-400">{topCourse.avg_score || 0}% match</p></div>) : (<span className="text-sm text-gray-400">—</span>)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      )}

      {/* Courses */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200"><h2 className="text-base font-semibold text-gray-800">Top Recommended Courses</h2><p className="text-sm text-gray-500 mt-0.5">Most frequently recommended programs</p></div>
          <div className="overflow-x-auto"><table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200"><tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Course</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recommendations</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Score</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Performance</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {topCourses.map((course, idx) => {
                const color = getCategoryColor(course.category_name);
                const avgScore = course.avg_score || 0;
                return (
                  <tr key={course.course_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</div></td>
                    <td className="px-5 py-3"><div><span className="font-medium text-gray-800">{course.course_code}</span><p className="text-xs text-gray-400">{course.course_name}</p></div></td>
                    <td className="px-5 py-3"><div className="flex items-center"><div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color }} /><span className="text-xs text-gray-500">{course.category_name}</span></div></td>
                    <td className="px-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">{course.recommendation_count}</span></td>
                    <td className="px-5 py-3"><span className={`text-sm font-semibold ${avgScore >= 70 ? 'text-emerald-600' : avgScore >= 50 ? 'text-amber-600' : 'text-gray-600'}`}>{avgScore}%</span></td>
                    <td className="px-5 py-3"><div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary-500" style={{ width: `${avgScore}%` }} /></div></td>
                  </tr>
                );
              })}
              {topCourses.length === 0 && (<tr><td colSpan="6" className="px-5 py-12 text-center text-gray-400">No course data available</td></tr>)}
            </tbody>
          </table></div>
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center">
        <p className="text-xs text-gray-400">Data reflects current system state • Last updated: {format(currentTime, 'h:mm a')}</p>
      </motion.div>
    </motion.div>
  );
};

export default Reports;