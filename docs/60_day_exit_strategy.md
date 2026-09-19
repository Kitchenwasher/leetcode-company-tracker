# 60-Day AWS Exit Strategy (Zero Downtime & Zero Data Loss)

Follow this simple 3-step checklist around **Day 55 to Day 59** when your $200 AWS credits are about to expire.

---

### Step 1: Promote Railway to Primary Backend
Because Railway is already configured as your fallback and connects to the exact same Neon database:
1. Open your **Vercel Dashboard**.
2. Go to your frontend project -> **Settings -> Environment Variables**.
3. Update `VITE_API_URL`:
   - Change `VITE_API_URL` to your Railway URL (e.g. `https://leetcode-production.up.railway.app`).
   - Leave `VITE_FALLBACK_API_URL` empty or point to another backup.
4. Click **Redeploy** on Vercel (takes ~30 seconds).
*All user traffic is now safely hitting Railway with 0 downtime.*

---

### Step 2: S3 to Cloudflare R2 Migration (If using object storage)
If you uploaded files/avatars to AWS S3:
1. Create a free **Cloudflare R2** bucket at [dash.cloudflare.com](https://dash.cloudflare.com).
2. Cloudflare R2 provides a 1-click **Super Slurper** migration tool:
   - Go to R2 -> Data Migration -> Select Amazon S3.
   - Enter your S3 bucket name and AWS credentials.
   - Cloudflare copies all files automatically with 0 egress fees.
3. Update your Railway environment variables:
   - `S3_ENDPOINT`: `https://<account_id>.r2.cloudflarestorage.com`
   - `S3_ACCESS_KEY_ID`: Your R2 Access Key
   - `S3_SECRET_ACCESS_KEY`: Your R2 Secret Key

---

### Step 3: Terminate AWS Resources to Prevent Any Billing
1. Log into AWS Console -> **Lightsail**.
2. Click the three dots on your instance (`cheatcode-api-mumbai`) -> **Delete**.
3. Go to **Networking** tab -> Delete the attached Static IP.
4. If an S3 bucket was created:
   - Go to **S3 Console** -> Empty bucket -> Delete bucket.

---

### Post-60-Day Cost Overview
* **Frontend (Vercel)**: **$0 / month** (Free tier)
* **Database (Neon)**: **$0 / month** (Free tier handles 0.5 GB, ~100k records, easily enough for 1,000 active users)
* **Backend (Railway)**: **$5 / month** (Hobby plan) or switch to a $4/mo Hetzner VPS
* **Storage (Cloudflare R2)**: **$0 / month** (Free 10 GB storage, 0 egress fees)
* **Total Running Cost**: **$0 to $5 / month**!
