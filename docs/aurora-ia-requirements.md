# Aurora Study, Spaces and Library: IA and product requirements

Nov 25, 2026 · @Sakshi

## Summary

Keep three distinct scopes (Study, Spaces, Library) and share one interaction grammar across them. Fix Spaces before building more on it.

Study is self-directed learning on any topic the student chooses, with no course attached. The split matches the industry pattern: a quick, broad chat plus a container of chosen sources. NotebookLM, ChatGPT and Claude Projects, and Copilot Notebooks all work this way. Aurora goes further in two places no benchmarked learning product covers: Spaces that inherit a course's materials, and one Library for saved work from courses, Spaces and self-study.

Spaces is the risk. No learning product gives students a workspace where they pick the sources, so students arrive without a mental model for it. The prototype then breaks the four promises a Space makes: who owns it, where its sources come from, what Aurora is reading, and where saved work goes.

The IA alone does not make students learn. Answer-giving AI raised practice scores 48% but lowered exam scores 17% in a 2025 PNAS study. Hint-first tutoring and spaced review must be built into all three scopes.

**Decision asked for:** approve the opening requirement and priority order (content, then aha moments, then persistence, then IA polish), and the scope model, as the bar for the student pilot.

## Opening requirement

Every mode must produce a grounded, useful learning interaction and end with an unaided attempt by the student. Generated artifacts are supporting tools, not the definition of completion.

Aurora's first problem is not missing workflow. It is that its generated study content is not yet trustworthy or teachable. So the product gets students into useful retrieval quickly, adapts to what they miss, and judges success over days, not by finishing a quiz or deck.

Every session still ends in a satisfying stopping point. The student's unaided attempt is acknowledged whether or not it is correct, and what they missed comes back on a later day. Completion is never blocked on a correct answer.

## Priority order

The IA requirements later in this doc (R1 to R22) sit inside this order.

| Priority | What | Requirements |
|---|---|---|
| 1 | Content quality and grounding | C1 to C4 |
| 2 | Mode aha moments, with the persistence they depend on | A1 to A4, plus R15 (review state) and saving missed items |
| 3 | Persistence and recovery | Partial sessions, resume where you left off, R13 versions |
| 4 | IA and interaction polish | R1 to R11, generate-first defaults, optional customization, states, controls, completion UX |

## Content requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| C1 | Answers address the actual question with specific content | A subject-matter reviewer rates 9 of 10 sampled answers specific and correct. No templated study tips in place of an answer |
| C2 | Quiz questions and flashcards teach the material | Every card has a real answer, not an instruction. Every question has one defensible correct option and a source-based explanation |
| C3 | Citations open the exact source passage | Clicking any citation opens the source scrolled to the cited passage. No toasts or dead ends |
| C4 | Sourced content and general knowledge are visibly different | Unsourced statements carry "From Aurora's general knowledge". Sourced statements carry a citation |

## Aha requirements

Each mode must end with an observable, unaided learning action. Success is measured later, never by the score in the same session.

| ID | Mode | Aha moment | Success signal |
|---|---|---|---|
| A1 | Ask | The student works out a step after a hint | Correct unaided answer to a follow-up, and fewer hints needed next time |
| A2 | Quiz | A precise diagnosis of what was missed, then fixing it | Missed questions answered correctly on retry and again on a later day |
| A3 | Flashcards | Recalling, on a later day, a card missed earlier | The student returns on the scheduled day and recalls previously missed cards |
| A4 | Voice | Explaining a concept aloud, then hearing what was right plus one gap | The flagged gap is answered correctly later. Requires a long pause tolerance or "tap when done", so Aurora never cuts in while the student is thinking |

## Problem

Today the same job (ask Aurora about my materials, make practice, keep it) works three different ways. Students cannot predict what Aurora is reading or where their work went. The table lists what the prototype audit found on the assistiv-study-ui branch, and what competitors learned the hard way.

