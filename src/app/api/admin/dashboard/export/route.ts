import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { getTimezoneFromRequest } from "@/lib/timezone-utils";
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Helper function to calculate date ranges based on period (same as dashboard route)
function getDateRange(period?: string, startDate?: string, endDate?: string) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  let filterStartDate: Date;
  let filterEndDate: Date;
  
  if (period === 'custom' && startDate && endDate) {
    filterStartDate = new Date(startDate);
    filterEndDate = new Date(endDate);
    filterEndDate.setHours(23, 59, 59, 999); // End of day
  } else if (period === '7days') {
    filterStartDate = new Date(today);
    filterStartDate.setDate(today.getDate() - 7);
    filterEndDate = new Date(today);
    filterEndDate.setHours(23, 59, 59, 999);
  } else if (period === '30days') {
    filterStartDate = new Date(today);
    filterStartDate.setDate(today.getDate() - 30);
    filterEndDate = new Date(today);
    filterEndDate.setHours(23, 59, 59, 999);
  } else if (period === 'lastmonth') {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    filterStartDate = lastMonth;
    filterEndDate = lastMonthEnd;
    filterEndDate.setHours(23, 59, 59, 999);
  } else {
    // Default: this month
    filterStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
    filterEndDate = new Date(today);
    filterEndDate.setHours(23, 59, 59, 999);
  }
  
  return { filterStartDate, filterEndDate };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    console.log('Export API called with filters:', { period, startDate, endDate });
    
    const { filterStartDate, filterEndDate } = getDateRange(period || undefined, startDate || undefined, endDate || undefined);
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    // Get current year and month for comparisons
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Start of current month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);

    // Fetch all dashboard data for export
    console.log("Fetching data for export with date range:", filterStartDate, "to", filterEndDate);

    // 1. Today's Sales Data (always today regardless of filters)
    const todaysSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      include: {
        customer: true,
        payments: true,
        saleItems: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    // 2. Filtered Period Sales Data
    const filteredSales = await prisma.sale.findMany({
      where: {
        createdAt: { 
          gte: filterStartDate,
          lte: filterEndDate
        }
      },
      include: {
        customer: true,
        payments: true,
        saleItems: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    // 3. Products Data
    const products = await prisma.product.findMany({
      include: {
        category: true,
        inventory: true
      }
    });

    // 4. Expenses Data (filtered)
    const expenses = await prisma.expense.findMany({
      where: {
        date: { 
          gte: filterStartDate,
          lte: filterEndDate
        }
      }
    });

    // 5. Payroll Data (filtered)
    const payroll = await prisma.payroll.findMany({
      where: {
        createdAt: { 
          gte: filterStartDate,
          lte: filterEndDate
        }
      },
      include: {
        user: true
      }
    });

    // 6. Inventory Alerts - Use timezone-aware expiration logic
    const userTimezone = getTimezoneFromRequest(request);
    
    // Get current date in user's timezone for expiration calculations
    let currentDateLocal: Date;
    if (userTimezone) {
      const now = new Date();
      const userDate = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
      currentDateLocal = new Date(userDate.getFullYear(), userDate.getMonth(), userDate.getDate());
    } else {
      const now = new Date();
      currentDateLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    // Calculate 2 days from current date in user's timezone
    const twoDaysFromNow = new Date(currentDateLocal);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    // Convert to UTC for database query
    const twoDaysFromNowUTC = new Date(Date.UTC(
      twoDaysFromNow.getFullYear(),
      twoDaysFromNow.getMonth(),
      twoDaysFromNow.getDate()
    ));
    
    const expiringProducts = await prisma.productBatch.findMany({
      where: {
        status: 'ACTIVE',
        quantity: { gt: 0 },
        expiryDate: {
          lte: twoDaysFromNowUTC
        }
      },
      include: {
        item: true
      }
    });

    const inventoryAlerts = await prisma.inventory.findMany({
      where: {
        OR: [
          { status: 'LOW_STOCK' },
          { status: 'OUT_OF_STOCK' }
        ]
      },
      include: {
        product: true
      }
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Dashboard Summary
    const summaryData = [
      ['Dashboard Summary', '', '', ''],
      ['Generated On:', new Date().toLocaleString(), '', ''],
      ['', '', '', ''],
      ['Today\'s Metrics', '', '', ''],
      ['Today\'s Revenue:', todaysSales.filter(s => s.paymentStatus === 'PAID').reduce((sum, s) => sum + Number(s.grandTotal), 0), '', ''],
      ['Today\'s Orders:', todaysSales.length, '', ''],
      ['Today\'s Returns:', todaysSales.filter(s => s.paymentStatus === 'REFUNDED').length, '', ''],
      ['', '', '', ''],
      ['Current Period Metrics', '', '', ''],
      ['Total Revenue:', filteredSales.filter(s => s.paymentStatus === 'PAID').reduce((sum, s) => sum + Number(s.grandTotal), 0), '', ''],
      ['Total Orders:', filteredSales.length, '', ''],
      ['Total Expenses:', expenses.reduce((sum, e) => sum + Number(e.amount), 0), '', ''],
      ['Total Payroll:', payroll.filter(p => p.paymentStatus === 'PAID').reduce((sum, p) => sum + Number(p.netPay), 0), '', ''],
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Sheet 2: Today's Sales
    const todaysSalesData = [
      ['Sale ID', 'Date', 'Customer', 'Payment Method', 'Status', 'Subtotal', 'Tax', 'Discount', 'Grand Total']
    ];
    
    todaysSales.forEach(sale => {
      todaysSalesData.push([
        sale.id.toString(),
        sale.createdAt.toLocaleString(),
        sale.customer?.name || 'Walk-in Customer',
        sale.paymentMethod,
        sale.paymentStatus,
        Number(sale.subtotal).toString(),
        '0', // Tax amount - not in schema
        Number(sale.discountAmount).toString(),
        Number(sale.grandTotal).toString()
      ]);
    });
    
    const todaysSalesSheet = XLSX.utils.aoa_to_sheet(todaysSalesData);
    XLSX.utils.book_append_sheet(workbook, todaysSalesSheet, 'Today Sales');

    // Sheet 3: Filtered Period Sales
    const periodSalesData = [
      ['Sale ID', 'Date', 'Customer', 'Payment Method', 'Status', 'Subtotal', 'Tax', 'Discount', 'Grand Total']
    ];
    
    filteredSales.forEach(sale => {
      periodSalesData.push([
        sale.id.toString(),
        sale.createdAt.toLocaleString(),
        sale.customer?.name || 'Walk-in Customer',
        sale.paymentMethod,
        sale.paymentStatus,
        Number(sale.subtotal).toString(),
        '0', // Tax amount - not in schema
        Number(sale.discountAmount).toString(),
        Number(sale.grandTotal).toString()
      ]);
    });
    
    const periodSalesSheet = XLSX.utils.aoa_to_sheet(periodSalesData);
    XLSX.utils.book_append_sheet(workbook, periodSalesSheet, 'Period Sales');

    // Sheet 4: Sale Items Details (Filtered Period)
    const saleItemsData = [
      ['Sale ID', 'Sale Date', 'Product Name', 'Category', 'Quantity', 'Unit Price', 'Total Price', 'Payment Status']
    ];
    
    filteredSales.forEach(sale => {
      sale.saleItems.forEach(item => {
        saleItemsData.push([
          sale.id.toString(),
          sale.createdAt.toLocaleString(),
          item.item.itemName,
          item.item.category?.name || 'No Category',
          item.quantity.toString(),
          Number(item.unitPrice).toString(),
          Number(item.totalPrice).toString(),
          sale.paymentStatus
        ]);
      });
    });
    
    const saleItemsSheet = XLSX.utils.aoa_to_sheet(saleItemsData);
    XLSX.utils.book_append_sheet(workbook, saleItemsSheet, 'Sale Items Details');

    // Sheet 5: Products & Inventory
    const productsData = [
      ['Product ID', 'Name', 'Category', 'Selling Price', 'Price Per Unit', 'Stock Quantity', 'Low Stock Threshold', 'Status']
    ];
    
    products.forEach(product => {
      productsData.push([
        product.id.toString(),
        product.itemName,
        product.category?.name || 'No Category',
        Number(product.sellingPrice || 0).toString(),
        Number(product.pricePerUnit || 0).toString(),
        (product.inventory?.availableQuantity || 0).toString(),
        product.lowStockThreshold.toString(),
        product.status
      ]);
    });
    
    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

    // Sheet 6: Expenses
    const expensesData = [
      ['Expense ID', 'Date', 'Category', 'Reason', 'Amount', 'Payment Method']
    ];
    
    expenses.forEach(expense => {
      expensesData.push([
        expense.id.toString(),
        expense.date.toISOString().split('T')[0], // Convert Date to string
        'General', // Category field doesn't exist in schema
        expense.reason,
        Number(expense.amount).toString(),
        'CASH' // Payment method field doesn't exist in schema
      ]);
    });
    
    const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');

    // Sheet 7: Payroll
    const payrollData = [
      ['Payroll ID', 'Employee', 'Role', 'Base Salary', 'Deductions', 'Net Pay', 'Status', 'Date']
    ];
    
    payroll.forEach(pay => {
      payrollData.push([
        pay.id.toString(),
        pay.user?.name || 'Unknown',
        pay.user?.role || 'Unknown',
        Number(pay.baseSalary).toString(),
        Number(pay.deductions).toString(),
        Number(pay.netPay).toString(),
        pay.paymentStatus,
        pay.createdAt.toLocaleString()
      ]);
    });
    
    const payrollSheet = XLSX.utils.aoa_to_sheet(payrollData);
    XLSX.utils.book_append_sheet(workbook, payrollSheet, 'Payroll');

    // Sheet 8: Inventory Alerts
    const alertsData = [
      ['Alert Type', 'Product ID', 'Product Name', 'Current Stock', 'Threshold/Expiry', 'Status']
    ];
    
    // Add expiring products
    expiringProducts.forEach(batch => {
      const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : new Date();
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      alertsData.push([
        'Expiring Soon',
        batch.item.id.toString(),
        batch.item.itemName,
        batch.quantity.toString(),
        `${daysUntilExpiry} days (${batch.expiryDate?.toISOString().split('T')[0]})`,
        'EXPIRING'
      ]);
    });
    
    // Add low/out of stock products
    inventoryAlerts.forEach(item => {
      alertsData.push([
        item.status === 'LOW_STOCK' ? 'Low Stock' : 'Out of Stock',
        item.product.id.toString(),
        item.product.itemName,
        item.availableQuantity.toString(),
        item.product.lowStockThreshold.toString(),
        item.status
      ]);
    });
    
    const alertsSheet = XLSX.utils.aoa_to_sheet(alertsData);
    XLSX.utils.book_append_sheet(workbook, alertsSheet, 'Inventory Alerts');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer',
      compression: true 
    });

    // Return the Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="dashboard-data-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error) {
    console.error("Export API Error:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to export dashboard data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}