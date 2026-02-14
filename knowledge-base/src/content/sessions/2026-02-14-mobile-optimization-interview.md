---
title: "Mobile Optimization — User Interview"
subtitle: "10-question interview validating mobile assumptions and uncovering new priorities"
date: 2026-02-14
phase: 1
vertical: mobile-optimization
verticalSecondary: [quoting, jobs, customer-management, invoicing]
stage: interview
tags: [research, decision]
sessionId: "dabb8a6a-42cc-4db3-a770-a184cd629875"
branch: "session/0214-mobile-interview"
status: complete
---

## Summary

Conducted a 10-question interview to validate assumptions from the competitive analysis and scope definition. The interview revealed significant new priorities — particularly around capacity-aware mobile quoting, notes with side effects, and the "app comes to you" philosophy — that reshape the mobile optimization build order.

## Interview Participants

- **Interviewer**: Claude (AI assistant)
- **Interviewee**: Chris Bays (developer / product owner, standing in for Gary)

## Key Findings

### 1. Capacity-Aware Quoting is the Top Mobile Use Case

When someone calls wanting an order, Gary needs to quickly assess: how many jobs, how many shirts, what complexity, what due dates — and give a safe delivery estimate. Rush orders (same-day DTF) are common. He needs to answer "can we take this?" and "what gets pushed if we do?" from his phone.

**Impact**: The Kanban board mobile adaptation (C6) was scoped as step 14/18. It should be promoted to Sprint 2 as a high-value screen. A "capacity summary" view may also be needed.

### 2. Mobile Quoting at Events is "Really Powerful"

At mobile events/venues, Gary meets prospects and currently captures info via business cards, texts to self, or memory. Being able to go from "nice to meet you" to "here's a rough quote" on the spot would be a differentiator.

**Impact**: P4 (Mobile Quoting Calculator) should be promoted from Peripheral/Phase 2 toward Core.

### 3. Notes With Side Effects

Notes aren't just text. "Digitizer files delayed" should block the job. "Customer pushed back on mockup" should block and explain why. The note input needs to optionally trigger state changes (block/unblock).

**Impact**: New interaction pattern not in current scope. Needs breadboarding.

### 4. Two Speeds of Task Tracking

Some users want granular task checkboxes. Others want to just slide the card to "done." Both must be supported. Mobile enables real-time updates on the floor instead of batch syncing at the desk (where you only remember 50% of what happened).

**Impact**: Kanban card quick-actions and task checkboxes both need to be mobile-friendly.

### 5. The App Comes to You

Notifications are half the mobile value prop. Decision-triggering events: quote accepted, rush order incoming, job hitting risk zone. These aren't FYI — they're calls to action.

**Impact**: P2 (Push Notifications) is more important than originally ranked. Should be early Phase 2, not late.

### 6. Shop Floor Display + Auto-Refresh

A TV on the shop floor showing the Kanban board that auto-refreshes when someone updates from their phone. Shared ambient awareness for the whole team.

**Impact**: New concept not in scope. Low-cost, high-value. Needs real-time data (Phase 2 backend), but the display layout could be designed now.

### 7. Gary is the Primary Mobile User

Employees are secondary. Small operation (3 employees), similar jobs. Employees might slide cards and log notes, but they're not checking off every task. Design for the owner's workflows.

**Impact**: Confirms owner-centric design. Don't over-engineer employee workflows.

### 8. Channel Centralization is the Long-Term Vision

Info comes from email, Facebook DMs, phone calls, voicemails, face-to-face. The dream is integrations that pull all channels into the app. For now, make it dead simple to manually log notes from any context.

**Impact**: Phase 3+ for integrations, but note capture UX in Phase 1 must be as fast as texting.

### 9. Simple "Coming Up" View Beats Smart Briefing

A filtered dashboard view (jobs due this week, risk items, recent activity) is enough for the evening check-in. AI-generated daily briefings are cool but need backend intelligence — defer to Phase 3+.

**Impact**: Dashboard mobile layout (C2) needs a "this week / coming up" filter, not AI features.

### 10. iPhone + Android; PWA Confirmed

Gary uses iPhone, at least one employee uses Android. Reinforces PWA-first approach — one codebase, both platforms.

## Full Interview Transcript

### Q1: When you're away from your desk, what are you doing and what shop info do you need?

