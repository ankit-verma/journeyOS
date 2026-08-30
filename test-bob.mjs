// Quick end-to-end test for BOB chatbot — calls existing server on port 3000
import http from 'node:http';

function postChat(messages, sessionId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ messages, session_id: sessionId });
    const req = http.request({
      hostname: 'localhost', port: 3000,
      path: '/api/ai/chat', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('\n=== BOB AI CHATBOT TESTS ===\n');

  const tests = [
    { name: 'Lagos Nigeria 7 days adventure', msgs: [{ role:'user', content:'I want to go to Lagos, Nigeria for 7 days adventure trip' }] },
    { name: 'Berlin to Prague 2 weeks',       msgs: [{ role:'user', content:'road trip from Berlin to Prague for 2 weeks' }] },
    { name: 'Maldives luxury 6 days',         msgs: [{ role:'user', content:'Family vacation in Maldives for 6 days luxury' }] },
    { name: 'Mumbai to Dubai 5 days business',msgs: [{ role:'user', content:'Mumbai to Dubai 5 days business trip' }] },
    { name: 'Greeting only',                  msgs: [{ role:'user', content:'Hello' }] },
    { name: 'Dest only - ask for duration',   msgs: [{ role:'user', content:'I want to visit Tokyo' }] },
    { name: 'Multi-turn: dest then duration', msgs: [
      { role:'user', content:'I want to visit Iceland' },
      { role:'assistant', content:'Great choice — Iceland sounds amazing! How many days are you planning?' },
      { role:'user', content:'10 days' }
    ]},
    { name: 'Cultural Morocco 8 days',        msgs: [{ role:'user', content:'Cultural tour of Morocco for 8 days' }] },
  ];

  let passed = 0;
  for (const t of tests) {
    try {
      const r = await postChat(t.msgs, 'test_' + Date.now() + '_' + Math.random().toString(36).slice(2));
      const reply = r.data?.reply || '';
      const tokens = r.data?.tokens || {};
      const provider = r.data?.provider || '?';
      const hasPlan = reply.includes('travel-plan');
      let planSummary = '';
      if (hasPlan) {
        const m = reply.match(/```travel-plan\s*([\s\S]*?)```/);
        if (m) {
          try {
            const p = JSON.parse(m[1]);
            planSummary = `  → "${p.title}" | ${p.duration} | $${p.price_per_person}/person | ${p.travel_style} | Season: ${p.best_season}`;
          } catch(_) { planSummary = '  → (plan JSON parse error)'; }
        }
      }
      passed++;
      console.log(`✓ ${t.name}`);
      console.log(`  Provider: ${provider} | Tokens: prompt=${tokens.prompt} resp=${tokens.response} total=${tokens.total}`);
      if (planSummary) console.log(planSummary);
      else console.log(`  Reply: "${reply.slice(0,110).replace(/\n/g,' ')}..."`);
      console.log();
    } catch(e) {
      console.log(`✗ ${t.name}: ${e.message}\n`);
    }
  }
  console.log(`=== ${passed}/${tests.length} passed ===`);
}

runTests().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
