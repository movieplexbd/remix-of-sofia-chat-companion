# Sofia Chat Companion — Advanced Intelligence Engine v6.5

Welcome to the **Sofia Chat Companion**, a cutting-edge, autonomous AI chat system built with React, TypeScript, and a highly sophisticated custom intelligence engine. Sofia is not just a chatbot; she is an evolving entity with memory, reasoning, and autonomous learning capabilities.

## 🚀 Project Overview

Sofia is designed to provide a deeply personalized and intelligent chat experience. The project consists of a high-performance frontend, a multi-layered intelligence engine, and a comprehensive Admin Panel for real-time monitoring and training.

### Key Highlights
- **Autonomous Mind:** Features active learning, curiosity, and meta-cognition.
- **Advanced Reasoning:** Multi-hop reasoning, contradiction detection, and evidence aggregation.
- **Evolving Knowledge:** Knowledge graphs, hierarchical ontology, and semantic concept engines.
- **Real-time Administration:** A powerful dashboard to monitor Sofia's "brain" and manage her knowledge base.

---

## 🧠 The Intelligence Engine (Sofia Layer v6.5)

The heart of the project is the `src/engine/intelligence` layer. It operates through a multi-phase pipeline:

| Phase | Component | Description |
| :--- | :--- | :--- |
| **Phase 1-3** | `normalizer` & `synonymEngine` | Text cleaning and query expansion using canonical word mapping. |
| **Phase 17** | `conceptEngine` | Detects semantic concepts and expands queries based on conceptual aliases. |
| **Phase 18** | `ontology` | Maps queries to a hierarchical category structure for better context. |
| **Phase 19** | `multiHopReasoner` | Navigates the knowledge graph to find non-obvious connections. |
| **Phase 20** | `topicDetector` | Identifies the core subject of the conversation for targeted responses. |
| **Phase 22** | `contradictionDetector` | Detects and manages conflicting facts in the knowledge base. |
| **Phase 24** | `rankingPipeline` | Intelligent re-ranking of responses using concept/ontology/topic boosts. |
| **v6.5** | `autonomousMind` | The "Self" layer: Inference, Curiosity, and Meta-Cognitive reflection. |

---

## 🛠️ Admin Panel Features

The Admin Panel is a mission control for Sofia, allowing you to:
- **Dashboard:** Real-time stats on bot performance and feedback.
- **QA Management:** CRUD operations for Sofia's core knowledge (Questions & Answers).
- **Mind Dashboard:** Visualize inferred facts, knowledge gaps, hypotheses, and weak domains.
- **Graph Viewer:** Inspect the internal Knowledge Graph and node relationships.
- **Auto-Trainer:** Autonomous generation of question variants to improve matching.
- **Analytics & Insights:** Deep dive into user behavior and engine performance.
- **Power Tools:** Bulk updates, find & replace, and database backup/restore.

---

## 💻 Tech Stack

- **Frontend:** React 18, Vite, TypeScript
- **UI Components:** Shadcn UI, Tailwind CSS, Lucide Icons
- **State Management:** React Hooks, TanStack Query
- **Database:** Firebase Realtime Database
- **Testing:** Vitest, Playwright

---

## ⚙️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/) (Recommended) or Pnpm/Npm

### 1. Clone the Repository
```bash
git clone https://github.com/movieplexbd/remix-of-sofia-chat-companion.git
cd remix-of-sofia-chat-companion
```

### 2. Install Dependencies
```bash
bun install
# or
npm install
```

### 3. Firebase Configuration
Create a `.env` file or update `src/constants/firebaseConfig.ts` with your Firebase credentials:
```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Run the Development Server
```bash
bun dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📖 Usage

### Chatting with Sofia
- Interact with the chat interface on the main page.
- Sofia uses her **Episodic Memory** to remember previous turns and **Context Memory** to resolve follow-up questions.

### Accessing the Admin Panel
- Navigate to `/admin`.
- Default login credentials (if not modified) are managed via `AdminLogin.tsx`.

---

## 🤝 Contributing

We welcome contributions to Sofia's intelligence! 
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

Developed with ❤️ by the **MovieplexBD** Team.
