# 1:1 Log

## 2026-02-14

**Pulse**: Phase 1 effectively complete. 6 verticals demo-ready, 15 PRs merged today. Gary gap is the top strategic risk.
**Focus recommended**: Schedule Gary demo. Don't build another feature.
**Key decisions**:
- Demo confirmed: February 21st (1 week out)
- Mobile polish is priority #1 before demo — preliminary feedback says huge value add
- Onboarding wizards (#145) — horizontal feature, cross-vertical guided first-time experience. Demo enabler AND permanent product feature.
- DTF Gang Sheet Builder (#144) — new vertical, direct user request. Logged for cool-down shaping. May revise quoting flow for SP vs DTF distinction.
- Cool-down cycle coming soon, before any major new work
- Bug triage + polish as time permits before demo
- Possible minimal backend for seamless demo user journey (vs hard-coded feature showcase)
- Christopher answered 7 of 9 Gary questions (see below). Remaining need Gary directly.
- Christopher's philosophy: anticipate complexity one phase ahead, establish patterns that scale

**Gary question answers captured**:
- mobile-q1: No mobile experience yet — it's new/exciting for them. Desktop computers in shop corner.
- mobile-q2: Access website via tablet at events/home. Don't use PrintLife on phone. PWA path confirmed.
- mobile-q3: Production floor ↔ desk computers. Tablets at events/home, not on floor.
- mobile-q4: Still need Gary directly (which phone apps he uses)
- mobile-q5: No tablets on production floor. Use at events. TV/display question still open for Gary.
- mobile-q6: Notes with side effects pattern — not directly answered yet
- garments-q1: Manual mockup process. Quote approved → mockup created → mockup approved → work committed → garments ordered.
- garments-q2: Gary sets positions. Customers approve/reject. Auto-place model sufficient for Phase 1.
- garments-q3: "Which 5 garment styles?" — unanswered, needs Gary

**Refined plan (Christopher's timelines)**:
- Day 1: Cool-down (1 day, not 2)
- Day 2: Mobile polish (1 day — velocity is there)
- Days 3-4: Wizards + mockup integration + bug triage (parallel, woven together)
- Day 5+: Minimal backend (stretch goal — only if Thursday+ and everything else done)
- Parallel track: DTF Gang Sheet Builder as own vertical running alongside

**Wizard demo journeys (scoped tight)**:
1. View the job board
2. Close an invoice
3. Create a customer
Goal: Walk through full process interactively, not just showcase features

**Mockup clarification**: Gary manually creates mockup images, shares via email. Opportunity: auto-generate mockups and attach to quotes when sending. Integrate into demo flow.

**Shop floor display insight**: They currently use a whiteboard. Auto-refresh is the selling point — stays naturally up-to-date, source of truth that doesn't go stale. Works on phones, tablets, TV.

**DTF Gang Sheet Builder**: Stretch goal for demo week, parallel vertical. Core user request — can't ignore. #144 created.

**Prioritized Gary questions (if limited face time)**:
1. garments-q3 — "Which 5 garment styles do you use most?" (determines SVG template priority)
2. mobile-q4 — "What other apps do you use on your phone?" (reveals UX expectations)
3. mobile-q5 — "TV on shop floor showing job board?" (validates display concept)
4. mobile-q6 — "Auto-block job when logging blocker note?" (new interaction pattern)

**Story beat**: "Observation deck" metaphor. Christopher on anticipating complexity: "If you establish good patterns early on that can address and scale to that complexity that comes later, it really sets you up for success."
