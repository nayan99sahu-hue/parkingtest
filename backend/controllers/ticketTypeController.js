const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all active ticket types (for operator) or all (for admin)
const getAll = async (req, res) => {
  try {
    const isAdmin = req.user.role === "SUPER_ADMIN";
    const types = await prisma.ticketType.findMany({
      where: isAdmin ? {} : { isActive: true },
      include: { serialCounter: true },
      orderBy: { value: "asc" },
    });
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ticket types" });
  }
};

// Create new ticket type (admin only)
const create = async (req, res) => {
  try {
    const { name, value, color, serialStart } = req.body;
    if (!name || !value) return res.status(400).json({ error: "Name and value required" });

    // Create ticket type + serial counter in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const type = await tx.ticketType.create({
        data: { name, value: parseInt(value), color: color || "#3B82F6" },
      });
      await tx.serialCounter.create({
        data: {
          ticketTypeId: type.id,
          currentSerial: serialStart ? parseInt(serialStart) : 0,
        },
      });
      return type;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create ticket type" });
  }
};

// Update ticket type (admin only)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value, color, isActive } = req.body;

    const type = await prisma.ticketType.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(value !== undefined && { value: parseInt(value) }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(type);
  } catch (err) {
    res.status(500).json({ error: "Failed to update ticket type" });
  }
};

// Delete ticket type (admin only)
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.ticketType.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete ticket type" });
  }
};

module.exports = { getAll, create, update, remove };
