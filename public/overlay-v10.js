const canvas = document.querySelector('#garden');
const ctx = canvas.getContext('2d');
const status = document.querySelector('#status');
let plants = [], gardeners = [], sunshineUntil = 0, effects = [], channelName = 'your channel';
let activity = null, lastTotalWaterings = null;
const speciesColors = { rose: '#ff3f7f', sunflower: '#ffbd16', tulip: '#b746f5', daisy: '#ffe500', lavender: '#8367ff', tropical: '#ff6438' };
const fireflyColors = ['#ffd54a', '#ff6e9b', '#8be6a5', '#ba8cff', '#58d9e8'];
const fireflies = Array.from({ length: 52 }, (_, i) => ({ x: (i * 491 + 83) % 1920, y: (i * 271 + 126) % 700, r: 1 + i % 3, phase: i * .91, color: fireflyColors[i % fireflyColors.length] }));

function roundRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function chip(x, y, w, h, color, r = h / 2) { ctx.fillStyle = color; roundRect(x, y, w, h, r); ctx.fill(); }
function outline(x, y, w, h, r, stroke, width = 1) { ctx.strokeStyle = stroke; ctx.lineWidth = width; roundRect(x, y, w, h, r); ctx.stroke(); }
function withAlpha(hex, alpha) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`; }
function position(_name, index, total) {
  const columns = Math.min(10, Math.max(1, total));
  const rows = Math.ceil(total / columns), row = Math.floor(index / columns), col = index % columns;
  const inRow = Math.min(columns, total - row * columns);
  const spacing = columns === 1 ? 0 : Math.min(230, 1500 / (columns - 1));
  const stagger = row % 2 ? spacing * .42 : 0;
  const x = Math.max(80, Math.min(1840, 960 + (col - (inRow - 1) / 2) * spacing + stagger));
  const rowGap = rows <= 2 ? 205 : rows === 3 ? 178 : rows === 4 ? 145 : rows === 5 ? 112 : Math.min(108, 540 / (rows - 1));
  const scale = rows <= 2 ? .88 : rows === 3 ? .78 : rows === 4 ? .65 : rows === 5 ? .52 : Math.max(.2, Math.min(.34, 2.1 / rows));
  return { x, y: 970 - row * rowGap, scale };
}
function drawLeaf(x, y, len, angle) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = '#59c777'; ctx.strokeStyle = '#26874c'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * .45, -len * .48, len, -len * .2); ctx.quadraticCurveTo(len * .7, len * .14, 0, 0); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(245,250,222,.72)'; ctx.beginPath(); ctx.moveTo(2, -1); ctx.quadraticCurveTo(len * .45, -len * .1, len * .86, -len * .18); ctx.stroke(); ctx.restore();
}
function drawPlant(p, now, index, total) {
  const pos = position(p.username, index, total), color = speciesColors[p.species] || speciesColors.daisy;
  const growth = p.stage === 'seed' ? .34 : p.stage === 'sprout' ? .59 : p.stage === 'bud' ? .82 : 1;
  const popEvent = effects.find(e => e.username === p.username && now - e.time < 1400);
  const pop = popEvent ? 1 + Math.sin((now - popEvent.time) / 1400 * Math.PI) * .2 : 1;
  ctx.save(); ctx.translate(pos.x, pos.y); ctx.scale(pos.scale * pop, pos.scale * pop);
  const stem = 88 + growth * 145;
  const soil = ctx.createRadialGradient(0, 0, 3, 0, 0, 48); soil.addColorStop(0, 'rgba(73,112,60,.27)'); soil.addColorStop(1, 'rgba(73,112,60,0)');
  ctx.fillStyle = soil; ctx.beginPath(); ctx.ellipse(0, 1, 48, 12, 0, 0, Math.PI * 2); ctx.fill();
  const halo = ctx.createRadialGradient(0, -stem, 2, 0, -stem, 78); halo.addColorStop(0, withAlpha(color, .28)); halo.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = halo; ctx.beginPath(); ctx.ellipse(0, -stem, 78, 70, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineCap = 'round'; ctx.strokeStyle = '#328a51'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-9, -stem * .34, 9, -stem * .68, 0, -stem); ctx.stroke();
  if (growth > .52) { drawLeaf(0, -stem * .4, 40, -.55); drawLeaf(1, -stem * .68, 37, 2.65); }
  const headY = -stem;
  if (p.stage === 'bloom') {
    const petals = p.species === 'sunflower' || p.species === 'daisy' ? 10 : 7;
    for (let i = 0; i < petals; i++) { const a = i * Math.PI * 2 / petals, x = Math.cos(a) * 16, y = headY + Math.sin(a) * 16;
      const grad = ctx.createLinearGradient(x - 5, y - 12, x + 5, y + 12); grad.addColorStop(0, '#fff8e8'); grad.addColorStop(.5, color); grad.addColorStop(1, color);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(x, y, 10, 18, a, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#95623c'; ctx.beginPath(); ctx.arc(0, headY, 11, 0, Math.PI * 2); ctx.fill();
  } else if (p.stage === 'bud') { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, headY, 13, 20, -.12, 0, Math.PI * 2); ctx.fill(); }
  else if (p.stage === 'sprout') { ctx.fillStyle = '#f0d16b'; ctx.beginPath(); ctx.ellipse(0, headY, 9, 7, 0, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.fillStyle = '#806341'; ctx.beginPath(); ctx.ellipse(0, -9, 9, 6, -.15, 0, Math.PI * 2); ctx.fill(); }
  const thresholds = { seed: [0, 3], sprout: [3, 10], bud: [10, 30] }[p.stage];
  if (thresholds) {
    const progress = Math.max(0, Math.min(1, (p.waterings - thresholds[0]) / (thresholds[1] - thresholds[0])));
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(32,64,45,.2)'; ctx.beginPath(); ctx.arc(25, headY - 19, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#e6c864'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(25, headY - 19, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.stroke();
  }
  if (popEvent) {
    const elapsed = (now - popEvent.time) / 1400, spread = 18 + elapsed * 28;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, px = Math.cos(a) * spread, py = headY + Math.sin(a) * spread - elapsed * 10;
      ctx.globalAlpha = Math.max(0, 1 - elapsed); ctx.fillStyle = i % 2 ? '#f4d782' : '#f6a3a4'; ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  ctx.font = '600 15px system-ui'; const w = Math.min(138, Math.max(66, ctx.measureText(p.username).width + 20));
  chip(-w / 2, 16, w, 27, 'rgba(255,255,246,.98)', 14); chip(-w / 2 + 3, 20, 4, 19, color, 2); outline(-w / 2, 16, w, 27, 14, withAlpha(color, .8), 1);
  ctx.fillStyle = '#183d31'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.username, 3, 29.5, w - 18);
  ctx.restore();
}
function drawBrand() {
  ctx.save(); ctx.shadowColor = 'rgba(16,42,32,.24)'; ctx.shadowBlur = 32; ctx.shadowOffsetY = 8; chip(48, 42, 430, 112, 'rgba(20,51,40,.95)', 26); ctx.shadowColor = 'transparent';
  const brandEdge = ctx.createLinearGradient(48, 42, 478, 154); brandEdge.addColorStop(0, '#ffe34f'); brandEdge.addColorStop(.48, '#ff6e9f'); brandEdge.addColorStop(1, '#61e0bd'); outline(48, 42, 430, 112, 26, brandEdge, 2);
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(102, 98, 31, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#315b43'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(101, 115); ctx.quadraticCurveTo(99, 92, 113, 77); ctx.stroke();
  ctx.fillStyle = '#6d9c62'; ctx.beginPath(); ctx.ellipse(93, 94, 9, 16, -.65, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(111, 84, 9, 15, .6, 0, Math.PI * 2); ctx.fill();
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff7dc'; ctx.font = '700 31px system-ui'; ctx.fillText('chatgarden', 151, 91);
  ctx.fillStyle = 'rgba(242,244,222,.78)'; ctx.font = '500 16px system-ui'; ctx.fillText(`Growing together in #${channelName}`, 152, 119, 220);
  chip(379, 58, 72, 27, 'rgba(108,164,111,.24)', 14); ctx.fillStyle = '#bfe6a8'; ctx.beginPath(); ctx.arc(393, 71.5, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d9f0c8'; ctx.font = '700 11px system-ui'; ctx.fillText('LIVE', 404, 75); ctx.restore();
}
function drawGardeners() {
  ctx.save(); ctx.shadowColor = 'rgba(16,42,32,.24)'; ctx.shadowBlur = 32; ctx.shadowOffsetY = 8; chip(1532, 42, 340, 302, 'rgba(20,51,40,.96)', 25); ctx.shadowColor = 'transparent';
  const boardEdge = ctx.createLinearGradient(1532, 42, 1872, 344); boardEdge.addColorStop(0, '#ffe05b'); boardEdge.addColorStop(.5, '#ff6fa3'); boardEdge.addColorStop(1, '#64dfbd'); outline(1532, 42, 340, 302, 25, boardEdge, 2);
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(1573, 83, 19, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff4c8d'; ctx.font = '700 20px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✿', 1573, 84);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff7dc'; ctx.font = '700 22px system-ui'; ctx.fillText('Gardeners', 1604, 81);
  ctx.fillStyle = 'rgba(242,244,222,.62)'; ctx.font = '600 12px system-ui'; ctx.fillText('GROWING TOGETHER', 1604, 101);
  chip(1556, 119, 292, 1.5, 'rgba(255,255,255,.16)', 1);
  if (!gardeners.length) { ctx.textAlign = 'center'; ctx.fillStyle = '#e1e9d8'; ctx.font = '500 15px system-ui'; ctx.fillText('Your first flower is waiting', 1702, 169); ctx.fillStyle = 'rgba(230,240,218,.6)'; ctx.font = '13px system-ui'; ctx.fillText('Say hello in chat to plant a seed', 1702, 193); }
  gardeners.slice(0, 5).forEach((g, i) => { const y = 151 + i * 36;
    ctx.fillStyle = i === 0 ? '#f0d47a' : 'rgba(238,244,224,.12)'; ctx.beginPath(); ctx.arc(1572, y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = i === 0 ? '#294834' : '#e8efda'; ctx.font = '700 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), 1572, y);
    ctx.textAlign = 'left'; ctx.fillStyle = '#f3f3df'; ctx.font = '600 15px system-ui'; ctx.fillText(g.username, 1597, y + 5, 175);
    ctx.textAlign = 'right'; ctx.fillStyle = '#c8d9b7'; ctx.font = '600 13px system-ui'; ctx.fillText(`${g.waterings} ✿`, 1842, y + 5);
  }); ctx.restore();
}
function drawStats() {
  const waterings = plants.reduce((sum, p) => sum + p.waterings, 0);
  const blooms = plants.filter(p => p.stage === 'bloom').length;
  ctx.save(); ctx.shadowColor = 'rgba(16,42,32,.16)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 7;
  chip(510, 42, 660, 148, 'rgba(20,51,40,.88)', 25); ctx.shadowColor = 'transparent';
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(242,244,222,.62)'; ctx.font = '600 11px system-ui'; ctx.fillText('COMMUNITY SNAPSHOT', 536, 66);
  const stats = [
    { label: 'GARDENERS', value: plants.length, color: '#bfe0a8' },
    { label: 'WATERINGS', value: waterings, color: '#f1d376' },
    { label: 'IN BLOOM', value: blooms, color: '#efa0aa' },
    { label: 'SPECIES', value: new Set(plants.map(p => p.species)).size, color: '#c5b5f0' },
  ];
  stats.forEach((s, i) => {
    const x = 536 + i * 148;
    if (i) { ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 16, 82); ctx.lineTo(x - 16, 132); ctx.stroke(); }
    ctx.fillStyle = s.color; ctx.font = '700 23px system-ui'; ctx.fillText(String(s.value), x, 105);
    ctx.fillStyle = 'rgba(242,244,222,.64)'; ctx.font = '600 10px system-ui'; ctx.fillText(s.label, x, 127);
  });
  const total = waterings;
  const milestones = [10, 25, 50, 100, 250, 500, 1000];
  const next = milestones.find(n => n > total) || (Math.floor(total / 1000) + 1) * 1000;
  const previous = next <= 10 ? 0 : milestones.includes(next) ? milestones[milestones.indexOf(next) - 1] : next - 1000;
  const ratio = Math.max(0, Math.min(1, (total - previous) / (next - previous)));
  ctx.fillStyle = 'rgba(242,244,222,.72)'; ctx.font = '600 10px system-ui'; ctx.fillText('NEXT COMMUNITY MILESTONE', 536, 151);
  ctx.textAlign = 'right'; ctx.fillStyle = '#f1d376'; ctx.font = '700 11px system-ui'; ctx.fillText(`${total} / ${next} waterings`, 1140, 151);
  chip(536, 163, 608, 7, 'rgba(255,255,255,.14)', 4);
  const progressColor = ctx.createLinearGradient(536, 0, 1144, 0); progressColor.addColorStop(0, '#56e39a'); progressColor.addColorStop(.52, '#ffe04f'); progressColor.addColorStop(1, '#ff5e9a');
  if (ratio > 0) chip(536, 163, 608 * ratio, 7, progressColor, 4);
  ctx.restore();
}
function drawButterflies(now) {
  for (let i = 0; i < 3; i++) {
    const t = now / 3200 + i * 2.1, x = 570 + ((t * 42) % 720), y = 490 + Math.sin(t * 1.4) * 62;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t) * .22);
    const flap = .45 + Math.abs(Math.sin(now / 95 + i)) * .55;
    ctx.fillStyle = ['rgba(255,102,154,.82)', 'rgba(255,205,78,.82)', 'rgba(114,224,189,.82)'][i];
    ctx.beginPath(); ctx.ellipse(-5, 0, 6 * flap, 9, -.4, 0, Math.PI * 2); ctx.ellipse(5, 0, 6 * flap, 9, .4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(54,76,51,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 5); ctx.stroke(); ctx.restore();
  }
}
function drawActivity(now) {
  if (!activity || now - activity.time > 4200) return;
  const fade = Math.min(1, (4200 - (now - activity.time)) / 650);
  ctx.save(); ctx.globalAlpha = fade; ctx.shadowColor = 'rgba(16,42,32,.16)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6;
  chip(730, 945, 460, 70, 'rgba(20,51,40,.92)', 22); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#e5c86d'; ctx.beginPath(); ctx.arc(770, 980, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#34593d'; ctx.font = '700 20px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(activity.icon, 770, 981);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = 'rgba(242,244,222,.63)'; ctx.font = '700 10px system-ui'; ctx.fillText(activity.title, 805, 972);
  ctx.fillStyle = '#fff7dc'; ctx.font = '600 15px system-ui'; ctx.fillText(activity.message, 805, 995, 350); ctx.restore();
}
function draw(now) {
  ctx.clearRect(0, 0, 1920, 1080);
  if (now < sunshineUntil) { const glow = ctx.createRadialGradient(960, 380, 20, 960, 380, 1050); glow.addColorStop(0, 'rgba(255,224,130,.24)'); glow.addColorStop(1, 'rgba(255,238,175,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, 1920, 1080); }
  const ground = ctx.createLinearGradient(0, 820, 0, 1080); ground.addColorStop(0, 'rgba(101,153,92,0)'); ground.addColorStop(.65, 'rgba(101,153,92,.09)'); ground.addColorStop(1, 'rgba(77,126,77,.16)');
  ctx.fillStyle = ground; ctx.beginPath(); ctx.moveTo(0, 930); ctx.bezierCurveTo(490, 850, 1000, 950, 1390, 893); ctx.bezierCurveTo(1600, 860, 1790, 875, 1920, 915); ctx.lineTo(1920, 1080); ctx.lineTo(0, 1080); ctx.fill();
  fireflies.forEach(s => { ctx.fillStyle = withAlpha(s.color, .14 + (Math.sin(now / 850 + s.phase) + 1) * .16); ctx.shadowColor = s.color; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }); ctx.shadowBlur = 0;
  for (let i = 0; i < 11; i++) {
    const drift = (now * (.006 + (i % 3) * .002) + i * 241) % 1900, y = 280 + (i * 79) % 450 + Math.sin(now / 1200 + i) * 18;
    ctx.save(); ctx.translate(drift, y); ctx.rotate(now / 1700 + i); ctx.fillStyle = withAlpha(speciesColors[Object.keys(speciesColors)[i % 6]], .42);
    ctx.beginPath(); ctx.ellipse(0, 0, 4, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  drawButterflies(now); plants.forEach((p, i) => drawPlant(p, now, i, plants.length)); drawBrand(); drawStats(); drawGardeners(); drawActivity(now);
  if (now < sunshineUntil) { chip(870, 54, 180, 42, 'rgba(255,248,216,.94)', 21); ctx.fillStyle = '#80653a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 16px system-ui'; ctx.fillText('☀ SUNSHINE', 960, 75); }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = 'rgba(31,73,49,.72)'; ctx.font = '700 12px system-ui'; ctx.fillText(`${plants.length} FLOWERS  ·  ONE SHARED GARDEN`, 52, 1032);
  effects = effects.filter(e => now - e.time < 1500); requestAnimationFrame(draw);
}
const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
function connect() {
  const ws = new WebSocket(`${protocol}//${location.host}/ws`);
  ws.onopen = () => { status.style.display = 'none'; };
  ws.onmessage = event => { const data = JSON.parse(event.data);
    if (data.type === 'state') {
      plants = data.plants; gardeners = data.top; sunshineUntil = data.sunshineUntil || 0; channelName = data.channel || 'your channel';
      const total = plants.reduce((sum, p) => sum + p.waterings, 0);
      if (lastTotalWaterings !== null && total > lastTotalWaterings) {
        const milestones = [10, 25, 50, 100, 250, 500, 1000], crossed = milestones.find(m => lastTotalWaterings < m && total >= m);
        if (crossed) activity = { title: 'COMMUNITY MILESTONE', message: `${crossed} shared waterings — amazing!`, icon: '✦', time: performance.now() };
      }
      lastTotalWaterings = total;
    }
    if (data.type === 'sunshine') sunshineUntil = data.until;
    if (data.type === 'grew' || data.type === 'planted') {
      const time = performance.now(); effects.push({ username: data.username, time });
      activity = data.type === 'planted'
        ? { title: 'NEW SEED', message: `${data.username} joined the garden`, icon: '✿', time }
        : { title: data.stage === 'bloom' ? 'A NEW BLOOM' : `${data.stage.toUpperCase()} REACHED`, message: `${data.username}'s flower is growing`, icon: data.stage === 'bloom' ? '✿' : '✦', time };
    }
  };
  ws.onclose = () => { status.textContent = 'Reconnecting to ChatGarden…'; status.style.display = 'block'; setTimeout(connect, 2000); };
}
connect(); requestAnimationFrame(draw);