| Promise broken | What the prototype does | Benchmark evidence |
|---|---|---|
| Who owns a Space | Called private, but has a Share button, a group icon and group names ("Bio study group") | ChatGPT has Owner, Edit and Chat-only roles. Gemini Notebook keeps chat history private even in shared notebooks |
| Where sources come from | A Space linked to BIO 201 holds its own copies of the course PDFs | No consumer app can inherit course materials; this is Assistiv's advantage, unused |
| What Aurora reads | Space source checkboxes appear to carry into new sessions with no indicator. Study offers both "My notes" and "Library" | Copilot has to tell users to "add it directly" if they want a file used for sure |
| Where work goes | Studio says saves appear in the Space; they also appear in Library. Study saves to "Personal Library", a name that collides with Library itself | ChatGPT users protested when it removed the project home page that listed chats and files together |
| Citations | Clicking one shows "Opening…" and nothing opens | NotebookLM jumps to the cited passage in the source |
| Consistency | Study shows an interactive quiz in chat; Spaces shows a summary card with Review cards | Quizlet drew complaints when features moved or disappeared |
| Item chat | Library item chat has no history and no save | Gemini Notebook lets students ask the notebook chat about their quiz results |

Learning outcomes are also unaddressed. Every scope currently gives answers directly. Nothing schedules review, and no course setting controls Aurora.

## IA model

Each section keeps its own scope, defined by the job it does. What students do inside them (ask, practice, save, cite) works the same everywhere.

Library is not another home: it is a view across the homes that own each item. Three rules keep the scopes apart:

1. Only Spaces let students choose sources. Study draws on Aurora's general knowledge for any topic; Library is fixed to the item.
2. Study never builds a collection. A thread that becomes a project moves with "Continue in a Space".
3. Library chat only works on what is open. Anything it creates links back to that item.

**Object model:** Course (from the LMS), Space (student-made, optionally linked to one course) and Self-study (where Study saves land) are the only homes. Every Thread belongs to one scope. Every Saved item (note, quiz, flashcard set, document) belongs to one home and keeps a link to the thread that made it.

## Interaction pattern

Every mode in Study, Spaces and Library uses the same four parts, in this order: **Context → One primary action → Current status → Next step**. No mode adds setup forms, dashboards or onboarding. Defaults apply automatically, and customization sits behind a quiet **Change** link.

| Part | What it shows | Examples | Meets |
|---|---|---|---|
| Context line | Under the mode title: what Aurora is reading | Space: "Studying: BIO 201 · Lecture 4 · 8 sources · Change". Thread override: "Using 4 of 9 sources · Change". Study: "Topic: osmosis · Change". Library: the item title | R1, R6 |
| One primary action | A single obvious first step, with defaults applied | Ask: **Explain what you're stuck on**. Quiz: **Start quiz**. Flashcards: **Start review**. Voice: **Tap when you're ready**, then **Tap when done** | R10, A4 |
| Status line | One line near the interaction, current state only | "Your turn" · "Aurora is thinking…" · "Saved: 3 cards need review" | R8, R15 |
| Next-step row | After every session: "You made progress. What next?" | **Review missed** · **Try once more** · **Save for later**. A student who is done can stop; no action is forced | Opening requirement, A2, R15 |
| Inline recovery | Replaces "Response stopped. This answer is incomplete." No error page or modal | "We saved what you completed." **Resume** · **Retry** · **Switch to text** | Priority 3 |
| Footer | The same small footer everywhere, naming the item's one home | "Saved to BIO 201 · 3 items to review later". Study: "Saved to Self-study · 3 items to review later" | R7, R8, R14 |

Acceptance criteria:

- All four parts appear in the same order in Ask, Quiz, Flashcards and Voice, in every scope.
- No mode needs a setup step before its primary action.
- Every failure state offers Resume or Retry in place.
- Students can stop after any session without being blocked.

This pattern ships in P0 alongside R1 and R8, since it delivers both.

## P0: before the student pilot

These 11 make the three scopes legible and give every output one home. Without them, pilot feedback will be about confusion, not about Aurora.

| ID | Requirement | Applies to | Acceptance criteria |
|---|---|---|---|
| R1 | One composer with a scope label at the top that names what Aurora reads | All | Label reads "Any topic", the Space name or the item title. 8 of 10 students can say what Aurora is reading within 5 seconds |
| R2 | Study is open to any topic and answers from Aurora's general knowledge. No course chips. Remove "My notes" and "Library" as separate options | Study | One "Use my Library" toggle, off by default. When a question names an enrolled course, Aurora offers to open that course's Space instead |
| R3 | The Sources panel shows only sources inside the current scope. Every citation opens the source at the cited passage | All | No source appears that is outside the scope. No citation ends in a toast or dead end. A Study answer with no source says "From Aurora's general knowledge, not your course materials" |
| R4 | Spaces are private only in v1. Remove the Share button and group icons and names | Spaces | Create dialog, cards and Space header all say private. No sharing control exists |
| R5 | A Space linked to a course references the course materials. It never copies them | Spaces | Course files show a "From BIO 201" tag, update when the course updates, and cannot be deleted from the Space, only hidden |
| R6 | Each Space has default sources. A thread can override them; the override ends with the thread | Spaces | When a thread differs from the default, the composer shows "Using 4 of 9 sources". A new thread starts from the default |
| R7 | Every saved output has one home: its course, its Space, or Self-study. Library is a view across those homes, not a second copy | All | Deleting an item in Library removes it from the Space, and the reverse. Studio no longer says "saves appear here" as a separate store |
| R8 | One Save action whose label names the destination | All | Study: "Save to Self-study" (changeable to a Space). Spaces: "Save to Bio study group". Library: "Save as new version". The toast offers Undo for 8 seconds |
| R9 | One quiz and one flashcard component everywhere | All | Same layout, grading and save in Study, Spaces and Library. A selected answer is neutral until graded. Submitting with unanswered questions asks to confirm |
| R10 | Hint-first tutoring is the default. A full answer needs an explicit "Show answer" | All | For problem and explain requests, the first reply gives a hint or guiding question. Each explanation ends by offering practice |
| R11 | Each Space has one home page with its threads, sources and outputs, plus search across them | Spaces | A student finds a 48-hour-old output from the Space home in under 30 seconds without help |

## P1: for a pilot worth measuring

These connect the scopes to each other and to learning. Ship them during the pilot, before measuring outcomes.

| ID | Requirement | Applies to | Acceptance criteria |
|---|---|---|---|
| R12 | "Continue in a Space" moves a Study thread into a Space | Study, Spaces | Offers New Space or Add to existing. The thread keeps its messages, and its sources become the Space defaults. It is offered after the third exchange or on request |
| R13 | Library item chat keeps history, saves as a new version, and keeps version history | Library | Each item lists its past chats and versions. Any Aurora edit can be undone |
| R14 | Library location is a course, a Space or Self-study. Rename "Personal Library" to Self-study | Library | Location filter lists Self-study, then courses, then Spaces. Each item links back to the thread that made it |
| R15 | Quizzes and flashcards keep review state, and Library shows a cross-course "Due today" queue | All | Got it / Missed it per card, retake missed only, next review date per item. The queue spans every course and Space |
| R16 | Course AI settings carry into Aurora | Spaces | Course AI off: its linked Spaces stop answering, with a plain-language note. An institution setting can turn Study off. If instructors can read chats, students see that before they first ask |
| R17 | Search across threads and outputs | Spaces, Library | One search box finds words inside past threads, notes, quizzes and flashcards |
| R18 | Aurora entry points inside course content | Spaces | "Explain this" and "Quiz me on this section" on course pages open the student's Space for that course, created on first use, scoped to that section |

## P2: after the pilot

Build these only if pilot evidence asks for them.

