# MONGODB ATLAS SETUP GUIDE

## 📚 COMPLETE SETUP DOCUMENTATION

---

## STEP 1: Create Account

**Website:** https://www.mongodb.com/cloud/atlas

**Options:**
- GitHub login (Recommended)
- Google login
- Email signup

**Details to Fill:**
- Name: [Your Name]
- Email: [Your Email]
- Password: [Strong Password]
- Account Type: Personal

---

## STEP 2: Create Free Cluster

1. Click "Build a Cluster"
2. Select "M0 Sandbox" (FREE - 512 MB)
3. Choose Region: Mumbai (or nearest)
4. Click "Create Cluster"
5. Wait 5-10 minutes for cluster to be ready

---

## STEP 3: Create Database User

1. Go to: Database Access (left sidebar)
2. Click "Add New Database User"
3. Fill details:
   ```
   Username: shop_admin
   Password: [Generate strong password - SAVE THIS!]
   Privileges: Read and write to any database
   ```
4. Click "Add User"

---

## STEP 4: Configure Network Access

1. Go to: Network Access (left sidebar)
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

⚠️ **Note:** For production, use specific IPs instead.

---

## STEP 5: Get Connection String

1. Go to: Database (left sidebar)
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Copy the connection string

**Example:**
```
mongodb+srv://shop_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

## STEP 6: Update Connection String

**Replace `<password>` with your actual password:**

Before:
```
mongodb+srv://shop_admin:<password>@cluster0.xxxxx.mongodb.net/
```

After:
```
mongodb+srv://shop_admin:MyStrongPass123@cluster0.xxxxx.mongodb.net/shop_management?retryWrites=true&w=majority
```

---

## STEP 7: Add to .env File

**Create `.env` file:**
```bash
MONGODB_URI=mongodb+srv://shop_admin:YourActualPassword@cluster0.xxxxx.mongodb.net/shop_management?retryWrites=true&w=majority
```

---

## 🎯 IMPORTANT NOTES

### Free Tier Limits (M0 Sandbox):
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ No credit card needed
- ✅ Forever free

### What You Can Do:
- Small to medium projects
- Testing & development
- Learning MongoDB
- Small production apps

### When to Upgrade:
- Storage > 512 MB needed
- High traffic expected
- Better performance needed

---

## 🔧 TROUBLESHOOTING

### Connection Issues:

**Error: "Authentication failed"**
→ Check username/password in .env file
→ Make sure database user exists

**Error: "Connection timeout"**
→ Check IP whitelist (Network Access)
→ Make sure 0.0.0.0/0 is added

**Error: "Cluster not ready"**
→ Wait for cluster to finish creating
→ Usually takes 5-10 minutes

---

## 📱 MONGODB ATLAS MOBILE APP

Download: MongoDB Atlas app (iOS/Android)

Features:
- Monitor clusters
- View metrics
- Manage users
- Check logs
- Get alerts

---

## 💰 PRICING (For Future Reference)

| Tier | Storage | RAM | Price |
|------|---------|-----|-------|
| M0 (Free) | 512 MB | Shared | FREE |
| M2 | 2 GB | Shared | $9/month |
| M5 | 5 GB | 1 GB | $29/month |
| M10+ | 10 GB+ | 2 GB+ | $57/month+ |

---

## 🚀 NEXT STEPS

1. Complete MongoDB Atlas setup
2. Copy connection string to .env file
3. Test connection with backend code
4. Create database schemas
5. Start building APIs

---

*Keep this document for future reference or for setting up other projects!*