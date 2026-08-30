'use strict';
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'journeyos-dev-secret-change-in-production';
const JWT_EXPIRES = '7d';

app.use(cors());
app.use(express.json());

// Redirect .html → clean URL (must be before static middleware)
['admin', 'admin-login', 'privacy', 'terms', 'demo'].forEach(page => {
  app.get(`/${page}.html`, (_req, res) => res.redirect(301, `/${page}`));
});

app.use(express.static(path.join(__dirname, 'public')));

// ── helpers ────────────────────────────────────────────────────────────────────
function ok(res, data)        { res.json({ success: true, data }); }
function fail(res, msg, code) { res.status(code || 400).json({ success: false, error: msg }); }

// ── auth middleware ────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return fail(res, 'Authentication required', 401);
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    fail(res, 'Invalid or expired token', 401);
  }
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return fail(res, 'Admin access required', 403);
    next();
  });
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return fail(res, 'name, email and password are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 'Invalid email address');
  if (password.length < 6) return fail(res, 'Password must be at least 6 characters');
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) return fail(res, 'Email already registered');
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)').run(name, email, hash, 'user');
  const user = db.prepare('SELECT id,name,email,role,created_at FROM users WHERE email=?').get(email);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  ok(res, { token, user });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'email and password are required');
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) return fail(res, 'Invalid email or password');
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  ok(res, { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,created_at FROM users WHERE id=?').get(req.user.id);
  if (!user) return fail(res, 'User not found', 404);
  ok(res, user);
});

// ── GET /api/admin/users (admin only) ────────────────────────────────────────
app.get('/api/admin/users', requireAdmin, (req, res) => {
  ok(res, db.prepare('SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC').all());
});

// ── GET /api/destinations ────────────────────────────────────────────────────
app.get('/api/destinations', (req, res) => {
  const { q, region } = req.query;
  let sql = 'SELECT * FROM destinations';
  const params = [];
  const where = [];
  if (q)      { where.push("(name LIKE ? OR country LIKE ? OR region LIKE ?)"); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (region) { where.push("region = ?"); params.push(region); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY rating DESC';
  ok(res, db.prepare(sql).all(...params));
});

app.get('/api/destinations/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM destinations WHERE id = ?').get(req.params.id);
  if (!row) return fail(res, 'Destination not found', 404);
  ok(res, row);
});

