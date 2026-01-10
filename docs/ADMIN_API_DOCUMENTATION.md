# RestroFly API Documentation

## 🍔 Menu Management API

Base URL: `/api/admin`

### 1. Category Management

#### **GET /categories**
Get all categories with item counts.

**Response:**
```json

  {
    "id": 1,
    "name": "Burgers",
    "imageUrl": "https://...",
    "itemCount": 5,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### **POST /categories**
Create a new category.

**Body:**
```json
{
  "name": "Beverages",
  "imageUrl": "https://..." // Optional
}
```

#### **GET /categories/:id**
Get a single category.

#### **PUT /categories/:id**
Update a category.

**Body:**
```json
{
  "name": "Cold Drinks",
  "imageUrl": "https://..."
}
```

#### **DELETE /categories/:id**
Delete a category.

**Query Parameters:**
- `transferToId` (Optional): ID of another category to move items to before deleting.

**Behavior:**
- If category is empty: Deletes immediately.
- If category has items and `transferToId` is provided: Moves items, then deletes.
- If category has items and NO `transferToId`: Returns 400 Error.

---

### 2. Menu Item Management

#### **GET /menu-items**
Get menu items with filtering and optional discount information.

**Query Parameters:**
- `page`: Page number (default 1)
- `limit`: Items per page (default 10)
- `search`: Search by item name
- `categoryId`: Filter by category
- `isAvailable`: Filter by status (true/false)
- `includeArchived`: Include archived items (true/false, default false)
- `includeDiscounts`: Include active discount information (true/false, default false)

**Response (without discounts):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Cheeseburger",
        "categoryId": 1,
        "category": {
          "id": 1,
          "name": "Burgers"
        },
        "basePrice": "12.99",
        "serviceCharge": "0.00",
        "imageUrl": "https://...",
        "description": "Juicy beef patty...",
        "isAvailable": true,
        "isArchived": false,
        "sortOrder": 0
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

**Response (with includeDiscounts=true):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Cheeseburger",
        "categoryId": 1,
        "category": {
          "id": 1,
          "name": "Burgers"
        },
        "basePrice": 12.99,
        "finalPrice": 10.39,
        "hasDiscount": true,
        "discount": {
          "id": 5,
          "type": "PERCENTAGE",
          "value": 20,
          "level": "ITEM",
          "validUntil": "2025-12-31T23:59:59.000Z"
        },
        "savingsAmount": 2.60,
        "savingsPercentage": 20,
        "imageUrl": "https://...",
        "description": "Juicy beef patty...",
        "isAvailable": true,
        "isArchived": false,
        "sortOrder": 0
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

**Discount Priority Logic:**
- Item-level discount takes priority over category-level discount
- If both exist, only the item-level discount is applied
- `level` field indicates whether discount is "ITEM" or "CATEGORY"

#### **POST /menu-items**
Create a new menu item.

**Body:**
```json
{
  "name": "Cheeseburger",
  "categoryId": 1,
  "basePrice": 12.99,
  "serviceCharge": 0,
  "imageUrl": "https://...",
  "description": "Juicy beef patty...",
  "isAvailable": true,
  "sortOrder": 0,
  "usesCategoryDefaults": true
}
```

#### **GET /menu-items/:id**
Get a single menu item.

#### **PUT /menu-items/:id**
Update a menu item.

**Body:**
```json
{
  "basePrice": 14.99,
  "isAvailable": false
}
```

#### **DELETE /menu-items/:id**
Archive a menu item (Soft Delete).
Sets `isArchived` to `true`. The item will no longer appear in standard lists but remains in the database.

---

## 🔐 Authentication & Authorization

### Better Auth Integration

RestroFly uses **Better Auth** for authentication, which requires:
1. **User table**: Basic user information
2. **Account table**: Authentication credentials (email/password)

When admin creates an employee, **both records are created automatically** to ensure the employee can login.

### Initial Setup

**Default Admin Credentials:**
- Email: `admin@restrofly.com`
- Password: `Admin@123`
- ⚠️ **Change password after first login!**

### Authentication Flow

1. All API routes require authentication via Better Auth session
2. Admin-only routes check for `role: "ADMIN"`
3. Sessions are managed automatically by Better Auth cookies
4. Employee creation automatically creates Better Auth account

### How Employee Authentication Works

```
Admin creates employee
  ↓
