'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const EMPTY = { q: '', category: '', city: '', search: '', hasEmail: false, hasPhone: false, hasWebsite: false, minRating: '' };

const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const fmt = (n) => (n ?? 0).toLocaleString();

export default function Dashboard() {
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [live, setLive] = useState(false);

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
      const [r1, r2] = await Promise.all([fetch('/api/places?' + p), fetch('/api/places/stats')]);
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

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const r = await fetch('/api/places/' + p._id, { method: 'DELETE' });
    if (r.ok) { setSelected(null); load(true); }
    else alert('Delete failed');
  };

  const exportUrl = '/api/places/export?' + filterQs.toString();
  const from = data.total ? (data.page - 1) * data.limit + 1 : 0;
  const to = Math.min(data.total, data.page * data.limit);

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
          <a className="btn p" href={exportUrl}>⬇ Export CSV</a>
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
        <div><label>Min rating</label><input type="number" step="0.1" min="0" max="5" style={{ width: 80 }} value={filters.minRating} onChange={(e) => setF('minRating', e.target.value)} /></div>
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
              <th className="ns">Phone</th>
              <th className="ns">Email</th>
              <th className="ns">Website</th>
              <th className="ns">Address</th>
              <th onClick={() => toggleSort('createdAt')}>Added{arrow('createdAt')}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p._id} onClick={() => setSelected(p)}>
                <td><b>{p.name}</b><small>{p.category || '—'}</small></td>
                <td>{p.rating != null ? <><span className="rate">★ {p.rating}</span><small>{fmt(p.reviews)} reviews</small></> : <span className="mut">—</span>}</td>
                <td>{p.phone || <span className="mut">—</span>}</td>
                <td>{p.email || <span className="mut">—</span>}</td>
                <td onClick={(e) => e.stopPropagation()}>{p.website ? <a href={p.website} target="_blank" rel="noreferrer">{host(p.website)}</a> : <span className="mut">—</span>}</td>
                <td>{p.address || <span className="mut">—</span>}</td>
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
              <button className="d btn" onClick={() => remove(selected)}>Delete</button>
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
