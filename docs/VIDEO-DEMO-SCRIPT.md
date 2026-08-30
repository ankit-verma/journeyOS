# JourneyOS — IBM TechXchange 2026 Hackathon Demo Video Script

> **Hard limit:** 3 minutes exactly — judges will not watch beyond 3:00  
> **IBM Bob requirement:** IBM Bob usage must be clearly demonstrated on screen  
> **Solution-in-action requirement:** At least 90 seconds showing the live solution  
> **Narration:** Required throughout  
> **Resolution:** 1920×1080, 30 fps minimum

---

## ⏱ Timing budget (strict)

| Segment | Window | Seconds | Purpose |
|---------|--------|---------|---------|
| Hook + Problem | 0:00–0:20 | 20 s | Grab attention, state the problem |
| IBM Bob — the prompt | 0:20–0:45 | 25 s | Show IBM Bob in action — the one prompt |
| IBM Bob — agents working | 0:45–1:10 | 25 s | Show Bob session screenshots / agent output |
| Live app — homepage + booking | 1:10–1:40 | 30 s | Solution in action |
| Live app — AI chatbot ★ | 1:40–2:30 | 50 s | **Core demo — watsonx.ai generating a plan** |
| Live app — admin panel | 2:30–2:50 | 20 s | Depth: token analytics, provider switching |
| Closing call-to-action | 2:50–3:00 | 10 s | URL + GitHub |

---

## 🎬 Pre-recording checklist

Do this 5 minutes before hitting record:

- [ ] Open https://journeyos.onrender.com/ and **wait for it to fully load** (free tier may sleep — allow 30 s)
- [ ] Open https://journeyos.onrender.com/admin and log in: `admin@journeyos.com` / `admin123`
- [ ] Open IBM Bob IDE with this repo — navigate to `journeyos/README.md`
- [ ] Have the **Bob session screenshots** folder open in File Explorer
- [ ] Browser zoom 100%, all notifications silenced
- [ ] Do a 30-second rehearsal of Scene 4 (the chatbot) — confirm watsonx.ai responds
- [ ] Set recorder to 1920×1080, 30 fps, with microphone enabled

---

## 🎥 Scene-by-scene script

---

### SCENE 1 — Hook + Problem (0:00–0:20)

**Screen:** Title card (black screen with text overlay) OR IBM Bob IDE — show the empty project folder before JourneyOS existed

**Narration (speak clearly and quickly):**
> "Travel planning is broken — scattered tabs, generic results, no personalisation.
> And building the app to fix it takes months.
> Unless you have IBM Bob.
> I'm going to show you JourneyOS — a full AI-powered travel booking platform —
> built from a single sentence using IBM SmartBob Framework."

**Visual tip:** If using a title card, show:
```
JourneyOS
AI-Powered Travel Platform
Built with IBM Bob · IBM watsonx.ai
journeyos.onrender.com
```

---

### SCENE 2 — IBM Bob: The one prompt (0:20–0:45) ★ MUST SHOW IBM BOB

**Screen:** IBM Bob IDE — show the prompt input bar at the top with the task title visible

> Point to the **IBM BOB** logo/header in the IDE

**Narration:**
> "This is IBM Bob — the AI agent framework I used.
> The entire application started with exactly this instruction —"

> Point to / show the task title: **"Build a travel website called JourneyOS"**

**Narration:**
> "— five words. No technical spec. No stack decision. No architecture diagram.
> IBM Bob's SmartBob orchestrator took that single request,
> discovered the project context, mapped the required capabilities,
> and assembled six specialist agents — autonomously."

**Action:**
- Show the IBM Bob IDE window — the task title `Build a travel website called JourneyOS` is visible at the top of screenshot `Screenshot 2026-08-30 121453.png`
- Zoom in on: **"Session complete ✅"** and **"Framework validation: PASS"**

---

### SCENE 3 — IBM Bob: Agents working in parallel (0:45–1:10) ★ MUST SHOW IBM BOB

**Screen:** Display the Bob session screenshots — use File Explorer or slide through them

**Show Screenshot: `Screenshot 2026-08-30 122007.png`**
*(All tasks completed! ✅ — 12/12 — 49 files changed)*

