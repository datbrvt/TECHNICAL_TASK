import { Avatar, AvatarFallback } from "./ui/avatar";

interface ChatMessageProps {
  username: string;
  text: string;
  timestamp: number;
  isOwnMessage: boolean;
}

export function ChatMessage({ username, text, timestamp, isOwnMessage }: ChatMessageProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  return (
    <div className={`flex gap-3 mb-4 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-blue-500 text-white">
          {username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={`flex flex-col ${isOwnMessage ? "items-end" : ""}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-gray-600">{username}</span>
          <span className="text-xs text-gray-400">{formatTime(timestamp)}</span>
        </div>
        <div
          className={`rounded-2xl px-4 py-2 max-w-xs md:max-w-md ${
            isOwnMessage
              ? "bg-blue-500 text-white rounded-tr-sm"
              : "bg-gray-100 text-gray-900 rounded-tl-sm"
          }`}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
