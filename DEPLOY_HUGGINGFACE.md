# 🚀 WordQue AI — Free Hugging Face Deployment

This is the **100% Free** way to launch your AI backend to the world without a credit card.

---

## 🏗️ Step 1: Create the Space
1.  Go to **[huggingface.co/new-space](https://huggingface.co/new-space)**.
2.  **Name**: `WordQue`
3.  **SDK**: Select **Docker** (Very Important).
4.  **Template**: Select **Blank**.
5.  **Privacy**: Public (so your frontend can talk to it).
6.  Click **Create Space**.

---

## ⚙️ Step 2: Configure Secrets
Before you upload the code, add your API Key so the AI works:
1.  In your new Space, click **Settings**.
2.  Scroll to **Variables and secrets**.
3.  Click **New secret**.
    *   **Name**: `GOOGLE_API_KEY`
    *   **Value**: *(Paste your Gemini Key)*
4.  Click **New variable**.
    *   **Name**: `ALLOWED_ORIGINS`
    *   **Value**: `*`

---

## 📤 Step 3: Upload Code
You can now push your code from your terminal:
1.  In your local terminal (`d:/WordQue`), run:
    ```bash
    git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/WordQue
    git push hf main
    ```
    *(Note: It will ask for your Hugging Face username and your **Access Token** as the password. Get your token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens))*

---

## 🎨 Step 4: Launch Frontend (Vercel)
1.  Go to [Vercel.com](https://vercel.com/new) and import your GitHub repo.
2.  Set **Root Directory** to `frontend`.
3.  Add environment variable `VITE_API_URL` with your Hugging Face Space URL.
    *   *Note: Your HF URL will look like `https://YOUR_USERNAME-wordque.hf.space`*
4.  **Deploy**.

---

## 🎉 Success!
You now have a professional AI platform running for free.
