# Pharmacy - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Prisma Accelerate)
- Git

### Installation

```bash
# 1. Clone repository
git clone <your-repo-url>
cd Pharmino

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create .env file with:
DATABASE_URL="your_postgresql_connection_string"
BETTER_AUTH_SECRET="your_secret_key"
BETTER_AUTH_URL="http://localhost:3000"

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed initial admin user
npm run db:seed

# 6. Start development server
npm run dev
```

### ✅ Verify Installation

Open http://localhost:3000/sign-in and login with:
- Email: `admin@pharmacy.com`
- Password: `Admin@123`

---

