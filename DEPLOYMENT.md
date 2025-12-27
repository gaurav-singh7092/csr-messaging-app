# Deployment Guide

## Recommended Setup: Render (Backend) + Vercel (Frontend)

### 🚀 Backend Deployment (Render)

1. **Create a Render account** at [render.com](https://render.com)

2. **Deploy via GitHub:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory as root
   - Configure:
     - **Name:** `branch-messaging-api`
     - **Runtime:** Python 3
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables:**
   ```
   PYTHON_VERSION=3.11
   DATABASE_URL=sqlite+aiosqlite:///./branch_messaging.db
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```

4. **Note your API URL** (e.g., `https://branch-messaging-api.onrender.com`)

---

### 🎨 Frontend Deployment (Vercel)

1. **Create a Vercel account** at [vercel.com](https://vercel.com)

2. **Deploy via GitHub:**
   - Click "Add New Project"
   - Import your GitHub repository
   - Set the **Root Directory** to `frontend`
   - Vercel auto-detects Next.js

3. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://branch-messaging-api.onrender.com
   NEXT_PUBLIC_WS_URL=wss://branch-messaging-api.onrender.com
   ```

4. **Deploy!** Vercel will build and deploy automatically.

---

### 🔄 Alternative: Deploy Both on Render

Use the `render.yaml` blueprint file:

1. Go to Render Dashboard
2. Click "New" → "Blueprint"
3. Connect your repository
4. Render will detect `render.yaml` and deploy both services

---

### ⚙️ Environment Variables Reference

#### Backend (Render)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite+aiosqlite:///./branch_messaging.db` |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `https://your-app.vercel.app` |

#### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://branch-messaging-api.onrender.com` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL (use `wss://` for HTTPS) | `wss://branch-messaging-api.onrender.com` |

---

### 🔧 Post-Deployment Checklist

- [ ] Backend health check: `https://your-api.onrender.com/health`
- [ ] Backend API docs: `https://your-api.onrender.com/docs`
- [ ] Frontend loads correctly
- [ ] WebSocket connection works (check browser console)
- [ ] Update `CORS_ORIGINS` on backend with your actual frontend URL

---

### 📝 Notes

- **Free tier limitations:** Render free tier services spin down after inactivity. First request may take ~30 seconds.
- **WebSocket on HTTPS:** Always use `wss://` (not `ws://`) when frontend is served over HTTPS.
- **Database:** SQLite works for demos. For production, consider upgrading to PostgreSQL on Render.