User record created (password: null)
  ↓
Account record created with providerId: "credential" (password: null)
  ↓
Admin sets password
  ↓
Both User.password AND Account.password updated
  ↓
Employee can now login via Better Auth
```

---

## 📋 Employee Management API

Base URL: `/api/admin/employees`

### 1. Create Employee

**Endpoint:** `POST /api/admin/employees`

**Authorization:** Admin only

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+8801712345678",
  "role": "COUNTER",
  "status": "ACTIVE",
  "dutyType": "FULL_TIME",
  "shift": "DAY",
  "joiningDate": "2025-01-01",
  "monthlySalary": 25000,
  "imageUrl": "https://example.com/image.jpg"
}
```

**Field Descriptions:**
- `name` (string, required): Employee full name
- `email` (string, required): Must be unique, used for login
- `phone` (string, required): Must be unique, minimum 10 characters
- `role` (enum, required): `ADMIN` | `COUNTER` | `KITCHEN`
- `status` (enum, optional): `ACTIVE` | `ON_LEAVE` | `INACTIVE` (default: `ACTIVE`)
- `dutyType` (enum, required): `FULL_TIME` | `PART_TIME`
- `shift` (enum, required): `DAY` | `NIGHT`
- `joiningDate` (string, required): ISO 8601 date format
- `monthlySalary` (number, required): Must be positive
- `imageUrl` (string, optional): Profile picture URL

**Response (201):**
```json
{
  "message": "Employee created successfully",
  "employee": {
    "id": "cm3x...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+8801712345678",
    "role": "COUNTER",
    "status": "ACTIVE",
    "dutyType": "FULL_TIME",
    "shift": "DAY",
    "joiningDate": "2025-01-01T00:00:00.000Z",
    "monthlySalary": "25000.00",
    "image": "https://example.com/image.jpg",
    "createdAt": "2025-11-20T10:30:00.000Z",
    "updatedAt": "2025-11-20T10:30:00.000Z"
  }
}
```

**What Happens:**
1. ✅ User record created in database
2. ✅ **Account record created with providerId: "credential"** (Better Auth)
3. ✅ **Payroll record auto-created** with baseSalary = monthlySalary, allowances = 0, deductions = 0
4. ✅ Audit log entry created
5. ✅ Password is NULL - admin must set it via `/set-password`
6. ✅ Employee is pre-verified (emailVerified: true)

---

### 2. Get All Employees
**Endpoint:** `GET /api/admin/employees`

**Authorization:** Admin only

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `role` (filter: ADMIN | COUNTER | KITCHEN)
- `status` (filter: ACTIVE | ON_LEAVE | INACTIVE)
- `search` (search by name, email, phone)

**Example Request:**
```
GET /api/admin/employees?page=1&limit=20&role=COUNTER&search=john
```