// ── GET /api/trips ───────────────────────────────────────────────────────────
app.get('/api/trips', (req, res) => {
  const { type, q } = req.query;
  let sql = 'SELECT * FROM trips';
  const params = [];
  const where = [];
  if (type && type !== 'All') { where.push("type = ?"); params.push(type); }
  if (q)                      { where.push("(title LIKE ? OR route LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY spots_left ASC';
  const rows = db.prepare(sql).all(...params);
  ok(res, rows.map(r => ({ ...r, highlights: r.highlights.split('|') })));
});

app.get('/api/trips/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!row) return fail(res, 'Trip not found', 404);
  ok(res, { ...row, highlights: row.highlights.split('|') });
});

// ── POST /api/bookings (auth required) ───────────────────────────────────────
app.post('/api/bookings', requireAuth, (req, res) => {
  const { trip_id, first_name, last_name, email, phone, travelers, travel_date, special_req } = req.body;

  if (!trip_id || !first_name || !last_name || !email || !travel_date)
    return fail(res, 'Missing required fields: trip_id, first_name, last_name, email, travel_date');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return fail(res, 'Invalid email address');

  const numTravelers = parseInt(travelers, 10) || 1;
  if (numTravelers < 1 || numTravelers > 20)
    return fail(res, 'Travelers must be between 1 and 20');

  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(trip_id);
  if (!trip) return fail(res, 'Trip not found', 404);
  if (trip.spots_left < numTravelers) return fail(res, `Only ${trip.spots_left} spot(s) remaining`);

  const total_price = trip.price * numTravelers;

  db.prepare(`
    INSERT INTO bookings (trip_id,first_name,last_name,email,phone,travelers,travel_date,special_req,total_price)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(trip_id, first_name, last_name, email, phone || null, numTravelers, travel_date, special_req || null, total_price);

  const bookingId = db.prepare('SELECT last_insert_rowid() as id').get().id;
  db.prepare('UPDATE trips SET spots_left = spots_left - ? WHERE id = ?').run(numTravelers, trip_id);

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  ok(res, { ...booking, trip_title: trip.title, trip_price: trip.price });
});

// ── GET /api/bookings (auth: user sees own, admin sees all) ──────────────────
app.get('/api/bookings', requireAuth, (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    rows = db.prepare(`
      SELECT b.*, t.title as trip_title, t.type as trip_type, t.price as trip_price
      FROM bookings b JOIN trips t ON b.trip_id = t.id
      ORDER BY b.created_at DESC
    `).all();
  } else {
    rows = db.prepare(`
      SELECT b.*, t.title as trip_title, t.type as trip_type, t.price as trip_price
      FROM bookings b JOIN trips t ON b.trip_id = t.id
      WHERE b.email = ?
      ORDER BY b.created_at DESC
    `).all(req.user.email);
  }
  ok(res, rows);
});

app.get('/api/bookings/:id', requireAuth, (req, res) => {
  const row = db.prepare(`
    SELECT b.*, t.title as trip_title, t.type as trip_type, t.price as trip_price, t.route
    FROM bookings b JOIN trips t ON b.trip_id = t.id WHERE b.id = ?
  `).get(req.params.id);
  if (!row) return fail(res, 'Booking not found', 404);
  if (req.user.role !== 'admin' && row.email !== req.user.email) return fail(res, 'Access denied', 403);
  ok(res, row);
});

// ── PATCH /api/bookings/:id/cancel (auth required) ───────────────────────────
app.patch('/api/bookings/:id/cancel', requireAuth, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return fail(res, 'Booking not found', 404);
  if (req.user.role !== 'admin' && booking.email !== req.user.email) return fail(res, 'Access denied', 403);
  if (booking.status === 'cancelled') return fail(res, 'Booking already cancelled');
  db.prepare("UPDATE bookings SET status='cancelled' WHERE id=?").run(req.params.id);
  db.prepare('UPDATE trips SET spots_left = spots_left + ? WHERE id = ?').run(booking.travelers, booking.trip_id);
  ok(res, { id: booking.id, status: 'cancelled' });
});

// ── POST /api/newsletter ─────────────────────────────────────────────────────
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return fail(res, 'Invalid email address');
  try {
    db.prepare('INSERT INTO newsletter (email) VALUES (?)').run(email);
    ok(res, { message: 'Subscribed successfully!' });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) return fail(res, 'This email is already subscribed');
    throw e;
  }
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  ok(res, {
    destinations: db.prepare('SELECT COUNT(*) as c FROM destinations').get().c,
    trips:        db.prepare('SELECT COUNT(*) as c FROM trips').get().c,
    bookings:     db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status!='cancelled'").get().c,
    subscribers:  db.prepare('SELECT COUNT(*) as c FROM newsletter').get().c,
  });
});

// ── ADMIN: dashboard analytics (admin only) ──────────────────────────────────
app.get('/api/admin/analytics', requireAdmin, (req, res) => {
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_price),0) as r FROM bookings WHERE status!='cancelled'").get().r;
  const pendingRevenue = db.prepare("SELECT COALESCE(SUM(total_price),0) as r FROM bookings WHERE status='pending'").get().r;
  const statusBreakdown = db.prepare("SELECT status, COUNT(*) as count FROM bookings GROUP BY status").all();
  const revenueByTrip = db.prepare(`
    SELECT t.title, t.type, COUNT(b.id) as bookings, COALESCE(SUM(b.total_price),0) as revenue
    FROM trips t LEFT JOIN bookings b ON b.trip_id=t.id AND b.status!='cancelled'
    GROUP BY t.id ORDER BY revenue DESC
  `).all();
  const bookingsByDay = db.prepare(`
    SELECT DATE(created_at) as day, COUNT(*) as bookings, COALESCE(SUM(total_price),0) as revenue
    FROM bookings WHERE status!='cancelled'
    GROUP BY DATE(created_at) ORDER BY day ASC LIMIT 30
  `).all();
  const topDestinations = db.prepare("SELECT name, country, region, rating, badge FROM destinations ORDER BY rating DESC LIMIT 5").all();
  const recentBookings = db.prepare(`
    SELECT b.id, b.first_name||' '||b.last_name as name, b.email, b.travelers,
           b.travel_date, b.total_price, b.status, b.created_at, t.title as trip
    FROM bookings b JOIN trips t ON b.trip_id=t.id
    ORDER BY b.created_at DESC LIMIT 10
  `).all();
  ok(res, { totalRevenue, pendingRevenue, statusBreakdown, revenueByTrip, bookingsByDay, topDestinations, recentBookings });
});

// ── ADMIN: newsletter subscribers (admin only) ───────────────────────────────
app.get('/api/admin/subscribers', requireAdmin, (req, res) => {
  ok(res, db.prepare('SELECT * FROM newsletter ORDER BY created_at DESC').all());
});
app.delete('/api/admin/subscribers/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM newsletter WHERE id=?').get(req.params.id);
  if (!row) return fail(res, 'Subscriber not found', 404);
  db.prepare('DELETE FROM newsletter WHERE id=?').run(req.params.id);
  ok(res, { deleted: true });
});

// ── ADMIN: trips CRUD (admin only) ───────────────────────────────────────────
app.post('/api/admin/trips', requireAdmin, (req, res) => {
  const { title, type, price, duration, best_season, route, max_group, spots_left, highlights } = req.body;
  if (!title || !type || !price) return fail(res, 'title, type, price are required');
  const hi = Array.isArray(highlights) ? highlights.join('|') : (highlights || '');
  db.prepare(`INSERT INTO trips (title,type,price,duration,best_season,route,max_group,spots_left,highlights)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(title, type, parseInt(price), duration||'', best_season||'', route||'', parseInt(max_group)||10, parseInt(spots_left)||0, hi);
  const id = db.prepare('SELECT last_insert_rowid() as id').get().id;
  ok(res, db.prepare('SELECT * FROM trips WHERE id=?').get(id));
});
app.put('/api/admin/trips/:id', requireAdmin, (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id=?').get(req.params.id);
  if (!trip) return fail(res, 'Trip not found', 404);
  const { title, type, price, duration, best_season, route, max_group, spots_left, highlights } = req.body;
  const hi = Array.isArray(highlights) ? highlights.join('|') : (highlights !== undefined ? highlights : trip.highlights);
  db.prepare(`UPDATE trips SET title=?,type=?,price=?,duration=?,best_season=?,route=?,max_group=?,spots_left=?,highlights=? WHERE id=?`)
    .run(title||trip.title, type||trip.type, price!=null?parseInt(price):trip.price,
         duration||trip.duration, best_season||trip.best_season, route||trip.route,
         max_group!=null?parseInt(max_group):trip.max_group, spots_left!=null?parseInt(spots_left):trip.spots_left,
         hi, req.params.id);
  ok(res, db.prepare('SELECT * FROM trips WHERE id=?').get(req.params.id));
});
app.delete('/api/admin/trips/:id', requireAdmin, (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id=?').get(req.params.id);
  if (!trip) return fail(res, 'Trip not found', 404);
  db.prepare('DELETE FROM trips WHERE id=?').run(req.params.id);
  ok(res, { deleted: true });
});

// ── ADMIN: bookings management (admin only) ──────────────────────────────────
app.put('/api/admin/bookings/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const allowed = ['pending','confirmed','cancelled'];
  if (!allowed.includes(status)) return fail(res, 'status must be: pending | confirmed | cancelled');
  const booking = db.prepare('SELECT * FROM bookings WHERE id=?').get(req.params.id);
  if (!booking) return fail(res, 'Booking not found', 404);
  if (booking.status === 'cancelled' && status !== 'cancelled') return fail(res, 'Cannot reactivate a cancelled booking');
  if (status === 'cancelled' && booking.status !== 'cancelled') {
    db.prepare('UPDATE trips SET spots_left = spots_left + ? WHERE id = ?').run(booking.travelers, booking.trip_id);
  }
  db.prepare('UPDATE bookings SET status=? WHERE id=?').run(status, req.params.id);
  ok(res, db.prepare('SELECT * FROM bookings WHERE id=?').get(req.params.id));
});

// ── GET /api/search ───────────────────────────────────────────────────────────
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) return ok(res, { destinations: [], trips: [] });

  const dests = db.prepare(
    "SELECT * FROM destinations WHERE name LIKE ? OR country LIKE ? OR region LIKE ? ORDER BY rating DESC LIMIT 6"
  ).all(`%${q}%`, `%${q}%`, `%${q}%`);

  const trips = db.prepare(
    "SELECT * FROM trips WHERE title LIKE ? OR route LIKE ? LIMIT 6"
  ).all(`%${q}%`, `%${q}%`).map(r => ({ ...r, highlights: r.highlights.split('|') }));

  ok(res, { destinations: dests, trips });
});

