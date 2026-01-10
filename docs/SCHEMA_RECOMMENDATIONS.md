# Schema Recommendations for Restaurant Management

## Current Schema Analysis

Your current Prisma schema is **well-designed** and suitable for a restaurant management system. However, here are some optional improvements you could consider based on industry best practices for restaurant operations.

---

## ✅ Current Schema Strengths

1. **Good separation of concerns** - Tables, Reservations, Orders, Customers
2. **Proper relationships** - Foreign keys and cascading deletes
3. **Status enums** - Clear state management
4. **Audit logging** - Tracks all changes
5. **Flexible roles** - ADMIN, COUNTER, KITCHEN

---

## 💡 Optional Improvements

### 1. Table Model Enhancement

**Current:**
```prisma
model Table {
  id              Int      @id @default(autoincrement())
  tableNumber     String   @unique
  seatingCapacity Int
  isAvailable     Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Suggested Enhancement:**
```prisma
enum TableStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
  MAINTENANCE
}

enum TableLocation {
  INDOOR
  OUTDOOR
  PATIO
  BAR
  VIP
}

model Table {
  id              Int          @id @default(autoincrement())
  tableNumber     String       @unique
  seatingCapacity Int
  minCapacity     Int?         // Minimum guests (for large tables)
  status          TableStatus  @default(AVAILABLE)  // More granular than boolean
  location        TableLocation @default(INDOOR)
  floor           Int?         // For multi-floor restaurants
  section         String?      // e.g., "Smoking", "Window", "Corner"
  shape           String?      // e.g., "Round", "Rectangle", "Square"
  notes           String?      // e.g., "Near kitchen", "Best view"
  isActive        Boolean      @default(true)  // For soft delete
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  orders          Order[]
  reservations    Reservation[]
  
  @@index([status])
  @@index([location])
  @@index([isActive])
}
```

**Benefits:**
- More precise status tracking (reserved vs occupied)
- Better table organization (floor, section, location)
- Useful for customers who want specific table types
- Maintenance status prevents booking during repairs

---

### 2. Reservation Model Enhancement

**Current:**
```prisma
model Reservation {
  id                 Int               @id @default(autoincrement())
  customerId         Int
  numGuests          Int
  tableId            Int
  reservationDate    DateTime          @db.Date
  startTime          DateTime
  endTime            DateTime
  status             ReservationStatus @default(PENDING)
  assignedOrderId    Int?
  cancellationReason String?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
}
```

**Suggested Enhancement:**
```prisma
enum ReservationSource {
  PHONE
  WEBSITE
  WALK_IN
  THIRD_PARTY  // e.g., OpenTable, Google
  MOBILE_APP
}

enum SpecialOccasion {
  NONE
  BIRTHDAY
  ANNIVERSARY
  BUSINESS
  DATE
  CELEBRATION
}