**Response (200):**
```json
{
  "employees": [
    {
      "id": "cm3x...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+8801712345678",
      "role": "COUNTER",
      "status": "ACTIVE",
      "dutyType": "FULL_TIME",
      "shift": "DAY",
      "joiningDate": "2025-01-01T00:00:00.000Z",
      "monthlySalary": "25000.00",
      "image": null,
      "createdAt": "2025-11-20T10:30:00.000Z",
      "updatedAt": "2025-11-20T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 3. Get Single Employee
**Endpoint:** `GET /api/admin/employees/:id`

**Authorization:** Admin only

**Response (200):**
```json
{
  "employee": {
    "id": "cm3x...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+8801712345678",
    "role": "COUNTER",
    "status": "ACTIVE",
    "dutyType": "FULL_TIME",
    "shift": "DAY",
    "joiningDate": "2025-01-01T00:00:00.000Z",
    "monthlySalary": "25000.00",
    "image": null,
    "createdAt": "2025-11-20T10:30:00.000Z",
    "updatedAt": "2025-11-20T10:30:00.000Z"
  }
}
```

---

### 4. Get Employee Full Profile
**Endpoint:** `GET /api/admin/employees/:id/full`

**Authorization:** Admin only

**Response (200):**
```json
{
  "employee": {
    "id": "cm3x...",
    "name": "John Doe",
    "email": "john@example.com",
    // ... basic info
    "attendances": [
      {
        "id": 1,
        "date": "2025-11-20T00:00:00.000Z",
        "status": "PRESENT",
        "createdAt": "2025-11-20T09:00:00.000Z"
      }
    ],
    "payrolls": [
      {
        "id": 1,
        "baseSalary": "25000.00",
        "allowances": "2000.00",
        "deductions": "500.00",
        "netPay": "26500.00",
        "paymentStatus": "PAID",
        "createdAt": "2025-11-01T00:00:00.000Z"
      }
    ],
    "auditLogs": [
      {
        "id": 1,
        "action": "LOGIN",
        "entity": "Session",
        "entityId": "session_id",
        "createdAt": "2025-11-20T09:00:00.000Z"
      }
    ],
    "statistics": {
      "attendance": {
        "present": 20,
        "absent": 2,
        "late": 3,
        "total": 25
      },
      "payroll": {
        "totalEarned": 265000,
        "totalPending": 26500,
        "paidCount": 10,
        "pendingCount": 1
      },
      "activityCount": 50
    }
  }
}
```

---

### 5. Update Employee
**Endpoint:** `PUT /api/admin/employees/:id`

**Authorization:** Admin only

**Request Body:** (all fields optional)
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "phone": "+8801712345679",
  "role": "KITCHEN",
  "status": "ON_LEAVE",
  "dutyType": "PART_TIME",
  "shift": "NIGHT",
  "joiningDate": "2025-01-15",
  "monthlySalary": 30000,
  "imageUrl": "https://example.com/new-image.jpg"
}
```

**Response (200):**
```json
{
  "message": "Employee updated successfully",
  "employee": {
    // Updated employee object
  }
}
```

---

### 6. Delete Employee (Soft Delete)
**Endpoint:** `DELETE /api/admin/employees/:id`

**Authorization:** Admin only

**Response (200):**
```json
{
  "message": "Employee deleted successfully",
  "employee": {
    "id": "cm3x...",
    "name": "John Doe"
  }
}
```

**Notes:**
- Implements **soft delete** (status changed to `DELETED`)
- Email and phone are modified to allow reuse (`deleted_<timestamp>_<original>`)
- Attendance and payroll history remain intact
- Cannot delete your own admin account
- Deleted employees won't appear in normal employee lists

**Status Values:**
- `ACTIVE` - Employee is working
- `ON_LEAVE` - Employee is on temporary leave
- `INACTIVE` - Employee is inactive (can be reactivated)
- `DELETED` - Employee has been deleted (soft delete, preserves history)

---

### 7. Set Employee Password

**Endpoint:** `POST /api/admin/employees/:id/set-password`

**Authorization:** Admin only

