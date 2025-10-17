# 🗄️ Install PostgreSQL on Windows

## **Option A: Quick Install with Installer (Recommended)**

### **Step 1: Download PostgreSQL**
1. Go to: https://www.postgresql.org/download/windows/
2. Click **"Download the installer"**
3. Download the latest version (16.x)
4. Run the installer

### **Step 2: Installation**
1. Click **Next** through the wizard
2. **Installation Directory**: Keep default
3. **Components**: Select all (PostgreSQL Server, pgAdmin, Command Line Tools)
4. **Data Directory**: Keep default
5. **Password**: Set a password (remember this!)
   - Example: `password` (for local dev)
6. **Port**: Keep default `5432`
7. **Locale**: Keep default
8. Click **Next** and **Install**

### **Step 3: Verify Installation**
```bash
# Check if PostgreSQL is running
psql --version

# Should show: psql (PostgreSQL) 16.x
```

### **Step 4: Create Database**
```bash
# Create the database
createdb shopify_support_bot

# If you get password prompt, use the password you set
```

---

## **Option B: Use Docker (Easier)**

### **Step 1: Install Docker Desktop**
1. Download: https://www.docker.com/products/docker-desktop/
2. Install and restart computer
3. Start Docker Desktop

### **Step 2: Run PostgreSQL in Docker**
```bash
# Start PostgreSQL container
docker run --name postgres-shopify ^
  -e POSTGRES_PASSWORD=password ^
  -e POSTGRES_DB=shopify_support_bot ^
  -p 5432:5432 ^
  -d postgres:14-alpine

# Check if running
docker ps
```

### **Step 3: Update .env**
Your DATABASE_URL stays the same:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/shopify_support_bot
```

---

## **Option C: Use Docker Compose (Even Easier)**

Just run this from your project root:

```bash
docker-compose up -d postgres
```

This will:
- ✅ Start PostgreSQL automatically
- ✅ Create the database
- ✅ Keep it running in background

---

## **Quick Fix Commands:**

### **If PostgreSQL won't start:**
```bash
# Windows Services
services.msc
# Find "postgresql-x64-16" and click Start

# OR restart the service
net stop postgresql-x64-16
net start postgresql-x64-16
```

### **If you forgot your password:**
Edit: `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`
Change `md5` to `trust` temporarily, restart service.

---

## **My Recommendation: Use Docker Compose**

It's the easiest:

```bash
# Start database
docker-compose up -d postgres

# Stop database
docker-compose down

# View logs
docker-compose logs postgres
```

No installation needed, just Docker Desktop!

