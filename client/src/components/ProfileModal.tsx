import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, BarChart3, Receipt, VolumeX, LogOut, Eye, EyeOff, Pencil } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  walletAddress?: string;
  onDisconnect?: () => void;
}

export default function ProfileModal({ 
  open, 
  onOpenChange, 
  username, 
  walletAddress,
  onDisconnect 
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState("options");
  const [showClientSeed, setShowClientSeed] = useState(false);
  const [streamerMode, setStreamerMode] = useState(false);

  const getAvatarColor = () => {
    return `hsl(${username.charCodeAt(0) * 137.5 % 360}, 65%, 50%)`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 border-0 bg-card overflow-hidden" style={{
        border: '2px solid rgba(234, 179, 8, 0.3)',
        boxShadow: '0 0 30px rgba(234, 179, 8, 0.2)'
      }}>
        <VisuallyHidden>
          <DialogTitle>User Profile Settings</DialogTitle>
          <DialogDescription>
            Manage your profile settings, view statistics, and configure your account preferences.
          </DialogDescription>
        </VisuallyHidden>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-52 border-r border-border/20 p-4 space-y-1" style={{
            background: 'rgba(10, 10, 10, 0.5)'
          }}>
            <div className="text-xl font-bold mb-6 italic" style={{
              background: 'linear-gradient(135deg, #EAB308 0%, #FCD34D 50%, #EAB308 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              PROFILE
            </div>

            <button
              onClick={() => setActiveTab("options")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === "options" 
                  ? "bg-muted text-foreground font-semibold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-testid="tab-options"
            >
              <Settings className="w-4 h-4" />
              Options
            </button>

            <button
              onClick={() => setActiveTab("statistics")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === "statistics" 
                  ? "bg-muted text-foreground font-semibold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-testid="tab-statistics"
            >
              <BarChart3 className="w-4 h-4" />
              Statistics
            </button>

            <button
              onClick={() => setActiveTab("transactions")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === "transactions" 
                  ? "bg-muted text-foreground font-semibold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-testid="tab-transactions"
            >
              <Receipt className="w-4 h-4" />
              Transactions
            </button>

            <button
              onClick={() => setActiveTab("muted")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === "muted" 
                  ? "bg-muted text-foreground font-semibold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-testid="tab-muted"
            >
              <VolumeX className="w-4 h-4" />
              Muted Users
            </button>

            <button
              onClick={() => {
                onDisconnect?.();
                onOpenChange(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              data-testid="tab-disconnect"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "options" && (
              <div className="space-y-6">
                {/* Avatar and User Info */}
                <div className="flex items-start gap-4">
                  <div className="relative group">
                    <div
                      className="w-24 h-24 rounded-lg flex items-center justify-center text-2xl font-bold"
                      style={{ background: getAvatarColor() }}
                    >
                      {username.slice(0, 2).toUpperCase()}
                    </div>
                    <button className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-border/40">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{username}</span>
                      <span className="px-2 py-0.5 rounded bg-muted text-xs">1</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Joined {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-sm">Streamer Mode</span>
                      <Switch 
                        checked={streamerMode} 
                        onCheckedChange={setStreamerMode}
                        data-testid="switch-streamer-mode"
                      />
                    </div>
                  </div>
                </div>

                {/* Enter Name */}
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Enter name</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={username} 
                      readOnly 
                      className="flex-1 bg-muted/30 border-border/20"
                      data-testid="input-username"
                    />
                    <Button variant="ghost" size="sm" className="gap-2" data-testid="button-edit-username">
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Enter Email */}
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Enter email</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value="user@example.com" 
                      readOnly 
                      className="flex-1 bg-muted/30 border-border/20"
                      data-testid="input-email"
                    />
                    <Button variant="ghost" size="icon" data-testid="button-verify-email">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2" data-testid="button-edit-email">
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Client Seed */}
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Client Seed</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type={showClientSeed ? "text" : "password"}
                      value="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
                      readOnly 
                      className="flex-1 bg-muted/30 border-border/20 font-mono"
                      data-testid="input-client-seed"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setShowClientSeed(!showClientSeed)}
                      data-testid="button-toggle-seed"
                    >
                      {showClientSeed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2" data-testid="button-edit-seed">
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Connect Account */}
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Connect Account</label>
                  <Input 
                    value={walletAddress || "Not Connected"} 
                    readOnly 
                    className="bg-muted/30 border-border/20 font-mono text-sm"
                    data-testid="input-wallet"
                  />
                </div>

                {/* Referred By */}
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Referred by</label>
                  <Input 
                    value="-" 
                    readOnly 
                    className="bg-muted/30 border-border/20"
                    data-testid="input-referral"
                  />
                </div>

                {/* Connected Apps */}
                <div>
                  <label className="text-sm text-muted-foreground block mb-3">Connected Apps</label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#5865F2] flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Discord</div>
                          <div className="text-xs text-muted-foreground">Not Connected</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" data-testid="button-connect-discord">
                        Connect Account
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-black flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium">X / Twitter</div>
                          <div className="text-xs text-muted-foreground">Not Connected</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" data-testid="button-connect-twitter">
                        Connect Account
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Follow Us Section */}
                <div className="flex gap-3 pt-4 border-t border-border/20">
                  <div className="flex-1 flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-black flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Follow our</div>
                        <div className="text-muted-foreground">X / Twitter</div>
                      </div>
                    </div>
                    <Button size="sm" style={{
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      color: 'white'
                    }} data-testid="button-follow-twitter">
                      Follow now
                    </Button>
                  </div>

                  <div className="flex-1 flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#5865F2] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                        </svg>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Join our</div>
                        <div className="text-muted-foreground">Discord</div>
                      </div>
                    </div>
                    <Button size="sm" style={{
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      color: 'white'
                    }} data-testid="button-join-discord">
                      Join
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "statistics" && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Statistics coming soon</p>
                </div>
              </div>
            )}

            {activeTab === "transactions" && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              </div>
            )}

            {activeTab === "muted" && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <VolumeX className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No muted users</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
