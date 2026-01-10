import { auth } from "../src/lib/auth";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("🌱 Starting database seeding...");

  // const adminEmail = "admin@restrofly.com";
  // const adminPassword = "Admin@123";

  const adminEmail = "admin@pharmacy.com";
  const adminPassword = "Admin@123";

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log("✅ Admin user already exists:", existingUser.email);
    return;
  }

  // Use Better Auth's signup API to create user with proper password hashing
  const result = await auth.api.signUpEmail({
    body: {
      email: adminEmail,
      password: adminPassword,
      name: "System Administrator",
    },
  });

  // Update the user with additional required fields
  await prisma.user.update({
    where: { id: result.user.id },
    data: {
      phone: "+8801234567890",
      role: "ADMIN",
      status: "ACTIVE",
      dutyType: "FULL_TIME",
      shift: "DAY",
      joiningDate: new Date(),
      monthlySalary: 50000,
      emailVerified: true,
    },
  });

  // Create initial audit log
  await prisma.auditLog.create({
    data: {
      userId: result.user.id,
      action: "SYSTEM_SEEDED",
      entity: "System",
      entityId: "seed",
      details: {
        message: "Initial admin user created via seed script",
      },
    },
  });

  // Seed SystemConfig
  console.log("🔧 Seeding system configuration...");

  

 

  console.log("✅ Admin user created successfully!");
  console.log("📧 Email:", adminEmail);
  console.log("🔑 Password:", adminPassword);
  console.log("⚠️  Please change the password after first login!");
  console.log("🎉 Database seeding completed!");
}

main()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
