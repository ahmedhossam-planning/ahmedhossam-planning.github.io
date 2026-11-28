/* Home page: earned value S-curve with a data-date slider. Data from evm-data.js (window.AH_EVM).
   Rules applied (GAO-20-195G, project-controls-dashboards skill): EAC shown as a range, CPI-based = best case,
   CPI x SPI = worst case; SPI is not read as a finish date; status is given in words, never by colour alone;
   the plotted values are also available as a table. */
(() => {
  'use strict';
  const D = window.AH_EVM, box = document.getElementById('evm');
  if (!D || !box) return;
  const AR = document.documentElement.lang === 'ar';
  const T = AR ? {
    dd: 'تاريخ البيانات',
    m: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    ok: 'العمل المكتسب في حدود الخطة والتكلفة في حدود قيمة العمل المنجز.', late: 'العمل المكتسب أقل من المخطط', over: 'والتكلفة أعلى من قيمة العمل المنجز.',
    lateOnly: 'العمل المكتسب أقل من المخطط، والتكلفة في حدود قيمة العمل المنجز.', overOnly: 'العمل المكتسب في حدود الخطة، لكن التكلفة أعلى من قيمة العمل المنجز.',
    cpm: ' مؤشر SPI يقيس قيمة العمل لا موعد الانتهاء؛ أثر ذلك على تاريخ الإنجاز يُحدَّد من المسار الحرج.',
    month: n => `الشهر ${n} من ${D.pd}`,
    behind: 'أقل من المخطط', onplan: 'في حدود الخطة', overc: 'تجاوز في التكلفة', within: 'في حدود التكلفة', overb: 'أعلى من الميزانية', inb: 'في حدود الميزانية',
    th: ['الشهر', 'PV', 'EV', 'AC', 'SPI', 'CPI']
  } : {
    dd: 'DATA DATE',
    m: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ok: 'Work earned is on plan and cost is in line with it.', late: 'Less work earned than planned', over: 'and spending more than the work earned.',
    lateOnly: 'Less work earned than planned; cost in line with the work earned.', overOnly: 'Work earned on plan, but spending more than it earned.',
    cpm: ' SPI measures work value, not the finish date: the critical path shows whether completion moves.',
    month: n => `Month ${n} of ${D.pd}`,
    behind: 'Behind plan', onplan: 'On plan', overc: 'Over cost', within: 'Within cost', overb: 'Over budget', inb: 'Within budget',
    th: ['Month', 'PV', 'EV', 'AC', 'SPI', 'CPI']
  };
  const label = i => { const [, y] = D.months[i].split(' '); return T.m[i % 12] + ' ' + y; };
  const RX = false; // keep the time axis left-to-right on the Arabic page too, like the Gantt charts
  const W = 640, H = 330, L = 46, R = 16, TOP = 18, B = 34, YMAX = 1400;
  const x = m => RX ? W - R - (W - L - R) * (m - 1) / (D.pd - 1) : L + (W - L - R) * (m - 1) / (D.pd - 1);
  const y = v => TOP + (H - TOP - B) * (1 - v / YMAX);
  const path = (arr, n) => arr.slice(0, n).map((v, i) => (i ? 'L' : 'M') + x(i + 1).toFixed(1) + ' ' + y(v).toFixed(1)).join('');
  const svg = box.querySelector('svg'), slider = box.querySelector('input[type=range]'), tbl = box.querySelector('[data-evm-table]');
  slider.min = 3; slider.max = D.dd; slider.value = D.dd;
  const f1 = v => v.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1});
  const f0 = v => Math.round(v).toLocaleString('en-US');
  // value + state in words (colour is only a second cue)
  const set = (k, v, bad, word) => {
    const el = box.querySelector(`[data-evm=${k}]`); if (!el) return;
    el.textContent = v;
    if (bad === undefined) return;
    const tile = el.parentElement; tile.dataset.state = bad ? 'bad' : 'good';
    let f = tile.querySelector('.evm-flag'); if (!f) { f = document.createElement('em'); f.className = 'evm-flag'; tile.insertBefore(f, el.nextSibling); }
    f.textContent = (bad ? '▼ ' : '● ') + word;
  };

  function grid() {
    let g = '';
    for (let v = 0; v <= YMAX; v += 200) g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${RX ? W - R + 4 : L - 6}" y="${y(v) + 3}" text-anchor="${RX ? 'start' : 'end'}">${v.toLocaleString('en-US')}</text>`;
    [1, 7, 13, 19, 25, 30].forEach(m => g += `<text class="ax" x="${x(m)}" y="${H - 12}" text-anchor="${m === 1 ? (RX ? 'end' : 'start') : m === 30 ? (RX ? 'start' : 'end') : 'middle'}">${label(m - 1)}</text>`);
    g += `<line class="bac" x1="${L}" x2="${W - R}" y1="${y(D.bac)}" y2="${y(D.bac)}"/><text class="ax" x="${RX ? W - R - 4 : L + 4}" y="${y(D.bac) - 5}" text-anchor="${RX ? 'end' : 'start'}">BAC ${D.bac.toLocaleString('en-US')}</text>`;
    return g;
  }
  const base = grid();
  function draw(n) {
    const pv = D.pv[n - 1], ev = D.ev[n - 1], ac = D.ac[n - 1], spi = ev / pv, cpi = ev / ac;
    // earned schedule: months of plan achieved by the work earned (Lipke)
    let c = 0; while (c < D.pd && D.pv[c] <= ev) c++;
    const es = c >= D.pd ? D.pd : c + (ev - (c ? D.pv[c - 1] : 0)) / (D.pv[c] - (c ? D.pv[c - 1] : 0));
    // EAC range per GAO-20-195G: cumulative CPI = best case, CPI x SPI = worst case
    const eacBest = ac + (D.bac - ev) / cpi, eacWorst = ac + (D.bac - ev) / (cpi * spi);
    svg.innerHTML = base +
      `<path class="pv" d="${path(D.pv, D.pd)}"/><path class="ac" d="${path(D.ac, n)}"/><path class="ev" d="${path(D.ev, n)}"/>` +
      `<line class="ddl" x1="${x(n)}" x2="${x(n)}" y1="${TOP}" y2="${H - B}"/><text class="ddt" x="${x(n) + (RX ? 6 : -6)}" y="${TOP + 10}" text-anchor="end">${T.dd}</text>` +
      `<circle class="ev" cx="${x(n)}" cy="${y(ev)}" r="4"/><circle class="pvd" cx="${x(n)}" cy="${y(pv)}" r="3.5"/>`;
    set('date', label(n - 1)); set('month', T.month(n));
    const late = spi < .97, over = cpi < .99;
    set('spi', spi.toFixed(2), late, late ? T.behind : T.onplan);
    set('cpi', cpi.toFixed(2), over, over ? T.overc : T.within);
    set('sv', f1(ev - pv), ev - pv < 0, ev - pv < 0 ? T.behind : T.onplan);
    set('cv', f1(ev - ac), ev - ac < 0, ev - ac < 0 ? T.overc : T.within);
    set('spit', (es / n).toFixed(2), es / n < .97, es / n < .97 ? T.behind : T.onplan);
    set('eac', f0(eacBest) + ' – ' + f0(eacWorst), eacBest > D.bac, eacBest > D.bac ? T.overb : T.inb);
    set('read', (late && over ? T.late + ' ' + T.over : late ? T.lateOnly : over ? T.overOnly : T.ok) + T.cpm);
    if (tbl) tbl.innerHTML = `<table><thead><tr>${T.th.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>` +
      D.ev.slice(0, n).map((e, i) => `<tr><td>${label(i)}</td><td>${f1(D.pv[i])}</td><td>${f1(e)}</td><td>${f1(D.ac[i])}</td><td>${(e / D.pv[i]).toFixed(2)}</td><td>${(e / D.ac[i]).toFixed(2)}</td></tr>`).join('') + '</tbody></table>';
  }
  slider.addEventListener('input', () => draw(+slider.value));
  draw(D.dd);
})();
