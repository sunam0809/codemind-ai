import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable } from "@workspace/db";
import { eq, desc, count, and, isNull } from "drizzle-orm";

const router = Router();

// GET /api/conversations
router.get("/conversations", async (req, res) => {
  try {
    const userId = req.user?.id ?? null;
    const where = userId
      ? eq(conversationsTable.userId, userId)
      : isNull(conversationsTable.userId);

    const conversations = await db
      .select({
        id: conversationsTable.id,
        title: conversationsTable.title,
        createdAt: conversationsTable.createdAt,
        updatedAt: conversationsTable.updatedAt,
        messageCount: count(messagesTable.id),
      })
      .from(conversationsTable)
      .leftJoin(messagesTable, eq(messagesTable.conversationId, conversationsTable.id))
      .where(where)
      .groupBy(conversationsTable.id)
      .orderBy(desc(conversationsTable.updatedAt));

    return res.json(conversations.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error listing conversations");
    return res.status(500).json({ error: "대화 목록을 가져오는 중 오류가 발생했습니다." });
  }
});

// POST /api/conversations
router.post("/conversations", async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  try {
    const userId = req.user?.id ?? null;
    const [conv] = await db.insert(conversationsTable).values({ title, userId }).returning();
    return res.status(201).json({
      ...conv,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating conversation");
    return res.status(500).json({ error: "대화를 생성하는 중 오류가 발생했습니다." });
  }
});

// GET /api/conversations/:id
router.get("/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const [conv] = await db.select().from(conversationsTable)
      .where(eq(conversationsTable.id, id)).limit(1);
    if (!conv) return res.status(404).json({ error: "대화를 찾을 수 없습니다." });

    const msgs = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);

    return res.json({
      ...conv,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      messages: msgs.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting conversation");
    return res.status(500).json({ error: "대화를 가져오는 중 오류가 발생했습니다." });
  }
});

// DELETE /api/conversations/:id
router.delete("/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    await db.delete(conversationsTable).where(eq(conversationsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting conversation");
    return res.status(500).json({ error: "대화를 삭제하는 중 오류가 발생했습니다." });
  }
});

// GET /api/conversations/:id/messages
router.get("/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const msgs = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);
    return res.json(msgs.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Error getting messages");
    return res.status(500).json({ error: "메시지를 가져오는 중 오류가 발생했습니다." });
  }
});

export default router;
