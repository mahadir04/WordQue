# 🌍 WordQue AI — Cloud Deployment Guide

This guide will walk you through deploying your full-stack WordQue AI platform to the internet using **Railway** (Backend) and **Vercel** (Frontend).

---

## 🏗️ Step 1: Push to GitHub
Before deploying, your code must be on GitHub.

1.  Create a **Private** repository on [GitHub](https://github.com/new) named `WordQue`.
2.  In your local terminal (`d:/WordQue`), run:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/WordQue.git
    git branch -M main
    git push -u origin main
    ```

---

## ⚙️ Step 2: Deploy Backend (Railway.app)
We use Railway because it supports **Docker** and **Persistent Storage** (required for your AI index and chat history).

1.  Go to [Railway.app](https://railway.app/) and login with GitHub.
2.  Click **+ New Project** > **Deploy from GitHub repo**.
3.  Select your `WordQue` repository.
4.  Click **Variables** and add your secrets:
    *   `GOOGLE_API_KEY`: *(Your Gemini Key)*
    *   `GOOGLE_CLIENT_ID`: *(Optional)*
    *   `FAISS_INDEX_PATH`: `/app/data/faiss_index`
5.  Click **Settings** > **Networking** > **Generate Domain**. This is your `BACKEND_URL`.
6.  **CRITICAL: Enable Persistence**
    *   Go to **Volumes** > **+ New Volume**.
    *   Mount Path: `/app/data`
    *   This ensures your PDFs and AI training don't disappear when the server restarts.

---

## 🎨 Step 3: Deploy Frontend (Vercel)
Vercel is the fastest way to host your React application.

1.  Go to [Vercel.com](https://vercel.com/) and login with GitHub.
2.  Click **Add New** > **Project**.
3.  Import the `WordQue` repository.
4.  In the **Project Settings**:
    *   **Root Directory**: Set this to `frontend`
    *   **Environment Variables**:
        *   `VITE_API_URL`: *(Paste your Railway Domain here, e.g., `https://wordque-production.up.railway.app`)*
5.  Click **Deploy**.

---

## 🔒 Step 4: Final Security Check
Once both are live, ensure your backend allows requests from your new Vercel domain.

1.  Copy your Vercel URL (e.g., `https://wordque.vercel.app`).
2.  Go to your **Backend Code** (`main.py`) or update your Railway environment variables if you've set up CORS that way.
3.  The current `main.py` is configured for `localhost`. You may need to add your production URL to the `allow_origins` list in `backend/main.py` and push the change:

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-vercel-app.vercel.app" # <--- Add this
    ],
    ...
)
```

---

## 🚀 Success!
Your platform is now live. Any PDF you upload will be stored securely on Railway's persistent volume, and your AI will be accessible from anywhere in the world.
