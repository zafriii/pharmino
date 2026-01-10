Pharmacy Management User Workflow

1. Category Management

Purpose: User first adds categories for medicines. 

Example Categories: Tablet, Syrup, Injection, Capsule, Cream, Drops. 

Workflow: 

Navigate to Category Management. 

Add new categories that classify medicines, edit, delete. 

2. Item Management

Purpose: Add medicines under specific categories with all required details. 

Workflow: 

Navigate to Item Management. 

Select the Category the medicine belongs to. 

Fill in all required fields: 

Item Name (Napa)

Category 

Generic Name (Paracetamol) 

Brand / Company 

Strength (e.g., 500 mg, 120 ml) ( optional) 

Tablets per Strip (Optional) 

Base Unit (Tablet / ml)(optional) 

Rack / Shelf Location 

Low Stock Threshold 

Selling Price 

Status (Active / Inactive) 

Result: Item is now part of the pharmacy’s inventory system but stock is not yet added. 

3. Purchase Management (with Individual Item Tracking)

Purpose: Manage purchase planning, ordering, receiving, and preparing individual items for inventory.

a) Purchase List (PO – Planning)

Workflow:

Navigate to Purchase List. 

Add medicines that the pharmacy plans to purchase. 

For each medicine, fill in: 

Item Name: Select from the existing medicine list. 

Brand: Auto-filled based on the selected medicine. 

Supplier 

Quantity ( For each item) 

Total Amount 

Key Points:

Multiple items can be added to the same purchase order. 

Database Storage: 

Each item is stored individually, even if part of the same purchase order. 

A Purchase Order ID (PO ID) groups the items conceptually. 

UI Representation:

In the Purchase List table, multiple items under the same PO can appear like this:

Action: There is an Order button for the PO: 

Clicking it changes the status of all items in that PO to Ordered. 

Items then appear in Purchase History. 

b) Purchase History & Receiving

Workflow:

Ordered items appear in Purchase History, still grouped under the same PO ID. Showing-

Item Name , Brand, Supplier, Quantity, Total Amount  

Each item remains a separate record in the database. 

Status is initially Incoming. 

A tick mark is displayed next to PO Id: 

Clicking it updates the item’s status to Received. 

Each received item is now ready for inventory/stock entry. 

Each item is individually selectable when adding to inventory, even though they share the same PO/Receive ID. 

Marking received will create a separate received table in the database. 

Result:

Even if multiple items are ordered together (e.g., Napa, Burnol, Injection), they are stored as separate items in the database. 

Allows the user to select individual items when adding to inventory/stock. 

Status flow for each item: Listed → Ordered → Received 

4. Stock Entry

Purpose: Add received items into the inventory stock. 

Workflow: 

Navigate to Stock Entry. 

Select medicine from the received list and fill in required fields: 

Item Name 

Brand 

Batch Number (auto-generated) 

Expiry Date (optional) 

Purchase Price 

Selling Price 

Quantity (in base units) 

Supplier 

Result: 

A new batch is automatically created. 

Batch is marked as Active, while previous batches (if any) may be Inactive until the older batch is sold or expires. 

Stock quantity updates dynamically based on batch quantities. 

Key Points:

Stock always exists at the batch level. 

Users do not manually create batches; the system handles batch creation. 

Supports FIFO logic: older batches sell first. 

5. Medicine & Stock Display

Purpose: View all medicines and their stock information in one place.

Workflow:

Navigate to the All Inventory item page. 

All items with stock entries appear in a single master list. 

Each medicine shows the following fields: 

Item Status: Active / Inactive (can be manually changed). 

Stock Status: In Stock / Low Stock / Out of Stock (calculated dynamically based on batch quantities and thresholds). 

View All button for each item to see batch-wise details. 

Batch-wise Stock Details

Clicking View All displays all batches for that medicine: 

Batch Number 

Expiry Date 

Quantity 

Status: Active / Inactive 

Logic:

Active/Inactive: 

The first added batch of NAPA-001 is Active. 

Newer batches  NAPA-002 remain inactive until the previous batch NAPA-001 is sold out or expired. 

Stock Status Calculation 

Low Stock Threshold:  

Defined per medicine (e.g., Napa threshold = 80 tablets).  

Total Stock Calculation:  

Total stock = Sum of all batches, both Active and Inactive.  

Example:  

Batch A = 30 (Active)  

Batch B = 40 (Inactive)  

Total Stock = 30 + 40 = 70 → Compared against threshold.  

Stock Status Logic:  

In Stock: Total stock ≥ Low Stock Threshold  

Low Stock: Total stock < Low Stock Threshold but > 0  

