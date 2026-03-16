# ⚡ AETHER AI — Autonomous Enterprise Intelligence

[![GitHub stars](https://img.shields.io/github/stars/Souharda6996/AETHER-AI-Frontend-Proj?style=for-the-badge&color=00BAE0&labelColor=1a1a1a)](https://github.com/Souharda6996/AETHER-AI-Frontend-Proj/stargazers)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-🚀-00BAE0?style=for-the-badge&labelColor=1a1a1a)](https://aether-ai-pro.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-00BAE0?style=for-the-badge&labelColor=1a1a1a)](https://opensource.org/licenses/MIT)


**AETHER AI** is the first autonomous enterprise agent built for high-performance spatial workflows. Engineered with a **47ms P95 latency** and zero-trust security architecture, Aether deploys intelligent, self-correcting agents that scale with your infrastructure.

---

## 🚀 Live Demo
Experience Aether AI in action: **[aether-ai-pro.vercel.app](https://aether-ai-pro.vercel.app/)**

---


## 💎 Premium Experience
The frontend is designed with a **"High-End Spatial"** aesthetic, featuring:
- **Interactive 3D Environments**: Cards and elements that tilt and respond to mouse movements.
- **Dynamic Glare & Shimmer**: Premium glassmorphism with real-time lighting effects.
- **Ultra-Responsive Layout**: Optimized for desktop, tablet, and mobile with seamless transitions.

---

## 🛠️ Technology Stack

| Category | Tools & Technologies |
| :--- | :--- |
| **Frontend Core** | ![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white) |
| **Styling & UI** | ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white) ![Framer Motion](https://img.shields.io/badge/Framer--Motion-black?style=flat&logo=framer&logoColor=white) ![Radix UI](https://img.shields.io/badge/radix%20ui-161618.svg?style=flat&logo=radix-ui&logoColor=white) |
| **State & Data** | ![React Query](https://img.shields.io/badge/-React%20Query-FF4154?style=flat&logo=react-query&logoColor=white) ![Zod](https://img.shields.io/badge/zod-%233068b7.svg?style=flat&logo=zod&logoColor=white) |
| **Icons & Media** | ![Lucide](https://img.shields.io/badge/Lucide-white?style=flat&logo=lucide&logoColor=pink) ![Recharts](https://img.shields.io/badge/Recharts-222?style=flat&logo=recharts) |
| **Testing** | ![Playwright](https://img.shields.io/badge/-Playwright-%232EAD33?style=flat&logo=playwright&logoColor=white) ![Vitest](https://img.shields.io/badge/-Vitest-6E9F18?style=flat&logo=vitest&logoColor=white) |

---

## 🏗️ System Architecture: The Neural Stack

Aether operates on a modular, multi-layer architecture designed for maximum reliability and minimum latency.

```mermaid
graph TD
    subgraph "Client Layer"
        User((User)) --> Web[Web Interface]
        User --> API[Omnichannel API]
    end

    subgraph "Inference Mesh"
        Web --> Ingest[Input Layer]
        API --> Ingest
        Ingest --> LLM[LLM Core: Transformer Reasoning]
    end

    subgraph "Data & Logic"
        LLM --> Memory[Memory Store: Vector DB]
        LLM --> Tools[Tool Orchestrator]
        Tools --> Security[Security Mesh: Zero Trust]
    end

    subgraph "Delivery"
        Security --> Out[Edge Delivery: Global CDN]
        Memory --> Out
    end

    style Ingest fill:#1a1a1a,stroke:#00BAE0,stroke-width:2px
    style LLM fill:#1a1a1a,stroke:#8B5CF6,stroke-width:2px
    style Memory fill:#1a1a1a,stroke:#00BAE0,stroke-width:2px
    style Out fill:#1a1a1a,stroke:#8B5CF6,stroke-width:2px
```

---

## 🚀 Key Features

- **Autonomous Reasoning**: Multi-step chains that resolve complex queries without human intervention.
- **47ms Edge Inference**: Distributed inference mesh for globally consistent response times.
- **Enterprise Security**: SOC2 Type II compliance with end-to-end encryption.
- **Omnichannel Deploy**: One configuration for Web, Mobile, Slack, Teams, and WhatsApp.
- **Conversational Memory**: High-fidelity context retention across indefinite session lengths.

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Souharda6996/AETHER-AI-Frontend-Proj.git
   cd AETHER-AI-Frontend-Proj
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by SOUHARDA MANDAL.
</p>