**Request Body:**
```json
{
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Response (200):**
```json
{
  "message": "Password set successfully. Employee can now log in."
}
```

**What Happens:**
1. ✅ Password is hashed with bcrypt (10 rounds)
2. ✅ **User.password updated**
3. ✅ **Account.password updated** (CRITICAL for Better Auth login)
4. ✅ Audit log entry created with admin who set the password
5. ✅ Employee can now login via Better Auth

**Important:** This is the **CRITICAL step** that enables employee login. Both the User and Account tables must have the password hash for Better Auth to work.

---

## 📅 Attendance Management API

Base URL: `/api/admin/attendance`

### 1. Mark Attendance

**Endpoint:** `POST /api/admin/attendance`

**Authorization:** Admin only

**Request Body:**
```json
{
  "userId": "cm3x...",
  "date": "2025-11-20",
  "status": "PRESENT"
}
```

**Field Descriptions:**
- `userId` (string, required): Employee user ID
- `date` (string, required): Date in ISO 8601 format (YYYY-MM-DD)
- `status` (enum, required): `PRESENT` | `ABSENT` | `LATE`

**Response (201):**
```json
{
  "message": "Attendance marked successfully",
  "attendance": {
    "id": 1,
    "userId": "cm3x...",
    "date": "2025-11-20T00:00:00.000Z",
    "status": "PRESENT",
    "createdAt": "2025-11-20T09:00:00.000Z",
    "updatedAt": "2025-11-20T09:00:00.000Z",
    "user": {
      "id": "cm3x...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "COUNTER"
    }
  }
}
```

**What Happens:**
1. ✅ Validates employee exists
2. ✅ Checks if attendance already marked for this date
3. ✅ Creates attendance record
4. ✅ Audit log entry created with admin details

**Error Cases:**
- `404` - Employee not found
- `409` - Attendance already marked for this date (use PUT to update)

---

### 2. Get Attendance Records

**Endpoint:** `GET /api/admin/attendance`

**Authorization:** Admin only

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 30) - Records per page
- `userId` (optional) - Filter by specific employee
- `status` (optional) - Filter by status: PRESENT | ABSENT | LATE
- `date` (optional) - Filter by specific date (YYYY-MM-DD)
- `startDate` (optional) - Filter from date (YYYY-MM-DD)
- `endDate` (optional) - Filter to date (YYYY-MM-DD)

**Example Requests:**
```
# Get all attendance for today
GET /api/admin/attendance?date=2025-11-20

# Get specific employee's attendance
GET /api/admin/attendance?userId=cm3x...

# Get attendance for date range
GET /api/admin/attendance?startDate=2025-11-01&endDate=2025-11-30

