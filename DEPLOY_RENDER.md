# 🌍 WordQue AI — Render Deployment Guide (Alternative)

Since Railway is unavailable, we will use **Render.com**. It is very stable and easy to set up.

---

## 🏗️ Step 1: Deploy Backend (Render.com)

1.  Go to **[Render.com](https://render.com/)** and sign in with GitHub.
2.  Click **New +** > **Web Service**.
3.  Connect your `WordQue` repository.
4.  **Configuration**:
    *   **Name**: `wordque-backend`
    *   **Root Directory**: `backend`
    *   **Environment**: `Docker` (Render will automatically see your `backend/Dockerfile`).
5.  **Environment Variables**:
    *   `GOOGLE_API_KEY`: *(Your Gemini Key)*
    *   `ALLOWED_ORIGINS`: `*`
    *   `FAISS_INDEX_PATH`: `/opt/render/project/src/data/faiss_index`
6.  **Persistent Storage (Crucial)**:
    *   Scroll down to **Disk**.
    *   Click **Add Disk**.
    *   **Name**: `wordque-data`
    *   **Mount Path**: `/opt/render/project/src/data`
    *   **Size**: 1GB is plenty.
7.  Click **Create Web Service**.

---

## 🎨 Step 2: Deploy Frontend (Vercel or Render)

You can use **Vercel** (recommended) or **Render Static Site**.

**Using Vercel**:
1.  Go to [Vercel.com](https://vercel.com/new).
2.  Import `WordQue`.
3.  Set **Root Directory** to `frontend`.
4.  Add `VITE_API_URL` variable with your new Render URL (e.g., `https://wordque-backend.onrender.com`).
5.  **Deploy**.

---

## 🛠️ Note on Persistent Storage
Render's persistent disks require a small monthly fee ($7/mo). If you need a **completely free** option without a credit card, you can try **Koyeb** or **Hugging Face Spaces** (Docker mode), but they may reset your data when the app sleeps.

For a production-grade launch, **Render with a Disk** is the best alternative to Railway.
