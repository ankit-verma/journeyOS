'use strict';
const db = require('./db');

let passed = 0, failed = 0;
function check(label, cond) {
  if (cond) { console.log('PASS:', label); passed++; }
  else { console.error('FAIL:', label); failed++; }
}

// Table checks
check('ai_settings table', db.prepare('SELECT COUNT(*) as c FROM ai_settings').get().c === 1);
check('ai_knowledge seeded', db.prepare('SELECT COUNT(*) as c FROM ai_knowledge').get().c >= 5);
check('ai_chat_sessions table', db.prepare('SELECT COUNT(*) as c FROM ai_chat_sessions').get().c >= 0);
check('trips has source column', db.prepare('PRAGMA table_info(trips)').all().some(c => c.name === 'source'));

// AI settings
const settings = db.prepare('SELECT * FROM ai_settings WHERE id=1').get();
check('ai_settings enabled=1', settings.enabled === 1);
check('ai_settings has system_prompt', settings.system_prompt && settings.system_prompt.length > 10);
check('ai_settings provider is valid', ['openai','claude','bob'].includes(settings.provider));

// Knowledge base
const knowledge = db.prepare('SELECT * FROM ai_knowledge').all();
check('knowledge has about entry', knowledge.some(k => k.category === 'about'));
check('knowledge has pricing entry', knowledge.some(k => k.category === 'pricing'));

// Simulate plan-purchase trip insert
db.prepare(`INSERT INTO trips (title,type,price,duration,best_season,route,max_group,spots_left,highlights,source)
  VALUES ('AI Test Plan','Adventure',2500,'10 Days','Year-round','Bali',2,2,'Highlight 1|Highlight 2','ai')`).run();
const aiTrip = db.prepare("SELECT * FROM trips WHERE title='AI Test Plan'").get();
check('AI trip insert success', !!aiTrip);
check('AI trip source=ai', aiTrip && aiTrip.source === 'ai');

// Booking for AI trip
db.prepare(`INSERT INTO bookings (trip_id,first_name,last_name,email,travelers,travel_date,total_price)
  VALUES (?,?,?,?,?,?,?)`).run(aiTrip.id, 'Test', 'User', 'test@test.com', 2, '2026-01-01', 5000);
const booking = db.prepare("SELECT * FROM bookings WHERE email='test@test.com'").get();
check('Booking for AI trip', !!booking);
check('Booking total price', booking && booking.total_price === 5000);

// Retrain: delete old dynamic knowledge
db.prepare("DELETE FROM ai_knowledge WHERE category IN ('destinations_live','trips_live','stats_live')").run();
const insertK = db.prepare('INSERT INTO ai_knowledge (category, content) VALUES (?,?)');
insertK.run('destinations_live', 'test destinations content');
insertK.run('trips_live', 'test trips content');
insertK.run('stats_live', 'test stats content');
db.prepare("UPDATE ai_settings SET last_trained=datetime('now') WHERE id=1").run();
const updatedSettings = db.prepare('SELECT last_trained FROM ai_settings WHERE id=1').get();
check('Retrain sets last_trained', !!updatedSettings.last_trained);
check('Retrain inserts live knowledge', db.prepare("SELECT COUNT(*) as c FROM ai_knowledge WHERE category='destinations_live'").get().c === 1);

// Chat session save
const sessionId = 'test_session_' + Date.now();
db.prepare('INSERT INTO ai_chat_sessions (session_id, messages) VALUES (?,?)').run(sessionId, '[]');
const session = db.prepare('SELECT * FROM ai_chat_sessions WHERE session_id=?').get(sessionId);
check('Chat session insert', !!session);

// Clean up test data
db.prepare("DELETE FROM bookings WHERE email='test@test.com'").run();
db.prepare("DELETE FROM trips WHERE title='AI Test Plan'").run();
db.prepare('DELETE FROM ai_chat_sessions WHERE session_id=?').run(sessionId);

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
