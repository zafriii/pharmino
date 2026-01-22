const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    try {
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { itemName: { contains: 'syrup', mode: 'insensitive' } },
                    { tabletsPerStrip: null },
                    { tabletsPerStrip: 0 }
                ]
            },
            take: 5,
            include: {
                batches: {
                    include: {
                        damageRecords: true
                    }
                }
            }
        });

        console.log(JSON.stringify(products, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
