import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ChatMessageProps {
  username: string;
  avatarUrl?: string;
  message: string;
  timestamp: string;
  level?: number;
}

export default function ChatMessage({ 
  username, 
  avatarUrl, 
  message, 
  timestamp,
  level = 1
}: ChatMessageProps) {
  return (
    <div 
      data-testid={`chat-message-${username}`}
      className="flex gap-3 p-2 rounded hover-elevate transition-colors"
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className="text-xs bg-muted">
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate" data-testid={`text-username-${username}`}>
            {username}
          </span>
          {level > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {level}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
            {timestamp}
          </span>
        </div>
        <p className="text-sm text-foreground break-words" data-testid={`text-message-${username}`}>
          {message}
        </p>
      </div>
    </div>
  );
}
