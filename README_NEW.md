# Pharmacy- POS System

A modern, secure Point of Sale (POS) system built with Next.js 15, Prisma, and Better Auth.

## 🌟 Features

### ✅ Implemented (v1.0)
- **Employee Management**
  - Admin can create, read, update, and delete employees
  - Role-based access control (Admin, Counter, Kitchen)
  - Soft delete with history preservation
  - Complete audit logging
  
- **Better Auth Integration**
  - Secure email/password authentication
  - Session management
  - Account record synchronization
  - Role-based redirects

- **Industrial Standard**
  - Clean database schema (PascalCase models, camelCase fields)
  - Database transactions for atomicity
  - Proper indexing for performance
  - Comprehensive error handling

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Run migrations
npx prisma migrate dev

# Seed admin user
npm run db:seed

# Start development server
npm run dev
```

**Login at:** http://localhost:3000/sign-in
- Email: `admin@pharmacy.com`
- Password: `Admin@123`

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Technical details
- **[Postman Collection](postman_collection.json)** - Ready-to-use API tests

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Better Auth
- **Validation:** Zod
- **UI:** Tailwind CSS + shadcn/ui
- **TypeScript:** Full type safety

## 🏗️ Project Structure

```
RestroFly/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed data script
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── admin/
│   │   │       └── employees/ # Employee API routes
│   │   ├── (auth)/            # Auth pages
│   │   └── (main)/            # Protected pages
│   ├── lib/
│   │   ├── auth.ts            # Better Auth config
│   │   ├── auth-utils.ts      # Auth helpers
│   │   └── prisma.ts          # Prisma client
│   └── components/            # Reusable components
├── API_DOCUMENTATION.md       # Complete API docs
├── IMPLEMENTATION_SUMMARY.md  # Technical summary
├── QUICK_START.md            # Getting started guide
└── postman_collection.json   # Postman API tests
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Role-based access control (RBAC)
- ✅ Input validation with Zod
- ✅ SQL injection protection via Prisma
- ✅ Session-based authentication
- ✅ Audit logging for all admin actions
- ✅ Soft delete for data preservation

## 📊 Database Schema

### Core Models
- **User** - Employee information and credentials
- **Account** - Better Auth authentication records
- **Session** - User sessions
- **AuditLog** - Action history
- **Attendance** - Employee attendance tracking
- **Payroll** - Salary management
- **Order, OrderItem** - Order management
- **Customer** - Customer information
- **Table, Reservation** - Table management
- **MenuItem, Category** - Menu management
- **Inventory** - Stock management

## 🧪 Testing

### Using Postman
1. Import `postman_collection.json`
2. Run "Login (Admin)" request
3. Session auto-saved ✅
4. Test other endpoints

### Manual Testing
```bash
# Login
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restrofly.com","password":"Admin@123"}'

# Create employee
curl -X POST http://localhost:3000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  -d '{...employee data...}'
```

## 📋 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/admin/employees` | Create employee | Admin |
| GET | `/api/admin/employees` | List employees | Admin |
| GET | `/api/admin/employees/:id` | Get employee | Admin |
| GET | `/api/admin/employees/:id/full` | Full profile | Admin |
| PUT | `/api/admin/employees/:id` | Update employee | Admin |
| DELETE | `/api/admin/employees/:id` | Delete employee | Admin |
| POST | `/api/admin/employees/:id/set-password` | Set password | Admin |

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete details.

## 🔄 Employee Workflow

```
1. Admin creates employee
   ├─ User record created (password: null)
   ├─ Account record created (providerId: "credential")
   └─ Audit log entry

2. Admin sets password
   ├─ User.password updated (hashed)
   ├─ Account.password updated (CRITICAL)
   └─ Audit log entry

3. Employee logs in
   ├─ Better Auth verifies Account.password
   ├─ Session created
   └─ Redirected to role-based dashboard
```

## 🎯 Roadmap

### Phase 1 - Employee Management 
- [x] Create, read, update, delete employees
- [x] Role-based authentication
- [x] Better Auth integration
- [x] Audit logging
- [x] API documentation
- [x] Postman collection


## 🆘 Support

- **Documentation:** Check the docs in this repository
- **Quick Start:** See [QUICK_START.md](QUICK_START.md)
- **API Reference:** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---


