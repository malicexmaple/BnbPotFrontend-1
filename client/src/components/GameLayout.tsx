import { ReactNode } from "react";
import GameNavigation from "@/components/GameNavigation";
import GameFooter from "@/components/GameFooter";
import ChatSidebar from "@/components/ChatSidebar";
import DailyStats from "@/components/DailyStats";
import { useWallet } from "@/hooks/useWallet";
import { useSignupTracking } from "@/hooks/useSignupTracking";
import { useChat } from "@/hooks/useChat";
import { useGameSocket } from "@/hooks/useGameSocket";
import bnbpotBg from '@assets/MOSHED-2025-11-18-4-12-49_1763403537895.gif';

interface GameLayoutProps {
  children: ReactNode;
  onOpenProfile: () => void;
  onShowChatRules: () => void;
  isChatCollapsed: boolean;
  onToggleChatCollapse: () => void;
  isLeaderboardCollapsed: boolean;
  onToggleLeaderboardCollapse: () => void;
}

export default function GameLayout({
  children,
  onOpenProfile,
  onShowChatRules,
  isChatCollapsed,
  onToggleChatCollapse,
  isLeaderboardCollapsed,
  onToggleLeaderboardCollapse,
}: GameLayoutProps) {
  const { address, isConnecting, connect, disconnect } = useWallet();
  const { username } = useSignupTracking(address);
  const { messages, onlineUsers, sendMessage } = useChat({ 
    username: username || undefined, 
    walletAddress: address || undefined 
  });
  
  // Connect to game WebSocket for real-time bet updates
  useGameSocket();

  return (
    <>
      {/* Fixed background */}
      <div className="fixed inset-0 space-bg" style={{
        backgroundImage: `url(${bnbpotBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: -1
      }} />
      
      {/* ONE scrollable container with header + content */}
      <div className="w-full">
        {/* Header - FIXED to top of viewport */}
        <div className="fixed top-0 left-0 right-0 w-full z-50">
          <GameNavigation 
            onConnect={connect} 
            onDisconnect={disconnect} 
            isConnected={!!address} 
            isConnecting={isConnecting} 
            walletAddress={address || undefined} 
            username={username || undefined} 
            onOpenProfile={onOpenProfile} 
          />
        </div>

        {/* Content - with top padding to account for fixed header */}
        <div className="flex flex-col min-h-screen w-full" style={{paddingTop: '100px'}}>
          {/* Wrapper for content + footer */}
          <div className="flex-1 flex flex-col w-full">
            {/* Content wrapper */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex">
                <ChatSidebar
                  isCollapsed={isChatCollapsed}
                  onToggleCollapse={onToggleChatCollapse}
                  messages={messages}
                  onSendMessage={(message: string) => {
                    if (address && username) {
                      sendMessage(message);
                    }
                  }}
                  canChat={!!address && !!username}
                  placeholderText={!address ? "Connect wallet to chat..." : !username ? "Complete signup to chat..." : "Type Message Here..."}
                  onlineUsers={onlineUsers}
                  onShowChatRules={onShowChatRules}
                />

                {/* MAIN GAME AREA - passed as children */}
                <div className="flex-1 flex flex-col relative">
                  {children}
                </div>

                {/* RIGHT - DAILY STATS SIDEBAR */}
                <DailyStats 
                  isCollapsed={isLeaderboardCollapsed}
                  onToggleCollapse={onToggleLeaderboardCollapse}
                />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <GameFooter />
        </div>
      </div>
    </>
  );
}
