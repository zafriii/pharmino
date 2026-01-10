import prisma from "./src/lib/prisma";

async function checkAccount() {
  console.log("Checking Account table...");
  
  const accounts = await prisma.account.findMany({
    include: {
      user: true
    }
  });
  
  console.log(`Found ${accounts.length} account(s):`);
  accounts.forEach(account => {
    console.log("\nAccount ID:", account.id);
    console.log("Account accountId:", account.accountId);
    console.log("Provider ID:", account.providerId);
    console.log("User ID:", account.userId);
    console.log("User Email:", account.user.email);
    console.log("Password hash:", account.password ? "SET" : "NOT SET");
    console.log("Password length:", account.password?.length || 0);
  });
  
  await prisma.$disconnect();
}

checkAccount().catch(console.error);
