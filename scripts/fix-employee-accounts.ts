/**
 * Script to fix existing employees without proper Better Auth Account records
 * Run this if you have employees created before the Better Auth integration fix
 */

import prisma from "../src/lib/prisma";
import { generateId } from "better-auth";

async function fixExistingEmployees() {
  console.log("🔧 Fixing existing employees without Better Auth accounts...\n");

  try {
    // Find all users without credential accounts
    const usersWithoutAccounts = await prisma.user.findMany({
      where: {
        accounts: {
          none: {
            providerId: "credential",
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    console.log(`Found ${usersWithoutAccounts.length} users without proper accounts\n`);

    if (usersWithoutAccounts.length === 0) {
      console.log("✅ All users have proper Account records!");
      return;
    }

    for (const user of usersWithoutAccounts) {
      console.log(`Fixing user: ${user.email}`);

      try {
        // Create Account record for Better Auth
        await prisma.account.create({
          data: {
            id: generateId(),
            userId: user.id,
            accountId: user.email,
            providerId: "credential",
            password: user.password, // Transfer existing password (might be null)
          },
        });

        console.log(`✅ Created Account for ${user.email}`);
        
        if (!user.password) {
          console.log(`⚠️  ${user.email} still needs password set via API\n`);
        } else {
          console.log(`⚠️  ${user.email} has old bcrypt password - needs re-set via API\n`);
        }
      } catch (error) {
        console.error(`❌ Failed to fix ${user.email}:`, error);
      }
    }

    console.log("\n✅ Migration complete!");
    console.log("\n⚠️  IMPORTANT: All fixed employees need their passwords reset using:");
    console.log("   POST /api/admin/employees/:id/set-password");
    console.log("   This will update both User and Account with proper Better Auth hash\n");
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  }
}

fixExistingEmployees()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