Out of Stock: Total stock = 0  

Batch-wise Quantity & Sold-Out:  

Individual batch quantities determine batch status:  

When a batch quantity = 0 or expires, it moves to the Sold-Out page.  

Next batch activation:  

When the previous batch (older batch) quantity reaches 0 or expires, the next batch automatically becomes Active.  

Inventory display:  

The stock page shows total stock (all batches combined).  

View All button shows batch-wise quantity and status (Active / Inactive / Sold-Out).

Sold-Out Handling: 

When a batch quantity reaches 0 or expires, it moves to a Sold-Out page. 

The Sold-Out page lists batch-wise sold-out items for reference and auditing.

6. Damage / Loss Management

Purpose: Deduct damaged or lost stock from inventory. 

Workflow: 

Navigate to Damage / Loss Management. 

Select the medicine and specific batch. 

Enter the quantity lost or damaged. 

The system automatically deducts the quantity from stock. 

7. Selling Types (Full Strip / Single Tablet - For tablet)

Core Rule

Stock is always maintained in the smallest unit (tablet or ml). 

Strip selling is only a calculation layer, not a stock unit. 

Internally, the system always deducts tablets, even when selling a strip. 

Pricing Logic

If Selling Price per Tablet is entered, the system automatically calculates Selling Price per Strip using: 

Tablets per Strip × Price per Tablet 

If Selling Price per Strip is entered, the system automatically calculates Selling Price per Tablet. 

Example:

Selling Price per Tablet = 2.00 BDT 

Tablets per Strip = 10 

Selling Price per Strip = 20.00 BDT (auto-calculated) 

8. Selling Process (POS User Workflow)

POS Screen – User View

When the cashier opens the POS screen and selects a medicine, the following information is shown:

Item Name (e.g., Napa 500 mg) 

Generic Name (Paracetamol) 

Brand (Beximco) 

Available Stock (shown in tablets, e.g., 160 tablets) 

Sell Type options - when tablet (optional): 

Full Strip 

Single Tablet 

Here the user doesn't see or select batches.

Case A: Full Strip Sale (User Flow)

The customer wants to buy 1 strip of Napa. 

The cashier selects Sell Type: Full Strip and enters quantity 1. 

The system converts: 

1 strip = 10 tablets 

The system automatically: 

Finds the earliest-expiring valid batch (FIFO). 

Deducts 10 tablets from that batch. 

Selling price is calculated: 

1 × 20.00 BDT = 20.00 BDT 

Sale is completed and payment is marked as Paid. 

Important:

Even though the user sold “1 strip”, internally the system deducted 10 tablets from a specific batch. 

Case B: Single Tablet Sale (User Flow)

The customer wants to buy 2 tablets. 

The cashier selects Sell Type: Single Tablet and enters quantity 2. 

The system calculates: 

2 × 2.00 BDT = 4.00 BDT 

The system automatically: 

Pick the earliest-expiring batch. 

Deducts 2 tablets from that batch. 

Sale is completed and payment is marked as Paid. 

Batch Selection & Stock Deduction (System Logic)

This part is fully automatic and invisible to the user.

Internal Steps:

The system fetches all valid (non-expired, non-blocked) batches of the items. 

Batches are sorted by earliest expiry date (FIFO). 

items are deducted from batches in order. 

Example:

Batch A (expires June 2025) has 60 tablets. 

Selling 10 tablets: 

Batch A becomes 50 tablets. 

The user never selects a batch FIFO logic is strictly enforced

Order & Batch Mapping (Behind the Scenes)

Every sale creates two internal records:

Order Item Record (Medicine-based) 

item 

Sell Type (Strip / Tablet)(optional)

Quantity sold 

Unit price 

Total selling price 

Order–Batch Mapping Record 

Which batch was used 

How many items were deducted 

Purchase price (for profit calculation) 

Selling price 

This mapping is critical for:

Returns 

Profit calculation 

Audit trails 

Return Handling (User Workflow)

Scenario: Customer Returns Medicine

A customer returns 1 strip of Napa. 

The cashier opens the sale record and selects Return. 

The cashier provides a return reason (e.g., “Customer changed mind”). 

System Actions:

The system identifies the exact batch from which the tablets were originally sold. 

10 tablets are added back to that batch. 

Sale status is updated to Returned. 

Payment status is updated to Refunded. 

This ensures stock accuracy and batch traceability.

After an order payment status is Paid by default

Expiry Handling During Selling

When a batch expires: 

It is automatically blocked. 

It cannot be sold. 

It is excluded from selling and stock calculations. 

Example:

Batch A expires → system blocks it. 

Batch B automatically becomes Active and sellable. 