| ID | Requirement | Applies to | Build it when |
|---|---|---|---|
| R19 | Shared Spaces with Owner, Edit and Chat-only roles. Each member's chat history stays private | Spaces | Pilot students say they need group study in Assistiv, not in another tool |
| R20 | "Exam prep" Space template: pick a course and an exam date, and Aurora schedules spaced review up to that date | Spaces | Students create Spaces mostly around exams |
| R21 | Cross-course progress on the Dashboard: what is due, what is weak, where you left off | Dashboard, Library | R15 review data exists for at least one term. This is the returning-learner promise from the Aurora brief |
| R22 | Instructor-made Spaces shared with a class as Chat-only | Spaces | Instructors ask to curate sources for students |

## Non-goals and constraints

**Not in this release**

- Auto-creating a Space for every course. A course Space is created the first time the student asks Aurora about that course (R18).
- Web search in Spaces and Library. Those answer from the student's chosen materials only. Whether Study uses the web is an open question below.
- Public or link sharing of Spaces or Library items.
- Paywalls or limits on review features. Assistiv is institution-paid; competitors' biggest complaint is paywalled review.

**Constraints every requirement must meet**

- **Accessibility, WCAG 2.2 AA.** The layout must reflow at 320 px and respect browser zoom; the prototype's whole-page scaling does neither. Flashcards must announce their answer side to screen readers.
- **Privacy.** Chat history belongs to the student. Any instructor visibility is disclosed before the first question (R16).
- **Institution control.** Admins and instructors can turn Aurora off per course, as in Canvas IgniteAI.
- **Reversibility.** Every save, move and Aurora edit can be undone (R8, R13).

## Success metrics

Targets are proposed starting points for the pilot, not benchmarks; adjust them after the first cohort.

| Outcome | Measure | Proposed target |
|---|---|---|
| Students understand the scopes | Share who can say what Aurora is reading, unprompted, in a 5-second test | 80% or more |
| Saved work is findable | Share who find a 48-hour-old output in under 30 seconds | 90% or more |
| Spaces earn their place | Share of pilot students who create a Space and return to it in 2 or more sessions | 30% or more |
| Students learn, not just finish | Delayed quiz score, hint-first vs answer-first | Hint-first equal or better |
| Review becomes a habit | Share of due review items completed within 2 days | 50% or more |
| Students trust the sources | Share of answers where the student opens a citation | Track; no target in pilot |

## Validation plan and open questions

Run the first three before building P0; they can change the model. The rest run during the pilot.

| Question | Method | Signal that answers it | When |
|---|---|---|---|
| Do students tell Study from a Space without being taught? | 5 to 8 moderated sessions on a clickable prototype with R1 to R4 | They choose the right scope for 3 of 4 tasks | Before P0 build |
| Will students make Spaces at all? | Same sessions: "You have an exam in 2 weeks, set up how you'd study" | Most reach for a Space unprompted, or name a reason not to | Before P0 build |
| Do they trust Study answers that cite no course material? | Same sessions, think-aloud on a Study answer from general knowledge | They can tell a general-knowledge answer from a sourced one | Before P0 build |
| Can they find saved work again? | 48-hour diary task in the pilot | Success rate and time to find (see metrics) | Pilot week 2 |
| Do they accept hint-first answers? | Pilot A/B, delayed quiz one week later | Hint-first scores equal or higher; frustration noted in surveys | Pilot weeks 2 to 6 |
| Do they need shared Spaces, and with what roles? | Pilot survey plus 5 follow-up interviews | Specific group tasks they could not do | End of pilot |

### Two tests to run in parallel

1. **Aha moments (A1 to A4):** 5 to 8 students per mode, each followed by an unaided check 2 to 3 days later. The signal is the success signal in the Aha requirements table, not same-session scores or "got it".
2. **Content quality (C1 to C4):** a stratified review of 48 generated items, scored with the rubric below. Results are reported per mode, never as one average. It runs without students, so it can start now.

**Content review sample:** 12 items per mode (Ask, Quiz, Flashcards, Voice), 4 from each of three topic types:

- a course-grounded STEM topic (BIO 201)
- a course-grounded reading or writing topic (UX 220)
- a Study topic with no course

