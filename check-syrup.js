const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSyrup() {
    try {
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { itemName: { contains: 'syrup', mode: 'insensitive' } },
                    { tabletsPerStrip: { in: [0, null] } }
                ]
            },
            include: {
                batches: true
            },
            take: 10
        });

        console.log('Found Products:', products.length);
        products.forEach(p => {
            console.log(`Product: ${p.itemName}, ID: ${p.id}, TabletsPerStrip: ${p.tabletsPerStrip}, Batches: ${p.batches.length}`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkSyrup();
