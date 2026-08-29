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
  const provider = settings.provider || 'openai';

  try {
    // ── Provider routing ─────────────────────────────────────────────────────
    if (provider === 'openai' && settings.openai_key) {
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
              resolve(j.choices?.[0]?.message?.content || '');
            } catch(e) { reject(e); }
          });
        });
        hreq.on('error', reject);
        hreq.write(payload);
        hreq.end();
      });
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
    } else {
      // ── Built-in fallback (no API key needed) ─────────────────────────────
      aiReply = generateFallbackReply(messages, systemPrompt, destinations, trips);
    }
  } catch (err) {
    console.error('AI provider error:', err.message);
    aiReply = generateFallbackReply(messages, systemPrompt, destinations, trips);
  }

  // Save session
  if (session_id) {
    const existing = db.prepare('SELECT id FROM ai_chat_sessions WHERE session_id=?').get(session_id);
    const allMsgs = JSON.stringify([...messages, { role: 'assistant', content: aiReply }]);
    if (existing) {
      db.prepare("UPDATE ai_chat_sessions SET messages=?, updated_at=datetime('now') WHERE session_id=?").run(allMsgs, session_id);
    } else {
      db.prepare('INSERT INTO ai_chat_sessions (session_id, messages) VALUES (?,?)').run(session_id, allMsgs);
    }
  }

  ok(res, { reply: aiReply });
}

