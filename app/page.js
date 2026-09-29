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
  ChevronDown
} from 'lucide-react';

const EMPTY = {
  q: '',
  category: '',
  city: '',
  search: '',
  hasEmail: false,
  hasPhone: false,
  hasWebsite: false,
  minRating: '',
  scrapedDate: '',
  status: ''
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

  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [live, setLive] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState('new');
  const [copiedKey, setCopiedKey] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

  // Debounce typing
  useEffect(() => {
    const t = setTimeout(() => load(false), 250);
    return () => clearTimeout(t);
  }, [load]);

  // Live refresh while the extension is scraping
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => load(true), 5000);
    return () => clearInterval(id);
  }, [live, load]);

  const setF = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

  const toggleSort = (field) => {
    if (sort === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  const renderSortIcon = (field) => {
    if (sort !== field) return <ArrowUpDown className="w-3 h-3 opacity-40 ml-1 inline" />;
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

  const toggleStatus = async (p, e) => {
    if (e) e.stopPropagation();
    const newStatus = p.status === 'done' ? 'pending' : 'done';
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
    } else {
      alert('Status update failed');
    }
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

  const from = data.total ? (data.page - 1) * data.limit + 1 : 0;
  const to = Math.min(data.total, data.page * data.limit);

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
    <div className="relative min-h-screen text-slate-100 bg-[#070a12] pb-12 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Subtle top ambient radial lighting */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_45%_at_50%_-10%,rgba(99,102,241,0.14),rgba(0,0,0,0))] z-0" />

      {/* Main Container - Extended width for spacious leads display */}
      <div className="relative z-10 w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1 border-b border-white/[0.06]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Maps Leads Studio
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-animation" />
                  MongoDB Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time Google Maps scraper pipeline & contact enrichment
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Live Refresh Switch */}
            <button
              onClick={() => setLive(!live)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                live
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/20'
                  : 'bg-[#0e1424] border-white/[0.08] text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  live ? 'bg-emerald-400 pulse-animation' : 'bg-slate-500'
                }`}
              />
              <span>Live Sync (5s)</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => load(false)}
              className="btn-outline text-xs px-3 py-1.5 gap-1.5"
              title="Refresh database records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Export CSV Button */}
            <button onClick={handleExport} className="btn-gradient text-xs px-4 py-1.5 gap-2">
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
              {stats?.total > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
                  {fmt(stats.total)}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* 4 Sleek Compact Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Leads */}
          <div className="stat-card-modern group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Total Places
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {fmt(stats?.total)}
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              Scraped & stored leads
            </div>
          </div>

          {/* With Email */}
          <div className="stat-card-modern group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                With Email
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {fmt(stats?.withEmail)}
              </div>
              <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                {emailPct}%
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Outreach-ready emails
            </div>
          </div>

          {/* With Phone */}
          <div className="stat-card-modern group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                With Phone
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Phone className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {fmt(stats?.withPhone)}
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {phonePct}%
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Direct phone lines
            </div>
          </div>

          {/* With Website */}
          <div className="stat-card-modern group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                With Website
              </span>
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {fmt(stats?.withWebsite)}
              </div>
              <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                {websitePct}%
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Verified web addresses
            </div>
          </div>
        </div>

        {/* Top Categories Quick Filter Pills */}
        {stats?.topCategories?.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="flex items-center gap-1 text-slate-400 shrink-0 font-medium">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Top Categories:
            </span>
            {stats.topCategories.map((c) => {
              const isSelected = filters.category === c.category;
              return (
                <button
                  key={c.category}
                  onClick={() => setF('category', isSelected ? '' : c.category)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/30'
                      : 'bg-[#0d1424] text-slate-300 border-white/[0.08] hover:border-white/[0.2] hover:text-white'
                  }`}
                >
                  <span>{c.category}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-indigo-800 text-white' : 'bg-white/[0.07] text-slate-400'
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
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filters.q}
                onChange={(e) => setF('q', e.target.value)}
                placeholder="Search business name, address, phone, email..."
                className="input-modern w-full pl-9 pr-8"
              />
              {filters.q && (
                <button
                  onClick={() => setF('q', '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3 relative">
              <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setF('category', e.target.value)}
                placeholder="Category (e.g. Hospital)"
                className="input-modern w-full pl-9 pr-3"
              />
            </div>

            {/* City / Address Filter */}
            <div className="md:col-span-2 relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setF('city', e.target.value)}
                placeholder="City / Address"
                className="input-modern w-full pl-9 pr-3"
              />
            </div>

            {/* Toggle Advanced / Expand */}
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`btn-outline w-full text-xs py-2 justify-between ${
                  showAdvancedFilters || activeFilterCount > 0 ? 'border-indigo-500/40 text-indigo-300' : ''
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showAdvancedFilters ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t border-white/[0.06] ${
              showAdvancedFilters ? 'block' : 'hidden md:grid'
            }`}
          >
            {/* Found by search query */}
            <div className="relative">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Found by Search
              </label>
              <div className="relative">
                <Compass className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setF('search', e.target.value)}
                  placeholder="hospital | California"
                  className="input-modern w-full pl-9 pr-3"
                />
              </div>
            </div>

            {/* Scraped date */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Scraped Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.scrapedDate}
                  onChange={(e) => setF('scrapedDate', e.target.value)}
                  className="input-modern w-full"
                />
              </div>
            </div>

            {/* Min Rating */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Min Rating
              </label>
              <div className="relative">
                <Star className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={filters.minRating}
                  onChange={(e) => setF('minRating', e.target.value)}
                  placeholder="4.0+"
                  className="input-modern w-full pl-9 pr-3"
                />
              </div>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Lead Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setF('status', e.target.value)}
                className="input-modern w-full"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => {
                  setFilters(EMPTY);
                  setPage(1);
                }}
                disabled={activeFilterCount === 0}
                className="btn-outline text-xs py-2 w-full gap-1.5 text-slate-300 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>

          {/* Quick Boolean Filter Chips */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/[0.05]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-medium mr-1">Must have:</span>

              <button
                type="button"
                onClick={() => setF('hasEmail', !filters.hasEmail)}
                className={`toggle-chip ${
                  filters.hasEmail ? 'toggle-chip-active' : 'toggle-chip-inactive'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Has Email</span>
              </button>

              <button
                type="button"
                onClick={() => setF('hasPhone', !filters.hasPhone)}
                className={`toggle-chip ${
                  filters.hasPhone ? 'toggle-chip-active' : 'toggle-chip-inactive'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Has Phone</span>
              </button>

              <button
                type="button"
                onClick={() => setF('hasWebsite', !filters.hasWebsite)}
                className={`toggle-chip ${
                  filters.hasWebsite ? 'toggle-chip-active' : 'toggle-chip-inactive'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Has Website</span>
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Showing <span className="font-semibold text-white">{from}–{to}</span> of{' '}
              <span className="font-semibold text-white">{fmt(data.total)}</span> results
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
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-[#0e1424] border-b border-white/[0.08] text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                  <th
                    onClick={() => toggleSort('name')}
                    className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  >
                    Business Name {renderSortIcon('name')}
                  </th>
                  <th
                    onClick={() => toggleSort('rating')}
                    className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                  >
                    Rating {renderSortIcon('rating')}
                  </th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Website</th>
                  <th className="py-3 px-4">Location</th>
                  <th
                    onClick={() => toggleSort('scrapedAt')}
                    className="py-3 px-3 cursor-pointer hover:text-white transition-colors text-right"
                  >
                    Scraped {renderSortIcon('scrapedAt')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.items.map((p) => {
                  const isDone = p.status === 'done';
                  return (
                    <tr
                      key={p._id}
                      onClick={() => setSelected(p)}
                      className="table-row-modern group"
                    >
                      {/* Name & Category */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100 text-sm group-hover:text-indigo-300 transition-colors">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                          {p.category && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.06] text-[11px]">
                              {p.category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rating & Reviews */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {p.rating != null ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {p.rating}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-0.5 pl-0.5">
                              {fmt(p.reviews)} reviews
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => toggleStatus(p, e)}
                          title="Click to toggle status"
                          className={`badge ${
                            isDone ? 'badge-success hover:bg-emerald-500/20' : 'badge-warning hover:bg-amber-500/20'
                          } transition-colors cursor-pointer`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isDone ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          {p.status || 'pending'}
                        </button>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        {p.phone ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-300 hover:text-emerald-400 transition-colors font-mono"
                            >
                              {p.phone}
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(p.phone, `phone-${p._id}`, e)}
                              className="btn-ghost p-1 text-slate-500 hover:text-white"
                              title="Copy phone"
                            >
                              {copiedKey === `phone-${p._id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        {p.email ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`mailto:${p.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-indigo-400 hover:underline max-w-[280px] xl:max-w-[380px] 2xl:max-w-none truncate"
                              title={p.email}
                            >
                              {p.email}
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(p.email, `email-${p._id}`, e)}
                              className="btn-ghost p-1 text-slate-500 hover:text-white"
                              title="Copy email"
                            >
                              {copiedKey === `email-${p._id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
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
                            className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline"
                          >
                            <span>{host(p.website)}</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3 px-4 text-xs text-slate-300 max-w-[340px] xl:max-w-[480px] 2xl:max-w-none truncate" title={p.address}>
                        {p.address || <span className="text-slate-500">—</span>}
                      </td>

                      {/* Scraped At */}
                      <td className="py-3 px-3 text-xs text-slate-400 text-right whitespace-nowrap font-mono">
                        {p.scrapedAt ? new Date(p.scrapedAt).toLocaleDateString() : '—'}
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
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Database className="w-6 h-6" />
              </div>
              <div className="text-base font-semibold text-white">No leads found</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No places match your search filter criteria, or no data has been scraped yet into MongoDB.
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setFilters(EMPTY);
                    setPage(1);
                  }}
                  className="btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
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
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto opacity-70" />
              <div className="text-sm font-medium text-slate-300">Fetching lead records...</div>
            </div>
          )}

          {/* Table Footer & Pagination */}
          <div className="bg-[#0b101d] border-t border-white/[0.06] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-400">
              Showing <span className="text-white font-medium">{from}</span> to{' '}
              <span className="text-white font-medium">{to}</span> of{' '}
              <span className="text-white font-medium">{fmt(data.total)}</span> entries
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Rows Per Page */}
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(+e.target.value);
                    setPage(1);
                  }}
                  className="input-modern py-1 px-2 text-xs"
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
                  onClick={() => setPage(1)}
                  className="btn-outline p-1.5"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-outline p-1.5"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-medium text-slate-200">
                  Page {page} of {data.pages || 1}
                </span>

                <button
                  disabled={page >= data.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-outline p-1.5"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= data.pages}
                  onClick={() => setPage(data.pages)}
                  className="btn-outline p-1.5"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
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
          <aside className="fixed top-0 right-0 bottom-0 w-full sm:max-w-xl bg-[#0c1220] border-l border-white/[0.09] shadow-2xl z-50 overflow-y-auto flex flex-col justify-between">
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/[0.08] bg-[#0a0f1d] sticky top-0 z-10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{selected.name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {selected.category && (
                      <span className="badge badge-indigo">{selected.category}</span>
                    )}
                    {selected.rating != null && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {selected.rating} ({fmt(selected.reviews)} reviews)
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="btn-outline p-2 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-5 space-y-4 flex-1">
              {/* Quick Contact Box */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Contact Details
                </div>

                {selected.phone && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone:
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${selected.phone.replace(/[^\d+]/g, '')}`}
                        className="font-mono text-slate-200 hover:text-emerald-400"
                      >
                        {selected.phone}
                      </a>
                      <button
                        onClick={() => handleCopy(selected.phone, 'drawer-phone')}
                        className="btn-ghost p-1"
                      >
                        {copiedKey === 'drawer-phone' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {(selected.email || selected.emails?.length > 0) && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-purple-400" /> Email:
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${selected.email || selected.emails?.[0]}`}
                        className="text-indigo-400 hover:underline"
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
                        className="btn-ghost p-1"
                      >
                        {copiedKey === 'drawer-email' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {selected.website && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-400" /> Website:
                    </span>
                    <a
                      href={selected.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-1"
                    >
                      {host(selected.website)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Location & Metadata */}
              <div className="space-y-3">
                <Field label="Full Address" v={selected.address} icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />} />
                <Field label="Plus Code" v={selected.plusCode} />
                <Field
                  label="Coordinates"
                  v={selected.lat != null && `${selected.lat}, ${selected.lng}`}
                />
                <Field label="Hours of Operation" v={selected.hours} icon={<Clock className="w-3.5 h-3.5 text-slate-400" />} />

                {selected.hoursTable?.length > 0 && (
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Weekly Schedule
                    </div>
                    <div className="space-y-1">
                      {selected.hoursTable.map((h, i) => (
                        <div key={i} className="text-xs text-slate-300 flex justify-between">
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
            <div className="p-4 border-t border-white/[0.08] bg-[#0a0f1d] flex flex-col gap-2.5 sticky bottom-0">
              {selected.url && (
                <a
                  className="btn-gradient text-xs py-2.5 w-full justify-center shadow-glow-sm font-semibold"
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
                </a>
              )}
              <div className="flex items-center gap-2 w-full">
                {selected.phone && (
                  <a
                    className="btn-outline text-xs py-2 px-3 whitespace-nowrap flex-1 justify-center"
                    href={'tel:' + selected.phone.replace(/[^\d+]/g, '')}
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call</span>
                  </a>
                )}
                {selected.email && (
                  <a
                    className="btn-outline text-xs py-2 px-3 whitespace-nowrap flex-1 justify-center"
                    href={'mailto:' + selected.email}
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Email</span>
                  </a>
                )}
                <button
                  className={`btn-outline text-xs py-2 px-3.5 whitespace-nowrap flex-1 justify-center ${
                    selected.status === 'done'
                      ? 'text-amber-300 border-amber-500/30 hover:bg-amber-500/10'
                      : 'text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10'
                  }`}
                  onClick={() => toggleStatus(selected)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap font-medium">
                    {selected.status === 'done' ? 'Mark Pending' : 'Mark Done'}
                  </span>
                </button>
                <button
                  className="btn-outline text-xs p-2 text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 shrink-0"
                  onClick={() => remove(selected)}
                  title="Delete lead"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Sleek Export Modal */}
      {showExportModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setShowExportModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md bg-[#0d1322] border border-white/[0.12] p-5 shadow-2xl relative animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Export Dataset</h3>
                    <p className="text-[11px] text-slate-400">Download filtered leads as CSV</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="btn-ghost p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-2.5">
                {/* Radio Option 1: New only */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    exportMode === 'new'
                      ? 'bg-indigo-500/10 border-indigo-500/50 shadow-sm shadow-indigo-500/20'
                      : 'bg-[#090e1a] border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportMode"
                    value="new"
                    checked={exportMode === 'new'}
                    onChange={(e) => setExportMode(e.target.value)}
                    className="mt-1 accent-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">New leads only</div>
                    <div className="text-xs text-slate-400">
                      {fmt(stats?.exportStats?.new || 0)} records not previously exported
                    </div>
                  </div>
                </label>

                {/* Radio Option 2: Previously exported */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    exportMode === 'previous'
                      ? 'bg-indigo-500/10 border-indigo-500/50 shadow-sm shadow-indigo-500/20'
                      : 'bg-[#090e1a] border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportMode"
                    value="previous"
                    checked={exportMode === 'previous'}
                    onChange={(e) => setExportMode(e.target.value)}
                    className="mt-1 accent-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">Previously exported</div>
                    <div className="text-xs text-slate-400">
                      {fmt(stats?.exportStats?.previous || 0)} records previously downloaded
                    </div>
                  </div>
                </label>

                {/* Radio Option 3: All data */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    exportMode === 'all'
                      ? 'bg-indigo-500/10 border-indigo-500/50 shadow-sm shadow-indigo-500/20'
                      : 'bg-[#090e1a] border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportMode"
                    value="all"
                    checked={exportMode === 'all'}
                    onChange={(e) => setExportMode(e.target.value)}
                    className="mt-1 accent-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">All data</div>
                    <div className="text-xs text-slate-400">
                      {fmt(stats?.exportStats?.all || 0)} total records (respects current search/filter)
                    </div>
                  </div>
                </label>
              </div>

              {exportMode === 'new' && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>These records will be marked as exported after download.</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={confirmExport}
                  className="btn-gradient flex-1 py-2 text-xs font-semibold"
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
                  className="btn-outline py-2 px-3 text-xs"
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
    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xs text-slate-200 break-words">{v}</div>
    </div>
  );
}
