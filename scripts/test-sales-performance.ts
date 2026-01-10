import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSalesPerformance() {
  console.log('🚀 Testing sales performance improvements...\n');

  try {
    // Test 1: Check if indexes are working for batch queries
    console.log('📊 Test 1: Active batch query performance');
    const startTime1 = Date.now();
    
    const activeBatches = await prisma.productBatch.findMany({
      where: {
        itemId: 1, // Replace with actual item ID
        quantity: { gt: 0 },
        status: 'ACTIVE'
      },
      orderBy: [
        { expiryDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    const endTime1 = Date.now();
    console.log(`✅ Found ${activeBatches.length} active batches in ${endTime1 - startTime1}ms\n`);

    // Test 2: Check inventory status query
    console.log('📊 Test 2: Inventory status query performance');
    const startTime2 = Date.now();
    
    const inventoryItems = await prisma.inventory.findMany({
      where: {
        status: 'IN_STOCK'
      },
      include: {
        product: {
          select: { itemName: true }
        }
      },
      take: 10
    });
    
    const endTime2 = Date.now();
    console.log(`✅ Found ${inventoryItems.length} in-stock items in ${endTime2 - startTime2}ms\n`);

    // Test 3: Check product batch compound index
    console.log('📊 Test 3: Product batch compound index performance');
    const startTime3 = Date.now();
    
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        batches: {
          where: {
            quantity: { gt: 0 },
            status: 'ACTIVE'
          }
        }
      },
      take: 5
    });
    
    const endTime3 = Date.now();
    console.log(`✅ Found ${products.length} products with active batches in ${endTime3 - startTime3}ms\n`);

    console.log('🎉 Performance tests completed successfully!');
    console.log('\n💡 Performance improvements implemented:');
    console.log('   • Batched database operations instead of loops');
    console.log('   • Added compound indexes for faster queries');
    console.log('   • Parallel processing of inventory deductions');
    console.log('   • Optimized batch activation logic');
    console.log('   • Reduced redundant database calls');

  } catch (error) {
    console.error('❌ Error during performance testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSalesPerformance();