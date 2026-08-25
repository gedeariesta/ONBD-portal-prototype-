# -*- coding: utf-8 -*-
"""Portal Map — hiring manager side. Same column shape as part 1."""

PORTAL_MAP_HM = [
# ---------------- H-00 readiness view ----------------
("Hiring manager","H-00","New hire readiness view","#/hm/","Selector","New hire selector (multiple concurrent hires)","Reference widget","n/a","Hires reporting to this manager","Second hire shown read-only to prove the multi-hire view.","—","M-13","HM Fields H-00.1","Open — volume unknown"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Score","Readiness score","Display","n/a","Computed","Plain count of tasks done over tasks assigned, with the absence of a formula stated on screen.","—","M-02","HM OI-02","Open — BLOCKS BUILD"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Score","Breakdown by owner: new hire / you / other teams","Display ×3","n/a","Computed","Separates what the manager controls from what they do not.","NH progress","M-02","PRD 3.6","Mockup only"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Header","New hire name, start date, days remaining","Display","n/a","Workday","—","—","—","HM Fields H-00.3","Aligned"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Blockers","Blockers and escalation panel","Display + action","n/a","Late/blocked tasks","Computed live: unordered computer, unassigned buddy near Day −3, overdue new hire tasks, blocked stack.","—","M-16","HM Fields H-00.8","Aligned"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Your tasks","Task cards with disposition badges","Task cards ×7-8","Mixed","—","Every card carries keep / exception-only / automate / remove / adds work.","—","M-09","HM Task Disposition","Mockup device"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Your tasks","Link to the subtraction review","Link","n/a","—","The argument screen for this side.","—","M-09","HM Task Disposition","Mockup device"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Equipment","Equipment orders table (identical to the new hire's)","Display table","n/a","Equipment Orders","One source, both sides. Names who each item waits on.","NH equipment","M-16 / L-04","Live UAT portal","Gap closed"),
("Hiring manager","H-00","New hire readiness view","#/hm/","New hire progress","Task names + status, content withheld","Display ×5","n/a","New hire task records","Sensitive rows marked 'Detail hidden' with what is withheld named.","NH all tasks","M-03 / L-05","HM OI-03","Open — BLOCKS BUILD"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Third party","PEX / EUT / CRE task status","Display ×3","n/a","Task records across teams","Badge print reflects whether the new hire submitted a photo.","NH photo task","—","PRD S2-US13 AC1","Aligned"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Rail","New hire contact card","Contact card","—","Workday","—","—","—","HM spec","Aligned"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Rail","Notice: the new hire already has your details","Display","n/a","—","Tells the manager they are contactable pre-Day 1, and that nothing sets a response expectation.","NH rail","L-03","HM OI-23","Open"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Rail","Quick confirm: your contact details","Action","No","Workday","One tap. Was a separate task; folded in because it needs no judgement.","NH manager card","M-18 / L-03","HM H-09","Gap closed"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Rail","Quick confirm: add to 4 team channels","Action","No","Team membership","One tap for all four.","—","M-18","HM H-12","Gap closed"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Rail","PEX contact + Manager Onboarding Guide link","Contact + link","—","Assigned PEX","Guide persists in the rail, not only in the notification.","—","M-15","PRD S2-US12 AC2-3","Open — content"),
("Hiring manager","H-00","New hire readiness view","#/hm/","Rail","Link: how the two portals connect","Link","—","—","Opens the handoff map.","Handoffs","—","—","Mockup device"),

# ---------------- H-03 logistics ----------------
("Hiring manager","H-03","Confirm the first-day details","#/hm/logistics","Blueprint","Where to go · parking · what to expect · dress code","Read-only ×4","n/a","NHO blueprint","Read-only. Fixing them means fixing the blueprint, so every Denver starter benefits.","NH first-day card","M-05","HM OI-05","Open — BLOCKS BUILD"),
("Hiring manager","H-03","Confirm the first-day details","#/hm/logistics","Manager input","Arrival time and where to come","Single line text","Yes","Blank","Feeds the new hire's first-day details card.","NH first-day card","L-07","HM Fields H-03.2","Gap closed"),
("Hiring manager","H-03","Confirm the first-day details","#/hm/logistics","Cover","Are you available on Day 1?","Radio","Yes","Assumed yes","'No' makes the proxy mandatory. Day 1 presence is a tracked measure.","—","—","HM Fields H-03.7","Aligned"),
("Hiring manager","H-03","Confirm the first-day details","#/hm/logistics","Cover","Day 1 proxy / delegate","Reference","Conditional","Blank","Applies to this hire only, not permanently. What a proxy can see is undefined.","NH first-day card","M-14","HM OI-12 · PRD v1.4 proxy","Open"),
("Hiring manager","H-03","Confirm the first-day details","#/hm/logistics","Manager input","Team-specific note","Multi line text","No","Blank","Optional. Also surfaces to the new hire.","NH first-day card","L-07","Assumption","Mockup only"),

# ---------------- H-04 computer ----------------
("Hiring manager","H-04","Order equipment for your new hire","#/hm/computer","Framing","This is an order, not a confirmation","Display","n/a","Live portal","Corrects the workbook baseline. Nothing ships until the manager acts.","NH equipment table","M-01","HM OI-24","Open — BLOCKS BUILD"),
("Hiring manager","H-04","Order equipment for your new hire","#/hm/computer","Selection","Three laptop options with lead times","Radio ×3","Yes","Catalogue","One option deliberately backordered so the late-delivery warning is visible.","—","M-17","PRD S2-US07 AC3","Open — content needed"),
("Hiring manager","H-04","Order equipment for your new hire","#/hm/computer","Warning","Would arrive after the start date","Display","n/a","Lead time vs start","Explains the loaner route and the notification to the equipment team.","NH equipment table","M-17","PRD S2-US07 AC4","Aligned"),
("Hiring manager","H-04","Order equipment for your new hire","#/hm/computer","Override","Reason (mandatory on the late option)","Multi line text","Conditional","Blank","Recorded with the order and shown to the new hire.","NH notification","M-01","PRD S2-US07 edge 1","Aligned"),
("Hiring manager","H-04","Order equipment for your new hire","#/hm/computer","Scope","Accessories and phone are explicitly not the manager's","Display","n/a","Live portal","States the boundary rather than leaving it implied.","NH equipment","A-40 / M-01","Merge Analysis 11","Gap closed"),

# ---------------- H-05 software ----------------
("Hiring manager","H-05","Confirm the application stack","#/hm/software","Blocked state","'There is no default stack to show you'","Display","n/a","Persona (unresolved)","The screen is drawn as it behaves today, not as intended.","—","M-04","HM OI-04","Open — BLOCKS BUILD"),
("Hiring manager","H-05","Confirm the application stack","#/hm/software","Default stack","Persona default (renders empty)","Display list","n/a","Persona","Empty because no full persona list exists in the platform.","—","M-04","PRD S2-US16 AC1","Open — BLOCKS BUILD"),
("Hiring manager","H-05","Confirm the application stack","#/hm/software","Additions","Add applications by hand (catalogue items only)","Checkbox ×8","No","Blank","Each raises its own request with its own approval flow.","—","M-04","PRD S2-US16 AC2-3","Aligned"),
("Hiring manager","H-05","Confirm the application stack","#/hm/software","Open question","May a manager remove from the default?","Display","n/a","—","Requirements cover additions in detail and never mention removals.","—","—","HM OI-08","Open"),

# ---------------- H-07 buddy ----------------
("Hiring manager","H-07","Choose an onboarding buddy","#/hm/buddy","Conflict","Buddy visibility rule switch (assignment vs 72h)","Prototype control","n/a","—","Implements both contradictory rules so the difference is arguable.","NH people rail","L-01","HM OI-22","CONFLICT — BLOCKS BUILD"),
("Hiring manager","H-07","Choose an onboarding buddy","#/hm/buddy","Suggestion","Suggested buddy with current load","Display + action","No","Suggestion engine","One tap when the manager agrees.","NH people rail","M-07","PRD S2-US18 AC1","Open"),
("Hiring manager","H-07","Choose an onboarding buddy","#/hm/buddy","Privacy","Why this person was suggested is withheld","Display","n/a","—","The criteria include a performance signal; surfacing it would show an inference about another employee.","—","M-07","HM OI-10","Open"),
("Hiring manager","H-07","Choose an onboarding buddy","#/hm/buddy","Alternatives","Filterable alternatives with capacity warning","List + action","No","Buddy pool","Warning at 3 concurrent — the limit is invented because the policy is undefined.","—","M-07","HM OI-10","Open — content needed"),
("Hiring manager","H-07","Choose an onboarding buddy","#/hm/buddy","Consequence","What happens now: assigned → notified → visible → changeable","Display ×4","n/a","—","Makes the downstream effects of the assignment visible.","NH people rail","L-01 / L-09","PRD S2-US18 AC2-3","Aligned"),

# ---------------- H-08 calendar ----------------
("Hiring manager","H-08","Set up their first day","#/hm/calendar","Auto hold","Day 1 one-to-one — placed automatically, cannot be deleted","Calendar hold","Yes","System","One hour immediately after the cohort lunch. Reschedule only.","Outlook","M-06","BTR activity 17","Aligned"),
("Hiring manager","H-08","Set up their first day","#/hm/calendar","Blueprint hold","New Hire Orientation — read-only","Calendar hold","n/a","NHO blueprint","PEX owns it; the manager cannot move it.","—","M-06","PRD S3-US06","Aligned"),
("Hiring manager","H-08","Set up their first day","#/hm/calendar","Suggested","Team intro · buddy check-in · IT setup window","Checkbox ×3","No","Blueprint suggestion","Accepted one at a time today. If auto-created, the screen becomes a glance.","—","M-06","HM OI-13","Open — BLOCKS BUILD"),

# ---------------- H-10 welcome ----------------
("Hiring manager","H-10","Send a welcome note","#/hm/welcome","Recipient","To — the new hire's personal email (read-only)","Display","n/a","Personal details task","Depends on the new hire having supplied it.","NH personal details","—","HM Fields H-10.1","Aligned"),
("Hiring manager","H-10","Send a welcome note","#/hm/welcome","Body","Standard welcome, pre-filled and editable","Rich text","Yes","Boilerplate","Written for the manager, not by them.","NH landing","M-08","HM Fields H-10.2","Open — see Alignment G-13"),
("Hiring manager","H-10","Send a welcome note","#/hm/welcome","Body","Your personal message","Multi line text","Recommended","Blank","The only part that genuinely needs the manager.","NH landing","M-08","HM Fields H-10.3","Open"),
("Hiring manager","H-10","Send a welcome note","#/hm/welcome","System block","'What to expect in your first week' — read-only","Display","n/a","New hire's task list","Generated, not written. Manager cannot edit it.","NH task list","M-08","HM Fields H-10.4","Open"),
("Hiring manager","H-10","Send a welcome note","#/hm/welcome","Sequencing","Should land before the introduction is requested","Display","n/a","—","Stated, not enforced. Three welcome messages compete for the same week.","NH introduction","L-08","Merge Analysis 7","Open"),

# ---------------- H-11 network ----------------
("Hiring manager","H-11","Name who they should meet","#/hm/network","Framing","This adds to your workload — the only item that does","Display","n/a","—","Stated on the screen rather than hidden.","—","M-10","HM OI-26","Open — needs decision"),
("Hiring manager","H-11","Name who they should meet","#/hm/network","Selection","Suggested people, pickable (7 in the pool)","Checkbox list","No","Org data","Five suggested with draft reasons; two unsuggested with none.","NH network","M-10","HM H-11","Open — see Alignment G-12"),
("Hiring manager","H-11","Name who they should meet","#/hm/network","Reason","Why should they meet this person? (required per person)","Multi line text","Yes per person","Draft text","Editable draft. Reaches the new hire verbatim.","NH network","L-06","1:1 with platform owner","Open"),
("Hiring manager","H-11","Name who they should meet","#/hm/network","Threshold","At least five people, each with a reason","Validation","Yes","—","Submit gated at five. Nobody has said what happens at three or twelve.","NH network","M-10","1:1 with platform owner","Open"),
("Hiring manager","H-11","Name who they should meet","#/hm/network","Notification","Each named person is notified","Behaviour","n/a","—","Shown as an effect; content of the notification not specified.","Named people","L-09","1:1 with platform owner","Open"),

# ---------------- H-16 forward introduction ----------------
("Hiring manager","H-16","Forward the introduction","#/hm/intro","Arrival","Task appears only after the new hire consents","Task card","n/a","New hire consent","No consent, no task — the gate is enforced across the join.","NH introduction","L-02","No source — invented","Open — no source"),
("Hiring manager","H-16","Forward the introduction","#/hm/intro","Content","What the new hire wrote, with their photo if shared","Display","n/a","New hire task","Read-only to the manager.","NH introduction","L-02","No source — invented","Open — no source"),
("Hiring manager","H-16","Forward the introduction","#/hm/intro","Action","Forward to the team","Action","No","—","Explicit send. Nothing auto-posts.","Team channel","A-14 / L-02","NH OI-11","Open"),
("Hiring manager","H-16","Forward the introduction","#/hm/intro","Destination","Where it goes: team channel, under the manager's name","Display ×3","n/a","—","New hire is told it was shared and when.","NH notification","L-02","No source — invented","Open — no source"),

# ---------------- review screens ----------------
("Hiring manager","H-SUB","The subtraction review","#/hm/subtraction","All","19 manager tasks grouped by verdict, with conditions","Review screen","n/a","HM Task Disposition","Remove rows struck through. Six groups: remove, automate, exception-only, keep, undecided, adds work.","—","M-09 / M-11 / M-12","HM Task Disposition","Mockup device"),
("Shared","HANDOFF","How the two portals connect","#/handoffs","All","Nine handoffs with direction, live state and assumption","Review screen","n/a","Computed","Reads real state, so it shows what is wired right now. Buddy row flagged as a conflict.","Both sides","L-01…L-09","This alignment pass","Mockup device"),

# ---------------- prototype devices ----------------
("Shared","PROTO","Prototype controls","(bottom left)","Controls","Persona · country · runway · task-state scenario · buddy rule","Prototype control","n/a","—","Clearly labelled as not product UI.","Both sides","A-45 / L-01","NH Stage 6","Mockup device"),
("Shared","PROTO","Assumptions & gaps panel","(ribbon)","Panel","74 entries, filterable by side, with provenance tags","Panel","n/a","—","47 new hire · 18 manager · 9 connection. Markers on screen link into it.","Both sides","all","NH + HM specs","Mockup device"),
]