// ── Built-in AI fallback (rule-based travel planner) ─────────────────────────
function generateFallbackReply(messages, _systemPrompt, destinations, trips) {
  const last = (messages[messages.length - 1]?.content || '').toLowerCase();
  const allMsgs = messages.map(m => m.content.toLowerCase()).join(' ');

  // Detect destination — match seeded DB OR any free-form place name
  const seededMatch = destinations.find(d =>
    allMsgs.includes(d.name.toLowerCase()) || allMsgs.includes(d.country.toLowerCase())
  );
  // Free-form: "trip to X", "X to Y", "visit X", "go to X", "in X for"
  const destPhraseMatch = allMsgs.match(
    /(?:(?:trip|travel|fly|flying|going)\s+(?:to|from)\s*(?:\w+\s+to\s+)?|(?:visit|explore|in)\s+)([a-z][a-z\s]{1,28}?)(?:\s+for\s|\s+\d|\s*,|\s*\.|$)/i
  );
  // Also catch bare "X to Y" route pattern (e.g. "delhi to london")
  const routeMatch = allMsgs.match(/\b([a-z][a-z\s]{1,20}?)\s+to\s+([a-z][a-z\s]{1,20}?)\s/i);
  const hasDestination = !!seededMatch || !!destPhraseMatch || !!routeMatch;

  // Build destination name for plan
  let detectedDestName, detectedDestCountry = '';
  if (seededMatch) {
    detectedDestName = seededMatch.name;
    detectedDestCountry = seededMatch.country;
  } else if (routeMatch) {
    const from = routeMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase());
    const to   = routeMatch[2].trim().replace(/\b\w/g, c => c.toUpperCase());
    detectedDestName = `${from} to ${to}`;
  } else if (destPhraseMatch) {
    detectedDestName = destPhraseMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase());
  } else {
    detectedDestName = 'Your Destination';
  }

  const hasDuration = /(\d+)\s*(day|week|night)/i.test(allMsgs);
  const hasBudget = /budget|cheap|luxury|afford|\$\d+|\d+\s*usd|\d+\s*dollar/i.test(allMsgs);

  const readyToPlan = hasDestination && hasDuration;

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

  if (!hasDestination && !hasDuration && messages.length < 3) {
    return `Great question! Let me help you find the perfect trip. 🌟

Here are some of our **most popular destinations**:
${destinations.slice(0,4).map(d => `• **${d.name}**, ${d.country} ⭐ ${d.rating} — ${d.tags}`).join('\n')}

Or just tell me where you want to go (any city or country works!) and how long you're planning to travel.`;
  }

  if (!hasDestination && messages.length >= 2) {
    return `I can plan a trip to **any destination in the world**! Just tell me:
- Where would you like to go? (e.g. "Delhi to London", "Paris", "Tokyo")
- How many days?

Here are some popular picks for inspiration:
${destinations.slice(0,3).map(d => `• **${d.name}** — ${d.description.slice(0,80)}...`).join('\n')}`;
  }

  if (hasDestination && !hasDuration) {
    return `Great choice — **${detectedDestName || 'that destination'}** sounds amazing! 🎉 How many days are you planning to travel?

Popular durations:
• **3–5 days** — Weekend escape
• **7 days** — Classic week-long trip
• **10–14 days** — Deep exploration
• **3 weeks** — Full immersion

What works best for you?`;
  }

  if (!hasDuration && hasDestination) {
    return `Excellent choice! 🎉 Now, how many days are you planning to travel? A longer trip lets us include more highlights and experiences.

Popular durations:
• **7 days** — Great for a focused destination
• **10–14 days** — Perfect for exploring a region
• **3 weeks** — Deep immersion with multiple stops

What works best for you?`;
  }

  if (readyToPlan && !hasBudget && messages.length < 6) {
    return `Almost there! What's your approximate budget per person? This helps me tailor the experience — whether you prefer boutique hotels, mid-range comfort, or luxury resorts.

• **Budget-friendly:** $800–$1,500/person
• **Mid-range:** $1,500–$3,000/person
• **Luxury:** $3,000+/person

Which range works for you? Or share a specific amount!`;
  }

  if (readyToPlan) {
    // Resolve destination object: use seeded or build a synthetic one from the detected name
    const dest = seededMatch || {
      name: detectedDestName || 'Your Destination',
      country: detectedDestCountry || '',
      tags: 'Sightseeing,Culture,Food',
      description: `A wonderful journey to ${detectedDestName || 'your chosen destination'}.`,
    };

    // Find matching trip by route (best-effort)
    const matchingTrip = trips.find(t =>
      t.route.toLowerCase().includes(dest.name.toLowerCase()) ||
      (dest.country && t.route.toLowerCase().includes(dest.country.toLowerCase()))
    );

    // Duration extraction — also handle "X nights"
    const durMatch = allMsgs.match(/(\d+)\s*(day|week|night)/i);
    let durDays = 7;
    if (durMatch) {
      const n = parseInt(durMatch[1]);
      if (durMatch[2].startsWith('week')) durDays = n * 7;
      else if (durMatch[2].startsWith('night')) durDays = n; // nights ≈ days
      else durDays = n;
    }
    durDays = Math.max(1, durDays);

    // Style
    let style = 'Group Tour';
    if (/luxury|premium|high.end/i.test(allMsgs)) style = 'Luxury';
    else if (/adventure|hike|trek|outdoor/i.test(allMsgs)) style = 'Adventure';
    else if (/wellness|yoga|spa|relax/i.test(allMsgs)) style = 'Wellness';
    else if (/cultural|history|art|museum/i.test(allMsgs)) style = 'Cultural';

    // Travelers — also detect "X person", "couple" etc.
    const travelMatch = allMsgs.match(/(\d+)\s*(person|people|travell?er|adult)/i);
    const travelers = travelMatch ? parseInt(travelMatch[1])
      : /couple|two of us/.test(allMsgs) ? 2
      : /solo|alone|myself/.test(allMsgs) ? 1
      : 2;

    // Price calculation
    const basePrice = matchingTrip ? matchingTrip.price : 1800;
    const durationFactor = Math.max(0.5, durDays / 8);
    const styleFactor = style === 'Luxury' ? 1.5 : style === 'Adventure' ? 1.1 : style === 'Wellness' ? 1.2 : 1.0;
    const pricePerPerson = Math.round(basePrice * durationFactor * styleFactor / 50) * 50;

    const accomm = Math.round(pricePerPerson * 0.32);
    const transport = Math.round(pricePerPerson * 0.24);
    const activities = Math.round(pricePerPerson * 0.28);
    const meals = Math.round(pricePerPerson * 0.10);
    const guide = Math.max(0, pricePerPerson - accomm - transport - activities - meals);

    // Future date
    const travelDate = new Date();
    travelDate.setMonth(travelDate.getMonth() + 2);
    const travelDateStr = travelDate.toISOString().split('T')[0];

    const highlights = (dest.tags || 'Sightseeing,Culture,Food').split(',')
      .map(t => t.trim() + ' experience in ' + dest.name).slice(0, 2)
      .concat(['Expert local guide throughout', 'Curated accommodation & dining']);

    const destLabel = dest.country ? `${dest.name}, ${dest.country}` : dest.name;

    const planJSON = {
      title: `${dest.name} ${style} ${durDays}-Day Experience`,
      destination: destLabel,
      duration: `${durDays} Days`,
      travel_style: style,
      travelers,
      travel_date: travelDateStr,
      route: matchingTrip ? matchingTrip.route : destLabel,
      highlights,
      best_season: matchingTrip ? matchingTrip.best_season : 'Year-round',
      price_per_person: pricePerPerson,
      price_breakdown: { accommodation: accomm, transport, activities, meals, guide },
      description: dest.description || `A curated ${style.toLowerCase()} journey through ${dest.name}.`,
    };

    return `I've designed your personalised travel plan! 🎉

\`\`\`travel-plan
${JSON.stringify(planJSON, null, 2)}
\`\`\`

This **${planJSON.title}** has been crafted just for you! Here's what's included:
- ✅ ${durDays} days of curated experiences in ${dest.name}
- ✅ ${travelers} traveler${travelers !== 1 ? 's' : ''} — total cost: **$${(pricePerPerson * travelers).toLocaleString()}**
- ✅ Expert local guide, accommodation & key activities

Ready to make this trip a reality? Click **"Purchase This Plan"** below to add it to your bookings! 🚀`;
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
  const { provider, openai_key, claude_key, bob_key, model, enabled, retrain_freq, system_prompt } = req.body;
  db.prepare(`UPDATE ai_settings SET
    provider=COALESCE(?,provider), openai_key=COALESCE(?,openai_key), claude_key=COALESCE(?,claude_key),
    bob_key=COALESCE(?,bob_key), model=COALESCE(?,model), enabled=COALESCE(?,enabled),
    retrain_freq=COALESCE(?,retrain_freq), system_prompt=COALESCE(?,system_prompt),
    updated_at=datetime('now') WHERE id=1`).run(
    provider ?? null, openai_key ?? null, claude_key ?? null, bob_key ?? null,
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
           u.name as user_name, u.email as user_email
    FROM ai_chat_sessions s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.updated_at DESC LIMIT 100
  `).all();
  ok(res, rows);
});

// fallback → SPA
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`JourneyOS running at http://localhost:${PORT}`));
