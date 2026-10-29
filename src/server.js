import express from 'express';
import { WebSocketServer } from 'ws';
import tmi from 'tmi.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chooseSpecies, detectSpike, growthStage } from './garden.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'garden.json');
const args = process.argv.slice(2);
const valueAfter = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
const channel = (valueAfter('--channel') || 'your_channel').replace(/^#/, '').toLowerCase();
const simulate = args.includes('--simulate');
await mkdir(DATA_DIR, { recursive: true });
let plants = {};
try {
  const saved = JSON.parse(await readFile(DATA_FILE, 'utf8'));
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    plants = Object.fromEntries(Object.entries(saved).filter(([, p]) => p && typeof p.username === 'string').map(([key, p]) => [key, { username: p.username, waterings: Math.max(0, Number(p.waterings) || 0), species: String(p.species || 'daisy') }]));
  }
} catch (error) { if (error.code !== 'ENOENT') console.error('Could not read garden.json:', error.message); }

let saveQueue = Promise.resolve();
function persist() {
  const snapshot = JSON.stringify(plants, null, 2);
  saveQueue = saveQueue.then(() => writeFile(DATA_FILE, snapshot, 'utf8')).catch(error => console.error('Could not save garden:', error.message));
  return saveQueue;
}
const clients = new Set();
let sunshineUntil = 0;
function payload() {
  return { type: 'state', channel, plants: Object.values(plants).map(p => ({ ...p, stage: growthStage(p.waterings) })), sunshineUntil, top: Object.values(plants).sort((a, b) => b.waterings - a.waterings || a.username.localeCompare(b.username)).slice(0, 5).map(p => ({ username: p.username, waterings: p.waterings })) };
}
function broadcast(data = payload()) {
  const message = JSON.stringify(data);
  for (const ws of clients) if (ws.readyState === 1) ws.send(message);
}
const messageTimes = [];
const lastWatered = new Map();
const emoteCounts = new Map();
let lastSpikeAt = 0;
async function handleChat(username, message, emotes = {}) {
  const user = String(username || '').toLowerCase();
  if (!user) return;
  const counts = emoteCounts.get(user) || new Map();
  for (const [emote, positions] of Object.entries(emotes ?? {})) {
    const count = Array.isArray(positions) ? positions.reduce((sum, group) => sum + String(group).split(',').length, 0) : 0;
    if (count) counts.set(emote, (counts.get(emote) || 0) + count);
  }
  emoteCounts.set(user, counts);
  const userEmotes = Object.fromEntries([...counts].map(([emote, count]) => [emote, Array(count).fill('0-0')]));
  const command = String(message || '').trim().toLowerCase();
  if (command === '!forget') { delete plants[user]; lastWatered.delete(user); emoteCounts.delete(user); await persist(); broadcast(); return; }
  if (command === '!plant') {
    plants[user] = { username: user, waterings: 0, species: chooseSpecies(user, userEmotes) };
    lastWatered.set(user, Date.now()); await persist(); broadcast({ type: 'planted', username: user, stage: 'seed', ...plants[user] }); broadcast(); return;
  }
  const now = Date.now();
  messageTimes.push(now);
  while (messageTimes.length && messageTimes[0] < now - 10 * 60_000) messageTimes.shift();
  const spike = detectSpike(messageTimes, now);
  if (spike.spike && now - lastSpikeAt > 30_000) {
    sunshineUntil = now + 30_000; lastSpikeAt = now;
    broadcast({ type: 'sunshine', until: sunshineUntil });
  }
  if (!plants[user]) {
    plants[user] = { username: user, waterings: 0, species: chooseSpecies(user, userEmotes) };
    lastWatered.set(user, now); await persist();
    broadcast({ type: 'planted', username: user, stage: 'seed', ...plants[user] });
  } else if (now - (lastWatered.get(user) || 0) >= 10_000) {
    const plant = plants[user]; const before = growthStage(plant.waterings);
    plant.waterings += now < sunshineUntil ? 2 : 1;
    lastWatered.set(user, now); await persist();
    const after = growthStage(plant.waterings);
    if (after !== before) broadcast({ type: 'grew', username: user, from: before, stage: after });
  }
  broadcast();
}

const app = express();
app.get('/overlay', (_req, res) => res.sendFile(path.join(ROOT, 'public', 'overlay.html')));
app.use('/assets', express.static(path.join(ROOT, 'public')));
const server = app.listen(Number(valueAfter('--port') || process.env.PORT || 30001), () => console.log(`ChatGarden overlay: http://localhost:${server.address().port}/overlay`));
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', ws => { clients.add(ws); ws.send(JSON.stringify(payload())); ws.on('close', () => clients.delete(ws)); });

if (simulate) {
  console.log('Simulation mode: generating anonymous sample chat.');
  const names = ['mossy', 'fernfriend', 'petalpal', 'sunnybee', 'clover'];
  setInterval(() => {
    const user = names[Math.floor(Math.random() * names.length)];
    void handleChat(user, 'hello garden', Math.random() > .5 ? { '25': ['0-3'] } : {});
  }, 1800);
} else {
  const client = new tmi.Client({ options: { skipMembership: true, skipUpdatingEmotesets: true }, connection: { reconnect: true, secure: true }, identity: { username: `justinfan${Math.floor(Math.random() * 900000) + 100000}`, password: 'SCHMOOPII' }, channels: [channel] });
  client.on('message', (_channel, tags, message, self) => { if (!self) void handleChat(tags.username, message, tags.emotes || {}); });
  client.connect().then(() => console.log(`Listening anonymously in #${channel}`)).catch(error => console.error('Twitch connection failed:', error.message));
}
