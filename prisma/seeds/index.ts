import { PrismaClient } from "@prisma/client";

import { seedBase } from "./base";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await seedBase(prisma);

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