**Narration:**
> "SmartBob coordinated six specialist agents in parallel:
> BobOps built the entire backend — 30 REST endpoints, JWT auth, the database.
> BobCompliance ran a live security audit — caught 5 blocking issues, fixed them.
> BobData designed the analytics dashboard.
> All of this — 49 files — generated, tested and deployed
> in a single IBM Bob session."

**Show Screenshot: `Screenshot 2026-08-30 121315.png`**
*(✅ Fully working. Live response from watsonx.ai — IAM token exchange: Working)*

**Narration:**
> "And IBM Bob verified the IBM watsonx.ai integration was live — not mocked —
> before marking the session complete."

---

### SCENE 4 — Live app: Homepage (1:10–1:40)

**Screen:** https://journeyos.onrender.com/ — browser address bar must be clearly visible

**Narration:**
> "Here is the live running application — deployed to Render.com.
> A fully functional travel booking platform with real destinations,
> trip listings, user accounts and a booking system.
> Every line of this was written by IBM Bob agents."

**Action (smooth, no rushing):**
1. Show the homepage scrolling — destination cards visible
2. Click one destination card — show the trip detail / booking page
3. Back to homepage — hover over the AI chat button (bottom-right)

---

### SCENE 5 — Live app: AI chatbot powered by IBM watsonx.ai (1:40–2:30) ★ KEY SCENE

**Screen:** https://journeyos.onrender.com/ — open the AI chat widget

**Narration:**
> "The centrepiece is the AI Travel Planner —
> powered by IBM watsonx.ai running llama-3-3-70b-instruct.
> Watch it generate a real, personalised itinerary."

**Action — type these messages, one at a time, pause for each response:**

| Step | You type | Pause |
|------|----------|-------|
| 1 | `I want to plan a trip to Tokyo` | 3 s |
| 2 | `7 days, solo, moderate budget` | wait for full response |

**Narration (while response is generating):**
> "The model is calling IBM watsonx.ai right now —
> IAM token exchange, live inference,
> returning a structured travel plan with five pricing categories."

**Action:** When the plan appears — **zoom in** on the plan card so the price breakdown is visible

**Narration:**
> "A complete itinerary — flights, accommodation, activities, food, transport —
> with itemised pricing. Generated in real time from a natural conversation."

**Action:** **Click "Book This Plan"**

**Narration:**
> "And with one click — that AI plan becomes a confirmed booking in the database.
> Not a prototype. A real transaction."

---

### SCENE 6 — Live app: Admin panel (2:30–2:50)

**Screen:** https://journeyos.onrender.com/admin (already logged in)

**Narration:**
> "The admin panel — built by IBM Bob's BobData agent —
> shows live token usage, per-session analytics,
> and lets you switch AI providers on the fly:
> watsonx.ai, OpenAI, Claude, or the built-in BOB engine —
> four-provider failover for 100% uptime."

**Action:**
1. Show token analytics chart briefly
2. Click AI Settings tab — show provider dropdown (watsonx.ai → OpenAI → Claude → BOB)
3. Show the system prompt editor — 2 seconds

---

### SCENE 7 — Closing (2:50–3:00)

**Screen:** Back to https://journeyos.onrender.com/ — browser address bar clearly visible

**Narration:**
> "JourneyOS. Live. Real. Built by IBM Bob.
> One prompt. Six agents. One session.
> journeyos.onrender.com"

**Action:** Slowly zoom the address bar so `journeyos.onrender.com` fills the frame.
Hold for 3 seconds. Fade to black.

---

## 🖼 Lower-third / title card copy

```
Opening card:
  JourneyOS — AI-Powered Travel Platform
  IBM TechXchange 2026 Hackathon
  Built with IBM Bob (SmartBob Framework v1) · IBM watsonx.ai

Scene 2 overlay:   "IBM Bob — SmartBob Orchestrator"
Scene 3 overlay:   "6 specialist agents · 49 files · 1 session"
Scene 5 overlay:   "IBM watsonx.ai · meta-llama/llama-3-3-70b-instruct"
Closing card:
  journeyos.onrender.com
  github.com/ankit-verma/journeyOS
  IBM TechXchange 2026
```

---

## 📸 Bob session screenshots — what to show and when