# Get all absent employees
GET /api/admin/attendance?status=ABSENT
```

**Response (200):**
```json
{
  "attendances": [
    {
      "id": 1,
      "userId": "cm3x...",
      "date": "2025-11-20T00:00:00.000Z",
      "status": "PRESENT",
      "createdAt": "2025-11-20T09:00:00.000Z",
      "updatedAt": "2025-11-20T09:00:00.000Z",
      "user": {
        "id": "cm3x...",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+8801712345678",
        "role": "COUNTER",
        "status": "ACTIVE"
      }
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 30,
    "totalPages": 2
  },
  "stats": {
    "last30Days": {
      "present": 22,
      "absent": 2,
      "late": 4
    }
  }
}
```

**Note:** `stats` object is only included when filtering by `userId`.

---

### 3. Get Single Attendance Record

**Endpoint:** `GET /api/admin/attendance/:id`

**Authorization:** Admin only

**Response (200):**
```json
{
  "attendance": {
    "id": 1,
    "userId": "cm3x...",
    "date": "2025-11-20T00:00:00.000Z",
    "status": "PRESENT",
    "createdAt": "2025-11-20T09:00:00.000Z",
    "updatedAt": "2025-11-20T09:00:00.000Z",
    "user": {
      "id": "cm3x...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+8801712345678",
      "role": "COUNTER",
      "status": "ACTIVE"
    }
  }
}
```

---

### 4. Update Attendance Status

**Endpoint:** `PUT /api/admin/attendance/:id`

**Authorization:** Admin only

**Request Body:**
```json
{
  "status": "LATE"
}
```

**Field Descriptions:**
- `status` (enum, required): `PRESENT` | `ABSENT` | `LATE`

**Response (200):**
```json
{
  "message": "Attendance updated successfully",
  "attendance": {
    "id": 1,
    "userId": "cm3x...",
    "date": "2025-11-20T00:00:00.000Z",
    "status": "LATE",
    "createdAt": "2025-11-20T09:00:00.000Z",
    "updatedAt": "2025-11-20T09:30:00.000Z",
    "user": {
      "id": "cm3x...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+8801712345678",
      "role": "COUNTER",
      "status": "ACTIVE"
    }
  }
}
```

**What Happens:**
1. ✅ Updates attendance status
2. ✅ Audit log entry created with old status, new status, and admin details

---

### 5. Delete Attendance Record

**Endpoint:** `DELETE /api/admin/attendance/:id`

**Authorization:** Admin only

**Response (200):**
```json
{
  "message": "Attendance record deleted successfully"
}
```

**What Happens:**
1. ✅ Deletes attendance record
2. ✅ Audit log entry created with deleted attendance details

**Use Case:** Correcting mistakes or removing erroneous entries.

---

## 📊 Attendance Workflow

### Daily Attendance Marking Flow

```
1. Admin opens attendance page
   ├─ GET /api/admin/employees (get all active employees)
   └─ Displays employee list for today's date

2. Admin marks attendance for each employee
   ├─ POST /api/admin/attendance (for each employee)
   ├─ Status: PRESENT / ABSENT / LATE
   └─ Creates attendance record + audit log

3. Admin reviews attendance
   ├─ GET /api/admin/attendance?date=today
   └─ Displays all marked attendance for today

4. Admin corrects mistakes (if needed)
   ├─ PUT /api/admin/attendance/:id (update status)
   └─ Updates record + audit log
```

### Monthly Attendance Report Flow

```
1. Admin selects employee and date range
   ├─ GET /api/admin/attendance?userId=xxx&startDate=2025-11-01&endDate=2025-11-30
   └─ Returns attendance records + statistics

2. System calculates statistics
   ├─ Total days present
   ├─ Total days absent
   ├─ Total days late
   └─ Attendance percentage

3. Used for payroll processing
   ├─ Deductions for absent days
   ├─ Bonus for perfect attendance
   └─ Late penalties (if applicable)
```

---

## 💰 Payroll Management API

Base URL: `/api/admin/payrolls`

**Note:** Payroll records are **automatically created** when an employee is created. You don't need to create payrolls manually - just update them with allowances and deductions.

### Auto-Creation on Employee Registration

When you create an employee via `POST /api/admin/employees`, a payroll record is automatically created with:
- `baseSalary` = employee's `monthlySalary`
- `allowances` = 0
- `deductions` = 0
- `netPay` = baseSalary (same as monthlySalary)
- `paymentStatus` = "PENDING"

**Workflow:**
```
Create Employee → Payroll Auto-Created → Update Payroll as Needed → Mark as Paid
```

---

### 1. Get Payroll Records

**Endpoint:** `GET /api/admin/payrolls`

**Authorization:** Admin only

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 10) - Records per page
- `userId` (optional) - Filter by specific employee
- `paymentStatus` (optional) - Filter by status: PENDING | PAID
- `startDate` (optional) - Filter from date (ISO format)
- `endDate` (optional) - Filter to date (ISO format)

**Example Requests:**
```bash
# Get all payrolls
GET /api/admin/payrolls

# Get specific employee's payroll history
GET /api/admin/payrolls?userId=cm3x...

# Get pending payrolls
GET /api/admin/payrolls?paymentStatus=PENDING

# Get payrolls for date range
GET /api/admin/payrolls?startDate=2025-01-01&endDate=2025-01-31
```

**Response (200):**
```json
{
  "payrolls": [
    {
      "id": 1,
      "userId": "cm3x...",
      "baseSalary": "25000.00",
      "allowances": "2000.00",
      "deductions": "500.00",
      "netPay": "26500.00",
      "paymentStatus": "PENDING",
      "createdAt": "2025-11-20T10:00:00.000Z",
      "updatedAt": "2025-11-20T10:00:00.000Z",
      "user": {
        "id": "cm3x...",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+8801712345678",
        "role": "COUNTER",
        "status": "ACTIVE"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  },
  "stats": {
    "totalPayrolls": 25,
    "totalBaseSalary": "625000.00",
    "totalAllowances": "50000.00",
    "totalDeductions": "12500.00",
    "totalNetPay": "662500.00",
    "pendingPayrolls": 5,
    "paidPayrolls": 20
  }
}
```

**Note:** `stats` object is only included when filtering by `userId`.

---

### 2. Get Single Payroll Record

**Endpoint:** `GET /api/admin/payrolls/:id`

**Authorization:** Admin only

**Response (200):**
```json
{
  "payroll": {
    "id": 1,
    "userId": "cm3x...",
    "baseSalary": "25000.00",
    "allowances": "2000.00",
    "deductions": "500.00",
    "netPay": "26500.00",
    "paymentStatus": "PENDING",
    "createdAt": "2025-11-20T10:00:00.000Z",
    "updatedAt": "2025-11-20T10:00:00.000Z",
    "user": {
      "id": "cm3x...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+8801712345678",
      "role": "COUNTER",
      "status": "ACTIVE",
      "monthlySalary": "25000.00"
    }
  }
}
```

---

### 3. Update Payroll

**Endpoint:** `PUT /api/admin/payrolls/:id`

**Authorization:** Admin only

**Request Body:** (all fields optional)
```json
{
  "allowances": 3000,
  "deductions": 800,
  "paymentStatus": "PAID"
}
```

**Field Descriptions:**
- `allowances` (number, optional): Update allowances amount
- `deductions` (number, optional): Update deductions amount
- `paymentStatus` (enum, optional): Update status: `PENDING` | `PAID`

**Response (200):**
```json
{
  "message": "Payroll updated successfully",
  "payroll": {
    "id": 1,
    "userId": "cm3x...",
    "baseSalary": "25000.00",
    "allowances": "3000.00",
    "deductions": "800.00",
    "netPay": "27200.00",
    "paymentStatus": "PAID",
    "createdAt": "2025-11-20T10:00:00.000Z",
    "updatedAt": "2025-11-20T10:30:00.000Z",
    "user": {
      "id": "cm3x...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+8801712345678",
      "role": "COUNTER",
      "status": "ACTIVE"
    }
  }
}
```

**Automatic Recalculation:**
- ✅ When `allowances` or `deductions` are updated, `netPay` is automatically recalculated
- ✅ Formula: `netPay = baseSalary + allowances - deductions`
- ✅ No need to send netPay from frontend

**What Gets Logged:**
1. ✅ Old and new values for changed fields
2. ✅ Automatic netPay recalculation logged
3. ✅ Admin who made the changes
4. ✅ Timestamp of update

---

### 4. Delete Payroll Record

**Endpoint:** `DELETE /api/admin/payrolls/:id`

**Authorization:** Admin only

**Response (200):**
```json
{
  "message": "Payroll record deleted successfully"
}
```

**Important Restrictions:**
- ❌ **Cannot delete PAID payrolls** (accounting compliance)
- ✅ Can only delete PENDING payrolls
- ✅ Deletes are logged in audit trail

**What Happens:**
1. ✅ Validates payroll exists
2. ✅ Checks payment status (must be PENDING)
3. ✅ Deletes payroll record
4. ✅ Creates audit log with deleted details

**Error Case:**
```json
{
  "error": "Cannot delete paid payroll records. This action is for accounting compliance."
}
```

---

## 💼 Payroll Workflow

### Monthly Payroll Processing Flow

```
1. Employees are created with auto-generated payroll
   ├─ POST /api/admin/employees
   ├─ Payroll automatically created:
   │  ├─ baseSalary = monthlySalary
   │  ├─ allowances = 0
   │  ├─ deductions = 0
   │  └─ paymentStatus: PENDING

2. Admin reviews and updates payrolls
   ├─ GET /api/admin/payrolls (get all pending payrolls)
   ├─ For each employee, calculate adjustments:
   │  ├─ Check attendance for absent days
   │  ├─ Add performance bonuses
   │  └─ Calculate deductions
   ├─ PUT /api/admin/payrolls/:id
   ├─ { allowances: 2000, deductions: 500 }
   └─ netPay automatically recalculated

3. Admin marks payroll as paid
   ├─ PUT /api/admin/payrolls/:id
   ├─ { paymentStatus: "PAID" }
   └─ Payroll now locked (cannot delete)

4. Next month: Repeat process
   ├─ Reset existing payroll (PUT with new allowances/deductions)
   └─ Or mark previous as PAID and update for new month
```

### Payroll Calculation Examples

**Example 1: Basic Salary Only**
```json
{
  "baseSalary": 25000,
  "allowances": 0,
  "deductions": 0,
  "netPay": 25000  // Auto-calculated
}
```

**Example 2: With Allowances**
```json
{
  "baseSalary": 25000,
  "allowances": 3000,  // Transport + Food allowance
  "deductions": 0,
  "netPay": 28000  // 25000 + 3000
}
```

**Example 3: With Deductions**
```json
{
  "baseSalary": 25000,
  "allowances": 3000,
  "deductions": 1500,  // Tax + Insurance
  "netPay": 26500  // 25000 + 3000 - 1500
}
```

**Example 4: Attendance-Based Deduction**
```json
{
  "baseSalary": 25000,
  "allowances": 2000,
  "deductions": 2500,  // 5 days absent × 500 per day
  "netPay": 24500  // 25000 + 2000 - 2500
}
```

---

## 📊 Integration with Attendance

### Calculate Deductions from Attendance

```typescript
// Backend logic example
async function calculatePayrollDeductions(userId: string, month: string) {
  // 1. Get employee's daily rate
  const employee = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlySalary: true }
  });
  
  const dailyRate = employee.monthlySalary / 30; // Assuming 30 days/month
  
  // 2. Count absent days for the month
  const absentCount = await prisma.attendance.count({
    where: {
      userId,
      status: "ABSENT",
      date: {
        gte: new Date(`${month}-01`),
        lte: new Date(`${month}-31`)
      }
    }
  });
  
  // 3. Calculate deduction
  const deduction = absentCount * dailyRate;
  
  // 4. Create payroll with calculated deduction
  await prisma.payroll.create({
    data: {
      userId,
      baseSalary: employee.monthlySalary,
      allowances: 0,
      deductions: deduction,
      paymentStatus: "PENDING"
      // netPay will be auto-calculated
    }
  });
}
```

---

## 🔐 Security & Best Practices

### Password Security
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ Never stored in plain text
- ✅ Strong password requirements enforced
- ✅ Confirmation required to prevent typos

### Better Auth Integration
- ✅ Account record with `providerId: "credential"` created for each employee
- ✅ Both User and Account passwords kept in sync
- ✅ Email verification status set to true for admin-created accounts
- ✅ Transaction ensures atomic operations

### Database Transactions
- ✅ Employee creation uses transactions (User + Account + AuditLog)
- ✅ Password setting uses transactions (User + Account + AuditLog)
- ✅ Rollback on any failure ensures data consistency

### Audit Logging
- ✅ All admin actions logged with user ID and timestamp
- ✅ Employee creation logged with details
- ✅ Password changes logged with admin who made the change
- ✅ Update and delete operations logged

---

## 📊 Testing with Postman

### Import Collection

1. Import `postman_collection.json` into Postman
2. Collection includes:
   - Authentication endpoints
   - All employee management endpoints
   - Complete workflow examples
   - Auto-saves session tokens and employee IDs

### Quick Start Workflow

**1. Login as Admin**
```
POST /api/auth/sign-in/email
Body: { "email": "admin@restrofly.com", "password": "Admin@123" }
```
Session cookie is automatically saved.

**2. Create Employee**
```
POST /api/admin/employees
Body: { name, email, phone, role, dutyType, shift, joiningDate, monthlySalary }
```
Employee ID is automatically saved.

**3. Set Employee Password**
```
POST /api/admin/employees/:id/set-password
Body: { "password": "Welcome123", "confirmPassword": "Welcome123" }
```

**4. Employee Can Login**
```
POST /api/auth/sign-in/email
Body: { "email": "employee@email.com", "password": "Welcome123" }
```

---

## 🔄 Complete Employee Lifecycle

### Onboarding Flow
```
1. Admin creates employee
   ├─ User record created (password: null)
   ├─ Account record created (providerId: "credential", password: null)
   └─ Audit log: CREATE_EMPLOYEE

