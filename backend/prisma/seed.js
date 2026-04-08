require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create SUPER_ADMIN user
  const hashedPw = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@parkingpos.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@parkingpos.com",
      password: hashedPw,
      role: "SUPER_ADMIN",
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Create operator
  const opPw = await bcrypt.hash("operator123", 10);
  const operator = await prisma.user.upsert({
    where: { email: "operator@parkingpos.com" },
    update: {},
    create: {
      name: "Operator One",
      email: "operator@parkingpos.com",
      password: opPw,
      role: "OPERATOR",
    },
  });
  console.log("✅ Operator created:", operator.email);

  // Ticket types with starting serials
  const ticketTypes = [
    { name: "₹5 Ticket",   value: 5,   color: "#10B981", serialStart: 600 },
    { name: "₹10 Ticket",  value: 10,  color: "#3B82F6", serialStart: 300 },
    { name: "₹20 Ticket",  value: 20,  color: "#8B5CF6", serialStart: 200 },
    { name: "₹100 Ticket", value: 100, color: "#F59E0B", serialStart: 10  },
  ];

  for (const tt of ticketTypes) {
    // Upsert ticket type (match by name)
    const existing = await prisma.ticketType.findFirst({ where: { name: tt.name } });

    let type;
    if (existing) {
      type = existing;
      console.log(`ℹ️  Ticket type already exists: ${tt.name}`);
    } else {
      type = await prisma.ticketType.create({
        data: { name: tt.name, value: tt.value, color: tt.color },
      });
      console.log(`✅ Created ticket type: ${tt.name}`);
    }

    // Upsert serial counter
    const counterExists = await prisma.serialCounter.findUnique({
      where: { ticketTypeId: type.id },
    });
    if (!counterExists) {
      await prisma.serialCounter.create({
        data: { ticketTypeId: type.id, currentSerial: tt.serialStart },
      });
      console.log(`✅ Serial counter for ${tt.name} set to ${tt.serialStart}`);
    } else {
      console.log(`ℹ️  Serial counter already exists for ${tt.name}`);
    }
  }

  console.log("\n🎉 Seeding complete!");
  console.log("-----------------------------");
  console.log("Admin login:    admin@parkingpos.com    / admin123");
  console.log("Operator login: operator@parkingpos.com / operator123");
  console.log("-----------------------------");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
