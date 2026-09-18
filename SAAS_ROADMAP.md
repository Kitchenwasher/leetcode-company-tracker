# 🚀 LeetTracker Pro — SaaS Architecture & Feature Roadmap

This document defines the product roadmap, architectural design, and implementation specification for transforming **LeetTracker Pro** into a comprehensive, multi-tenant SaaS interview preparation platform.

---

## 🏗️ Master Architectural Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LEETTRACKER PRO (SaaS)                          │
├────────────────────────────────────────────────────────────────────────┤
│  [ Auth & Multi-User Identity ]      [ SaaS Subscription & Tiering ]   │
│  • Guest / Free / Pro / Enterprise   • Free: Core Tracker & Filters    │
│  • Email + Password & Social OAuth   • Pro: Unlimited Mocks, Anki,     │
│  • Isolated Per-User Workspace State   WASM Runner, Advanced Analytics │
├────────────────────────────────────────────────────────────────────────┤
│                          CORE PREP ENGINES                             │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐ │
│  │ 1. Curated Roadmaps   │  │ 2. Anki Flashcard SRS │  │ 3. Planner  │ │
│  │ Blind 75, NeetCode 150│  │ Active Recall Trainer │  │ Company Pacer││
│  │ Striver 180, Grind 75 │  │ Invariant & Time Flip │  │ Countdown   │ │
│  └───────────────────────┘  └───────────────────────┘  └─────────────┘ │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐ │
│  │ 4. Custom Tags/Notes  │  │ 5. Universal Exporter │  │ 6. Whiteboard││
│  │ Rich Markdown Notes   │  │ Anki .csv, Obsidian   │  │ Graph/Tree  │ │
│  │ #revisit, #tricky     │  │ Markdown, JSON Backup │  │ Canvas Tool │ │
│  └───────────────────────┘  └───────────────────────┘  └─────────────┘ │
│                                                                        │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │ 7. In-Browser C++ Run │  │ 8. LeetCode Profile Auto-Sync          │ │
│  │ Sandbox Test Runner   │  │ Public GraphQL / Solved Import         │ │
│  └───────────────────────┘  └────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│                   DATA LAYER & STORAGE ISOLATION                       │
│  • Multi-user isolated storage: `leettracker_user_{userId}_data`       │
│  • Seamless offline-first persistence + ready for Cloud DB sync        │
│  • 3,399 verified questions & on-demand multi-approach C++ solutions   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💎 Phase 1: SaaS Foundation & Multi-User Authentication

### 1.1 User Identity & Auth State (`src/context/AuthContext.tsx`)
- **User Schema**:
  ```typescript
  export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    tier: 'free' | 'pro' | 'enterprise';
    leetcodeUsername?: string;
    targetCompany?: string;
    targetDate?: string;
    createdAt: string;
  }
  ```
- **Authentication Flows**:
  - **Sign In / Sign Up**: Email and password with instant client-side validation.
  - **Quick Demo Accounts**: Pre-configured instant one-click logins (`Alex (Pro FAANG Candidate)`, `Sarah (Free Explorer)`).
  - **Social OAuth Integration**: Simulated Google / GitHub 1-click SSO.
  - **Guest Mode**: Effortless exploration with option to convert to a permanent account without losing progress.
  - **Per-User State Isolation**: User data (solved problems, notes, flashcard reviews, whiteboard drawings) is strictly scoped to the logged-in user ID (`leettracker_user_{userId}_data`).

### 1.2 SaaS Subscription & Tiering (`src/components/SubscriptionModal.tsx`)
- **Tier Differentiation**:
  - **Free Tier**: Access to all 659 companies, 3,399 questions, C++ solutions, standard filters, 1 mock interview per day.
  - **Pro Tier ($9/mo or $79 Lifetime)**: Unlimited mock interviews, Anki deck export, interactive whiteboard canvas, interview pacing planner, multi-company overlap matrix, in-browser C++ runner.
- **Interactive Upgrade Modal**:
  - Feature comparison table.
  - Monthly vs Annual toggle with discount badge.
  - Simulated 1-click checkout with instant upgrade notification and sound effect.

### 1.3 User Profile & Navbar Dropdown
- User avatar with initials and `PRO` glow badge.
- Quick user menu: Profile Details, Subscription Status, Change Password, Switch Account, and Sign Out.

---

## 🎯 Phase 2: Feature Implementation Roadmap

### Feature 1: Curated Roadmaps (Blind 75, NeetCode 150, Striver SDE Sheet)
- **Concept**: Curated roadmap pill selector in the filter bar.
- **Roadmap Tracks**:
  - **Blind 75**: The essential 75 classic interview questions.
  - **NeetCode 150**: Expanded 150 structured pattern questions.
  - **Striver SDE Sheet**: Top 180 comprehensive coding interview problems.
  - **Company Hot 30**: Top 30 most frequent questions for the selected company.
- **UI Enhancements**:
  - Roadmap progress bar (e.g. `NeetCode 150: 42 / 150 (28%)`).
  - Track badges on question cards and table rows.

