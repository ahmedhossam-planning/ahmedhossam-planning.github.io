/* Projects page: portfolio programme (Gantt), project-type tiles, searchable register and project detail.
   Data comes from register-data.js (window.AH_DATA), generated from the classic site's project records. */
(() => {
  'use strict';
  const DATA = window.AH_DATA;
  if (!DATA) return;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const typeOf = code => DATA.types.find(t => code.startsWith(t.code + '-'));
  const now = new Date(), DD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const AR = document.documentElement.lang === 'ar';
  // Arabic plural for 'project': 1 مشروع واحد, 2 مشروعان, 3-10 مشاريع, 11+ مشروعاً
  const nProj = n => AR ? (n === 1 ? 'مشروع واحد' : n === 2 ? 'مشروعان' : n <= 10 ? n + ' مشاريع' : n + ' مشروعاً') : n + ' project' + (n === 1 ? '' : 's');
  const L = AR ? {elapsed: 'الزمن المنقضي حتى تاريخ البيانات', remaining: 'المدة المتبقية', dd: 'تاريخ البيانات', to: ' إلى ',
      meta: ['المنطقة', 'نوع العميل', 'نوع المالك', 'المدة', 'البرنامج', 'نطاق القيمة'], seq: 'تسلسل التنفيذ', lp: 'المسار الأطول', role: 'ما قدمته', arrow: '←', all: 'الكل',
      showAll: n => 'اعرض كل المشاريع (' + n + ')', fewer: 'اعرض عدداً أقل', count: (a, b) => a + ' من ' + b + ' مشروعاً',
      match: q => ' · نتائج البحث عن «' + q + '»', none: n => 'لا يوجد مشروع مطابق. امسح نص البحث لعرض المشاريع كلها (' + n + ').'}
    : {elapsed: 'Elapsed to data date', remaining: 'Remaining window', dd: 'DATA DATE', to: ' to ',
      meta: ['REGION', 'CLIENT TYPE', 'OWNER TYPE', 'SCHEDULE', 'SOFTWARE', 'VALUE RANGE'], seq: 'Construction sequence', lp: 'Longest path', role: 'What I delivered', arrow: '→', all: 'ALL',
      showAll: n => 'Show all ' + n + ' projects', fewer: 'Show fewer', count: (a, b) => a + ' of ' + b + ' projects',
      match: q => ' · matching “' + q + '”', none: n => 'No project matches that search. Clear the search box to see all ' + n + '.'};
  const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  // headline figures
  $('#pstats').innerHTML = DATA.stats.slice(0, 4).map(([v, l]) => `<span>${esc(v)} ${esc(l)}</span>`).join('');

  // project-type tiles
  $('#typegrid').innerHTML = DATA.types.map((t, i) => {
    const n = DATA.projects.filter(p => p.code.startsWith(t.code + '-')).length;
    return `<button type="button" class="sector-tile type-tile" data-f="${t.code}" style="--c:var(${t.color})"><span class="num">${String(i + 1).padStart(2, '0')} / ${t.code}</span><b>${esc(t.name)}</b><p>${nProj(n)} · ${esc(t.tags.slice(0, 3).join(' · '))}</p></button>`;
  }).join('');
  $('#typegrid').addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    setFilter(b.dataset.f); $('#register').scrollIntoView({behavior: smooth});
  });

  // legend
  $('#legend').innerHTML = DATA.types.map(t => `<span><i style="background:var(${t.color})"></i>${t.code}</span>`).join('')
    + `<span><i class="el"></i>${L.elapsed}</span><span><i class="el rem"></i>${L.remaining}</span>`;

  // programme chart
  (function gantt() {
    const svg = $('#gantt'), W = 1000, L = 92, R = 14, top = 28, laneH = 11, gapS = 12;
    const items = DATA.projects.filter(p => p.start && p.finish);
    const t0 = new Date(Math.min(...items.map(p => +new Date(p.start)))), t1 = new Date(Math.max(...items.map(p => +new Date(p.finish))));
    t0.setMonth(0, 1); t1.setFullYear(t1.getFullYear() + 1, 0, 1);
    const x = d => L + (W - L - R) * (new Date(d) - t0) / (t1 - t0);
    let y = top; const out = [];
    for (let yr = t0.getFullYear(); yr <= t1.getFullYear(); yr++) {
      const xx = x(`${yr}-01-01`);
      out.push(`<line x1="${xx}" x2="${xx}" y1="${top - 8}" y2="__H__" class="gl"/>`);
      if (yr < t1.getFullYear()) out.push(`<text x="${xx + 4}" y="${top - 12}">${yr}</text>`);
    }
    for (const t of DATA.types) {
      const ps = items.filter(p => p.code.startsWith(t.code + '-')).sort((a, b) => a.start.localeCompare(b.start));
      if (!ps.length) continue;
      const lanes = [];
      for (const p of ps) {
        let k = lanes.findIndex(end => end < p.start);
        if (k < 0) { k = lanes.length; lanes.push(''); }
        lanes[k] = p.finish; p._lane = k;
      }
      const h = lanes.length * laneH;
      out.push(`<rect x="0" y="${y - 3}" width="${W}" height="${h + 6}" class="band"/>`);
      out.push(`<text class="lab" x="6" y="${y + 9}">${t.code}</text><text x="6" y="${y + 21}">${AR ? nProj(ps.length) : ps.length + ' jobs'}</text>`);
      for (const p of ps) {
        const a = x(p.start), b = Math.max(x(p.finish), a + 3), yy = y + p._lane * laneH, dd = Math.min(Math.max(x(DD), a), b);
        out.push(`<g class="bar" tabindex="0" role="button" data-code="${p.code}" aria-label="${esc(p.code + ' ' + p.title)}"><title>${esc(p.code + ' · ' + p.title + ' · ' + p.start.slice(0, 7) + L.to + p.finish.slice(0, 7))}</title>
          <rect x="${a}" y="${yy}" width="${b - a}" height="7" fill="var(${t.color})" opacity=".38"/>
          <rect x="${a}" y="${yy}" width="${dd - a}" height="7" fill="var(${t.color})"/></g>`);
      }
      y += h + gapS;
    }
    const xd = x(DD);
    out.push(`<line x1="${xd}" x2="${xd}" y1="${top - 8}" y2="${y}" class="ddl"/><text x="${xd + 4}" y="${y - 2}" class="ddt">${L.dd}</text>`);
    svg.setAttribute('viewBox', `0 0 ${W} ${y + 4}`);
    svg.innerHTML = out.join('').replaceAll('__H__', y);
    const sc = svg.parentElement; let userScrolled = false;
    const toDD = () => { if (!userScrolled && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = sc.scrollWidth * xd / W - sc.clientWidth * 0.7; };
    sc.addEventListener('pointerdown', () => userScrolled = true, {once: true});
    requestAnimationFrame(toDD); addEventListener('load', toDD);
    if (window.ResizeObserver) new ResizeObserver(toDD).observe(sc);
    svg.addEventListener('click', e => { const g = e.target.closest('.bar'); if (g) openProject(g.dataset.code, true); });
    svg.addEventListener('keydown', e => { const g = e.target.closest('.bar'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openProject(g.dataset.code, true); } });
  })();

  // project detail
  function openProject(code, scroll) {
    const p = DATA.projects.find(q => q.code === code); if (!p) return;
    const t = typeOf(code), n = Math.max(1, p.sequence.length);
    const steps = p.sequence.map((s, i) => `<li><span class="aid">A${String((i + 1) * 10).padStart(3, '0')}</span><div>${esc(s)}<i class="sbar" style="--c:var(${t.color});width:${Math.max(18, 100 - i * (70 / n))}%;margin-left:${i * (70 / n) / 1.6}%"></i></div></li>`).join('');
    const meta = [[L.meta[0], p.location], [L.meta[1], p.client], [L.meta[2], p.owner], [L.meta[3], p.timeline], [L.meta[4], p.software || 'P6'], [L.meta[5], p.value]]
      .filter(([, v]) => v && v !== '-').map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    $('#pdetail').innerHTML = `<span class="eyebrow" style="color:var(${t.color})">${p.code} / ${esc(t.name)}</span><h3>${esc(p.title)}</h3><dl class="pmeta">${meta}</dl>
      <p>${esc(p.description)}</p>${p.detail ? `<p class="soft">${esc(p.detail)}</p>` : ''}
      <div class="pcols"><div><h4>${L.seq}</h4><ol class="psteps">${steps}</ol>${p.basis ? `<p class="small-note">${esc(p.basis)}</p>` : ''}</div>
      <div>${p.longest_path && p.longest_path.length ? `<h4>${L.lp}</h4><ol class="lpath">${p.longest_path.map(s => `<li>${esc(s)}</li>`).join(`<li class="arr" aria-hidden="true">${L.arrow}</li>`)}</ol>${p.lp_basis ? `<p class="small-note">${esc(p.lp_basis)}</p>` : ''}` : ''}
      <h4>${L.role}</h4><ul class="prole">${p.role.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div></div>`;
    document.querySelectorAll('#rbody tr').forEach(r => r.classList.toggle('is-open', r.dataset.code === code));
    if (scroll) { $('#pdetail').scrollIntoView({behavior: smooth, block: 'start'}); $('#pdetail').focus({preventScroll: true}); }
  }

  // register
  let rf = 'ALL', rAll = false;
  const RMAX = matchMedia('(max-width:760px)').matches ? 5 : 10;
  function renderReg() {
    const q = $('#rsearch').value.trim().toLowerCase();
    const rows = DATA.projects.filter(p => (rf === 'ALL' || p.code.startsWith(rf + '-')) &&
      (!q || [p.code, p.title, p.location, p.client, p.services_short].join(' ').toLowerCase().includes(q)));
    const cut = !rAll && rf === 'ALL' && !q && rows.length > RMAX;
    const mb = $('#rmore');
    mb.hidden = !(cut || (rAll && rf === 'ALL' && !q && rows.length > RMAX));
    mb.textContent = cut ? L.showAll(rows.length) : L.fewer;
    mb.setAttribute('aria-expanded', String(!cut));
    $('#rcount').textContent = L.count(rows.length, DATA.projects.length) + (rf === 'ALL' ? '' : ` · ${rf}`) + (q ? L.match($('#rsearch').value.trim()) : '');
    $('#rbody').innerHTML = (cut ? rows.slice(0, RMAX) : rows).map(p => {
      const t = typeOf(p.code);
      return `<tr data-code="${p.code}" tabindex="0"><td class="code"><i class="dot" style="background:var(${t.color})"></i>${p.code}</td><td>${esc(p.title)}</td><td>${esc(p.location)}</td><td>${esc(p.client)}</td><td class="num${p.activities ? '' : ' na'}">${p.activities ? '~' + p.activities.toLocaleString('en-US') : '-'}</td><td>${esc(p.services_short)}</td></tr>`;
    }).join('') || `<tr><td colspan="6">${L.none(DATA.projects.length)}</td></tr>`;
  }
  function setFilter(f) {
    rf = f; $('#rfilter').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.f === f))); renderReg();
  }
  $('#rfilter').innerHTML = ['ALL', ...DATA.types.map(t => t.code)].map(c => `<button type="button" class="filter-btn" data-f="${c}" aria-pressed="${c === 'ALL'}">${c === 'ALL' ? L.all : c}</button>`).join('');
  $('#rfilter').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setFilter(b.dataset.f); });
  $('#rsearch').addEventListener('input', renderReg);
  $('#rmore').addEventListener('click', () => { const wasAll = rAll; rAll = !rAll; renderReg(); if (wasAll) $('#register').scrollIntoView({block: 'start'}); });
  $('#rbody').addEventListener('click', e => { const r = e.target.closest('tr[data-code]'); if (r) openProject(r.dataset.code, true); });
  $('#rbody').addEventListener('keydown', e => { const r = e.target.closest('tr[data-code]'); if (r && e.key === 'Enter') openProject(r.dataset.code, true); });

  renderReg();
  openProject(location.hash.length > 1 && DATA.projects.some(p => p.code === location.hash.slice(1)) ? location.hash.slice(1) : DATA.featured, false);
})();