// ── DELETE /api/auth/me (right to erasure — GDPR Art. 17) ────────────────────
app.delete('/api/auth/me', requireAuth, (req, res) => {
  const userId = req.user.id;
  // Anonymise bookings rather than hard-delete (7-yr financial retention)
  db.prepare("UPDATE bookings SET first_name='Deleted', last_name='User', email='deleted@deleted.invalid', phone=NULL, special_req=NULL WHERE email=?")
    .run(req.user.email);
  db.prepare('DELETE FROM newsletter WHERE email=?').run(req.user.email);
  db.prepare('DELETE FROM users WHERE id=?').run(userId);
  ok(res, { deleted: true, message: 'Your account and personal data have been removed.' });
});

// ── AI: get public chat config (enabled flag only) ───────────────────────────
app.get('/api/ai/config', (req, res) => {
  const s = db.prepare('SELECT enabled, provider FROM ai_settings WHERE id=1').get();
  ok(res, { enabled: s ? !!s.enabled : false, provider: s ? s.provider : 'openai' });
});

// ── AI: chat endpoint ─────────────────────────────────────────────────────────
app.post('/api/ai/chat', (req, res) => {
  chatHandler(req, res).catch(err => {
    console.error('AI chat error:', err);
    if (!res.headersSent) fail(res, 'An error occurred. Please try again.', 500);
  });
});

async function chatHandler(req, res) {
  const { messages, session_id } = req.body;
  if (!messages || !Array.isArray(messages)) return fail(res, 'messages array required');

  const settings = db.prepare('SELECT * FROM ai_settings WHERE id=1').get();
  if (!settings || !settings.enabled) return fail(res, 'AI chatbot is currently disabled', 503);

  // Build knowledge context
  const knowledge = db.prepare('SELECT category, content FROM ai_knowledge').all();
  const destinations = db.prepare('SELECT name, country, region, rating, description, tags FROM destinations ORDER BY rating DESC').all();
  const trips = db.prepare('SELECT title, type, price, duration, best_season, route, highlights FROM trips ORDER BY price ASC').all();

  const knowledgeText = knowledge.map(k => `[${k.category.toUpperCase()}]: ${k.content}`).join('\n');
  const destinationsText = destinations.map(d =>
    `${d.name}, ${d.country} (${d.region}) - Rating: ${d.rating}★ - ${d.description} - Tags: ${d.tags}`
  ).join('\n');
  const tripsText = trips.map(t =>
    `"${t.title}" | Type: ${t.type} | Price: $${t.price}/person | Duration: ${t.duration} | Season: ${t.best_season} | Route: ${t.route}`
  ).join('\n');

  const systemPrompt = (settings.system_prompt || '') + `

--- JOURNEYOS KNOWLEDGE BASE ---
${knowledgeText}

--- AVAILABLE DESTINATIONS ---
${destinationsText}

--- AVAILABLE TRIPS ---
${tripsText}

--- TRAVEL PLAN FORMAT ---
When the user is ready to see a plan, respond with a JSON block in this exact format wrapped in triple backticks:
\`\`\`travel-plan
{
  "title": "Trip title",
  "destination": "City, Country",
  "duration": "X Days",
  "travel_style": "Adventure|Luxury|Wellness|Cultural|Group Tour",
  "travelers": 2,
  "travel_date": "YYYY-MM-DD",
  "route": "Start to End",
  "highlights": ["highlight1", "highlight2", "highlight3", "highlight4"],
  "best_season": "Month range",
  "price_per_person": 2500,
  "price_breakdown": {
    "accommodation": 800,
    "transport": 600,
    "activities": 700,
    "meals": 250,
    "guide": 150
  },
  "description": "Brief description of the plan"
}
\`\`\`
After the JSON, continue with a friendly message inviting them to purchase/book.
`;

  let aiReply = null;
  let usedProvider = 'bob'; // will be updated to actual provider if API call succeeds
  const provider = settings.provider || 'bob';

  // Resolve credentials: DB value takes precedence; env var is the fallback.
  // This makes watsonx work on Render free tier where /tmp DB is wiped on restart.
  const wxKey     = settings.watsonx_key     || process.env.WATSONX_API_KEY    || '';
  const wxProject = settings.watsonx_project_id || process.env.WATSONX_PROJECT_ID || '';
  const wxRegion  = settings.watsonx_region  || process.env.WATSONX_REGION     || 'us-south';

  try {
    // ── Provider routing ─────────────────────────────────────────────────────
    if (provider === 'watsonx' && wxKey && wxProject) {
      // ── watsonx.ai (IBM Granite via IAM token exchange) ───────────────────
      const https = require('https');
      const region = wxRegion;

      // Step 1: Exchange IAM API key for a Bearer token
      const iamToken = await new Promise((resolve, reject) => {
        const body = `grant_type=urn%3Aibm%3Aparams%3Aoauth%3Agrant-type%3Aapikey&apikey=${encodeURIComponent(wxKey)}`;
        const opts = {
          hostname: 'iam.cloud.ibm.com', path: '/identity/token', method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
        };
        const hreq = https.request(opts, hres => {
          let data = '';
          hres.on('data', c => { data += c; });
          hres.on('end', () => {
            try {
              const j = JSON.parse(data);
              if (!j.access_token) return reject(new Error('IAM token exchange failed: ' + (j.errorMessage || JSON.stringify(j))));
              resolve(j.access_token);
            } catch(e) { reject(e); }
          });
        });
        hreq.on('error', reject);
        hreq.write(body);
        hreq.end();
      });

      // Step 2: Call watsonx.ai text generation endpoint
      const wxModel = 'meta-llama/llama-3-3-70b-instruct';
      // Build a single prompt string from system + conversation history
      const historyText = messages.slice(-10).map(m =>
        m.role === 'user' ? `Human: ${m.content}` : `Assistant: ${m.content}`
      ).join('\n');
      const wxPrompt = `${systemPrompt}\n\n${historyText}\nAssistant:`;
      const payload = JSON.stringify({
        model_id: wxModel,
        input: wxPrompt,
        parameters: { decoding_method: 'greedy', max_new_tokens: 800, min_new_tokens: 10, stop_sequences: ['Human:'] },
        project_id: wxProject,
      });
      aiReply = await new Promise((resolve, reject) => {
        const opts = {
          hostname: `${region}.ml.cloud.ibm.com`,
          path: '/ml/v1/text/generation?version=2023-05-29',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${iamToken}`, 'Content-Length': Buffer.byteLength(payload) }
        };
        const hreq = https.request(opts, hres => {
          let data = '';
          hres.on('data', c => { data += c; });
          hres.on('end', () => {
            try {
              const j = JSON.parse(data);
              if (j.errors || j.error) return reject(new Error((j.errors?.[0]?.message) || j.error || 'watsonx error'));
              resolve(j.results?.[0]?.generated_text?.trim() || '');
            } catch(e) { reject(e); }
          });
        });
        hreq.on('error', reject);
        hreq.write(payload);
        hreq.end();
      });
      usedProvider = 'watsonx';
    } else if (provider === 'openai' && settings.openai_key) {
      const https = require('https');
      const payload = JSON.stringify({
        model: settings.model || 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-20)],
        max_tokens: 1200,
        temperature: 0.7,
      });
      aiReply = await new Promise((resolve, reject) => {
        const opts = {
          hostname: 'api.openai.com', path: '/v1/chat/completions', method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.openai_key}`, 'Content-Length': Buffer.byteLength(payload) }
        };
        const hreq = https.request(opts, hres => {
          let data = '';
          hres.on('data', c => { data += c; });
          hres.on('end', () => {
            try {
              const j = JSON.parse(data);
              if (j.error) return reject(new Error(j.error.message));
              const text = j.choices?.[0]?.message?.content || '';
              resolve(text);
            } catch(e) { reject(e); }
          });
        });
        hreq.on('error', reject);
        hreq.write(payload);
        hreq.end();
      });
      usedProvider = 'openai';
    } else if (provider === 'claude' && settings.claude_key) {
      const https = require('https');
      const claudeMsgs = messages.slice(-20).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
      const payload = JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1200,
        system: systemPrompt,
        messages: claudeMsgs,
      });
      aiReply = await new Promise((resolve, reject) => {
        const opts = {
          hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': settings.claude_key, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(payload) }
        };
        const hreq = https.request(opts, hres => {
          let data = '';
          hres.on('data', c => { data += c; });
          hres.on('end', () => {
            try {
              const j = JSON.parse(data);
              if (j.error) return reject(new Error(j.error.message));
              resolve(j.content?.[0]?.text || '');
            } catch(e) { reject(e); }
          });
        });
        hreq.on('error', reject);
        hreq.write(payload);
        hreq.end();
      });
      usedProvider = 'claude';
    } else {
      // ── Built-in BOB fallback (no API key needed) ─────────────────────────
      aiReply = generateFallbackReply(messages, systemPrompt, destinations, trips);
      usedProvider = 'bob';
    }
  } catch (err) {
    console.error('AI provider error:', err.message);
    aiReply = generateFallbackReply(messages, systemPrompt, destinations, trips);
    usedProvider = 'bob';
  }

  // ── Token estimation (1 token ≈ 4 chars — standard approximation) ───────────
  const promptText  = systemPrompt + messages.map(m => m.content).join(' ');
  const promptTok   = Math.ceil(promptText.length / 4);
  const responseTok = Math.ceil((aiReply || '').length / 4);
  const totalTok    = promptTok + responseTok;

  // Save session + log tokens
  if (session_id) {
    const existing = db.prepare('SELECT id, tokens_total FROM ai_chat_sessions WHERE session_id=?').get(session_id);
    const allMsgs  = JSON.stringify([...messages, { role: 'assistant', content: aiReply }]);
    if (existing) {
      db.prepare("UPDATE ai_chat_sessions SET messages=?, tokens_total=tokens_total+?, updated_at=datetime('now') WHERE session_id=?")
        .run(allMsgs, totalTok, session_id);
    } else {
      db.prepare('INSERT INTO ai_chat_sessions (session_id, messages, tokens_total) VALUES (?,?,?)').run(session_id, allMsgs, totalTok);
    }
    db.prepare('INSERT INTO ai_token_log (session_id, provider, prompt_tokens, response_tokens, total_tokens) VALUES (?,?,?,?,?)')
      .run(session_id, provider, promptTok, responseTok, totalTok);
  }

  ok(res, { reply: aiReply, provider: usedProvider, tokens: { prompt: promptTok, response: responseTok, total: totalTok } });
}

// ── Built-in AI fallback (rule-based travel planner) ─────────────────────────
function generateFallbackReply(messages, _systemPrompt, destinations, trips) {
  const last = (messages[messages.length - 1]?.content || '').toLowerCase();
  // IMPORTANT: allMsgs must only be USER messages — bot replies contain duration/destination
  // suggestions (e.g. "3–5 days", "7 days") that corrupt detection if included.
  const userMsgs = messages.filter(m => m.role === 'user');
  const allMsgs  = userMsgs.map(m => m.content.toLowerCase()).join(' ');

  // ── Destination detection ─────────────────────────────────────────────────
  // Priority: most-recent user message first, then full user history.
  const recentUserTexts = userMsgs.slice(-2).map(m => m.content.toLowerCase());
  const recentText = recentUserTexts.join(' ');

  function findSeeded(text) {
    return destinations.find(d =>
      text.includes(d.name.toLowerCase()) || text.includes(d.country.toLowerCase())
    );
  }
  function findPhrase(text) {
    // "want to go to X", "go to X", "visit X", "trip to X", "travel to X", "holiday in X"
    const m = text.match(
      /(?:want(?:ed)?\s+to\s+(?:go\s+to|visit|travel\s+to)|go\s+to|headed\s+to|trip\s+to|travel(?:ling)?\s+to|fly(?:ing)?\s+to|visit(?:ing)?|explore|plan(?:ning)?\s+a?\s*trip\s+to|holiday\s+in|vacation\s+in|escape\s+to|getaway\s+to|tour\s+(?:of|in|to)|road\s+trip\s+(?:to|in|through))\s+([a-z][a-z\s,]{1,35}?)(?:\s+for\s|\s+\d|\s*,|\s*\.|$)/i
    );
    return m;
  }
  // Non-place words that should never be matched as a city/country origin in "X to Y"
  const NOT_PLACE = /^(trip|travel|plan|go|i|we|a|the|my|our|fly|from|how|want|need|looking|thinking|considering|doing|having|taking|make|get|just|also|please|can|could|would|help|book|find|show|tell|give|what|where|when|why|which|this|that|these|those|your|their|his|her|its|solo|family|couple|group|weekend|vacation|holiday|getaway|tour|escape|adventure|luxury|budget|cultural|wellness|romantic|hiking|beach|safari|cruise|business|corporate|road)$/i;
  function findRoute(text) {
    const m = text.match(/\b([a-z][a-z]{2,20}(?:\s[a-z][a-z]{2,15})?)\s+to\s+([a-z][a-z]{2,20}(?:\s[a-z][a-z]{2,15})?)\b/i);
    if (!m) return null;
    if (NOT_PLACE.test(m[1].trim())) return null;
    return m;
  }
  // Bare-noun fallback: extract first proper-noun-like word(s) from the message
  // Used when no verb prefix or route pattern is present — e.g. "Paris 5 days", "Maldives luxury 6 days"
  const STOP_WORDS = new Set([
    'trip','travel','plan','a','an','the','i','we','my','our','for','and','or','but',
    'in','on','at','by','to','of','with','from','go','fly','want','need','help','book',
    'find','show','tell','solo','family','couple','group','romantic','adventure','luxury',
    'budget','cultural','wellness','hiking','beach','safari','cruise','weekend','vacation',
    'holiday','getaway','tour','escape','days','day','nights','night','weeks','week',
    'people','person','travelers','adults','pax','cheap','affordable','premium','high',
    'end','explore','discover','business','corporate','quick','short','long','extended',
    'upcoming','next','this','some','great','beautiful','amazing','wonderful','exciting',
  ]);
  function findBareNoun(text) {
    // Try to find first capitalised word or sequence of 1-3 words that look like a place name
    // Strategy: split on spaces, skip stop-words and numbers, take up to 2 consecutive non-stop words
    const words = text.replace(/[^a-z\s]/gi, ' ').trim().split(/\s+/);
    const placeWords = [];
    for (const w of words) {
      if (!w || /^\d+$/.test(w)) { if (placeWords.length) break; continue; }
      if (STOP_WORDS.has(w.toLowerCase())) { if (placeWords.length) break; continue; }
      placeWords.push(w);
      if (placeWords.length === 2) break;
    }
    return placeWords.length ? placeWords.join(' ') : null;
  }

  // Check recent messages first, fall back to full history only if nothing found recently
  const seededMatch     = findSeeded(recentText)   || findSeeded(allMsgs);
  const destPhraseMatch = findPhrase(recentText)   || findPhrase(allMsgs);
  const routeMatch      = findRoute(recentText)    || findRoute(allMsgs);

  // If recent text overrides old — re-check: did latest message mention a DIFFERENT destination?
  const latestSeeded = findSeeded(last);
  const effectiveSeeded = latestSeeded || seededMatch;

  const hasDestination = !!effectiveSeeded || !!destPhraseMatch || !!routeMatch;

  // Build destination name — latest mention wins
  let detectedDestName, detectedDestCountry = '';
  if (effectiveSeeded) {
    detectedDestName = effectiveSeeded.name;
    detectedDestCountry = effectiveSeeded.country;
  } else if (routeMatch) {
    const from = routeMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase());
    const to   = routeMatch[2].trim().replace(/\b\w/g, c => c.toUpperCase());
    detectedDestName = `${from} to ${to}`;
  } else if (destPhraseMatch) {
    detectedDestName = destPhraseMatch[1].trim()
      .replace(/^(trip\s+to\s+|travel\s+to\s+|a\s+trip\s+to\s+)/i, '')
      .replace(/\b\w/g, c => c.toUpperCase());
  } else {
    detectedDestName = 'Your Destination';
  }

  // Duration — check full history
  const hasDuration = /(\d+)\s*(day|week|night)/i.test(allMsgs);
  // Budget: explicit amount OR travel style keyword (luxury/adventure/wellness/cultural implies a tier)
  const hasStyleKeyword = /luxury|premium|high.end|adventure|hike|trek|wellness|yoga|spa|cultural|history|budget.friendly|cheap|affordable/i.test(allMsgs);
  const hasBudget = hasStyleKeyword || /budget|\$\d+|\d+\s*usd|\d+\s*dollar|afford/i.test(allMsgs);

  // If we have duration but no destination yet, try bare-noun extraction from the message with duration
  let bareNounDest = null;
  if (!hasDestination && hasDuration) {
    // Search all user messages for a bare noun
    for (const um of userMsgs.slice().reverse()) {
      const bn = findBareNoun(um.content);
      if (bn && bn.length >= 3) { bareNounDest = bn; break; }
    }
  }
  const effectiveHasDestination = hasDestination || !!bareNounDest;
  if (!hasDestination && bareNounDest) {
    detectedDestName = bareNounDest.replace(/\b\w/g, c => c.toUpperCase());
  }

  const readyToPlan = effectiveHasDestination && hasDuration;

  // Greeting: only fire when first message is ONLY a greeting (no destination/duration in it)
  const isFirstMessage = messages.length <= 1;
  const isGreeting = /^(hi|hey|hello|hiya|good\s*(morning|afternoon|evening)|greetings|howdy)/i.test(last.trim());
  if (isFirstMessage && isGreeting && !hasDestination && !hasDuration) {
    return `Hello! I'm your JourneyOS AI Travel Assistant 🌍✈️

I can help you design a **personalised travel plan** with real-time pricing — tailored just for you!

To get started, tell me:
- **Where** would you like to go? (or I can suggest destinations!)
- **How long** are you planning to travel?
- **What's your travel style?** (Adventure, Luxury, Wellness, Cultural, Group Tour)
- **How many travelers?**
- **What's your budget?** (approximate per person)

I know all our destinations and trips, so let's create your perfect adventure! 🗺️`;
  }

  if (!effectiveHasDestination && !hasDuration && messages.length < 3) {
    return `Great question! Let me help you find the perfect trip. 🌟

Here are some of our **most popular destinations**:
${destinations.slice(0,4).map(d => `• **${d.name}**, ${d.country} ⭐ ${d.rating} — ${d.tags}`).join('\n')}

Or just tell me where you want to go (any city or country works!) and how long you're planning to travel.`;
  }

  if (!effectiveHasDestination && messages.length >= 2) {
    return `I can plan a trip to **any destination in the world**! Just tell me:
- Where would you like to go? (e.g. "Delhi to London", "Paris", "Tokyo")
- How many days?

Here are some popular picks for inspiration:
${destinations.slice(0,3).map(d => `• **${d.name}** — ${d.description.slice(0,80)}...`).join('\n')}`;
  }

  if (effectiveHasDestination && !hasDuration) {
    return `Great choice — **${detectedDestName || 'that destination'}** sounds amazing! 🎉 How many days are you planning to travel?

Popular durations:
• **3–5 days** — Weekend escape
• **7 days** — Classic week-long trip
• **10–14 days** — Deep exploration
• **3 weeks** — Full immersion

What works best for you?`;
  }

  if (!hasDuration && effectiveHasDestination) {
    return `Excellent choice! 🎉 Now, how many days are you planning to travel? A longer trip lets us include more highlights and experiences.

Popular durations:
• **7 days** — Great for a focused destination
• **10–14 days** — Perfect for exploring a region
• **3 weeks** — Deep immersion with multiple stops

What works best for you?`;
  }

  if (readyToPlan) {
    // Duration extraction — use LAST match across user messages so the most recent answer wins.
    // e.g. bot suggested "3-5 days / 7 days / 3 weeks" — we want the user's reply "3 weeks", not
    // the first "3" from the bot's suggestion list (which is now excluded from allMsgs anyway).
    const durMatches = [...allMsgs.matchAll(/(\d+)\s*(day|week|night)/gi)];
    let durDays = 7;
    if (durMatches.length) {
      const last_dur = durMatches[durMatches.length - 1]; // most recent mention wins
      const n = parseInt(last_dur[1]);
      if (last_dur[2].toLowerCase().startsWith('week'))  durDays = n * 7;
      else if (last_dur[2].toLowerCase().startsWith('night')) durDays = n;
      else durDays = n;
    }
    durDays = Math.max(1, durDays);

    // Style — infer from keywords
    let style = 'Group Tour';
    if (/luxury|premium|high.end|5.star|five.star/i.test(allMsgs)) style = 'Luxury';
    else if (/adventure|hike|trek|outdoor|backpack|camping/i.test(allMsgs)) style = 'Adventure';
    else if (/wellness|yoga|spa|relax|retreat/i.test(allMsgs)) style = 'Wellness';
    else if (/cultural|history|art|museum|heritage/i.test(allMsgs)) style = 'Cultural';
    else if (/solo|alone|myself/i.test(allMsgs)) style = 'Adventure';

    // Travelers
    const travelMatch = allMsgs.match(/(\d+)\s*(person|people|travell?er|adult|pax)/i);
    const travelers = travelMatch ? parseInt(travelMatch[1])
      : /couple|two of us|2 of us/i.test(allMsgs) ? 2
      : /solo|alone|myself|just me/i.test(allMsgs) ? 1
      : /family/i.test(allMsgs) ? 4
      : 2;

    // Resolve destination object
    const cleanDestName = detectedDestName && detectedDestName !== 'Your Destination' ? detectedDestName : 'Your Destination';
    // For route matches like "Berlin to Prague", use destination as the arrival city for the title
    const titleDest = routeMatch ? routeMatch[2].trim().replace(/\b\w/g, c => c.toUpperCase()) : cleanDestName;
    const dest = seededMatch || {
      name: titleDest,
      country: detectedDestCountry || '',
      region: '',
      tags: style === 'Adventure' ? 'Hiking,Nature,Adventure' : style === 'Luxury' ? 'Fine Dining,Spa,Exclusive Stays' : style === 'Cultural' ? 'History,Culture,Architecture' : style === 'Wellness' ? 'Spa,Relaxation,Wellness' : 'Sightseeing,Culture,Food',
      description: `A curated ${style.toLowerCase()} journey through ${cleanDestName}.`,
    };

    // Find matching trip by route (best-effort)
    const matchingTrip = trips.find(t =>
      t.route.toLowerCase().includes(dest.name.toLowerCase()) ||
      (dest.country && t.route.toLowerCase().includes(dest.country.toLowerCase()))
    );

    // ── Dynamic price calculation ─────────────────────────────────────────────
    // Base prices vary by region (rough daily rate per person before multipliers)
    const REGION_BASE = {
      asia: 220, europe: 280, 'north america': 300, 'south america': 240,
      africa: 200, oceania: 320, 'middle east': 260,
    };
    const destRegion = (dest.region || '').toLowerCase();
    const regionBase = REGION_BASE[destRegion] || 230;
    const basePrice = matchingTrip ? matchingTrip.price : regionBase * 8;
    const durationFactor = Math.max(0.6, durDays / 8);
    const styleFactor = style === 'Luxury' ? 1.55 : style === 'Adventure' ? 1.1 : style === 'Wellness' ? 1.25 : style === 'Cultural' ? 1.05 : 1.0;
    const pricePerPerson = Math.round(basePrice * durationFactor * styleFactor / 50) * 50;

    const accomm    = Math.round(pricePerPerson * 0.33);
    const transport = Math.round(pricePerPerson * 0.23);
    const activities = Math.round(pricePerPerson * 0.27);
    const meals     = Math.round(pricePerPerson * 0.11);
    const guide     = Math.max(0, pricePerPerson - accomm - transport - activities - meals);

    // ── Future travel date ────────────────────────────────────────────────────
    const travelDate = new Date();
    travelDate.setMonth(travelDate.getMonth() + 2);
    const travelDateStr = travelDate.toISOString().split('T')[0];

    // ── Rich highlights based on style + destination tags ────────────────────
    const tagList = (dest.tags || 'Sightseeing,Culture,Food').split(',').map(t => t.trim());
    const styleActivities = {
      Luxury:    ['Private guided city tour', 'Fine dining at award-winning restaurant', 'Luxury spa & wellness session', 'VIP cultural experience'],
      Adventure: ['Guided outdoor trekking excursion', 'Local expedition with certified guide', 'Off-the-beaten-path exploration', 'Adventure gear & safety briefing included'],
      Wellness:  ['Daily yoga & meditation classes', 'Traditional healing & spa rituals', 'Mindful nature walks', 'Organic farm-to-table meals'],
      Cultural:  ['Guided heritage & museum tours', 'Traditional cooking class with locals', 'Artisan market & craft workshop', 'Evening cultural performance'],
    };
    const baseHighlights = styleActivities[style] || ['Guided city highlights tour', 'Local market food tasting', 'Scenic photography stops', 'Cultural immersion experience'];
    const tagHighlights = tagList.slice(0, 2).map(t => `${t} experience in ${dest.name}`);
    const highlights = [
      ...tagHighlights,
      ...baseHighlights.slice(0, 2),
      'Expert local guide throughout',
      'Hand-picked accommodation & airport transfers',
    ].slice(0, 6);

    // ── Best season (infer from destination region if not from DB) ───────────
    const REGION_SEASON = {
      asia: 'Oct–Apr', europe: 'May–Sep', 'north america': 'Jun–Aug',
      'south america': 'Oct–Mar', africa: 'Jun–Sep', oceania: 'Sep–Nov',
      'middle east': 'Oct–Mar',
    };
    const bestSeason = (matchingTrip ? matchingTrip.best_season : null) || REGION_SEASON[destRegion] || 'Year-round';

    const destLabel = dest.country ? `${dest.name}, ${dest.country}` : dest.name;

    // ── Build plan JSON ───────────────────────────────────────────────────────
    const planJSON = {
      title: `${dest.name} ${style} ${durDays}-Day Experience`,
      destination: destLabel,
      duration: `${durDays} Days`,
      travel_style: style,
      travelers,
      travel_date: travelDateStr,
      route: matchingTrip ? matchingTrip.route : cleanDestName,
      highlights,
      best_season: bestSeason,
      price_per_person: pricePerPerson,
      price_breakdown: { accommodation: accomm, transport, activities, meals, guide },
      description: dest.description || `A curated ${style.toLowerCase()} journey through ${dest.name}.`,
    };

    const totalCost = (pricePerPerson * travelers).toLocaleString();
    return `I've designed your personalised travel plan! 🎉

\`\`\`travel-plan
${JSON.stringify(planJSON, null, 2)}
\`\`\`

Here's your **${planJSON.title}**:
- ✅ **${durDays} days** of curated ${style.toLowerCase()} experiences in ${dest.name}
- ✅ **${travelers} traveler${travelers !== 1 ? 's' : ''}** — total cost: **$${totalCost}** ($${pricePerPerson.toLocaleString()}/person)
- ✅ Includes: accommodation, transport, guided activities, meals & guide
- ✅ Best season to visit: **${bestSeason}**

Ready to make this trip a reality? Click **"Purchase This Plan"** below to confirm your booking! 🚀`;
  }

  // Generic helpful response
  const faq = [
    ['cancel', 'You can cancel your booking up to 30 days before travel for a full refund. For cancellations within 30 days, a partial refund applies.'],
    ['payment', 'We accept all major credit cards. You can pay a 30% deposit to secure your booking, with the balance due 60 days before travel.'],
    ['insurance', 'We strongly recommend travel insurance. We partner with top insurers — ask our team for quotes when booking.'],
    ['visa', 'Visa requirements vary by nationality. Our team provides destination-specific guidance once you book.'],
    ['group', 'Group sizes vary by trip type: Group Tours (up to 14), Adventure (up to 8), Luxury (up to 6). Solo travelers are welcome!'],
  ];
  const matched = faq.find(([kw]) => last.includes(kw));
  if (matched) return matched[1];

  return `I'm here to help you plan your perfect trip! 🌍

You can ask me about:
- **Specific destinations** — e.g. "Tell me about Bali"
- **Trip recommendations** — e.g. "Best adventure trips under $2000"
- **Building a custom plan** — just tell me where, when, and how you like to travel
- **Booking info** — cancellations, payments, visas, and more

What would you like to explore? ✈️`;
}