| File | When to show | Key visual |
|------|-------------|------------|
| `Screenshot 2026-08-30 121453.png` | Scene 2 | Task title "Build a travel website called JourneyOS" · Session complete ✅ · Framework validation: PASS |
| `Screenshot 2026-08-30 122007.png` | Scene 3 | All tasks completed ✅ 12/12 · 49 files changed |
| `Screenshot 2026-08-30 121315.png` | Scene 3 | ✅ Fully working · IAM token exchange: Working · live watsonx.ai response |
| `Screenshot 2026-08-30 121544.png` | Optional B-roll | Compliance audit: 5 FAIL → fixed · stack discovery |

---

## 🎙 Full narration text (copy-paste for teleprompter)

```
[0:00] Travel planning is broken — scattered tabs, generic results, no personalisation.
       And building the app to fix it takes months.
       Unless you have IBM Bob.
       I'm going to show you JourneyOS — a full AI-powered travel booking platform —
       built from a single sentence using IBM SmartBob Framework.

[0:20] This is IBM Bob.
       The entire application started with exactly this instruction:
       "Build a travel website called JourneyOS."
       Five words. No technical spec. No stack decision. No architecture diagram.
       IBM Bob's SmartBob orchestrator took that single request,
       discovered the project context, mapped the required capabilities,
       and assembled six specialist agents — autonomously.

[0:45] SmartBob coordinated six specialist agents in parallel.
       BobOps built the entire backend — 30 REST endpoints, JWT auth, the database.
       BobCompliance ran a live security audit — caught 5 blocking issues, fixed them.
       BobData designed the analytics dashboard.
       All of this — 49 files — generated, tested and deployed
       in a single IBM Bob session.
       And IBM Bob verified the IBM watsonx.ai integration was live — not mocked —
       before marking the session complete.

[1:10] Here is the live running application — deployed to Render.com.
       A fully functional travel booking platform with real destinations,
       trip listings, user accounts and a booking system.
       Every line of this was written by IBM Bob agents.

[1:40] The centrepiece is the AI Travel Planner —
       powered by IBM watsonx.ai running llama-3-3-70b-instruct.
       Watch it generate a real, personalised itinerary.
       [pause — while AI responds]
       The model is calling IBM watsonx.ai right now —
       IAM token exchange, live inference,
       returning a structured travel plan with five pricing categories.
       A complete itinerary — flights, accommodation, activities, food, transport —
       with itemised pricing. Generated in real time from a natural conversation.
       And with one click — that AI plan becomes a confirmed booking in the database.
       Not a prototype. A real transaction.

[2:30] The admin panel — built by IBM Bob's BobData agent —
       shows live token usage, per-session analytics,
       and lets you switch AI providers on the fly:
       watsonx.ai, OpenAI, Claude, or the built-in BOB engine —
       four-provider failover for 100% uptime.

[2:50] JourneyOS. Live. Real. Built by IBM Bob.
       One prompt. Six agents. One session.
       journeyos.onrender.com
```

---

## 🛠 Recommended recording setup

| Platform | Tool | Notes |
|----------|------|-------|
| Windows  | [OBS Studio](https://obsproject.com/) (free) | Best quality, scene switching for title cards |
| Windows  | [ShareX](https://getsharex.com/) (free) | Quickest to start recording |
| Any      | [Loom](https://www.loom.com/) (free tier) | Instant shareable URL — ideal for submission |
| macOS    | QuickTime → New Screen Recording | Built-in, no install |

---

## ✂️ Quick edit (10 minutes — Clipchamp or DaVinci Resolve)

1. **Add title card** at 0:00–0:05 (black background, white text from copy above)
2. **Add lower-thirds** at Scene 2, 3 and 5 (use copy above)
3. **Speed up** any AI response wait longer than 8 seconds (1.5× in editor)
4. **Fade to black** at 3:00
5. **Export** MP4 H.264 1080p — typical file size 150–300 MB

---

## 📤 Submission

- Upload to **YouTube** (set to Unlisted — not Private, judges need access without a Google account)
- Or **Vimeo** (free tier, public link)
- Paste the public video URL into the hackathon submission form
- Verify the link plays in an incognito / private browser window before submitting
