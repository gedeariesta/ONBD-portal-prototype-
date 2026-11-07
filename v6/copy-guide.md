# How the portal speaks

A one-page guide for anyone writing words for the portal, Sidekick or the
emails around them. It comes from three places: the Equinix Brand Center
(Voice and tone, Messaging), the positioning and messaging guide's word
choices, and Janine's ask on 6 Nov to put every word "through a global
translation layer". Her example was "somewhere else", which now reads "a
different address".

## Voice: welcoming expertise

| Trait | In the portal |
|---|---|
| Conversational | Talk with the person, not at them: "You start on Tuesday, 18 August 2026." |
| Intentional | Say why a step matters: "so your laptop, your badge and your first pay go to the right place." |
| Authentic | Say what is true, including what is not ready yet. No hype. |
| Encouraging | Say what is done and what is next: "Four things, then you're ready." |
| Inclusive | Write for someone new to Equinix, not for the project team. |

On product screens, clarity leads (the brand's WISP rule for product
writing: intelligence and simplicity first, wit second). Wit is fine in a
heading or a Sidekick greeting, never in an instruction.

## Write for translation

1. **One idea per sentence.** Over 30 words is two sentences.
2. **No idioms or slang.** Not "have them to hand", "on track", "up next",
   "shout", "your call", "the bit", "fortnight".
3. **One verb, not a phrasal verb, when one exists.** Complete (not fill in),
   return (not come back), continue (not carry on), meet (not pick up),
   appear (not fill in or turn up). Standard interface verbs stay: sign in,
   set up.
4. **Name the place or the thing.** "A different address", not "somewhere
   else". "Email, Teams and the standard tools", not "the basics".
5. **One name for one thing.** Task (not to-do, except where the current
   system is quoted), new hire (not new starter), People Experience (not
   People Operations), sign in (not log in), Onboarding Buddy.
6. **Numbers and dates.** Digits for durations and counts (10 minutes, 2
   weeks). Dates written out (Tuesday, 18 August 2026). 24-hour times.
7. **Contractions are fine** (you're, don't). Avoid 'd, and 's for "has".
8. **No** "e.g.", "i.e.", "etc.", "and/or", or "&" outside a team's name.
9. **Whole sentences in the code.** A translator sees a string, not the
   screen, and word order and plurals differ by language. The six policy
   names are stored whole for this reason, not built from "Acknowledge" +
   "the" + a title.
10. **Leave room.** German and French run about a third longer than
    English, so no fixed-width buttons or labels.

## Words from the messaging guide

- Not "platform" or "Platform Equinix": say Equinix, the portal or the system.
- Not "21st century": say modern.
- No claims we can't show: "seamless", "world-class", "instantly". Say what
  happens and when.

## What stays as written

Text quoted from another system stays verbatim: the Glint survey
questions, ServiceNow's equipment form, Inside Equinix. Sample text written
"by" Jordan or Priya was edited only where it would set a bad example
("Shout if anything is unclear").

## Checked automatically

`tools/prose.js` fails the build on the jargon list, the global-English
list and the messaging guide's words, read with design notes off on every
screen and in Sidekick on all three sides. It also flags sentences over 30
words on the new hire's screens. When a review finds another word, add it
to the list there.
