import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { UsernameDialog } from "./components/UsernameDialog";
import { Button } from "./components/ui/button";
import { ScrollArea } from "./components/ui/scroll-area";
import { MessageCircle, RefreshCw } from "lucide-react";
import { projectId, publicAnonKey } from "./utils/supabase/info";
import { createClient } from "@supabase/supabase-js";

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export default function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  // Fetch messages from server
  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f3d4f57a/messages`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching messages:", errorData);
        return;
      }

      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  // Send a message
  const handleSendMessage = async (text: string) => {
    if (!username) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f3d4f57a/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ username, text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error sending message:", errorData);
        return;
      }

      // Broadcast to Realtime channel
      const channel = supabase.channel("chat-messages");
      await channel.send({
        type: "broadcast",
        event: "new-message",
        payload: { refresh: true },
      });

      // Refresh messages
      await fetchMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  // Set up Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("chat-messages")
      .on("broadcast", { event: "new-message" }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <UsernameDialog open={!username} onSubmit={setUsername} />

      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-4 md:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1>Real-Time Chat</h1>
              <p className="text-sm text-gray-500">
                {username ? `Logged in as ${username}` : "Please set your name"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchMessages}
            title="Refresh messages"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full px-4 py-4 md:px-6">
          <ScrollArea className="h-full bg-white rounded-lg shadow-sm">
            <div ref={scrollRef} className="p-4 md:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Be the first to say hello!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    username={message.username}
                    text={message.text}
                    timestamp={message.timestamp}
                    isOwnMessage={message.username === username}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t px-4 py-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} disabled={loading || !username} />
        </div>
      </div>
    </div>
  );
}