// ── AI: purchase plan (convert AI plan to bookable trip) ─────────────────────
app.post('/api/ai/purchase-plan', requireAuth, (req, res) => {
  const { plan } = req.body;
  if (!plan || !plan.title || !plan.price_per_person) return fail(res, 'Invalid plan data');

  const highlights = Array.isArray(plan.highlights) ? plan.highlights.join('|') : (plan.highlights || 'Custom AI-generated itinerary');

  // Create trip in DB
  db.prepare(`INSERT INTO trips (title,type,price,duration,best_season,route,max_group,spots_left,highlights,source)
    VALUES (?,?,?,?,?,?,?,?,?,'ai')`).run(
    plan.title,
    plan.travel_style || 'Group Tour',
    parseInt(plan.price_per_person),
    plan.duration || '7 Days',
    plan.best_season || 'Year-round',
    plan.route || plan.destination,
    plan.travelers || 10,
    plan.travelers || 10,
    highlights
  );

  const tripId = db.prepare('SELECT last_insert_rowid() as id').get().id;

  // Create the booking immediately
  const user = req.user;
  const nameParts = (user.name || 'AI User').split(' ');
  const travelers = parseInt(plan.travelers) || 1;
  const totalPrice = parseInt(plan.price_per_person) * travelers;
  const travelDate = plan.travel_date || new Date(Date.now() + 60*24*3600*1000).toISOString().split('T')[0];

  db.prepare(`INSERT INTO bookings (trip_id,first_name,last_name,email,phone,travelers,travel_date,special_req,total_price)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
    tripId,
    nameParts[0] || 'AI',
    nameParts.slice(1).join(' ') || 'Traveler',
    user.email,
    null,
    travelers,
    travelDate,
    `AI-generated custom travel plan: ${plan.description || ''}`,
    totalPrice
  );

  db.prepare('UPDATE trips SET spots_left = spots_left - ? WHERE id = ?').run(travelers, tripId);
  const bookingId = db.prepare('SELECT last_insert_rowid() as id').get().id;
  const booking = db.prepare('SELECT * FROM bookings WHERE id=?').get(bookingId);
  const trip = db.prepare('SELECT * FROM trips WHERE id=?').get(tripId);

  ok(res, { booking: { ...booking, trip_title: trip.title, trip_price: trip.price }, trip });
});

// ── ADMIN: AI settings CRUD ───────────────────────────────────────────────────
app.get('/api/admin/ai/settings', requireAdmin, (req, res) => {
  const s = db.prepare('SELECT * FROM ai_settings WHERE id=1').get();
  ok(res, s || {});
});

app.put('/api/admin/ai/settings', requireAdmin, (req, res) => {
  const { provider, openai_key, claude_key, bob_key, watsonx_key, watsonx_project_id, watsonx_region, model, enabled, retrain_freq, system_prompt } = req.body;
  db.prepare(`UPDATE ai_settings SET
    provider=COALESCE(?,provider), openai_key=COALESCE(?,openai_key), claude_key=COALESCE(?,claude_key),
    bob_key=COALESCE(?,bob_key), watsonx_key=COALESCE(?,watsonx_key),
    watsonx_project_id=COALESCE(?,watsonx_project_id), watsonx_region=COALESCE(?,watsonx_region),
    model=COALESCE(?,model), enabled=COALESCE(?,enabled),
    retrain_freq=COALESCE(?,retrain_freq), system_prompt=COALESCE(?,system_prompt),
    updated_at=datetime('now') WHERE id=1`).run(
    provider ?? null, openai_key ?? null, claude_key ?? null, bob_key ?? null,
    watsonx_key ?? null, watsonx_project_id ?? null, watsonx_region ?? null,
    model ?? null, enabled != null ? (enabled ? 1 : 0) : null,
    retrain_freq ?? null, system_prompt ?? null
  );
  ok(res, db.prepare('SELECT * FROM ai_settings WHERE id=1').get());
});

// ── ADMIN: AI knowledge base ──────────────────────────────────────────────────
app.get('/api/admin/ai/knowledge', requireAdmin, (req, res) => {
  ok(res, db.prepare('SELECT * FROM ai_knowledge ORDER BY category').all());
});

app.post('/api/admin/ai/knowledge', requireAdmin, (req, res) => {
  const { category, content } = req.body;
  if (!category || !content) return fail(res, 'category and content required');
  db.prepare('INSERT INTO ai_knowledge (category, content) VALUES (?,?)').run(category, content);
  const id = db.prepare('SELECT last_insert_rowid() as id').get().id;
  ok(res, db.prepare('SELECT * FROM ai_knowledge WHERE id=?').get(id));
});

app.put('/api/admin/ai/knowledge/:id', requireAdmin, (req, res) => {
  const { category, content } = req.body;
  const row = db.prepare('SELECT id FROM ai_knowledge WHERE id=?').get(req.params.id);
  if (!row) return fail(res, 'Knowledge entry not found', 404);
  db.prepare('UPDATE ai_knowledge SET category=COALESCE(?,category), content=COALESCE(?,content), updated_at=datetime("now") WHERE id=?')
    .run(category ?? null, content ?? null, req.params.id);
  ok(res, db.prepare('SELECT * FROM ai_knowledge WHERE id=?').get(req.params.id));
});

app.delete('/api/admin/ai/knowledge/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT id FROM ai_knowledge WHERE id=?').get(req.params.id);
  if (!row) return fail(res, 'Knowledge entry not found', 404);
  db.prepare('DELETE FROM ai_knowledge WHERE id=?').run(req.params.id);
  ok(res, { deleted: true });
});

// ── ADMIN: AI retrain (rebuild knowledge from live DB content) ────────────────
app.post('/api/admin/ai/retrain', requireAdmin, (req, res) => {
  // Refresh dynamic knowledge entries
  const dests = db.prepare('SELECT name, country, region, rating, description, tags FROM destinations ORDER BY rating DESC').all();
  const tripsData = db.prepare('SELECT title, type, price, duration, best_season, route, highlights FROM trips WHERE source="manual" ORDER BY price ASC').all();
  const bookingStats = db.prepare("SELECT COUNT(*) as total, SUM(total_price) as revenue FROM bookings WHERE status!='cancelled'").get();

  db.prepare("DELETE FROM ai_knowledge WHERE category IN ('destinations_live','trips_live','stats_live')").run();

  const insertKnowledge = db.prepare('INSERT INTO ai_knowledge (category, content) VALUES (?,?)');
  insertKnowledge.run('destinations_live',
    'Current destinations: ' + dests.map(d => `${d.name} (${d.country}, ${d.region}, ${d.rating}★) - ${d.description}`).join(' | ')
  );
  insertKnowledge.run('trips_live',
    'Current trips: ' + tripsData.map(t => `"${t.title}" $${t.price}/person ${t.duration} ${t.route}`).join(' | ')
  );
  insertKnowledge.run('stats_live',
    `Platform stats: ${bookingStats.total} successful bookings, $${bookingStats.revenue || 0} total revenue generated.`
  );

  db.prepare("UPDATE ai_settings SET last_trained=datetime('now') WHERE id=1").run();
  ok(res, { message: 'Knowledge base retrained successfully', entries: 3, timestamp: new Date().toISOString() });
});

// ── ADMIN: AI chat sessions ───────────────────────────────────────────────────
app.get('/api/admin/ai/sessions', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT s.id, s.session_id, s.created_at, s.updated_at,
           json_array_length(s.messages) as message_count,
           s.tokens_total,
           u.name as user_name, u.email as user_email
    FROM ai_chat_sessions s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.updated_at DESC LIMIT 100
  `).all();
  ok(res, rows);
});

