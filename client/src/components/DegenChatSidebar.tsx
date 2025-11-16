import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";

interface ChatPlayer {
  id: string;
  username: string;
  avatarUrl?: string;
  amount: number;
  level: number;
}

interface DegenChatSidebarProps {
  players?: ChatPlayer[];
  onlineCount?: number;
}

export default function DegenChatSidebar({ 
  players = [],
  onlineCount = 302
}: DegenChatSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <div className="font-bold text-sm">Degen Chat</div>
          </div>
          <Badge variant="secondary" className="text-xs">{onlineCount}</Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {players.map((player) => (
            <div 
              key={player.id}
              data-testid={`chat-player-${player.id}`}
              className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={player.avatarUrl} />
                <AvatarFallback className="text-xs bg-muted">
                  {player.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{player.username}</span>
                  <Badge variant="outline" className="h-4 px-1 text-[10px] border-primary/50">
                    {player.level}
                  </Badge>
                </div>
                {player.amount > 0 && (
                  <div className="text-xs text-muted-foreground font-mono">
                    {player.amount.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border space-y-2">
        <Input
          data-testid="input-chat-message"
          placeholder="Type Message Here..."
          className="h-9 text-sm bg-background/50"
        />
        <Button
          data-testid="button-clear-bets"
          variant="outline"
          className="w-full h-9 text-sm"
        >
          Clear Bets
        </Button>
      </div>
    </div>
  );
}
