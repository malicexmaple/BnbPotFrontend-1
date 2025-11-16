import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Pause, Play } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { useState } from "react";

interface Message {
  id: string;
  username: string;
  avatarUrl?: string;
  message: string;
  timestamp: string;
  level: number;
}

interface ChatSidebarProps {
  messages?: Message[];
  onlineCount?: number;
}

export default function ChatSidebar({ 
  messages = [],
  onlineCount = 313
}: ChatSidebarProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log('Send message:', messageInput);
      setMessageInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Degen Chat
            <Badge variant="secondary" className="text-xs" data-testid="badge-online-count">
              {onlineCount}
            </Badge>
          </CardTitle>
          <Button
            data-testid="button-toggle-pause"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2" data-testid="chat-messages-container">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                username={msg.username}
                avatarUrl={msg.avatarUrl}
                message={msg.message}
                timestamp={msg.timestamp}
                level={msg.level}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              data-testid="input-chat-message"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button
              data-testid="button-send-message"
              onClick={handleSendMessage}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-center">
            <button 
              data-testid="link-chat-rules"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => console.log('Chat rules clicked')}
            >
              Chat Rules
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
