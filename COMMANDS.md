# 🛠️ Useful Commands Reference

## 📦 **Development Commands**

```bash
# Start development server
npm run dev

# Start development with fresh DB generation
npm run dev:full

# Run all quality checks (lint, format, typecheck)
npm run check

# Format code
npm run format
```

## 🗄️ **Database Commands (Prisma + Neon)**

```bash
# Push schema changes to database
npm run db:push

# Pull schema from database to local
npm run db:pull

# Generate Prisma client after schema changes
npm run db:generate

# Open Prisma Studio (visual database browser)
npm run db:studio

# Reset database (⚠️ DESTRUCTIVE - deletes all data)
npm run db:reset

# Deploy migrations to production
npm run db:deploy

# Seed database with sample data
npm run db:seed
```

## 🚀 **Production & Deployment**

```bash
# Build for production with all checks
npm run build:production

# Full deployment process
npm run deploy

# Deploy to Vercel
npm run vercel:deploy

# Pull environment variables from Vercel
npm run vercel:env
```

## 👤 **User Management**

```bash
# Create admin user (admin@luxecuts.com / admin123)
npm run admin:create

# Manual data backup info
npm run data:backup
```

## 🔧 **Development Workflow**

### **Setting up a new environment:**

```bash
npm install --legacy-peer-deps
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

### **After schema changes:**

```bash
npm run db:push
npm run db:generate
```

### **Before deployment:**

```bash
npm run check
npm run build:production
```

### **Database management:**

```bash
# View data
npm run db:studio

# Reset and reseed (development only)
npm run db:reset
npm run db:seed
```

## 📊 **Default Accounts After Seeding**

**Admin Account:**

- Email: `admin@luxecuts.com`
- Password: `admin123`

**Test Customer:**

- Email: `john@example.com`
- Password: `password123`

## ⚠️ **Important Notes**

- **`db:reset`** deletes ALL data - only use in development
- **`db:seed`** creates sample appointments and users
- **`db:studio`** opens a web interface at http://localhost:5555
- Environment variables must be set before database commands
- Always run `db:generate` after schema changes
