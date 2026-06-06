import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable } from "@workspace/db";
import { eq, count, gte } from "drizzle-orm";
import Groq from "groq-sdk";

const router = Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// POST /api/chat/send
router.post("/chat/send", async (req, res) => {
  const { content, conversationId, model } = req.body;

  if (!content || !conversationId) {
    return res.status(400).json({ error: "content and conversationId are required" });
  }

  try {
    await db.insert(messagesTable).values({
      content,
      role: "user",
      conversationId,
    });

    await db.update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, conversationId));

    const history = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationId))
      .orderBy(messagesTable.createdAt)
      .limit(40);

    const messages = history.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const selectedModel = model || "llama-3.3-70b-versatile";
    const completion = await groq.chat.completions.create({
      model: selectedModel,
      messages,
      max_tokens: 8192,
      temperature: 0.7,
    });

    const assistantContent = completion.choices[0]?.message?.content || "응답을 생성할 수 없습니다.";

    const [assistantMessage] = await db.insert(messagesTable).values({
      content: assistantContent,
      role: "assistant",
      conversationId,
    }).returning();

    const conv = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId)).limit(1);
    if (conv[0]?.title === "새 대화" || conv[0]?.title === "New Chat") {
      const autoTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      await db.update(conversationsTable)
        .set({ title: autoTitle, updatedAt: new Date() })
        .where(eq(conversationsTable.id, conversationId));
    }

    return res.json({
      id: assistantMessage.id,
      content: assistantMessage.content,
      role: assistantMessage.role,
      conversationId: assistantMessage.conversationId,
      createdAt: assistantMessage.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error in chat send");
    return res.status(500).json({ error: "AI 응답 생성 중 오류가 발생했습니다." });
  }
});

// GET /api/chat/stats
router.get("/chat/stats", async (req, res) => {
  try {
    const [convCount] = await db.select({ count: count() }).from(conversationsTable);
    const [msgCount] = await db.select({ count: count() }).from(messagesTable);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayCount] = await db.select({ count: count() })
      .from(messagesTable)
      .where(gte(messagesTable.createdAt, today));

    return res.json({
      totalConversations: convCount.count,
      totalMessages: msgCount.count,
      todayMessages: todayCount.count,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting stats");
    return res.status(500).json({ error: "통계를 가져오는 중 오류가 발생했습니다." });
  }
});

export default router;
