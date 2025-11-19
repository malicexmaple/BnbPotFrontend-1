import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Flame } from "lucide-react";
import { SIDEBAR, AIRDROP, BORDER_RADIUS, GOLDEN, DARK_BG } from "@/constants/layout";
import bnbIcon from '@assets/bnb-bnb-logo_1763489145043.png';
import airdropLogo from '@assets/airdropnew_1763414250628.png';
import airdropPackage from '@assets/airdrop-pachage_1763543740528.png';

interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  canChat: boolean;
  placeholderText: string;
  onlineUsers: number;
  onShowChatRules: () => void;
}

export default function ChatSidebar({
  isCollapsed,
  onToggleCollapse,
  messages,
  onSendMessage,
  canChat,
  placeholderText,
  onlineUsers,
  onShowChatRules,
}: ChatSidebarProps) {
  const [chatInput, setChatInput] = useState("");
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !canChat) return;
    onSendMessage(chatInput);
    setChatInput("");
  };

  return (
    <div className="flex-shrink-0 transition-all duration-300 relative glass-panel" style={{
      width: isCollapsed ? '0px' : `${SIDEBAR.CHAT_WIDTH}px`,
      paddingLeft: '0px',
      paddingTop: isCollapsed ? '0px' : '24px',
      paddingBottom: isCollapsed ? '0px' : '24px',
      paddingRight: '0px',
      overflow: 'visible',
      zIndex: 50,
      borderRadius: '0px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Collapse Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center hover-elevate active-elevate-2 transition-all duration-300"
        style={{
          left: 'calc(100% - 20px)',
          zIndex: 9999,
          borderRadius: isCollapsed ? '8px' : '4px',
          width: isCollapsed ? `${SIDEBAR.COLLAPSE_BUTTON_WIDTH_COLLAPSED}px` : `${SIDEBAR.COLLAPSE_BUTTON_WIDTH_EXPANDED}px`,
          height: `${SIDEBAR.COLLAPSE_BUTTON_HEIGHT}px`,
          background: DARK_BG.MEDIUM,
          border: '1px solid rgba(60, 60, 60, 0.4)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.5)'
        }}
        data-testid="button-collapse-chat"
      >
        {isCollapsed ? (
          <Flame className="w-8 h-8 text-white" fill="white" />
        ) : (
          <svg className="w-3 h-3 text-foreground transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        )}
      </button>

      {!isCollapsed && (
        <div className="flex flex-col flex-1" style={{
          width: `${SIDEBAR.CHAT_INNER_WIDTH}px`,
          marginTop: `${SIDEBAR.CHAT_MARGIN_TOP}px`,
          marginLeft: `${SIDEBAR.CHAT_MARGIN_LEFT}px`
        }}>
          {/* Degen Chat Header */}
          <div className="glass-panel p-3 flex items-center justify-between" style={{
            borderRadius: BORDER_RADIUS.CHAT_HEADER_TOP
          }}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                <svg className="w-3 h-3 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">Degen Chat</span>
            </div>
            <Badge className="text-white text-xs font-bold px-2 border-0" style={{
              background: DARK_BG.GRADIENT,
              border: GOLDEN.BORDER_LIGHT,
              boxShadow: GOLDEN.GLOW
            }} data-testid="badge-chat-count">{onlineUsers}</Badge>
          </div>

          {/* Chat Box Container */}
          <div className="glass-panel flex-1 flex flex-col relative" style={{
            borderRadius: BORDER_RADIUS.CHAT_BOTTOM,
            overflow: 'visible'
          }}>
            {/* LIVE AIRDROP Section */}
            <div className="absolute top-2 left-2 right-2 z-10">
              <div className="glass-panel neon-border p-2 relative" style={{
                animation: 'floatAirdropBox 2s ease-in-out infinite'
              }}>
                {/* Gift package with air streams */}
                <div className="absolute z-[9999]" style={{
                  right: '-5px',
                  top: '-70px',
                  width: '8rem',
                  height: '8rem',
                  animation: 'floatAirdrop 2s ease-in-out infinite'
                }}>
                  <img
                    src={airdropPackage}
                    alt="Gift Package"
                    className="h-32 w-32 relative z-10"
                    style={{
                      filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 4px rgba(0, 0, 0, 0.7))'
                    }}
                    data-testid="img-gift-package"
                  />
                  {/* Air stream effects around package - closer and thinner */}
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${30 + (i * 3)}%`,
                        top: `${55 + (i % 4) * 8}%`,
                        width: '2px',
                        height: '30px',
                        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0))',
                        borderRadius: '50%',
                        animation: `airStream${i % 8} ${0.8 + (i * 0.1)}s ease-out infinite`,
                        animationDelay: `${i * 0.08}s`,
                        filter: 'blur(0.5px)'
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-start" style={{paddingLeft: '5px', marginTop: '0.25rem'}}>
                  <div className="flex items-center gap-2 px-3 py-1.5" style={{
                    background: DARK_BG.SOLID,
                    border: GOLDEN.BORDER,
                    borderRadius: BORDER_RADIUS.SMALL,
                    boxShadow: GOLDEN.SHADOW
                  }}>
                    <img src={bnbIcon} alt="BNB" style={{width: '1.5rem', height: '1.5rem'}} />
                    <span className="font-bold font-mono no-text-shadow" style={{
                      color: '#FFFFFF',
                      fontSize: '1rem',
                      lineHeight: '1',
                      display: 'flex',
                      alignItems: 'center',
                      height: '1.5rem',
                      paddingTop: `${AIRDROP.BALANCE_PADDING_TOP}px`
                    }} data-testid="text-airdrop-amount">0.255</span>
                  </div>
                </div>
                <div className="flex items-center justify-start relative" style={{marginTop: '0.25rem'}}>
                  <div className="shine-image relative" style={{
                    '--shine-mask': `url(${airdropLogo})`,
                    animation: 'floatAirdrop 2s ease-in-out infinite'
                  } as React.CSSProperties}>
                    <img 
                      src={airdropLogo} 
                      alt="AIRDROP" 
                      style={{
                        height: '3.125rem'
                      }} 
                      data-testid="img-airdrop-logo" 
                    />
                    {/* Air stream effects around airdrop logo - white, thinner, and closer */}
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute"
                        style={{
                          left: `${15 + (i * 6)}%`,
                          bottom: `${0 - (i % 3) * 4}px`,
                          width: '2px',
                          height: '22px',
                          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0))',
                          borderRadius: '50%',
                          animation: `airStreamLogo${i % 6} ${0.7 + (i * 0.08)}s ease-out infinite`,
                          animationDelay: `${i * 0.05}s`,
                          filter: 'blur(0.5px)'
                        }}
                      />
                    ))}
                  </div>
                </div>
                <Badge className="text-primary font-bold px-2 py-0.5" style={{
                  fontSize: '0.875rem',
                  position: 'absolute',
                  right: '-6px',
                  bottom: '-6px',
                  background: DARK_BG.SOLID,
                  border: GOLDEN.BORDER,
                  borderRadius: BORDER_RADIUS.TINY,
                  boxShadow: GOLDEN.SHADOW
                }} data-testid="badge-airdrop-live">LIVE</Badge>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-3 pt-32" ref={chatMessagesRef}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <div className="text-center space-y-2">
                    <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>No messages yet</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pb-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex gap-2">
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-muted">
                          {msg.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-foreground">{msg.username}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-foreground break-words">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-border/10">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={placeholderText}
                className="h-10 text-sm bg-muted/30 border-border/20"
                data-testid="input-chat"
                disabled={!canChat}
              />
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <button onClick={onShowChatRules} className="flex items-center gap-1 hover-elevate" data-testid="link-chat-rules">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <span>Chat Rules</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