2. Admin sets password
   ├─ User.password = hash(password)
   ├─ Account.password = hash(password)  ← CRITICAL
   └─ Audit log: SET_EMPLOYEE_PASSWORD

3. Employee logs in
   ├─ Better Auth checks Account table
   ├─ Verifies password hash
   ├─ Creates session
   └─ Redirects to role-based dashboard
```

### Role-Based Access
- **Admin** → Full access to `/admin` and all employee management
- **Counter** → Access to `/counter` module only
- **Kitchen** → Access to `/kitchen` module only

---

## 🐛 Troubleshooting

### Employee Cannot Login

**Problem:** Employee created but cannot login

**Solution:** Check if password was set via `/set-password` endpoint

**Verify:**
```sql
SELECT u.email, u.password IS NOT NULL as has_user_password, 
       a.password IS NOT NULL as has_account_password
FROM "User" u
LEFT JOIN "Account" a ON a."userId" = u.id AND a."providerId" = 'credential'
WHERE u.email = 'employee@email.com';
```

Both `has_user_password` and `has_account_password` should be `true`.

### Session Not Working

**Problem:** API returns 401 Unauthorized

**Solution:** 
1. Check if session cookie is being sent
2. Verify cookie name (Better Auth uses `better-auth.session_token`)
3. Check if session hasn't expired

### Account Record Missing

**Problem:** Employee exists but Account record is missing

**Solution:** Run this to create Account record:
```typescript
await prisma.account.create({
  data: {
    userId: "employee_id",
    accountId: "employee@email.com",
    providerId: "credential",
    password: null // Will be set via /set-password
  }
});
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden - Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Employee not found"
}
```

### 409 Conflict
```json
{
  "error": "Email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Usage Flow

### Creating and Onboarding an Employee

1. **Admin creates employee** (password is NULL)
   ```
   POST /api/admin/employees
   ```

2. **Admin sets initial password**
   ```
   POST /api/admin/employees/:id/set-password
   ```

3. **Employee logs in via Better Auth**
   ```
   POST /api/auth/login (Better Auth endpoint)
   ```

4. **Employee accesses role-based dashboard**
   - Admin → `/admin`
   - Counter → `/counter`
   - Kitchen → `/kitchen`

---

## Database Schema

### User Table
```typescript
{
  id: string (cuid)
  name: string
  email: string (unique)
  phone: string (unique)
  password: string | null
  emailVerified: boolean
  image: string | null
  role: "ADMIN" | "COUNTER" | "KITCHEN"
  status: "ACTIVE" | "ON_LEAVE"
  dutyType: "FULL_TIME" | "PART_TIME"
  shift: "DAY" | "NIGHT"
  joiningDate: DateTime
  monthlySalary: Decimal
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## Testing with cURL

### Create Employee
```bash
curl -X POST http://localhost:3000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Test Employee",
    "email": "test@example.com",
    "phone": "+8801712345678",
    "role": "COUNTER",
    "status": "ACTIVE",
    "dutyType": "FULL_TIME",
    "shift": "DAY",
    "joiningDate": "2025-01-01",
    "monthlySalary": 25000
  }'
```

### Get All Employees
```bash
curl -X GET "http://localhost:3000/api/admin/employees?page=1&limit=10" \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN"
```

---

## Best Practices

1. **Always validate input** - Zod schemas handle this
2. **Use transactions** for complex operations
3. **Log all admin actions** via AuditLog table
4. **Soft delete** instead of hard delete
5. **Index frequently queried fields** (already done in schema)
6. **Use pagination** for large result sets
7. **Implement rate limiting** (recommended for production)

---

## Security Considerations

- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Input validation with Zod
- ✅ SQL injection protection via Prisma
- ✅ Audit logging for all admin actions
- ⚠️ Add reCAPTCHA for login (as per requirements)
- ⚠️ Add rate limiting for production
- ⚠️ Add session timeout configuration

---

## Next Steps

1. Implement reCAPTCHA on login
2. Create role-based middleware for `/counter` and `/kitchen` routes
3. Implement session timeout
4. Add email notifications for password setup
5. Create frontend UI for employee management
6. Add export functionality (CSV/PDF)
7. Implement bulk operations