// ── ADMIN: AI token usage stats ───────────────────────────────────────────────
app.get('/api/admin/ai/token-stats', requireAdmin, (req, res) => {
  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(total_tokens),0)    as total_tokens,
      COALESCE(SUM(prompt_tokens),0)   as prompt_tokens,
      COALESCE(SUM(response_tokens),0) as response_tokens,
      COUNT(*)                          as total_requests,
      COALESCE(AVG(total_tokens),0)    as avg_tokens_per_request
    FROM ai_token_log
  `).get();

  const byProvider = db.prepare(`
    SELECT provider,
           COALESCE(SUM(total_tokens),0) as tokens,
           COUNT(*) as requests
    FROM ai_token_log GROUP BY provider ORDER BY tokens DESC
  `).all();

  const byDay = db.prepare(`
    SELECT DATE(created_at) as day,
           COALESCE(SUM(total_tokens),0) as tokens,
           COUNT(*) as requests
    FROM ai_token_log
    GROUP BY DATE(created_at)
    ORDER BY day ASC LIMIT 30
  `).all();

  const topSessions = db.prepare(`
    SELECT s.session_id, s.tokens_total,
           json_array_length(s.messages) as message_count,
           s.updated_at,
           u.name as user_name
    FROM ai_chat_sessions s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.tokens_total DESC LIMIT 10
  `).all();

  ok(res, { totals, byProvider, byDay, topSessions });
});

// ── Clean URLs: serve .html files without extension ─────────────────────────
const PAGES = ['admin', 'admin-login', 'privacy', 'terms', 'demo'];
PAGES.forEach(page => {
  app.get(`/${page}`, (_req, res) => res.sendFile(path.join(__dirname, 'public', `${page}.html`)));
});

// fallback → SPA
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`JourneyOS running at http://localhost:${PORT}`));
