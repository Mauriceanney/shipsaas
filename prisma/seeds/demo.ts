import { Plan, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedDemo() {
  console.log("🎭 Seeding demo data...");

  // Demo User
  const demoPassword = await bcrypt.hash("demo123", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      password: demoPassword,
      role: Role.USER,
      emailVerified: new Date(),
      subscription: {
        create: {
          status: "ACTIVE",
          plan: Plan.PLUS,
        },
      },
    },
  });
  console.log("  ✓ Demo user created:", demoUser.email);

  // Admin User
  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
      subscription: {
        create: {
          status: "ACTIVE",
          plan: Plan.PRO,
        },
      },
    },
  });
  console.log("  ✓ Admin user created:", adminUser.email);

  console.log("✅ Demo seeding complete!");
  console.log("");
  console.log("  Demo accounts:");
  console.log("  📧 demo@example.com / demo123");
  console.log("  📧 admin@example.com / admin123");
}

seedDemo()
  .catch((e) => {
    console.error("❌ Demo seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
