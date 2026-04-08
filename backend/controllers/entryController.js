const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Submit ticket entries.
 * Input: [ { ticketTypeId, quantity }, ... ]
 * For each item:
 *   startSerial = currentSerial + 1
 *   endSerial   = currentSerial + quantity
 *   Update serial counter
 *   Insert TicketEntry
 * All done in a single DB transaction to prevent duplicates.
 */
const submitEntries = async (req, res) => {
  try {
    const { entries } = req.body; // array of { ticketTypeId, quantity }
    const userId = req.user.id;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "Entries array required" });
    }

    // Filter valid (quantity > 0)
    const validEntries = entries.filter((e) => e.quantity > 0);
    if (validEntries.length === 0) {
      return res.status(400).json({ error: "No valid quantities" });
    }

    const created = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const entry of validEntries) {
        const { ticketTypeId, quantity } = entry;
        const tid = parseInt(ticketTypeId);
        const qty = parseInt(quantity);

        // Lock and fetch current serial counter
        const counter = await tx.serialCounter.findUnique({
          where: { ticketTypeId: tid },
        });
        if (!counter) throw new Error(`No serial counter for ticket type ${tid}`);

        const startSerial = counter.currentSerial + 1;
        const endSerial = counter.currentSerial + qty;

        // Update counter first (prevents race conditions within transaction)
        await tx.serialCounter.update({
          where: { ticketTypeId: tid },
          data: { currentSerial: endSerial },
        });

        // Insert the entry record
        const record = await tx.ticketEntry.create({
          data: {
            ticketTypeId: tid,
            quantity: qty,
            startSerial,
            endSerial,
            userId,
          },
          include: { ticketType: true },
        });

        results.push(record);
      }

      return results;
    });

    res.status(201).json({ message: "Entry submitted successfully", entries: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to submit entries" });
  }
};

// Get all entries (admin) or own entries (operator)
const getEntries = async (req, res) => {
  try {
    const isAdmin = req.user.role === "SUPER_ADMIN";
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const entries = await prisma.ticketEntry.findMany({
      where: isAdmin ? {} : { userId: req.user.id },
      include: { ticketType: true, user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.ticketEntry.count({
      where: isAdmin ? {} : { userId: req.user.id },
    });

    res.json({ entries, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
};

module.exports = { submitEntries, getEntries };
