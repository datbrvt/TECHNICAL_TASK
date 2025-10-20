import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

// Health check endpoint
app.get("/make-server-f3d4f57a/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all messages
app.get("/make-server-f3d4f57a/messages", async (c) => {
  try {
    const messages = await kv.getByPrefix("message:");
    // Sort by timestamp (newest first)
    const sortedMessages = messages
      .map((msg) => JSON.parse(msg))
      .sort((a, b) => b.timestamp - a.timestamp);
    return c.json({ messages: sortedMessages });
  } catch (error) {
    const msg = getErrorMessage(error);
    console.log(`Error fetching messages: ${msg}`);
    return c.json({ error: "Failed to fetch messages", details: msg }, 500);
  }
});

// Post a new message
app.post("/make-server-f3d4f57a/messages", async (c) => {
  try {
    const { username, text } = await c.req.json();
    
    if (!username || !text) {
      return c.json({ error: "Username and text are required" }, 400);
    }

    const message = {
      id: crypto.randomUUID(),
      username,
      text,
      timestamp: Date.now(),
    };

    await kv.set(`message:${message.id}`, JSON.stringify(message));
    return c.json({ message });
  } catch (error) {
    const msg = getErrorMessage(error);
    console.log(`Error posting message: ${msg}`);
    return c.json({ error: "Failed to post message", details: msg }, 500);
  }
});

export default app.fetch;