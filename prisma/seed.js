const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@planora.app" },
    update: {},
    create: {
      name: "Planora Admin",
      email: "admin@planora.app",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const userPassword = await bcrypt.hash("User123!", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@planora.app" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@planora.app",
      password: userPassword,
      role: "USER",
    },
  });

  await prisma.event.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      title: "Planora Launch Meetup",
      description: "Kickoff event to celebrate the Planora platform launch.",
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      time: "18:00",
      venue: "Dhaka Tech Hub",
      visibility: "PUBLIC",
      fee: 0,
      isFeatured: true,
      ownerId: admin.id,
    },
  });

  console.log("Seed complete:", { admin: admin.email, user: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
