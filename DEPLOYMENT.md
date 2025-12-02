# CollabRoom Deployment Guide

## Free Deployment on Render

### Prerequisites
1. GitHub account with your code pushed
2. MongoDB Atlas account (free tier)
3. Cloudinary account (free tier)
4. Render account

---

## Step-by-Step Deployment

### Step 1: Set Up MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new project
4. Create a cluster (select free tier)
5. Create a database user:
   - Go to Database Access
   - Add a new user with username and password
6. Get connection string:
   - Go to Clusters → Connect
   - Choose "Drivers"
   - Copy the connection string
   - Replace `<password>` with your user password
   - Replace `myFirstDatabase` with `collabroom`

Example: `mongodb+srv://username:password@cluster.mongodb.net/collabroom`

### Step 2: Set Up Cloudinary (File Storage)

1. Go to [Cloudinary](https://cloudinary.com)
2. Sign up or log in
3. Go to Dashboard
4. Copy your:
   - Cloud Name
   - API Key
   - API Secret

### Step 3: Push Code to GitHub

```bash
cd /Users/mony/collabroom
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 4: Deploy on Render

1. Go to [Render](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Fill in the form:
   - **Name**: collabroom
   - **Runtime**: Node
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free

6. Add Environment Variables (click "Add Environment Variable"):
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/collabroom
   JWT_SECRET=your_random_secret_key_here
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   PORT=3000
   FRONTEND_URL=https://your-render-url.onrender.com
   ```

7. Click "Create Web Service"
8. Wait for deployment (5-10 minutes)
9. Once deployed, you'll get a URL like: `https://collabroom.onrender.com`

### Step 5: Update Frontend Environment

1. In your Render dashboard, go to your service
2. Go to "Environment" tab
3. Add:
   ```
   VITE_API_URL=https://your-render-url.onrender.com
   ```

4. Redeploy by pushing a new commit:
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push origin main
   ```

---

## Important Notes

- **Free Tier Limitations**:
  - Render spins down after 15 minutes of inactivity (cold start ~30 seconds)
  - MongoDB Atlas free tier: 512MB storage
  - Cloudinary free tier: 75GB/month

- **Environment Variables**: Never commit `.env` files. Use Render's environment variable dashboard.

- **Monitoring**: Check Render logs for any errors:
  - Go to your service → Logs tab

- **Custom Domain** (Optional):
  - Go to your service → Settings → Custom Domain
  - Add your domain and follow DNS instructions

---

## Troubleshooting

### Build Fails
- Check server logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify `.env` variables are set correctly

### Socket.io Connection Issues
- Ensure `FRONTEND_URL` is set correctly in server environment
- Check browser console for connection errors
- Verify CORS settings in server.js

### Database Connection Issues
- Test MongoDB connection string locally
- Ensure IP whitelist includes Render's IP (or use 0.0.0.0/0)
- Check MongoDB Atlas connection logs

---

## Local Testing Before Deployment

```bash
# Terminal 1: Start server
cd server
npm start

# Terminal 2: Start client
cd client
npm run dev
```

Visit `http://localhost:5173`
