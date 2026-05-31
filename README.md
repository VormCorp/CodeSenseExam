<p align="center">
  <img src="banner.png" alt="VormCorp EdTech Banner" width="100%">
</p>

# Code Sense — Stage 4 Software Engineering Quiz

**A browser-based, anti-cheat Python assessment for NSW Stage 4 students**

> *Designed for Year 7 Software Engineering classrooms where take-home tasks are increasingly vulnerable to undisclosed AI assistance.*

---

## The Problem: AI Use in Take-Home Coding Tasks

### A Brief Literature Review

The emergence of large language model (LLM) tools — including ChatGPT, GitHub Copilot, and Google Gemini — has fundamentally altered the landscape of programming education. Finnie-Ansley et al. (2022) were among the first computing educators to formally document this shift, demonstrating that OpenAI Codex could correctly solve the majority of introductory programming questions used in university assessments, often achieving results equivalent to a B-grade student. Shortly after, Becker et al. (2023) extended this analysis, concluding that LLMs had effectively rendered traditional take-home coding tasks "trivially solvable" for any student with internet access, and calling for urgent redesign of programming pedagogy at all levels. The challenge is not theoretical: students at all stages of education now routinely have access to tools that can produce syntactically correct, task-appropriate code on demand.

The more pressing concern for educators is not that students *use* AI, but that they use it **without declaring it**. Cotton et al. (2024) found that many students perceive AI-generated submissions as ethically ambiguous — distinct from traditional plagiarism — and therefore do not self-report its use. This perception gap is documented empirically by Gonsalves (2024), whose study at a UK business school found that 74% of students who had used AI in their submitted work failed to declare it, even when a mandatory disclosure statement was explicitly required. These students were not necessarily acting deceptively; many had simply not developed a coherent personal framework for what constitutes AI-assisted work versus their own. Perkins (2023) characterises this as a structural failure: institutions and teachers have not yet given students the language, norms, or assessment conditions that would make honest AI disclosure the default behaviour.

For programming-specific tasks, the problem is compounded by the invisibility of AI involvement. Unlike essay writing, where stylistic inconsistencies may signal AI authorship, code produced by an LLM is functionally indistinguishable from student-written code and can be easily personalised with variable renaming and minor restructuring (Lau & Guo, 2023). Lau and Guo surveyed university programming instructors and found that most had already encountered suspected AI-assisted submissions, yet felt ill-equipped to detect or respond to them. Critically, the same study found that instructors viewed the problem as growing fastest in take-home and project-based tasks — precisely the formats most common in secondary digital technologies curricula.

Kasneci et al. (2023) argue that the appropriate response is not to prohibit AI outright, but to design assessments that authentically probe student understanding in ways that AI delegation cannot mask. This project reflects that principle. *Code Sense* is not designed to make AI *use* impossible — it is designed to make AI *substitution* detectable and to ensure that the act of completing the quiz produces genuine learning, not just a correct answer. The quiz runs entirely within a controlled browser environment, without copy-paste access to question text, without tab-switch invisibility, and with answers stored in a form that requires understanding rather than transcription to respond correctly.

---

## Project Overview

**Code Sense** is a self-contained, single-session browser quiz covering NSW Stage 4 Software Engineering content across three sections:

**V2 - All in one giant HTML file which will run perfectly fine on school PCs or you can distribute to students.**

**V3 is the latest release. I added basic browser security after finding casual/out of subject teachers didn't notice double tabbers and inspectors. The JS is therefore separated from the HTML.**

Both versions need a working internet connection for the CSS and some functionality.d 

**This is offered entirely 'as is' and unbranded to a large degree. V2 allows you to change the PIN (no hashing). Student email is given light validation (name@education.nsw.gov.au) and no verification. No data is stored. V3 would require reworking the hashing unless you want to use the PIN ID (see V2 code) 🙂 for that.

## Where does this sit in the new curriculum

