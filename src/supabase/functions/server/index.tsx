import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
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
    console.log(`Error fetching messages: ${error}`);
    return c.json({ error: "Failed to fetch messages", details: error.message }, 500);
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
    console.log(`Error posting message: ${error}`);
    return c.json({ error: "Failed to post message", details: error.message }, 500);
  }
});

Deno.serve(app.fetch);