### Feature 2: Anki-Style Flashcard Recall Trainer (`FlashcardModal.tsx`)
- **Concept**: Active recall flashcard system powered by Spaced Repetition (SRS).
- **Study Workflow**:
  1. **Prompt**: Shows problem title, difficulty, company tags, and key prompt: *"What is the optimal algorithmic paradigm & time/space complexity?"*
  2. **Recall Action**: User thinks or types their answer.
  3. **Flip Card**: Reveals Approach 3 (Optimal C++ solution), invariant proof, and edge cases.
  4. **SRS Rating**:
     - 🔴 **Again** (+1 day)
     - 🟡 **Hard** (+3 days)
     - 🟢 **Good** (+7 days)
     - 🔵 **Easy** (+14 days)
- Directly updates problem status and `nextReviewAt` in the user's isolated profile.

### Feature 3: Company Interview Pacing Planner (`PrepPlannerModal.tsx`)
- **Concept**: Reverse-engineered preparation roadmap based on interview target date.
- **Inputs**:
  - Target Company (e.g., *Google*).
  - Target Interview Date (e.g., *30 days from today*).
  - Available Daily Study Time (e.g., *2 hours / 3 problems per day*).
- **Generated Plan**:
  - **Phase 1 (Days 1–7)**: Top 30-Day Hot Problems (recency priority).
  - **Phase 2 (Days 8–18)**: Top 3-Month Core Patterns & Hard Questions.
  - **Phase 3 (Days 19–25)**: High-Overlap Questions (cross-company staples).
  - **Phase 4 (Days 26–30)**: Full-length Timed Mock Interviews & Invariant Review.
- Visual pacing speedometer and daily quota tracker.

### Feature 4: Custom Tags & Rich Markdown Personal Notes
- **Concept**: Personalized tagging and Markdown notes for every problem.
- **Capabilities**:
  - Add and remove custom tags (e.g., `#revisit-before-onsite`, `#monotonic-stack`, `#edge-case-overflow`).
  - Tag filter chip bar in `FilterBar.tsx` allowing instant filtering by custom tags.
  - Markdown notes editor in `QuestionDetailModal.tsx` with bold, code blocks, lists, and instant preview.

### Feature 5: Universal Data Export & Backup Suite
- **Export Formats**:
  1. **Anki Deck Export (`.csv`)**: Formatted with Front (Question, Topics, Companies) and Back (Optimal C++ solution + Theory + Invariant) for direct 1-click import into Anki.
  2. **Obsidian / Notion Markdown Export (`.md`)**: Generates a clean, formatted Markdown cheat sheet of all solved problems, personal notes, and C++ snippets.
  3. **Full JSON Backup & Restore**: Complete snapshot of all progress, notes, tags, and settings.

### Feature 6: In-Browser Whiteboard & Diagram Canvas (`WhiteboardCanvas.tsx`)
- **Concept**: Scratchpad drawing canvas embedded into problem and mock interview modals.
- **Tools**: Freehand drawing pen, shapes (circle nodes for binary trees/graphs, boxes for arrays, arrows for pointers), color selector, eraser, clear, and undo.
- **Persistence**: Drawings automatically saved per problem in the user's profile.

### Feature 7: In-Browser C++ Code Runner & Playground
- **Concept**: Interactive C++ editor tab with execution simulation and syntax checks.
- **Features**:
  - Pre-filled with LeetCode C++ function signatures.
  - Custom test case inputs.
  - Output console with stdout, return value, execution time, and memory usage.

### Feature 8: LeetCode Profile Sync / Import
- **Concept**: Import already solved problems directly from a public LeetCode profile.
- **Features**:
  - Username input field.
  - Import solved problem IDs and map them to the local tracker.
  - Option to merge or overwrite progress.

---

## 📅 Implementation Phasing

| Phase | Component / Feature | Deliverables | Status |
|:---|:---|:---|:---:|
| **Phase 1** | **SaaS Architecture & Auth** | `AuthContext`, Sign In/Sign Up Modal, User Profile dropdown, `SubscriptionModal` (Free vs Pro) | ⏳ Planned |
| **Phase 2** | **Curated Roadmaps** | Blind 75, NeetCode 150, Striver 180 roadmap filters and progress trackers | ⏳ Planned |
| **Phase 3** | **Anki Flashcard Mode** | `FlashcardModal` with active recall, flip animations, and SRS rating triggers | ⏳ Planned |
| **Phase 4** | **Company Pacing Planner** | `PrepPlannerModal` with 4-week milestone generator and countdown speedometer | ⏳ Planned |
| **Phase 5** | **Custom Tags & Notes** | Tag manager, FilterBar tag integration, and Markdown notes editor | ⏳ Planned |
| **Phase 6** | **Universal Exporter** | Anki `.csv` generator, Obsidian `.md` exporter, and JSON backup/restore | ⏳ Planned |
| **Phase 7** | **Whiteboard Canvas** | HTML5 interactive drawing canvas with shapes, tree nodes, and per-problem save | ⏳ Planned |
| **Phase 8** | **In-Browser C++ Runner** | C++ code runner playground with test case runner and console output | ⏳ Planned |
| **Phase 9** | **LeetCode Profile Sync** | Profile sync modal with username lookup and bulk question import | ⏳ Planned |
