import { type PrismaClient } from "@prisma/client";

export async function seedBase(_prisma: PrismaClient) {
  console.log("  Creating base data...");

  // Add any essential data that needs to exist for the app to function
  // For example, default roles, settings, or configuration

  console.log("  ✓ Base data created");
}