model Reservation {
  id                 Int                @id @default(autoincrement())
  customerId         Int
  numGuests          Int
  tableId            Int
  reservationDate    DateTime           @db.Date
  startTime          DateTime
  endTime            DateTime
  status             ReservationStatus  @default(PENDING)
  assignedOrderId    Int?
  
  // Enhanced fields
  source             ReservationSource  @default(PHONE)
  specialOccasion    SpecialOccasion?   @default(NONE)
  specialRequests    String?            // e.g., "High chair needed"
  dietaryRestrictions String?           // e.g., "Vegan", "Gluten-free"
  seatingPreference  String?            // e.g., "Window seat", "Quiet area"
  
  reminderSent       Boolean            @default(false)
  confirmationSent   Boolean            @default(false)
  noShowCount        Int                @default(0)  // Track no-shows
  
  cancellationReason String?
  cancelledAt        DateTime?
  cancelledBy        String?            // User ID who cancelled
  
  notes              String?            // Internal staff notes
  createdBy          String?            // User ID who created
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  
  customer           Customer           @relation(fields: [customerId], references: [id], onDelete: Cascade)
  table              Table              @relation(fields: [tableId], references: [id], onDelete: Cascade)
  order              Order?             @relation(fields: [assignedOrderId], references: [id], onDelete: SetNull)
  
  @@index([customerId])
  @@index([tableId])
  @@index([reservationDate])
  @@index([status])
  @@index([source])
}
```

**Benefits:**
- Track reservation source (for marketing analysis)
- Special occasion tracking (upsell opportunities)
- Dietary restrictions (kitchen preparation)
- No-show tracking (helps identify problematic customers)
- Better cancellation tracking

---

### 3. Customer Model Enhancement

**Current:**
```prisma
model Customer {
  id        Int      @id @default(autoincrement())
  name      String
  phone     String?  @unique
  address   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Suggested Enhancement:**
```prisma
enum CustomerTier {
  REGULAR
  VIP
  PREMIUM
}

model Customer {
  id        Int          @id @default(autoincrement())
  name      String
  phone     String?      @unique
  email     String?      @unique
  address   String?
  
  // Enhanced fields
  tier              CustomerTier     @default(REGULAR)
  loyaltyPoints     Int              @default(0)
  totalSpent        Decimal          @default(0) @db.Decimal(10, 2)
  visitCount        Int              @default(0)
  noShowCount       Int              @default(0)
  lastVisitDate     DateTime?
  
  dateOfBirth       DateTime?        @db.Date
  anniversary       DateTime?        @db.Date
  preferences       String?          // e.g., "Likes spicy food"
  dietaryRestrictions String?
  allergies         String?
  
  notes             String?          // Staff notes
  isBlacklisted     Boolean          @default(false)
  blacklistReason   String?
  
  marketingOptIn    Boolean          @default(false)
  smsOptIn          Boolean          @default(false)
  
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  
  orders            Order[]
  reservations      Reservation[]
  
  @@index([phone])
  @@index([email])
  @@index([tier])
}
```

**Benefits:**
- Customer loyalty program support
- Personalized service (preferences, allergies)
- Marketing segmentation (tiers, opt-ins)
- No-show tracking
- Birthday/anniversary reminders

---

### 4. Waitlist Feature (NEW Model)

```prisma
enum WaitlistStatus {
  WAITING
  NOTIFIED
  SEATED
  CANCELLED
  NO_SHOW
}

model Waitlist {
  id            Int            @id @default(autoincrement())
  customerId    Int?
  customerName  String
  phone         String
  numGuests     Int
  
  estimatedWait Int?           // Minutes
  notifiedAt    DateTime?
  seatedAt      DateTime?
  tableId       Int?
  
  status        WaitlistStatus @default(WAITING)
  priority      Int            @default(0)  // VIP customers get higher priority
  
  preferences   String?        // e.g., "Window seat"
  notes         String?
  
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  customer      Customer?      @relation(fields: [customerId], references: [id], onDelete: SetNull)
  table         Table?         @relation(fields: [tableId], references: [id], onDelete: SetNull)
  
  @@index([status])
  @@index([createdAt])
}
```

**Benefits:**
- Manage walk-in customers when tables are full
- SMS notifications when table ready
- Better customer experience during peak hours

---

### 5. Table Combination/Grouping (NEW Model)

```prisma
model TableCombination {
  id          Int      @id @default(autoincrement())
  name        String   // e.g., "T1+T2 (Large Party)"
  capacity    Int
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tables      TableInCombination[]
}

model TableInCombination {
  id                 Int              @id @default(autoincrement())
  combinationId      Int
  tableId            Int
  
  combination        TableCombination @relation(fields: [combinationId], references: [id], onDelete: Cascade)
  table              Table            @relation(fields: [tableId], references: [id], onDelete: Cascade)
  
  @@unique([combinationId, tableId])
  @@index([combinationId])
  @@index([tableId])
}
```

**Benefits:**
- Support large parties (8+ guests)
- Combine adjacent tables
- Track combined table availability

---

### 6. Reservation Deposit (NEW Model)

```prisma
enum DepositStatus {
  PENDING
  PAID
  REFUNDED
  FORFEITED
}

model ReservationDeposit {
  id              Int           @id @default(autoincrement())
  reservationId   Int           @unique
  amount          Decimal       @db.Decimal(10, 2)
  status          DepositStatus @default(PENDING)
  paymentMethod   PaymentMethod
  refundReason    String?
  refundedAt      DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  reservation     Reservation   @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  
  @@index([status])
}
```

**Benefits:**
- Reduce no-shows (especially for large parties)
- Revenue protection
- Industry standard for fine dining

---

## 🎯 Priority Recommendations

### High Priority (Implement Soon)
1. **Table Status Enum** - Replace boolean with AVAILABLE/OCCUPIED/RESERVED/MAINTENANCE
2. **Customer Email** - Essential for digital receipts and marketing
3. **Reservation Source** - Track where bookings come from
4. **Notes fields** - Staff need to record important information

### Medium Priority (Consider for V2)
5. **Customer Loyalty** - Points system, tiers, visit tracking
6. **Waitlist System** - Essential for busy restaurants
7. **Special Occasions** - Birthday/anniversary tracking
8. **Table Locations** - Indoor/outdoor, floor, section

### Low Priority (Nice to Have)
9. **Table Combinations** - Only if you serve large parties regularly
10. **Reservation Deposits** - Only for fine dining or no-show problems
11. **Dietary Restrictions** - Can store in notes field initially
12. **Marketing Opt-ins** - Add when ready to do email campaigns

---

## 📊 Performance Indexes

Add these indexes if not already present:

```prisma
// Table
@@index([status])
@@index([location])
@@index([isActive])

// Reservation
@@index([customerId])
@@index([tableId])
@@index([reservationDate])
@@index([status])
@@index([startTime, endTime])

// Customer
@@index([phone])
@@index([email])
@@index([tier])
@@index([lastVisitDate])
```

---

## 🔄 Migration Strategy

If you decide to implement any of these:

1. **Backward Compatible Changes** (safe):
   - Adding optional fields
   - Adding new indexes
   - Adding new models

2. **Breaking Changes** (requires planning):
   - Changing `isAvailable` Boolean to `status` Enum
   - Requires data migration
   - Update all API endpoints

**Recommended Approach:**
```bash
# Add new field first
prisma migrate dev --name add_table_status_field

# Keep both fields temporarily
# Update application code to use new field
# After verification, remove old field
prisma migrate dev --name remove_is_available_field
```

---

## 🎬 Implementation Timeline

**Phase 1 (Current)** - Core Features ✅
- Basic table management
- Basic reservation system
- Customer creation
- Status automation

**Phase 2 (Next Sprint)** - Enhanced Features
- Table status enum
- Customer email field
- Reservation source tracking
- Special occasion tracking
- Staff notes

**Phase 3 (Future)** - Advanced Features
- Waitlist system
- Customer loyalty program
- Table combinations
- Deposit system
- Marketing automation

---

## ⚠️ Important Notes

1. **Don't over-engineer**: Start with what you need NOW
2. **Iterate based on feedback**: Add features as staff requests them
3. **Consider your restaurant type**: 
   - Fast casual? Keep it simple
   - Fine dining? Need deposits and special occasions
   - High volume? Need waitlist system
4. **Performance first**: Don't add fields you won't use

---

## ✅ Decision

**Your current schema is PRODUCTION READY as-is!**

The improvements above are **optional enhancements** for future iterations. Implement them based on:
- User feedback
- Operational pain points
- Business requirements
- Feature requests

Start with what you have, gather data, then enhance based on real usage patterns.
