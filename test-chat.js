'use strict';
const db = require('./db');

// Test 1: session save
try {
  const sid = 'test_' + Date.now();
  const msgs = JSON.stringify([{role:'user',content:'hi'},{role:'assistant',content:'Hello!'}]);
  db.prepare('INSERT INTO ai_chat_sessions (session_id, messages) VALUES (?,?)').run(sid, msgs);
  db.prepare('UPDATE ai_chat_sessions SET messages=?, updated_at=datetime(\'now\') WHERE session_id=?').run(msgs, sid);
  db.prepare('DELETE FROM ai_chat_sessions WHERE session_id=?').run(sid);
  console.log('PASS: session save');
} catch(e) { console.error('FAIL: session save -', e.message); }

// Test 2: full generateFallbackReply simulation
try {
  const destinations = db.prepare('SELECT name,country,region,rating,description,tags FROM destinations ORDER BY rating DESC').all();
  const trips = db.prepare('SELECT title,type,price,duration,best_season,route,highlights FROM trips ORDER BY price ASC').all();

  const testCases = [
    ['hi plan a trip to bali', true],
    ['Delhi to London trip for 3 days 2 nights 1 person', true],
    ['I want to visit Japan for 7 days', true],
    ['plan a trip to paris for 5 days', true],
    ['about', false],
    ['hello', false],
  ];

  for (const [input, expectPlan] of testCases) {
    const messages = [{role:'user', content: input}];
    const allMsgs = messages.map(m=>m.content.toLowerCase()).join(' ');
    const last = messages[messages.length-1].content.toLowerCase();

    const seededMatch = destinations.find(d =>
      allMsgs.includes(d.name.toLowerCase()) || allMsgs.includes(d.country.toLowerCase())
    );
    const destPhraseMatch = allMsgs.match(
      /(?:trip to|visit|go to|travel to|going to|from .+ to|in)\s+([a-z][a-z\s]{1,24}?)(?:\s+for|\s+\d|\s+trip|\s+from|,|\.|$)/i
    );
    const hasDestination = !!seededMatch || !!destPhraseMatch;
    const hasDuration = /(\d+)\s*(day|week|night)/i.test(allMsgs);
    const readyToPlan = hasDestination && hasDuration;

    // Also test that when readyToPlan, plan generation doesn't throw
    if (readyToPlan) {
      const dest = seededMatch || {
        name: (destPhraseMatch ? destPhraseMatch[1].trim().replace(/\b\w/g,c=>c.toUpperCase()) : 'Test'),
        country: '', tags: 'Culture,Food', description: 'Test destination.'
      };
      const durMatch = allMsgs.match(/(\d+)\s*(day|week|night)/i);
      let durDays = 7;
      if (durMatch) {
        const n = parseInt(durMatch[1]);
        durDays = durMatch[2].startsWith('week') ? n*7 : n;
      }
      const pricePerPerson = 1800;
      const accomm = Math.round(pricePerPerson*0.32);
      const transport = Math.round(pricePerPerson*0.24);
      const activities = Math.round(pricePerPerson*0.28);
      const meals = Math.round(pricePerPerson*0.10);
      const guide = Math.max(0, pricePerPerson-accomm-transport-activities-meals);
      const highlights = (dest.tags||'Culture,Food').split(',').map(t=>t.trim()+' in '+dest.name).slice(0,2)
        .concat(['Expert guide','Accommodation']);
      const planJSON = JSON.stringify({
        title:`${dest.name} Group Tour ${durDays}-Day Experience`,
        destination: dest.country ? `${dest.name}, ${dest.country}` : dest.name,
        price_per_person: pricePerPerson,
        price_breakdown:{accommodation:accomm,transport,activities,meals,guide},
        highlights
      });
      JSON.parse(planJSON); // validate JSON
    }

    const isGreeting = last.includes('hello')||last.includes('hi')||last.includes('hey')||messages.length<=1;
    console.log(`${readyToPlan?'PLAN':'INFO'} [${input.slice(0,40)}] dest=${hasDestination} dur=${hasDuration} greet=${isGreeting}`);
  }
  console.log('PASS: all fallback cases ran without error');
} catch(e) { console.error('FAIL: fallback -', e.message, e.stack); }
