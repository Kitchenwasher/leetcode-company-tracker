# Production Deployment Guide: Vercel + Neon + AWS Lightsail + Railway Fallback

This guide covers the complete deployment of the platform targeting 1,000 users with a Mumbai server (`ap-south-1`), custom subdomains, and zero-downtime failover.

---

## 1. Create Neon Database (Mumbai Region)

1. Go to [https://neon.tech](https://neon.tech) and sign up (Free).
2. Click **Create Project**.
3. Set project settings:
   - **Project Name**: `cheatcode-db` (or any name)
   - **Postgres Version**: 16 (default)
   - **Region**: Select **AWS Asia Pacific (Mumbai) - `ap-south-1`** *(Crucial for lowest latency!)*
4. Click **Create Project**.
5. You will see your **Connection Details**. Click **Connection string** and copy it. It looks like:
   ```env
   postgresql://alex:AbCdEfGh123@ep-cool-frost-123456.ap-south-1.aws.neon.tech/neondb?sslmode=require
   ```
6. In your local repository:
   - Paste this URL into [`backend/.env`](file:///c:/Users/as360/Desktop/leetcode/backend/.env) as `DATABASE_URL`.
   - Push the schema and initial seed data:
     ```bash
     cd backend
     npx prisma db push
     npx prisma db seed
     ```
   All question tables, user accounts, and test data are now live in Neon Mumbai!

---

## 2. DNS Records to Give to Your Brother

Depending on what subdomains your brother gives you, provide him these exact DNS settings:

### Option A: Subdomain for Frontend (e.g., `leetcode.hisdomain.com` or `app.hisdomain.com`)
If the custom subdomain is for the web app interface:
* **Record Type**: `CNAME`
* **Name / Host**: `app` (or whatever subdomain prefix)
* **Value / Points To**: `cname.vercel-dns.com`
* **TTL**: Auto or 3600
* **Proxy Status (if Cloudflare)**: DNS only (Grey Cloud) or Proxied (Orange Cloud)

*Then on Vercel*: Go to **Project Settings -> Domains -> Add Domain** and enter `app.hisdomain.com`.

### Option B: Subdomain for Backend API (e.g., `api.hisdomain.com`)
If the custom subdomain is for your AWS Lightsail API:
* **Record Type**: `A`
* **Name / Host**: `api` (or whatever subdomain prefix)
* **Value / Points To**: `<Your AWS Lightsail Static Public IP>` (e.g., `13.235.xx.xx`)
* **TTL**: Auto or 3600

---

## 3. Create AWS Lightsail VPS (Mumbai Region)

1. Log into AWS Console -> Search for **Lightsail** (or go to [https://lightsail.aws.amazon.com](https://lightsail.aws.amazon.com)).
2. Make sure the region dropdown shows **Mumbai (`ap-south-1`)**.
3. Click **Create Instance**:
   - **Platform**: Linux/Unix
   - **Blueprint**: **OS Only -> Ubuntu 22.04 LTS**
   - **Instance Plan**: **$24/month** (4 GB RAM, 2 vCPUs, 80 GB SSD, 3 TB Transfer).
   - **Instance Name**: `cheatcode-api-mumbai`
4. Click **Create Instance**.
5. Once created:
   - Go to the **Networking** tab.
   - Under **IPv4 Firewall**, click **Add rule** and ensure these ports are open:
     - `HTTP` (TCP 80)
     - `HTTPS` (TCP 443)
     - `Custom TCP 5000` (Optional, if accessing backend directly)
   - Under **Static IP**, click **Create Static IP** and attach it to your instance. Copy this IP for your brother's DNS A record!
6. Click the terminal icon (SSH Connect) on the Lightsail dashboard:
   Run these commands to install Docker and start the app:
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker ubuntu
   newgrp docker

   # Clone your repository
   git clone https://github.com/Kitchenwasher/leetcode-company-tracker.git
   cd leetcode-company-tracker

   # Create environment file
   cat << 'EOF' > .env
   NODE_ENV=production
   DATABASE_URL=YOUR_NEON_DATABASE_URL
   JWT_SECRET=super_secret_jwt_access_key_32chars
   JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_32chars
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   SUBDOMAIN=api.hisdomain.com
   EOF

   # Start containers with automatic HTTPS via Caddy
   docker compose -f docker-compose.prod.yml up -d --build
   ```

---

## 4. Deploy Fallback Backend on Railway

1. Go to [https://railway.com](https://railway.com).
2. Click **New Project -> Deploy from GitHub repo**.
3. Select `Kitchenwasher/leetcode-company-tracker`.
4. In **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. In **Variables**, add:
   - `DATABASE_URL`: *(Same Neon URL)*
   - `JWT_SECRET`: *(Must match Lightsail exactly)*
   - `JWT_REFRESH_SECRET`: *(Must match Lightsail exactly)*
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: *(Your Vercel URL)*
6. In **Networking**, click **Generate Domain** (e.g. `https://leetcode-production.up.railway.app`). Copy this URL!

---

## 5. Deploy Frontend to Vercel

1. Go to [https://vercel.com](https://vercel.com) -> **Add New Project**.
2. Import `Kitchenwasher/leetcode-company-tracker`.
3. Set **Root Directory** to `frontend`.
4. Add **Environment Variables**:
   - `VITE_API_URL`: `https://api.hisdomain.com` (or your Lightsail IP `http://13.235.xx.xx:5000`)
   - `VITE_FALLBACK_API_URL`: `https://leetcode-production.up.railway.app` (Your Railway backend)
   - `VITE_API_TIMEOUT_MS`: `2500`
5. Click **Deploy**.

---

## 6. How Failover Works in Action

1. The user browser requests `https://app.yourdomain.com`.
2. All API queries try your **AWS Lightsail Mumbai** server first.
3. If Lightsail takes longer than **2.5 seconds** or goes down:
   - The browser's built-in circuit breaker catches the timeout.
   - It seamlessly re-routes the request to **Railway**.
   - If Lightsail fails 2 times consecutively, all requests bypass Lightsail and go straight to Railway for 60 seconds before testing Lightsail again.
4. Because both backends connect to **Neon Mumbai**, users experience zero data loss and uninterrupted service.