Two reviewers score every item on their own first. Before any discussion, record agreement for each criterion across all 48 items, not per mode, because 12 items is too few for a stable estimate. Use weighted Cohen's kappa for two reviewers, since the 0 to 2 scale is ordered. If a third reviewer joins, use Krippendorff's alpha with an ordinal metric. Then agree on a consensus score. A criterion with agreement below 0.67 has unclear rubric wording, so fix the wording and rescore it before trusting its results.

| Criterion | 0 | 1 | 2 |
|---|---|---|---|
| Accuracy | Contains a factual error | Correct but imprecise | Fully correct |
| Specificity | Generic, could fit any topic | Partly specific | Specific to the question and its material |
| Instructional usefulness | Restates or instructs instead of teaching | Teaches but adds little | Builds understanding or tests it well |
| Grounding | Cites wrongly, claims a source it lacks, or states an unsourced claim without the "From Aurora's general knowledge" label | Correct source, vague location | Cites the exact passage, or is labeled as general knowledge |
| Answerability | Ambiguous, or more than one defensible answer | Answerable, but wording is loose | One clear, defensible answer from the material |

An unsourced claim with no label scores 0 on Grounding, as C4 requires, so it counts as a hard fail.

**Pass bar, per mode:** an average of 1.6 or higher on every criterion, and no item scores 0 on Accuracy or Grounding. The 1.6 average is provisional: revisit it after the first round of scores. The hard fail is permanent: a single invented fact or citation fails that mode, whatever its average, and only an explicit team decision can change this rule. For Ask and Voice, Answerability applies to the follow-up question Aurora asks.

**Results matrix:** consensus average per criterion (0 to 2), one row per mode. A mode passes with no hard fails and every criterion at 1.6 or higher. The overall row is for reference only and never decides a pass.

| Mode | Accuracy | Specificity | Usefulness | Grounding | Answerability | Hard fails | Pass |
|---|---:|---:|---:|---:|---:|---:|---|
| Ask | | | | | | | |
| Quiz | | | | | | | |
| Flashcards | | | | | | | |
| Voice | | | | | | | |
| Overall (reference only) | | | | | | | |

**Topic flags:** also list every combination of mode and topic type that has a hard fail or averages below 1.6 on any criterion. With 4 items per combination these flags are diagnostic only and never decide a pass. They show where a passing mode still breaks, such as Study topics with no course.

| Mode | Topic type | Criterion | Average | Hard fails |
|---|---|---|---:|---:|
| | | | | |

## Open questions for the founder and engineering

- [ ] Does Study use web search and cite web pages, or answer from Aurora's general knowledge only? This decides how R3 is met for Study.
- [ ] Can course materials be referenced by Spaces without copying, given how Assistiv stores files today? (R5)
- [ ] Which course AI settings exist today, and who controls them: admin, instructor, or both? (R16)
- [ ] Is instructor read access to student chats a requirement for any client? (R16)
- [ ] Does any pilot client require a review schedule synced to their own exam calendar? (R20)

## Sources

**Project evidence:** hands-on audit of the Assistiv prototype, assistiv-study-ui branch (sakshi2431-debug/FTF-Research-AI), November 25, 2026.

- Sana AI 101 and Sana Workspace admin guide
- Workday Learning, powered by Sana, GA
- NotebookLM renamed Gemini Notebook, NotebookLM chat and citations, Gemini Notebook flashcards and quizzes, Notebook chat in the Gemini app
- Projects in ChatGPT, Request to restore the project home page, Projects are containers, not archives
- Claude Projects
- How Copilot Notebooks works, What's new in Notebooks
- Notion personal agent
- Khanmigo features, Teacher view of Khanmigo chats, Khanmigo engagement study
- Coursera Coach
- Canvas IgniteAI Study Tools, IgniteAI Agent
- Quizlet study guides, Quizlet classes, Student reaction to Quizlet changes, Knowt on the App Store, StudyFetch reviews
- Generative AI without guardrails can harm learning (Bastani et al., PNAS 2025)
- Which study strategies make the grade (Dunlosky et al.)
- AI tutoring outperforms active learning (Scientific Reports 2025)
