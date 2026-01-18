const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const start = new Date('2026-01-17T00:00:00Z');
    const end = new Date('2026-01-18T23:59:59Z');

    console.log('Checking expenses between', start, 'and', end);

    const expenses = await prisma.expense.findMany({
        where: {
            date: {
                gte: new Date('2026-01-17T00:00:00Z'),
                lte: new Date('2026-01-19T00:00:00Z')
            }
        }
    });

    console.log('Expenses found:', JSON.stringify(expenses, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