The 2026 academic year mandates explicit instruction regarding the ethical deployment and operational limits of AI in the classroom. This assessment directly evaluates student compliance with the [NSW Department of Education Guidelines regarding the use of generative AI](https://education.nsw.gov.au/teaching-and-learning/education-for-a-changing-world/guidelines-regarding-use-of-generative-ai), specifically testing core system safety competencies and data boundaries.

| Section | Focus | Questions | Points |
|---------|-------|-----------|--------|
| A | Python Syntax & Logic | Q1 – Q20 | 50 pts |
| B | Computational Thinking | Q21 – Q30 | 25 pts |
| C | AI & Ethics | Q31 – Q35 | 25 pts |

**Total: 35 questions · 100 points**

Questions are levelled using the SOLO taxonomy (Biggs & Collis, 1982):

- **Getting Started** — Unistructural: single-concept recall
- **Finding My Feet** — Multistructural: multiple related concepts
- **Connecting the Dots** — Relational: applying connections between ideas
- **Thinking Like a Programmer** — Extended Abstract: transfer and evaluation

Question formats include multiple choice, select-all-that-apply, drag-to-reorder, drag-to-match, and code hotspot (click the buggy line). On completion, students download a PDF results report for upload to Google Classroom.

---

## Features

- **PIN-gated access** — the teacher distributes the session PIN; students cannot begin without it
- **Email capture** — student school email is embedded in the PDF filename and header
- **Lives system** — 3 lives lost by using hints or repeated tab-switching; creates mild exam conditions
- **Hint system** — 3 hints available; each costs a life; hints are written to guide thinking rather than reveal answers
- **Section banners** — animated transitions between the three content sections
- **Confetti completion overlay** — celebrates completion before redirecting to the PDF download screen
- **PDF results** — client-side generated; includes score, performance band, section breakdown, SOLO level breakdown, per-question result table, and a tab-switch warning if triggered
- **No server required** — runs entirely from the filesystem; no data ever leaves the student's device

---

## Anti-Cheat Security Measures

This quiz is designed to raise the effort required to cheat to a level above that required to simply attempt the quiz honestly.

### 1. PIN Hash (SHA-256)
The session PIN is never stored in plaintext. It is verified by hashing the entered value with a salt and comparing against a pre-computed SHA-256 digest using the Web Crypto API. Viewing the source reveals only the hash, not the PIN.

### 2. Answer Obfuscation
All correct answers are separated from the question data and stored as an XOR-obfuscated, base64-encoded string. The answers array is decoded once at runtime into an anonymous closure variable. Searching the source for common patterns like `correct:` or `answer:` returns no matches.

### 3. DevTools Keyboard Shortcut Blocking
The following shortcuts are intercepted and suppressed:

| Shortcut | Purpose blocked |
|----------|----------------|
| F12 | Opens DevTools |
| Ctrl / Cmd + Shift + I | Inspector panel |
| Ctrl / Cmd + Shift + J | Console |
| Ctrl / Cmd + Shift + C | Element picker |
| Ctrl / Cmd + U | View page source |

### 4. Right-Click Disabled During Quiz
The context menu is suppressed while the quiz screen is active, blocking "Inspect Element" access.

### 5. Tab-Switch Detection
`visibilitychange` events are monitored throughout the quiz. Each time a student navigates away from the quiz tab:

- The switch is counted
- On return, a modal warning is displayed stating the switch has been recorded
- From the 3rd switch onward, a life is deducted on every odd-numbered switch
- The total switch count is printed as a flagged warning line in the student's PDF results, visible to the teacher

This makes tab-switching to look up answers both visible to the teacher and costly to the student.

---

## File Structure

```
PythonBeginnersExam/
├── python_quiz_vorm_v3.html   ← Main file: HTML structure + CSS
├── quiz.js                    ← All quiz logic, security, and question data
└── README.md                  ← This file
```

Both `python_quiz_vorm_v3.html` and `quiz.js` must be in the **same directory**. The quiz is launched by opening `python_quiz_vorm_v3.html` in a browser.

> **Note:** The earlier file `python_quiz_vorm_v2.html` is retained as a reference copy. It is functionally equivalent but stores the PIN in plaintext and embeds answers directly in question objects — it should not be distributed to students.

---

## Deployment

This quiz requires no server, no build step, and no internet connection beyond the initial CDN asset load (Semantic UI, jsPDF, Google Fonts).

`index.html` is a copy of `python_quiz_vorm_v3.html` purly for the purpose of using GitHub pages.

**To distribute to students:**

1. Copy both `python_quiz_vorm_v3.html` and `quiz.js` to a shared drive, USB, or Google Classroom attachment
2. Confirm students open `python_quiz_vorm_v3.html` in Chrome or Edge (Firefox and Safari also supported)
3. Provide the session PIN verbally or via a separate channel — never in the same file as the quiz
4. Students complete the quiz, download the PDF, and upload it to Google Classroom

**Teacher checklist before distributing:**
- [ ] Test the PIN works in your target browser
- [ ] Confirm PDF download works and includes the student's email
- [ ] Brief students that tab-switching is recorded — tell them it exists, not how it works

---

## Curriculum Alignment

This quiz aligns with the **NSW Education Standards Authority (NESA) Stage 4 Technology Mandatory** syllabus and the **Digital Technologies** component of the **Stage 4 Software Engineering** elective, specifically:

- **Procedural programming:** variables, data types, operators, control flow, iteration
- **Computational thinking:** problem decomposition, data structure selection, algorithm design
- **Digital citizenship:** responsible use of AI tools, academic integrity in a generative AI context, recognising the difference between AI-assisted learning and AI-substituted work

---

## Dependencies

All loaded from CDN at runtime:

| Library | Version | Purpose |
|---------|---------|---------|
| Semantic UI | 2.5.0 | Base CSS reset |
| jQuery | 3.7.1 | DOM utility |
| jsPDF | 2.5.1 | Client-side PDF generation |
| Google Fonts | — | Space Mono, DM Sans |

---

## References

Becker, B. A., Denny, P., Finnie-Ansley, J., Luxton-Reilly, A., Prather, J., & Santos, E. A. (2023). Programming is hard—or at least it used to be: Educational opportunities and challenges of AI code generation. In *Proceedings of the 54th ACM Technical Symposium on Computer Science Education* (pp. 500–506). ACM. https://doi.org/10.1145/3545945.3569759

Biggs, J. B., & Collis, K. F. (1982). *Evaluating the quality of learning: The SOLO taxonomy*. Academic Press.

Cotton, D. R. E., Cotton, P. A., & Shipway, J. R. (2024). Chatting and cheating: Ensuring academic integrity in the era of ChatGPT. *Innovations in Education and Teaching International*, *61*(2), 228–239. https://doi.org/10.1080/14703297.2023.2190148

Finnie-Ansley, J., Denny, P., Becker, B. A., Luxton-Reilly, A., & Prather, J. (2022). The robots are coming: Exploring the implications of OpenAI Codex on introductory programming. In *Proceedings of the 24th Australasian Computing Education Conference* (pp. 10–19). ACM. https://doi.org/10.1145/3511861.3511863

Gonsalves, C. (2024). Addressing student non-compliance in AI use declarations: Implications for academic integrity and assessment in higher education. *Assessment & Evaluation in Higher Education*. Advance online publication. https://doi.org/10.1080/02602938.2024.2415654

Kasneci, E., Sessler, K., Küchemann, S., Bannert, M., Dementieva, D., Fischer, F., Gall, T., Giannini, P., Küchemann, S., Montag, C., Mousavinasab, R., Sailer, M., & Kasneci, G. (2023). ChatGPT for good? On opportunities and challenges of large language models for education. *Learning and Individual Differences*, *103*, 102274. https://doi.org/10.1016/j.lindif.2023.102274

Lau, S., & Guo, P. J. (2023). From "ban it till we understand it" to "resistance is futile": How university programming instructors plan to adapt as more students use AI code generation and explanation tools such as ChatGPT and GitHub Copilot. In *Proceedings of the 2023 ACM Conference on International Computing Education Research*. ACM. https://doi.org/10.1145/3568813.3600138

Perkins, M. (2023). Academic integrity considerations of AI large language models in the post-pandemic era: ChatGPT and beyond. *Journal of University Teaching and Learning Practice*, *20*(2), Article 7. https://doi.org/10.53761/1.20.02.07

---

*Vorm Education · Code Sense · Stage 4 Software Engineering*  
*This quiz generates no server-side data. All student responses are processed and stored in the browser session only.*
