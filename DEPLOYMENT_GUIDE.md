# Ultimate Deployment Guide

I have successfully updated your codebase. Your project is now functionally ready to be deployed to the internet! We will deploy the Backend (Python/FastAPI) to **Render** and the Frontend (React) to **Vercel**. 

Follow these steps exactly in order:

## Step 1: Push Your Code to GitHub
1. Create a free account on GitHub (https://github.com) if you haven't already.
2. In your terminal, navigate to your root project folder: `C:\Users\Tanisha P Paunikar\OneDrive\Desktop\npm run dev`.
3. Run the following commands to push your project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/texon09/SHIELD.git
   git push -u origin main
   ```

## Step 2: Deploy Backend to Render
Render will host your Python API and protect your local SQLite database with a persistent disk.

1. Go to [Render.com](https://render.com) and create an account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select the repository you just pushed.
4. Fill out the configuration:
   - **Name:** shield-backend
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. *Wait before hitting deploy!* Scroll down and click **Advanced**.
   - Click **Add Disk**.
   - Name it `data-disk`.
   - Mount Path: `/opt/render/project/src/data`
   - Size: `1 GB`
6. Click **Create Web Service**.
7. Once it finishes building, Render will give you a live URL at the top left (e.g., `https://shield-backend.onrender.com`). **Copy this URL.**

## Step 3: Deploy Frontend to Vercel
Vercel will host your React interface.

1. Go to [Vercel.com](https://vercel.com) and create an account.
2. Click **Add New Project**.
3. Import your GitHub repository.
4. Fill out the configuration:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
5. Click **Environment Variables** to expand that section:
   - Name: `VITE_API_URL`
   - Value: Paste the Render URL you copied in Step 2 (e.g., `https://shield-backend.onrender.com`). Make sure there is NO trailing slash at the end of the URL.
6. Click **Deploy**.
7. Once finished, Vercel will give you a live frontend URL (e.g., `https://shield.vercel.app`).

## Step 4: Publish the Chrome Extension (Optional)
If you want to use the extension on your browser away from your local machine:

1. Open `background.js` and `popup.js` inside your `extension` folder.
2. Replace all instances of `http://localhost:8000` with your new Render URL (`https://shield-backend.onrender.com`).
3. Save the files, zip the entire `extension` folder, and you can now load it on any Chrome browser!
