'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const EMPTY = { q: '', category: '', city: '', search: '', hasEmail: false, hasPhone: false, hasWebsite: false, minRating: '', scrapedDate: '', status: '' };

const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
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

  const filterQs = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v === true) p.set(k, 'true');
      else if (v) p.set(k, v);
    });
    return p;
  }, [filters]);

  const load = useCallback(async (silent) => {
    if (!silent) setLoading(true);
    try {
      const p = new URLSearchParams(filterQs);
      p.set('page', page); p.set('limit', limit); p.set('sort', sort); p.set('order', order);
      const [r1, r2] = await Promise.all([fetch('/api/places?' + p), fetch('/api/places/stats?' + filterQs.toString())]);
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

  // debounce typing
  useEffect(() => {
    const t = setTimeout(() => load(false), 250);
    return () => clearTimeout(t);
  }, [load]);

  // live refresh while the extension is scraping
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => load(true), 5000);
    return () => clearInterval(id);
  }, [live, load]);

  const setF = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };
  const toggleSort = (field) => {
    if (sort === field) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(field); setOrder(field === 'name' ? 'asc' : 'desc'); }
  };
  const arrow = (f) => (sort === f ? (order === 'asc' ? ' ▲' : ' ▼') : '');

  const sortable = ['createdAt', 'updatedAt', 'scrapedAt', 'name', 'rating', 'reviews'];

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const r = await fetch('/api/places/' + p._id, { method: 'DELETE' });
    if (r.ok) { setSelected(null); load(true); }
    else alert('Delete failed');
  };

  const toggleStatus = async (p) => {
    const newStatus = p.status === 'done' ? 'pending' : 'done';
    const r = await fetch('/api/places/' + p._id, { method: 'PATCH', body: JSON.stringify({ status: newStatus }), headers: { 'Content-Type': 'application/json' } });
    if (r.ok) {
      setSelected({ ...p, status: newStatus });
      load(true);
    }
    else alert('Status update failed');
  };

  const exportUrl = '/api/places/export?' + filterQs.toString() + '&sort=' + sort + '&order=' + order + '&exportMode=' + exportMode;
  const from = data.total ? (data.page - 1) * data.limit + 1 : 0;
  const to = Math.min(data.total, data.page * data.limit);

  const handleExport = () => {
    setShowExportModal(true);
  };

  const confirmExport = () => {
    window.location.href = exportUrl;
    setShowExportModal(false);
  };

  return (
    <div className="wrap">
      <div className="top">
        <div>
          <h1>Maps Leads Dashboard</h1>
          <div className="sub">Data scraped by the extension, stored in MongoDB</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label className="check" style={{ padding: 0 }}>
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> Live refresh (5s)
          </label>
          <button onClick={() => load(false)}>↻ Refresh</button>
          <button className="btn p" onClick={handleExport}>⬇ Export CSV</button>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>{fmt(stats?.total)}</b><span>Total places</span></div>
        <div className="stat"><b>{fmt(stats?.withEmail)}</b><span>With email</span></div>
        <div className="stat"><b>{fmt(stats?.withPhone)}</b><span>With phone</span></div>
        <div className="stat"><b>{fmt(stats?.withWebsite)}</b><span>With website</span></div>
      </div>

      {stats?.topCategories?.length > 0 && (
        <div className="chips">
          {stats.topCategories.map((c) => (
            <button key={c.category} className={'chip' + (filters.category === c.category ? ' on' : '')}
              onClick={() => setF('category', filters.category === c.category ? '' : c.category)}>
              {c.category}<i>{c.count}</i>
            </button>
          ))}
        </div>
      )}

      <div className="filters">
        <div className="grow">
          <label>Search name / address / phone / email</label>
          <input type="text" value={filters.q} onChange={(e) => setF('q', e.target.value)} placeholder="Type to search…" />
        </div>
        <div><label>Category</label><input type="text" value={filters.category} onChange={(e) => setF('category', e.target.value)} placeholder="Hospital" /></div>
        <div><label>City / address contains</label><input type="text" value={filters.city} onChange={(e) => setF('city', e.target.value)} placeholder="Los Angeles" /></div>
        <div><label>Found by search</label><input type="text" value={filters.search} onChange={(e) => setF('search', e.target.value)} placeholder="hospital | California" /></div>
        <div><label>Scraped date</label><input type="date" value={filters.scrapedDate} onChange={(e) => setF('scrapedDate', e.target.value)} /></div>
        <div><label>Min rating</label><input type="number" step="0.1" min="0" max="5" style={{ width: 80 }} value={filters.minRating} onChange={(e) => setF('minRating', e.target.value)} /></div>
        <div><label>Status</label>
          <select value={filters.status} onChange={(e) => setF('status', e.target.value)} style={{ width: 120 }}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="done">Done</option>
          </select>
        </div>
        <label className="check"><input type="checkbox" checked={filters.hasEmail} onChange={(e) => setF('hasEmail', e.target.checked)} /> Has email</label>
        <label className="check"><input type="checkbox" checked={filters.hasPhone} onChange={(e) => setF('hasPhone', e.target.checked)} /> Has phone</label>
        <label className="check"><input type="checkbox" checked={filters.hasWebsite} onChange={(e) => setF('hasWebsite', e.target.checked)} /> Has website</label>
        <button onClick={() => { setFilters(EMPTY); setPage(1); }}>Clear</button>
      </div>

      {error && (
        <div className="err">
          <b>Error:</b> {error}
          {/MONGODB_URI|ECONNREFUSED|selection/i.test(error) && (
            <div className="sub" style={{ color: '#ffb3bb' }}>Check that MongoDB is running and MONGODB_URI is set in .env.local, then restart <code>npm run dev</code>.</div>
          )}
        </div>
      )}

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort('name')}>Name{arrow('name')}</th>
              <th onClick={() => toggleSort('rating')}>Rating{arrow('rating')}</th>
              <th className="ns">Status</th>
              <th className="ns">Phone</th>
              <th className="ns">Email</th>
              <th className="ns">Website</th>
              <th className="ns">Address</th>
              <th onClick={() => toggleSort('scrapedAt')}>Scraped{arrow('scrapedAt')}</th>
              <th onClick={() => toggleSort('createdAt')}>Added{arrow('createdAt')}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p._id} onClick={() => setSelected(p)}>
                <td><b>{p.name}</b><small>{p.category || '—'}</small></td>
                <td>{p.rating != null ? <><span className="rate">★ {p.rating}</span><small>{fmt(p.reviews)} reviews</small></> : <span className="mut">—</span>}</td>
                <td><span className={p.status === 'done' ? 'done' : 'pending'}>{p.status || 'pending'}</span></td>
                <td>{p.phone || <span className="mut">—</span>}</td>
                <td>{p.email || <span className="mut">—</span>}</td>
                <td onClick={(e) => e.stopPropagation()}>{p.website ? <a href={p.website} target="_blank" rel="noreferrer">{host(p.website)}</a> : <span className="mut">—</span>}</td>
                <td>{p.address || <span className="mut">—</span>}</td>
                <td className="mut">{p.scrapedAt ? new Date(p.scrapedAt).toLocaleDateString() : ''}</td>
                <td className="mut">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !data.items.length && !error && (
          <div className="empty">No places yet. Run the extension and send data to <code>/api/places/bulk</code>.</div>
        )}
        {loading && !data.items.length && <div className="empty">Loading…</div>}
      </div>

      <div className="pager">
        <span className="mut">{from}–{to} of {fmt(data.total)}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={limit} onChange={(e) => { setLimit(+e.target.value); setPage(1); }}>
            {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button disabled={page <= 1} onClick={() => setPage(1)}>«</button>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
          <span>Page {page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
          <button disabled={page >= data.pages} onClick={() => setPage(data.pages)}>»</button>
        </div>
      </div>

      {selected && (
        <>
          <div className="overlay" onClick={() => setSelected(null)} />
          <aside className="drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <h2>{selected.name}</h2>
                <div className="sub">{selected.category}{selected.rating != null && <> · <span className="rate">★ {selected.rating}</span> ({fmt(selected.reviews)})</>}</div>
              </div>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>

            <Field label="Address" v={selected.address} />
            <Field label="Phone" v={selected.phone} />
            <Field label="Email" v={selected.emails?.length ? selected.emails.join(', ') : selected.email} />
            <Field label="Website" v={selected.website && <a href={selected.website} target="_blank" rel="noreferrer">{selected.website}</a>} />
            <Field label="Hours" v={selected.hours} />
            {selected.hoursTable?.length > 0 && <Field label="Weekly hours" v={selected.hoursTable.map((h, i) => <div key={i}>{h}</div>)} />}
            <Field label="Plus code" v={selected.plusCode} />
            <Field label="Coordinates" v={selected.lat != null && `${selected.lat}, ${selected.lng}`} />
            <Field label="Found by" v={selected.searches?.join(' · ')} />
            <Field label="Scraped at" v={selected.scrapedAt && new Date(selected.scrapedAt).toLocaleString()} />

            <div className="actions">
              {selected.url && <a className="btn p" href={selected.url} target="_blank" rel="noreferrer">Open in Google Maps</a>}
              {selected.phone && <a className="btn" href={'tel:' + selected.phone.replace(/[^\d+]/g, '')}>Call</a>}
              {selected.email && <a className="btn" href={'mailto:' + selected.email}>Email</a>}
              <button className="btn" onClick={() => toggleStatus(selected)}>
                {selected.status === 'done' ? 'Mark as Pending' : 'Mark as Done'}
              </button>
              <button className="d btn" onClick={() => remove(selected)}>Delete</button>
            </div>
          </aside>
        </>
      )}

      {showExportModal && (
        <>
          <div className="overlay" onClick={() => setShowExportModal(false)} />
          <aside className="drawer" style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <h2>Export Options</h2>
              <button onClick={() => setShowExportModal(false)}>✕</button>
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Choose what to export:</label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="check" style={{ padding: 12, border: '1px solid #2a2f3d', borderRadius: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="exportMode"
                    value="new"
                    checked={exportMode === 'new'}
                    onChange={(e) => setExportMode(e.target.value)}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>New data only</div>
                    <div style={{ fontSize: 12, color: '#8b92a5' }}>
                      {fmt(stats?.exportStats?.new || 0)} records not previously exported
                    </div>
                  </div>
                </label>

                <label className="check" style={{ padding: 12, border: '1px solid #2a2f3d', borderRadius: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="exportMode"
                    value="previous"
                    checked={exportMode === 'previous'}
                    onChange={(e) => setExportMode(e.target.value)}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>Previously exported</div>
                    <div style={{ fontSize: 12, color: '#8b92a5' }}>
                      {fmt(stats?.exportStats?.previous || 0)} records already exported
                    </div>
                  </div>
                </label>

                <label className="check" style={{ padding: 12, border: '1px solid #2a2f3d', borderRadius: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="exportMode"
                    value="all"
                    checked={exportMode === 'all'}
                    onChange={(e) => setExportMode(e.target.value)}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>All data</div>
                    <div style={{ fontSize: 12, color: '#8b92a5' }}>
                      {fmt(stats?.exportStats?.all || 0)} total records (respects current filters)
                    </div>
                  </div>
                </label>
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                <button className="btn p" onClick={confirmExport} style={{ flex: 1 }}>
                  Export {fmt(
                    exportMode === 'new' ? (stats?.exportStats?.new || 0) :
                    exportMode === 'previous' ? (stats?.exportStats?.previous || 0) :
                    (stats?.exportStats?.all || 0)
                  )} records
                </button>
                <button onClick={() => setShowExportModal(false)}>Cancel</button>
              </div>

              {exportMode === 'new' && (
                <div style={{ marginTop: 12, fontSize: 12, color: '#8b92a5' }}>
                  ⚠️ These records will be marked as exported after download
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function Field({ label, v }) {
  if (!v) return null;
  return <div className="kv"><label>{label}</label><div>{v}</div></div>;
}
