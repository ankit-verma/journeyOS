import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('./journeyos.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(r=>r.name).join(', '));
try { const ai = db.prepare('SELECT * FROM ai_settings LIMIT 1').get(); console.log('ai_settings:', JSON.stringify(ai)); } catch(e) { console.log('ai_settings error:', e.message); }
try { const kn = db.prepare('SELECT COUNT(*) as c FROM ai_knowledge').get(); console.log('ai_knowledge count:', kn.c); } catch(e) { console.log('ai_knowledge error:', e.message); }
try { const col = db.prepare("PRAGMA table_info(trips)").all(); console.log('trips cols:', col.map(c=>c.name).join(', ')); } catch(e) { console.log('trips error:', e.message); }
try { const col2 = db.prepare("PRAGMA table_info(ai_chat_sessions)").all(); console.log('ai_chat_sessions cols:', col2.map(c=>c.name).join(', ')); } catch(e) { console.log('ai_chat_sessions error:', e.message); }
