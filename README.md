# Cheat Code • Company-Wise LeetCode Interview Tracker

> A high-aesthetic, feature-rich web application to track, practice, and master company-wise LeetCode interview questions across 659 companies.

![Cheat Code](https://img.shields.io/badge/LeetCode-659_Companies-ff2d92?style=for-the-badge&logo=leetcode&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-ff2d92?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## ✨ Features

- **659 Companies Indexed**: Pre-compiled dataset of 3,399 verified LeetCode questions across FAANG, Big Tech, FinTech & Quant, and Top Unicorns.
- **5 Recency Timeframes**: Filter questions by `30 Days (Hot 🔥)`, `3 Months`, `6 Months`, `1 Year+`, and `All-Time`.
- **Deep Todo & SRS Tracking**: 5 problem states (`Todo`, `In Progress`, `Solved`, `Review Needed`, `Mastered`) with automated Spaced Repetition reminders (1d, 3d, 7d, 30d).
- **Personal Markdown Notes**: Jot down approaches, time complexity $O(N)$, space complexity $O(1)$, and edge cases with live edit/preview.
- **Multi-Language Code Scratchpad**: Tab-indentable code editor for Python, Java, C++, and JavaScript with boilerplate starter generation.
- **Interview Stopwatch & Countdown Timers**: Integrated 25-minute and 45-minute countdown timers with audio cues.
- **Company Overlap Matrix**: Select multiple companies (e.g. Google + Meta + Amazon) to surface high-yield intersecting questions.
- **Timed Mock Interview Simulator**: Launches a 45-minute technical interview with 2 company-frequent questions and an interview rubric checklist.
- **52-Week Activity Heatmap**: GitHub-style activity contribution grid and streak flame counter 🔥.
- **Power User Hotkeys**: Navigate with `j`/`k`, cycle status with `Space`/`x`, bookmark with `b`, spin roulette with `r`, search with `/`.
- **Sound Effects & Confetti**: Synthesized Web Audio chimes and particle confetti on solving questions.
- **Data Portability**: Full JSON backup export, JSON restore, and CSV export.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `/` or `Ctrl+K` | Focus Search Bar |
| `j` / `k` | Navigate Next / Previous Question |
| `Space` or `x` | Cycle Question Status (Todo → Solved) |
| `Enter` | Open Problem Workspace Modal |
| `b` | Toggle Bookmark / Star |
| `r` | Random Problem Roulette 🎲 |
| `o` | Open Company Overlap Matrix |
| `m` | Launch Mock Interview Session |
| `a` | Open Analytics & Activity Heatmap |
| `?` | Show Shortcuts Cheat Sheet |
| `Esc` | Close Active Modal |

---

## 📂 Project Structure

```
leetcode/
├── public/
│   └── data/
│       └── leetcode_company_data.json   # Pre-compiled 1.95MB static bundle
├── scripts/
│   ├── build_dataset.py                 # Parser & compiler for 659 companies
│   └── verify_app.py                    # Automated test & validation suite
├── src/
│   ├── components/                      # UI components (Navbar, Table, Modals, etc.)
│   ├── data/
│   │   └── company_meta.json            # Fast-bootstrap company metadata
│   ├── services/
│   │   └── storage.ts                   # LocalStorage, SRS, export/import
│   ├── types/
│   │   └── index.ts                     # TypeScript definitions
│   ├── utils/
│   │   └── sound.ts                     # Web Audio synthesizer
│   ├── App.tsx                          # Core application orchestrator
│   ├── index.css                        # Design tokens & theme styles
│   └── main.tsx                         # Entry point
└── repo_data/                           # Raw CSV files from upstream repository
```

---

## 📄 Credits
Interview question data sourced and updated from [`snehasishroy/leetcode-companywise-interview-questions`](https://github.com/snehasishroy/leetcode-companywise-interview-questions).

---

## 👥 Contributors
- [Abhinav Sharma](https://github.com/Kitchenwasher)
- [Bismeet](https://github.com/Bismeet)

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for details.
