# WordQue AI — Enterprise-Grade Multi-PDF Intelligence

WordQue is a state-of-the-art, full-stack RAG (Retrieval-Augmented Generation) platform designed to transform your documents into interactive knowledge. Built with a focus on privacy, speed, and premium user experience, WordQue enables individuals and organizations to manage isolated corpora, perform semantic searches, and interact with AI-driven insights across multiple PDFs.

![WordQue Banner](https://img.shields.io/badge/WordQue-AI--Powered-emerald?style=for-the-badge&logo=openai)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FAISS](https://img.shields.io/badge/FAISS-Local--Vector--DB-blue?style=for-the-badge)

---

## 🌟 Advanced Features

### 🔐 Multi-Tenant Knowledge Isolation
*   **Private Corpora**: Every user has their own isolated knowledge base. No data leakage between accounts.
*   **Ownership Persistence**: Documents, vectors, and chat histories are strictly filtered by User ID at the database and vector-store levels.

### 🎨 Premium Aesthetics & Dark Mode
*   **Dynamic Theming**: Seamlessly switch between Light and Dark modes with a single click.
*   **Bento-Card Design**: A modern, glassmorphic UI built for clarity and visual excellence.
*   **Fully Responsive**: Optimized for mobile, tablet, and desktop devices with adaptive chat and dashboard layouts.

### 🧠 Intelligent RAG Engine
*   **Semantic Search**: Powered by local `sentence-transformers` for lightning-fast indexing and retrieval.
*   **Session-Aware Conversations**: Chat history is isolated by session, allowing you to maintain multiple deep dives simultaneously.
*   **Interactive Citations**: Every AI response includes clickable sources, showing you exactly which document and page the information came from.

### 📚 Knowledge Base & Data Control
*   **Real-time Indexing**: Upload 1-10 PDFs simultaneously with automatic metadata extraction.
*   **Advanced Settings**: Manage your profile, check live system health, and control your data privacy.
*   **Danger Zone**: One-click actions to purge entire chat histories or wipe your knowledge base securely.

### 🎓 Professional Tutor Mode
*   **Smart Quizzes**: Auto-generate MCQs, True/False, and Short Answer questions adapted to the specific domain of your PDFs.
*   **Instant Feedback**: Learn faster with real-time answer validation and detailed explanations.

### 📊 Intelligence Analytics
*   **Insight Dashboard**: Monitor your corpus size, document distribution, and AI interaction metrics in a premium visual interface.

---

## 🛠️ Technical Architecture

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | React 18, Vite, Tailwind CSS | High-performance, responsive UI |
| **Backend** | FastAPI (Python) | Robust asynchronous API layer |
| **LLM** | Google Gemini 2.0 Flash | Advanced reasoning & Q&A |
| **Embeddings** | HuggingFace (Local) | On-device semantic vector generation |
| **Vector DB** | FAISS (Facebook AI) | Local, high-speed similarity search |
| **Storage** | SQLite + SQLAlchemy | User profiles, Chat history & Metadata |
| **PDF Engine** | PyMuPDF (Fitz) | High-fidelity text & page extraction |

---

## 🚀 Getting Started

### 1. Prerequisites
*   **Python 3.10+** & **Node.js 18+**
*   **Google AI API Key** (Get it from [Google AI Studio](https://aistudio.google.com/))
*   **Google OAuth Client ID** (Optional, for Google Login)

### 2. Backend Installation
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Configure `.env` in `/backend`**:
```env
GOOGLE_API_KEY=your_key_here
GOOGLE_CLIENT_ID=optional_client_id
FAISS_INDEX_PATH=./data/faiss_index
```

### 3. Frontend Installation
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Project Structure

```text
WordQue/
├── backend/                # FastAPI Microservice
│   ├── routes/             # Isolated API Controllers
│   ├── services/           # AI Engine, Embedder, PDF Parser
│   ├── data/               # Local SQLite & Vector Storage
│   └── main.py             # Application Entry Point
├── frontend/               # Vite + React Frontend
│   ├── src/components/     # Modular UI Architecture
│   ├── src/services/       # API Integration Layer
│   └── index.css           # Global Design Tokens
└── start.ps1               # One-click script for Windows
```

---

## 🛡️ Privacy & Security
*   **Local-First Indexing**: Your actual document content is processed locally and stored in a private FAISS index on your server.
*   **Zero-Shared State**: The vector store uses a strict user-filtering logic to ensure that a search query from "User A" can never retrieve chunks belonging to "User B".

---

## 📄 License
WordQue is an open-source project intended for research and educational excellence. All rights reserved. Powered by Google Gemini.
