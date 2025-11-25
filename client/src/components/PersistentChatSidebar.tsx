import { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatRulesModal from "@/components/ChatRulesModal";
import { useGameState } from "@/hooks/useGameState";
import { useToast } from "@/hooks/use-toast";

export default function PersistentChatSidebar() {
  const { address, username, messages, onlineUsers, sendMessage } = useGameState();
  const { toast } = useToast();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [showChatRules, setShowChatRules] = useState(false);

  const handleSendMessage = (message: string) => {
    if (!address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to chat.",
      });
      return;
    }

    if (!username) {
      toast({
        variant: "destructive",
        title: "Username Required",
        description: "Please complete signup to use chat.",
      });
      return;
    }

    const success = sendMessage(message);
    if (!success) {
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: "Could not send message. Please try again.",
      });
    }
  };

  return (
    <>
      <ChatSidebar
        isCollapsed={isChatCollapsed}
        onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
        messages={messages}
        onSendMessage={handleSendMessage}
        canChat={!!address && !!username}
        placeholderText={!address ? "Connect wallet to chat..." : !username ? "Complete signup to chat..." : "Type Message Here..."}
        onlineUsers={onlineUsers}
        onShowChatRules={() => setShowChatRules(true)}
      />
      <ChatRulesModal open={showChatRules} onOpenChange={setShowChatRules} />
    </>
  );
}
