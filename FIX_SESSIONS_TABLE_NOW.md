# 🚨 URGENT: Fix Missing Sessions Table

## The Problem
The `sessions` table doesn't exist in your database, causing the app to crash.

## ✅ **IMMEDIATE FIX**

### **Step 1: Open Railway Terminal**
1. Go to: https://railway.app/dashboard
2. Click: **AI-CustomerService** project
3. Click: **AI-CustomerService** service
4. Click: **"Deployments"** tab
5. Click latest deployment
6. Click **"View Logs"**
7. Click **"Open Shell"** (Terminal button)

### **Step 2: Run These Commands (Copy & Paste)**
```bash
npx prisma migrate deploy
```

```bash
npx prisma generate
```

```bash
npx prisma db push
```

### **Step 3: Check if Tables Exist**
```bash
npx prisma studio
```

---

## 🎯 **Alternative: Use Raw SQL**

If Prisma commands don't work, run this SQL directly:

```sql
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" VARCHAR(255) PRIMARY KEY,
  "shop_id" INTEGER NOT NULL,
  "state" VARCHAR(255),
  "is_online" BOOLEAN DEFAULT false,
  "scope" TEXT,
  "expires" TIMESTAMP,
  "access_token" TEXT,
  "user_id" BIGINT,
  "first_name" VARCHAR(255),
  "last_name" VARCHAR(255),
  "email" VARCHAR(255),
  "locale" VARCHAR(10),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ✅ **After Fix**

Your app will work! Test:
```
https://ai-customerservice-production.up.railway.app/health
```

Should return:
```json
{"status": "healthy"}
```

---

**Run those Prisma commands in Railway terminal now!** 🚀

