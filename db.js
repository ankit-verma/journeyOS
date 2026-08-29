'use strict';
// Node 22.5+ built-in SQLite — no native build required
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

// On Render, use the persistent disk at /data; otherwise use the project dir
const DB_DIR = process.env.RENDER ? '/data' : __dirname;
const db = new DatabaseSync(path.join(DB_DIR, 'journeyos.db'));

// ── schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    email        TEXT NOT NULL UNIQUE,
    password     TEXT NOT NULL,
    role         TEXT NOT NULL DEFAULT 'user',
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    country     TEXT NOT NULL,
    region      TEXT NOT NULL,
    rating      REAL NOT NULL,
    badge       TEXT,
    description TEXT,
    tags        TEXT,
    bg_class    TEXT
  );

  CREATE TABLE IF NOT EXISTS trips (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    type         TEXT NOT NULL,
    price        INTEGER NOT NULL,
    duration     TEXT NOT NULL,
    best_season  TEXT NOT NULL,
    route        TEXT NOT NULL,
    max_group    INTEGER NOT NULL,
    spots_left   INTEGER NOT NULL,
    highlights   TEXT NOT NULL,
    source       TEXT NOT NULL DEFAULT 'manual'
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id      INTEGER NOT NULL REFERENCES trips(id),
    first_name   TEXT NOT NULL,
    last_name    TEXT NOT NULL,
    email        TEXT NOT NULL,
    phone        TEXT,
    travelers    INTEGER NOT NULL DEFAULT 1,
    travel_date  TEXT NOT NULL,
    special_req  TEXT,
    status       TEXT NOT NULL DEFAULT 'pending',
    total_price  INTEGER NOT NULL,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS newsletter (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_settings (
    id              INTEGER PRIMARY KEY CHECK (id = 1),
    provider        TEXT    NOT NULL DEFAULT 'openai',
    openai_key      TEXT    NOT NULL DEFAULT '',
    claude_key      TEXT    NOT NULL DEFAULT '',
    bob_key         TEXT    NOT NULL DEFAULT '',
    model           TEXT    NOT NULL DEFAULT 'gpt-4o-mini',
    enabled         INTEGER NOT NULL DEFAULT 1,
    retrain_freq    TEXT    NOT NULL DEFAULT 'daily',
    last_trained    TEXT,
    system_prompt   TEXT    NOT NULL DEFAULT '',
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_knowledge (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    category   TEXT NOT NULL,
    content    TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    user_id    INTEGER,
    messages   TEXT NOT NULL DEFAULT '[]',
    plan_data  TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── seed if empty ────────────────────────────────────────────────────────────
const destCount = db.prepare('SELECT COUNT(*) as c FROM destinations').get().c;
if (destCount === 0) {
  const insertDest = db.prepare(
    `INSERT INTO destinations (name,country,region,rating,badge,description,tags,bg_class)
     VALUES (?,?,?,?,?,?,?,?)`
  );
  const destinations = [
    ['Kyoto','Japan','Asia',4.9,'Trending','Ancient temples, zen gardens, and cherry blossoms in Japan\'s cultural capital.','Culture,History,Food','dest-bg-1'],
    ['Santorini','Greece','Europe',4.8,'Favourite','Iconic blue-domed churches, caldera sunsets, and crystal-clear Aegean waters.','Beach,Romantic,Views','dest-bg-2'],
    ['Marrakech','Morocco','Africa',4.7,'Hot Deal','Vibrant souks, riads, and the magical medina of Morocco\'s "Red City".','Markets,Culture,Food','dest-bg-3'],
    ['Patagonia','Argentina','South America',4.9,'New','Dramatic glaciers, jagged peaks, and vast untouched wilderness at the end of the world.','Hiking,Adventure,Wildlife','dest-bg-4'],
    ['Amalfi Coast','Italy','Europe',4.8,'Trending','Clifftop villages, lemon groves, and turquoise coves on Italy\'s most scenic coastline.','Scenic,Food,Sailing','dest-bg-5'],
    ['Bali','Indonesia','Asia',4.7,'Limited','Sacred temples, terraced rice fields, world-class surf, and vibrant spiritual culture.','Wellness,Surf,Culture','dest-bg-6'],
  ];
  destinations.forEach(d => insertDest.run(...d));
}

const tripCount = db.prepare('SELECT COUNT(*) as c FROM trips').get().c;
if (tripCount === 0) {
  const insertTrip = db.prepare(
    `INSERT INTO trips (title,type,price,duration,best_season,route,max_group,spots_left,highlights)
     VALUES (?,?,?,?,?,?,?,?,?)`
  );
  const trips = [
    ['Japan in Full Bloom','Group Tour',2890,'14 Days','Apr-May','Tokyo to Kyoto',12,3,'Cherry blossom picnic in Ueno Park|Tea ceremony in a historic Kyoto temple|Day trip to Mount Fuji|Nishiki Market food tour'],
    ['Patagonia Trek & Glacier','Adventure',3450,'10 Days','Nov-Mar','El Calafate',8,5,'Perito Moreno glacier hike|Torres del Paine W-circuit|Lago Nordenskjold kayaking|Condor sighting at Mirador'],
    ['Greek Islands Sailing','Luxury',4200,'8 Days','Jun-Sep','Athens to Mykonos',6,2,'Private catamaran charter|Sunset dinner in Oia, Santorini|Snorkeling in hidden coves|Delos archaeological day'],
    ['Bali Wellness Escape','Wellness',1890,'7 Days','Apr-Oct','Ubud to Seminyak',10,7,'Daily yoga and meditation|Tirta Empul temple blessing|Rice terrace sunrise walk|Balinese cooking class'],
    ['Moroccan Desert & Medina','Cultural',1650,'8 Days','Mar-May','Casablanca to Marrakech',14,9,'Sahara camel trek at sunset|Fes medina guided walk|Atlas Mountains day hike|Traditional hammam experience'],
  ];
  trips.forEach(t => insertTrip.run(...t));
}

// ── seed admin user if no users exist ────────────────────────────────────────
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const adminHash = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)")
    .run('Admin', 'admin@journeyos.com', adminHash, 'admin');
}

// ── migrate: add source column to trips if missing ───────────────────────────
try {
  db.exec("ALTER TABLE trips ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'");
} catch { /* column already exists */ }

// ── seed AI settings row (singleton id=1) ────────────────────────────────────
const aiRow = db.prepare('SELECT id FROM ai_settings WHERE id=1').get();
if (!aiRow) {
  db.prepare(`INSERT INTO ai_settings (id,provider,openai_key,claude_key,bob_key,model,enabled,retrain_freq,system_prompt)
    VALUES (1,'openai','','','','gpt-4o-mini',1,'daily',
    'You are JourneyOS Travel Assistant, an expert travel planner. You help users create personalised travel plans with dynamic pricing. You know all the destinations, trips, and offerings of JourneyOS. When building a travel plan, ask about destination, duration, budget, travel style (adventure/luxury/wellness/cultural), number of travelers, and preferred travel date. Once you have enough info, generate a structured travel plan with an itemised price breakdown. Always be helpful, enthusiastic and concise.')`
  ).run();
}

// ── seed AI knowledge base ────────────────────────────────────────────────────
const knowledgeCount = db.prepare('SELECT COUNT(*) as c FROM ai_knowledge').get().c;
if (knowledgeCount === 0) {
  const insertKnowledge = db.prepare('INSERT INTO ai_knowledge (category, content) VALUES (?,?)');
  insertKnowledge.run('about', 'JourneyOS is a premium travel platform founded in 2018. We offer curated group tours, adventure trips, luxury escapes, wellness retreats, and cultural experiences worldwide. Our expert guides ensure every journey is unforgettable.');
  insertKnowledge.run('booking', 'Users can browse destinations and trips, then book securely with a deposit. Full payment flexibility with no hidden fees. Bookings can be cancelled for a full refund up to 30 days before travel.');
  insertKnowledge.run('pricing', 'Trip prices are per person in USD. Dynamic AI plans are priced based on destination, duration, season, travel style, and group size. Luxury trips command a 50% premium, adventure and wellness trips are mid-range, and group tours offer the best value.');
  insertKnowledge.run('destinations', 'Top destinations: Kyoto (Japan, Asia, 4.9★), Santorini (Greece, Europe, 4.8★), Marrakech (Morocco, Africa, 4.7★), Patagonia (Argentina, South America, 4.9★), Amalfi Coast (Italy, Europe, 4.8★), Bali (Indonesia, Asia, 4.7★).');
  insertKnowledge.run('support', 'JourneyOS offers 24/7 support throughout your journey. Contact us via the Help Center or email support@journeyos.com. For urgent matters during travel, your local guide is always reachable.');
}

module.exports = db;
