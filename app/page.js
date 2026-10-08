'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Building2,
  Mail,
  Phone,
  Globe,
  Search,
  RefreshCw,
  Download,
  Filter,
  Star,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Layers,
  Compass,
  Calendar,
  AlertCircle,
  Database,
  SlidersHorizontal,
  ChevronDown,
  Sun,
  Moon,
  MessageCircle,
  CircleCheck,
  Skull
} from 'lucide-react';

const EMPTY = {
  q: '',
  category: '',
  city: '',
  hasEmail: false,
  hasPhone: false,
  hasWebsite: false,
  status: '',
  state: ''
};

const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
};

const fmt = (n) => (n ?? 0).toLocaleString();

export default function Dashboard() {
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sort, setSort] = useState('scrapedAt');
  const [order, setOrder] = useState('desc');

  const [data, setData] = useState({ items: [], total: 0, pages: 1, page: 1, limit: 50 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [live, setLive] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState('new');
  const [copiedKey, setCopiedKey] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark';
    setTheme(saved);
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', next);
    }
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const filterQs = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v === true) p.set(k, 'true');
      else if (v) p.set(k, v);
    });
    return p;
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([k, v]) => v !== '' && v !== false).length;
  }, [filters]);

  const load = useCallback(async (silent) => {
    if (!silent) setLoading(true);
    try {
      const p = new URLSearchParams(filterQs);
      p.set('page', page);
      p.set('limit', limit);
      p.set('sort', sort);
      p.set('order', order);
      const [r1, r2] = await Promise.all([
        fetch('/api/places?' + p),
        fetch('/api/places/stats?' + filterQs.toString())
      ]);
      const j1 = await r1.json();
      if (!r1.ok || !j1.ok) throw new Error(j1.error || 'Request failed');
      setData(j1);
      const j2 = await r2.json();
      if (j2.ok) setStats(j2);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterQs, page, limit, sort, order]);

  // Load data on initial mount
  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live refresh while the extension is scraping
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => load(true), 5000);
    return () => clearInterval(id);
  }, [live, load]);

  const setF = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
  };

  const handleSearch = () => {
    setPage(1);
    load(false);
  };

  const toggleSort = (field) => {
    if (sort === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder(field === 'name' ? 'asc' : 'desc');
    }
    handleSearch();
  };

  const renderSortIcon = (field) => {
    if (sort !== field) return <ArrowUpDown className="w-3 h-3 opacity-40 ml-1 inline text-slate-400 dark:text-slate-500" />;
    return order === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-400 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-400 ml-1 inline" />
    );
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const r = await fetch('/api/places/' + p._id, { method: 'DELETE' });
    if (r.ok) {
      setSelected(null);
      load(true);
    } else {
      alert('Delete failed');
    }
  };

  const STATUSES = ['pending', 'reached', 'convince', 'signed', 'dead'];

  const STATUS_META = {
    pending: { label: 'Pending', dot: 'bg-amber-400', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40', selectClass: 'status-select status-select-pending' },
    reached: { label: 'Reached', dot: 'bg-blue-400', badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40', selectClass: 'status-select status-select-reached' },
    convince: { label: 'Convince', dot: 'bg-purple-400', badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40', selectClass: 'status-select status-select-convince' },
    signed: { label: 'Signed', dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40', selectClass: 'status-select status-select-signed' },
    dead: { label: 'Dead', dot: 'bg-rose-400', badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40', selectClass: 'status-select status-select-dead' }
  };

  const setStatus = async (p, newStatus, e) => {
    if (e) e.stopPropagation();
    const r = await fetch('/api/places/' + p._id, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (r.ok) {
      if (selected && selected._id === p._id) {
        setSelected({ ...selected, status: newStatus });
      }
      load(true);
      // Show success toast
      const statusLabel = STATUS_META[newStatus]?.label || newStatus;
      setToast({
        message: `Status updated to ${statusLabel}`,
        type: 'success'
      });
      setTimeout(() => setToast(null), 3000);
    } else {
      setToast({
        message: 'Status update failed',
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const cycleStatus = (p, e) => {
    if (e) e.stopPropagation();
    const cur = p.status || 'pending';
    const idx = STATUSES.indexOf(cur);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    setStatus(p, next, null);
  };

  const handleCopy = (text, key, e) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const exportUrl =
    '/api/places/export?' +
    filterQs.toString() +
    '&sort=' +
    sort +
    '&order=' +
    order +
    '&exportMode=' +
    exportMode;

  const curPage = data.page || page || 1;
  const curLimit = data.limit || limit || 50;
  const from = data.total ? (curPage - 1) * curLimit + 1 : 0;
  const to = data.total ? Math.min(data.total, curPage * curLimit) : 0;

  const handleExport = () => {
    setShowExportModal(true);
  };

  const confirmExport = () => {
    window.location.href = exportUrl;
    setShowExportModal(false);
  };

  const emailPct = stats?.total ? Math.round(((stats.withEmail || 0) / stats.total) * 100) : 0;
  const phonePct = stats?.total ? Math.round(((stats.withPhone || 0) / stats.total) * 100) : 0;
  const websitePct = stats?.total ? Math.round(((stats.withWebsite || 0) / stats.total) * 100) : 0;

  return (
    <div className="relative min-h-screen text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-[#0b0f19] pb-12 selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Subtle top ambient radial lighting */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_45%_at_50%_-10%,rgba(99,102,241,0.18),rgba(0,0,0,0))] z-0" />

      {/* Main Container - Extended width for spacious leads display */}
      <div className="relative z-10 w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-300 dark:border-slate-700/80">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-indigo-400 dark:text-indigo-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Maps Leads Studio
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 pulse-animation" />
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                Real-time Google Maps scraper pipeline & contact enrichment
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="btn-outline text-xs px-3 py-1.5 gap-1.5 font-bold"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {/* Live Refresh Switch */}
            <button
              onClick={() => setLive(!live)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 ${live
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'bg-white dark:bg-[#162238] border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-400 pulse-animation' : 'bg-slate-400'
                  }`}
              />
              <span>Live Sync (5s)</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={handleSearch}
              className="btn-outline text-xs px-3 py-1.5 gap-1.5 font-bold"
              title="Refresh database records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-500' : 'text-slate-600 dark:text-slate-300'}`} />
              <span>Refresh</span>
            </button>

            {/* Export CSV Button */}
            <button onClick={handleExport} className="btn-gradient text-xs px-4 py-1.5 gap-2">
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
              {stats?.total > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-md bg-white/25 text-[10px] font-black">
                  {fmt(stats.total)}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* 4 Sleek Prominent Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Leads */}
          <div className="stat-card-modern group border-blue-500/30 dark:border-blue-500/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase">
                Total Places
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {fmt(stats?.total)}
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Scraped & stored leads
            </div>
          </div>

          {/* With Email */}
          <div className="stat-card-modern group border-purple-500/30 dark:border-purple-500/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase">
                With Email
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {fmt(stats?.withEmail)}
              </div>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-200 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/40">
                {emailPct}%
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Outreach-ready emails
            </div>
          </div>

          {/* With Phone */}
          <div className="stat-card-modern group border-emerald-500/30 dark:border-emerald-500/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase">
                With Phone
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {fmt(stats?.withPhone)}
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-200 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                {phonePct}%
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Direct phone lines
            </div>
          </div>

          {/* With Website */}
          <div className="stat-card-modern group border-sky-500/30 dark:border-sky-500/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase">
                With Website
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {fmt(stats?.withWebsite)}
              </div>
              <span className="text-xs font-bold text-sky-700 dark:text-sky-200 bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/40">
                {websitePct}%
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Verified web addresses
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        {stats?.statusCounts && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              Status:
            </span>
            {[
              { key: '', label: 'All', count: stats.statusCounts.all, dot: 'bg-slate-400', active: 'bg-slate-700 text-white border-slate-600' },
              { key: 'pending', label: 'Pending', count: stats.statusCounts.pending, dot: 'bg-amber-400', active: 'bg-amber-500 text-white border-amber-600' },
              { key: 'reached', label: 'Reached', count: stats.statusCounts.reached, dot: 'bg-blue-400', active: 'bg-blue-500 text-white border-blue-600' },
              { key: 'convince', label: 'Convince', count: stats.statusCounts.convince, dot: 'bg-purple-400', active: 'bg-purple-500 text-white border-purple-600' },
              { key: 'signed', label: 'Signed', count: stats.statusCounts.signed, dot: 'bg-emerald-400', active: 'bg-emerald-500 text-white border-emerald-600' },
              { key: 'dead', label: 'Dead', count: stats.statusCounts.dead, dot: 'bg-rose-400', active: 'bg-rose-500 text-white border-rose-600' }
            ].map((s) => {
              const isActive = filters.status === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => { setF('status', isActive ? '' : s.key); }}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 border ${isActive
                    ? s.active + ' shadow-md'
                    : 'bg-white dark:bg-[#162238] text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}>{s.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Top Categories Quick Filter Pills */}
        {stats?.topCategories?.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 shrink-0 font-bold">
              <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              Top Categories:
            </span>
            {stats.topCategories.map((c) => {
              const isSelected = filters.category === c.category;
              return (
                <button
                  key={c.category}
                  onClick={() => setF('category', isSelected ? '' : c.category)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 border ${isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/30'
                    : 'bg-white dark:bg-[#162238] text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-white'
                    }`}
                >
                  <span>{c.category}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isSelected
                      ? 'bg-indigo-900 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                  >
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Unified Modern Filter & Control Bar */}
        <div className="glass-card p-4 space-y-3.5">
          {/* Row 1: Primary Search Bar & Direct Filters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-500 dark:text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filters.q}
                onChange={(e) => setF('q', e.target.value)}
                placeholder="Search business name, address, phone, email..."
                className="input-modern w-full !pl-10 pr-8"
              />
              {filters.q && (
                <button
                  onClick={() => setF('q', '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3 relative">
              <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setF('category', e.target.value)}
                placeholder="Category (e.g. Hospital)"
                className="input-modern w-full !pl-10 pr-3"
              />
            </div>

            {/* City / Address Filter */}
            <div className="md:col-span-2 relative">
              <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setF('city', e.target.value)}
                placeholder="City / Address"
                className="input-modern w-full !pl-10 pr-3"
              />
            </div>

            {/* Toggle Advanced / Expand */}
            <div className="md:col-span-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`btn-outline w-full text-xs py-2 justify-between ${showAdvancedFilters || activeFilterCount > 0 ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 font-bold' : ''
                  }`}
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-600 dark:text-slate-300 ${showAdvancedFilters ? 'rotate-180' : ''
                    }`}
                />
              </button>
            </div>

            {/* Search Button */}
            <div className="md:col-span-1">
              <button
                type="button"
                onClick={handleSearch}
                className="btn-gradient w-full text-xs py-2 font-bold"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 ${showAdvancedFilters ? 'block' : 'hidden md:grid'
              }`}
          >
            {/* State Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                State
              </label>
              <select
                value={filters.state}
                onChange={(e) => setF('state', e.target.value)}
                className="input-modern w-full dark:bg-[#0f172a] dark:text-white dark:border-slate-600"
              >
                <option value="">All States</option>
                {stats?.stateCounts?.map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.name} ({s.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                Lead Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setF('status', e.target.value)}
                className="input-modern w-full dark:bg-[#0f172a] dark:text-white dark:border-slate-600"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reached">Reached</option>
                <option value="convince">In Conversation</option>
                <option value="signed">Signed</option>
                <option value="dead">Dead</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => {
                  setFilters(EMPTY);
                  setPage(1);
                  handleSearch();
                }}
                disabled={activeFilterCount === 0}
                className="btn-outline text-xs py-2 w-full gap-1.5 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>

          {/* Quick Boolean Filter Chips */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-bold mr-1">Must have:</span>

              <button
                type="button"
                onClick={() => setF('hasEmail', !filters.hasEmail)}
                className={`toggle-chip ${filters.hasEmail ? 'toggle-chip-active' : 'toggle-chip-inactive'
                  }`}
              >
                <Mail className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Has Email</span>
              </button>

              <button
                type="button"
                onClick={() => setF('hasPhone', !filters.hasPhone)}
                className={`toggle-chip ${filters.hasPhone ? 'toggle-chip-active' : 'toggle-chip-inactive'
                  }`}
              >
                <Phone className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Has Phone</span>
              </button>

              <button
                type="button"
                onClick={() => setF('hasWebsite', !filters.hasWebsite)}
                className={`toggle-chip ${filters.hasWebsite ? 'toggle-chip-active' : 'toggle-chip-inactive'
                  }`}
              >
                <Globe className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Has Website</span>
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Showing <span className="font-bold text-slate-900 dark:text-white">{from}–{to}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{fmt(data.total)}</span> results
            </div>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-rose-200">Database Connection Error</div>
              <div className="mt-0.5 opacity-90">{error}</div>
              {/MONGODB_URI|ECONNREFUSED|selection/i.test(error) && (
                <div className="mt-1 text-rose-300/80">
                  Ensure MongoDB is running and your <code className="bg-rose-900/40 px-1 py-0.5 rounded text-rose-100">MONGODB_URI</code> is properly configured in <code className="bg-rose-900/40 px-1 py-0.5 rounded text-rose-100">.env.local</code>.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leads Data Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#1b2640] border-b-2 border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-100 uppercase tracking-wider select-none">
                  <th
                    onClick={() => toggleSort('name')}
                    className="py-3 px-4 cursor-pointer hover:text-indigo-600 dark:hover:text-white transition-colors w-[500px]"
                  >
                    Business Name {renderSortIcon('name')}
                  </th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Website</th>
                  <th
                    onClick={() => toggleSort('scrapedAt')}
                    className="py-3 px-3 cursor-pointer hover:text-indigo-600 dark:hover:text-white transition-colors text-right"
                  >
                    Scraped {renderSortIcon('scrapedAt')}
                  </th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {data.items.map((p) => {
                  const statusMeta = STATUS_META[p.status] || STATUS_META.pending;
                  return (
                    <tr
                      key={p._id}
                      onClick={() => setSelected(p)}
                      className="table-row-modern group"
                    >
                      {/* Name & Category */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                          {p.name}
                        </div>
                        {p.category && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200">
                              {p.category}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3 px-4 text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[340px] xl:max-w-[480px] 2xl:max-w-none truncate" title={p.address}>
                        {p.address || <span className="text-slate-400 font-bold">—</span>}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        {p.phone ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-800 dark:text-slate-100 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors font-mono font-bold"
                            >
                              {p.phone}
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(p.phone, `phone-${p._id}`, e)}
                              className="btn-ghost p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                              title="Copy phone"
                            >
                              {copiedKey === `phone-${p._id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        {p.email ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`mailto:${p.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-indigo-600 dark:text-indigo-300 hover:underline max-w-[280px] xl:max-w-[380px] 2xl:max-w-none truncate font-bold"
                              title={p.email}
                            >
                              {p.email}
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(p.email, `email-${p._id}`, e)}
                              className="btn-ghost p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                              title="Copy email"
                            >
                              {copiedKey === `email-${p._id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold">—</span>
                        )}
                      </td>

                      {/* Website */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        {p.website ? (
                          <a
                            href={p.website}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-300 hover:text-sky-700 dark:hover:text-sky-200 hover:underline font-bold"
                          >
                            <span>{host(p.website)}</span>
                            <ExternalLink className="w-3 h-3 opacity-80 text-sky-600 dark:text-sky-300" />
                          </a>
                        ) : (
                          <span className="text-slate-400 font-bold">—</span>
                        )}
                      </td>

                      {/* Scraped At */}
                      <td className="py-3 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 text-right whitespace-nowrap font-mono">
                        {p.scrapedAt ? new Date(p.scrapedAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Status - dropdown to pick status directly */}
                      <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={p.status || 'pending'}
                          onChange={(e) => setStatus(p, e.target.value, null)}
                          className={`${statusMeta.selectClass} dark:bg-[#0f172a] dark:text-white dark:border-slate-600`}
                        >
                          <option value="pending">Pending</option>
                          <option value="reached">Reached</option>
                          <option value="convince">In Conversation</option>
                          <option value="signed">Signed</option>
                          <option value="dead">Dead</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {!loading && !data.items.length && !error && (
            <div className="py-14 px-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Database className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">No leads found</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-sm mx-auto">
                No places match your search filter criteria, or no data has been scraped yet into MongoDB.
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setFilters(EMPTY);
                    setPage(1);
                  }}
                  className="btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1.5 font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && !data.items.length && (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-spin mx-auto opacity-80" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Fetching lead records...</div>
            </div>
          )}

          {/* Table Footer & Pagination */}
          <div className="bg-slate-100 dark:bg-[#11192b] border-t border-slate-300 dark:border-slate-700 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-700 dark:text-slate-300 font-medium">
              Showing <span className="text-slate-900 dark:text-white font-bold">{from}</span> to{' '}
              <span className="text-slate-900 dark:text-white font-bold">{to}</span> of{' '}
              <span className="text-slate-900 dark:text-white font-bold">{fmt(data.total)}</span> entries
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Rows Per Page */}
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(+e.target.value);
                    setPage(1);
                    handleSearch();
                  }}
                  className="input-modern py-1 px-2 text-xs font-bold dark:bg-[#0f172a] dark:text-white dark:border-slate-600"
                >
                  {[25, 50, 100, 200].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => { setPage(1); handleSearch(); }}
                  className="btn-outline p-1.5 font-bold"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
                <button
                  disabled={page <= 1}
                  onClick={() => { setPage((p) => p - 1); handleSearch(); }}
                  className="btn-outline p-1.5 font-bold"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>

                <span className="px-3 py-1 font-bold text-slate-800 dark:text-slate-100">
                  Page {page} of {data.pages || 1}
                </span>

                <button
                  disabled={page >= data.pages}
                  onClick={() => { setPage((p) => p + 1); handleSearch(); }}
                  className="btn-outline p-1.5 font-bold"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
                <button
                  disabled={page >= data.pages}
                  onClick={() => { setPage(data.pages); handleSearch(); }}
                  className="btn-outline p-1.5 font-bold"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Slide-over Lead Detail Drawer */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setSelected(null)}
          />
          <aside className="fixed top-0 right-0 bottom-0 w-full sm:max-w-xl bg-white dark:bg-[#141d30] border-l border-slate-300 dark:border-slate-700 shadow-2xl z-50 overflow-y-auto flex flex-col justify-between">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] sticky top-0 z-10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{selected.name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {selected.category && (
                      <span className="badge badge-indigo font-bold">{selected.category}</span>
                    )}
                    {selected.rating != null && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-300">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {selected.rating} ({fmt(selected.reviews)} reviews)
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="btn-outline p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold"
                >
                  <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-5 space-y-4 flex-1">
              {/* Quick Contact Box */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#1a253e] border border-slate-300 dark:border-slate-700 space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Contact Details
                </div>

                {selected.phone && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Phone:
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${selected.phone.replace(/[^\d+]/g, '')}`}
                        className="font-mono text-slate-900 dark:text-slate-100 font-bold hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        {selected.phone}
                      </a>
                      <button
                        onClick={() => handleCopy(selected.phone, 'drawer-phone')}
                        className="btn-ghost p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      >
                        {copiedKey === 'drawer-phone' ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {(selected.email || selected.emails?.length > 0) && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Email:
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${selected.email || selected.emails?.[0]}`}
                        className="text-indigo-600 dark:text-indigo-300 hover:underline font-bold"
                      >
                        {selected.emails?.length ? selected.emails.join(', ') : selected.email}
                      </a>
                      <button
                        onClick={() =>
                          handleCopy(
                            selected.emails?.length ? selected.emails.join(', ') : selected.email,
                            'drawer-email'
                          )
                        }
                        className="btn-ghost p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      >
                        {copiedKey === 'drawer-email' ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {selected.website && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Website:
                    </span>
                    <a
                      href={selected.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 dark:text-sky-300 hover:underline flex items-center gap-1 font-bold"
                    >
                      {host(selected.website)}
                      <ExternalLink className="w-3 h-3 text-sky-600 dark:text-sky-300" />
                    </a>
                  </div>
                )}
              </div>

              {/* Location & Metadata */}
              <div className="space-y-3">
                <Field label="Full Address" v={selected.address} icon={<MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />} />
                <Field label="Plus Code" v={selected.plusCode} icon={<MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />} />
                <Field
                  label="Coordinates"
                  v={selected.lat != null && `${selected.lat}, ${selected.lng}`}
                  icon={<Compass className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                />
                <Field label="Hours of Operation" v={selected.hours} icon={<Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />} />

                {selected.hoursTable?.length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#1a253e] border border-slate-300 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                      Weekly Schedule
                    </div>
                    <div className="space-y-1">
                      {selected.hoursTable.map((h, i) => (
                        <div key={i} className="text-xs text-slate-800 dark:text-slate-200 font-medium flex justify-between">
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Field label="Found By Search Query" v={selected.searches?.join(' · ')} />
                <Field
                  label="Scraped At"
                  v={selected.scrapedAt && new Date(selected.scrapedAt).toLocaleString()}
                />
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] flex flex-col gap-2.5 sticky bottom-0">
              {selected.url && (
                <a
                  className="btn-gradient text-xs py-2.5 w-full justify-center font-bold"
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className="w-3.5 h-3.5 text-white" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3 opacity-90 ml-0.5 text-white" />
                </a>
              )}
              <div className="flex items-center gap-2 w-full">
                {selected.phone && (
                  <a
                    className="btn-outline text-xs py-2 px-3 whitespace-nowrap flex-1 justify-center font-bold"
                    href={'tel:' + selected.phone.replace(/[^\d+]/g, '')}
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Call</span>
                  </a>
                )}
                {selected.email && (
                  <a
                    className="btn-outline text-xs py-2 px-3 whitespace-nowrap flex-1 justify-center font-bold"
                    href={'mailto:' + selected.email}
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Email</span>
                  </a>
                )}
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${(STATUS_META[selected.status] || STATUS_META.pending).dot}`} />
                    Lead Status
                  </label>
                  <select
                    value={selected.status || 'pending'}
                    onChange={(e) => setStatus(selected, e.target.value, null)}
                    className={`${(STATUS_META[selected.status] || STATUS_META.pending).selectClass} status-select-lg dark:bg-[#0f172a] dark:text-white dark:border-slate-600`}
                  >
                    <option value="pending">Pending</option>
                    <option value="reached">Reached</option>
                    <option value="convince">In Conversation</option>
                    <option value="signed">Signed</option>
                    <option value="dead">Dead</option>
                  </select>
                </div>
                <button
                  className="btn-outline text-xs p-2 text-rose-600 dark:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10 shrink-0 font-bold"
                  onClick={() => remove(selected)}
                  title="Delete lead"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-fadeIn">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${toast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
              }`}
          >
            {toast.type === 'success' ? (
              <CircleCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            )}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Sleek Export Modal */}
      {showExportModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setShowExportModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 p-5 shadow-2xl relative animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Export Dataset</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Download filtered leads as CSV</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="btn-ghost p-1.5 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                </button>
              </div>

              <div className="py-4 space-y-2.5">
                {/* Radio Option 1: New only */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${exportMode === 'new'
                    ? 'bg-indigo-500/15 border-indigo-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#1a253e] border-slate-300 dark:border-slate-700 hover:border-slate-400'
                    }`}
                >
                  <input
                    type="radio"
                    name="exportMode"
                    value="new"
                    checked={exportMode === 'new'}
                    onChange={(e) => setExportMode(e.target.value)}
                    className="mt-1 accent-indigo-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">New leads only</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {fmt(stats?.exportStats?.new || 0)} records not previously exported
                    </div>
                  </div>
                </label>

                {/* Radio Option 2: Previously exported */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${exportMode === 'previous'
                    ? 'bg-indigo-500/15 border-indigo-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#1a253e] border-slate-300 dark:border-slate-700 hover:border-slate-400'
                    }`}
                >
                  <input
                    type="radio"
                    name="exportMode"
                    value="previous"
                    checked={exportMode === 'previous'}
                    onChange={(e) => setExportMode(e.target.value)}
                    className="mt-1 accent-indigo-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Previously exported</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {fmt(stats?.exportStats?.previous || 0)} records previously downloaded
                    </div>
                  </div>
                </label>

                {/* Radio Option 3: All data */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${exportMode === 'all'
                    ? 'bg-indigo-500/15 border-indigo-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#1a253e] border-slate-300 dark:border-slate-700 hover:border-slate-400'
                    }`}
                >
                  <input
                    type="radio"
                    name="exportMode"
                    value="all"
                    checked={exportMode === 'all'}
                    onChange={(e) => setExportMode(e.target.value)}
                    className="mt-1 accent-indigo-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">All data</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {fmt(stats?.exportStats?.all || 0)} total records (respects current search/filter)
                    </div>
                  </div>
                </label>
              </div>

              {exportMode === 'new' && (
                <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>These records will be marked as exported after download.</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={confirmExport}
                  className="btn-gradient flex-1 py-2 text-xs font-bold"
                >
                  Download CSV (
                  {fmt(
                    exportMode === 'new'
                      ? stats?.exportStats?.new || 0
                      : exportMode === 'previous'
                        ? stats?.exportStats?.previous || 0
                        : stats?.exportStats?.all || 0
                  )}
                  )
                </button>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="btn-outline py-2 px-3 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, v, icon }) {
  if (!v) return null;
  return (
    <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#1a253e] border border-slate-300 dark:border-slate-700">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xs text-slate-900 dark:text-slate-100 font-medium break-words">{v}</div>
    </div>
  );
}