**Answer**: Multiple scenarios — taking a call about a new order and needing to understand capacity for delivery estimates. Glancing at daily/weekly KPIs. Logging notes quickly. Getting alerted on important things. Evening planning from home (what's next, what are the issues). At mobile events, capturing contact info for prospects. Not deep app sessions — quick check-ins.

### Q2: For capacity/quoting on the fly — what info do you need to give a delivery estimate?

**Answer**: Job count, shirt count, complexity (colors, locations), and due dates. Rush orders (same-day DTF) are common — need to know if we can do it and what shifts. The Kanban board already captures most of this. The challenge is showing it on a phone.

### Q3: At a mobile event — what does capturing a prospect look like today?

**Answer**: Business cards, texts to self, "whatever works." No ability to kick off a quote on the spot. Being able to draft a quote right there would be "really powerful."

### Q4: What notifications would be useful vs. noise?

**Answer**: Quote accepted (time to schedule). Rush order request. Job hitting risk zone (deadline approaching, work not on track). All decision-triggering, not FYI.

### Q5: What kind of notes, and where do they go today?

**Answer**: Information comes from many channels (email, Facebook, phone, voicemail, face-to-face). Goal is centralizing into one place. Long-term dream is integrations (Facebook DMs flowing into quotes). Initially: notes attached to entities (customer, job, invoice, quote). Must be as fast as texting. Notes should be able to trigger state changes — logging a blocker should block the job. Also quick task completion from the phone to keep things updated in real time instead of batch syncing at the desk.

### Q6: iPhone or Android?

**Answer**: iPhone for owner, Android for at least one employee. Need both.

### Q7: Just you using mobile, or employees too?

**Answer**: Gary (owner) is primary mobile user. Employees might slide cards and log notes but won't be granular. Shop floor display showing the Kanban board with auto-refresh would be valuable — shared ambient awareness. Don't over-engineer employee workflows.

### Q8: Evening check-in — daily briefing or just looking around?

**Answer**: Looking at the board, checking notifications (new quotes, payments, contacts). The idea of a briefing/summary is interesting but seems like it needs significant intelligence. Open to a simple version if feasible.

### Q9: What other business apps do you use on your phone?

**Answer**: Deferred — better question for Gary directly.

### Q10: The one thing that makes mobile worth using from day one?

**Answer**: Two things: (1) Untethered access — don't need to be at the desk. (2) The app comes to you — notifications, and ideally integrations that bring business from all channels (Facebook, text, email, customer self-service) into one place. "If we're able to bring the business to the app and bring the app to Gary, then the mobile experience sells itself."

## Decisions Made

### Build Order: Hybrid Approach (Approach C)

**Decision**: Use a "Foundation Sprint + Value Sprint" approach rather than the bottom-up build order from the original scope definition.

- **Sprint 1**: Foundation (nav shell, design tokens, touch targets, shared card component)
- **Sprint 2**: Highest-value screens (mobile Kanban board, dashboard with capacity/coming-up view, quick note capture)
- **Sprint 3-4**: List views, forms, detail pages, modals

**Rationale**: Foundation is necessary, but Gary should see the board on his phone by week 2, not week 4. List view conversions are lower-priority mobile use cases.

### Scope Adjustments from Interview

| Item | Original Scope | New Priority |
|------|---------------|--------------|
| Kanban Board Mobile (C6) | Step 14/18 (Sprint 4) | Sprint 2 (high-value) |
| Mobile Quoting (P4) | Peripheral / Phase 2 | Promote toward Core |
| Push Notifications (P2) | Peripheral / Phase 2 | Early Phase 2, not late |
| Notes with side effects | Not scoped | New Core interaction pattern |
| Capacity summary view | Not scoped | Explore during breadboarding |
| Shop floor display mode | Not scoped | Design now, implement Phase 2 |
| Smart daily briefing | Not scoped | Phase 3+ (needs AI backend) |

## What's Next

1. **Breadboarding** — Map UI affordances for the mobile navigation shell, mobile card list, mobile Kanban board, and quick note capture with state changes.
2. **Update scope definition** — Reflect revised build order and new interaction patterns from interview findings.
3. **Implementation planning** — Detailed sprint breakdown with the hybrid approach.

<div class="gary-question" data-question-id="mobile-q4" data-vertical="mobile-optimization" data-status="unanswered">
  <p class="gary-question-text">What other business apps do you use on your phone? (QuickBooks, Square, bank app, calendar?)</p>
  <p class="gary-question-context">Understanding which apps Gary already uses daily reveals interaction patterns he's comfortable with and expectations for mobile UX quality.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="mobile-q5" data-vertical="mobile-optimization" data-status="unanswered">
  <p class="gary-question-text">Would you want a TV on the shop floor showing the job board that auto-updates when someone moves a card from their phone?</p>
  <p class="gary-question-context">The shop floor display concept emerged from the interview. Need Gary's reaction to validate before designing.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="mobile-q6" data-vertical="mobile-optimization" data-status="unanswered">
  <p class="gary-question-text">When you log a note about a blocker, do you want the app to automatically mark the job as blocked, or would you prefer to do that as a separate step?</p>
  <p class="gary-question-context">The "notes with side effects" pattern needs validation. Auto-blocking could be powerful but might cause accidental state changes.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>
