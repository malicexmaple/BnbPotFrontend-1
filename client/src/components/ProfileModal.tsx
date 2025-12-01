import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, BarChart3, Receipt, VolumeX, LogOut, Eye, EyeOff, Pencil, ChevronDown, Check, X, Loader2 } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import AvatarUploadModal from "./AvatarUploadModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import profileLogo from '@assets/PROIFILE_1763429559487.png';

const EMPTY_CHART_DATA = [
  { games: 0, profit: 0 },
  { games: 1, profit: 0 },
];

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  walletAddress?: string;
  onDisconnect?: () => void;
  initialTab?: "options" | "statistics" | "transactions" | "muted";
}

export default function ProfileModal({ 
  open, 
  onOpenChange, 
  username, 
  walletAddress,
  onDisconnect,
  initialTab = "options"
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { toast } = useToast();
  
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);
  const [showClientSeed, setShowClientSeed] = useState(false);
  const [streamerMode, setStreamerMode] = useState(false);
  const [timeRange, setTimeRange] = useState("7days");
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Editing state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingSeed, setIsEditingSeed] = useState(false);
  const [editedUsername, setEditedUsername] = useState(username);
  const [editedEmail, setEditedEmail] = useState("");
  const [editedSeed, setEditedSeed] = useState("");
  
  // Store pre-edit values for cancel functionality
  const [preEditUsername, setPreEditUsername] = useState(username);
  const [preEditEmail, setPreEditEmail] = useState("");
  const [preEditSeed, setPreEditSeed] = useState("");
  
  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user data when modal opens
  useEffect(() => {
    const fetchUserData = async () => {
      if (open && walletAddress) {
        try {
          const response = await fetch(`/api/users/me?walletAddress=${encodeURIComponent(walletAddress)}`);
          if (response.ok) {
            const userData = await response.json();
            setEditedUsername(userData.username || username);
            setEditedEmail(userData.email || "");
            setPreEditUsername(userData.username || username);
            setPreEditEmail(userData.email || "");
            // Load avatar and client seed from database (always set to ensure fresh data)
            setAvatarUrl(userData.avatarUrl || null);
            setEditedSeed(userData.clientSeed || "");
            setPreEditSeed(userData.clientSeed || "");
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      }
    };
    
    if (open) {
      fetchUserData();
      setIsEditingUsername(false);
      setIsEditingEmail(false);
      setIsEditingSeed(false);
    }
  }, [open, walletAddress, username]);

  // Start editing helpers
  const startEditingUsername = () => {
    setPreEditUsername(editedUsername);
    setIsEditingUsername(true);
  };
  
  const startEditingEmail = () => {
    setPreEditEmail(editedEmail);
    setIsEditingEmail(true);
  };
  
  const startEditingSeed = () => {
    setPreEditSeed(editedSeed);
    setIsEditingSeed(true);
  };

  // Cancel editing helpers
  const cancelEditingUsername = () => {
    setEditedUsername(preEditUsername);
    setIsEditingUsername(false);
  };
  
  const cancelEditingEmail = () => {
    setEditedEmail(preEditEmail);
    setIsEditingEmail(false);
  };
  
  const cancelEditingSeed = () => {
    setEditedSeed(preEditSeed);
    setIsEditingSeed(false);
  };

  // Handler for saving username
  const handleSaveUsername = async () => {
    if (!editedUsername.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await apiRequest("PATCH", "/api/users/profile", { username: editedUsername });
      setPreEditUsername(editedUsername);
      toast({
        title: "Username updated",
        description: `Your username has been changed to ${editedUsername}`,
      });
      setIsEditingUsername(false);
      
      // Invalidate user profile query to refresh username everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      
      // Also dispatch event for localStorage sync (for same-browser tabs)
      window.dispatchEvent(new CustomEvent('usernameUpdated', { detail: { username: editedUsername } }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update username",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for saving email
  const handleSaveEmail = async () => {
    setIsSaving(true);
    try {
      await apiRequest("PATCH", "/api/users/profile", { email: editedEmail || "" });
      setPreEditEmail(editedEmail);
      toast({
        title: "Email updated",
        description: editedEmail ? `Your email has been changed to ${editedEmail}` : "Your email has been cleared",
      });
      setIsEditingEmail(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for saving client seed to database
  const handleSaveSeed = async () => {
    if (!editedSeed.trim() || editedSeed.length < 16) {
      toast({
        title: "Error",
        description: "Client seed must be at least 16 characters",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await apiRequest("PATCH", "/api/users/profile", { clientSeed: editedSeed });
      setPreEditSeed(editedSeed);
      toast({
        title: "Client seed updated",
        description: "Your client seed has been saved",
      });
      setIsEditingSeed(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update client seed",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for social links
  const handleFollowTwitter = () => {
    window.open("https://twitter.com/bnbpot", "_blank", "noopener,noreferrer");
  };

  const handleJoinDiscord = () => {
    window.open("https://discord.gg/bnbpot", "_blank", "noopener,noreferrer");
  };

  // Handler for connecting accounts (OAuth coming soon)
  const handleConnectSocial = (platform: string) => {
    toast({
      title: "Coming Soon",
      description: `${platform} account connection will be available soon!`,
    });
  };

  const handleAvatarUpdate = async (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl);
    // Save avatar to database
    try {
      await apiRequest("PATCH", "/api/users/profile", { avatarUrl: newAvatarUrl || "" });
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { username, avatarUrl: newAvatarUrl } }));
    } catch (error) {
      console.error("Failed to save avatar:", error);
    }
  };

  // Listen for avatar updates from child modals
  useEffect(() => {
    const handleAvatarEvent = (event: CustomEvent) => {
      if (event.detail.username === username) {
        setAvatarUrl(event.detail.avatarUrl);
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarEvent as EventListener);
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarEvent as EventListener);
    };
  }, [username]);

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
            <div className="mb-6 flex justify-center">
              <img src={profileLogo} alt="PROFILE" className="w-40" />
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
                      className="w-24 h-24 flex items-center justify-center text-2xl font-bold glass-panel overflow-hidden rounded-lg"
                      style={{
                        background: 'linear-gradient(145deg, rgba(40, 40, 40, 0.6), rgba(20, 20, 20, 0.9))',
                        border: '2px solid rgba(60, 60, 60, 0.4)',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                      ) : (
                        username.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <button 
                      onClick={() => setShowAvatarUpload(true)}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover-elevate"
                      style={{
                        background: 'rgba(234, 179, 8, 0.2)',
                        border: '2px solid rgba(234, 179, 8, 0.5)',
                        boxShadow: '0 0 12px rgba(234, 179, 8, 0.3)'
                      }}
                      data-testid="button-upload-avatar"
                    >
                      <Pencil className="w-4 h-4" style={{ color: '#FCD34D' }} />
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
                    {isEditingUsername ? (
                      <>
                        <Input 
                          value={editedUsername}
                          onChange={(e) => setEditedUsername(e.target.value)}
                          className="flex-1 bg-muted/30 border-border/20"
                          data-testid="input-username-edit"
                          autoFocus
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={handleSaveUsername}
                          disabled={isSaving}
                          data-testid="button-save-username"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-500" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={cancelEditingUsername}
                          disabled={isSaving}
                          data-testid="button-cancel-username"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input 
                          value={editedUsername} 
                          readOnly 
                          className="flex-1 bg-muted/30 border-border/20"
                          data-testid="input-username"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2" 
                          onClick={startEditingUsername}
                          data-testid="button-edit-username"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Enter Email */}
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Enter email</label>
                  <div className="flex items-center gap-2">
                    {isEditingEmail ? (
                      <>
                        <Input 
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          type="email"
                          className="flex-1 bg-muted/30 border-border/20"
                          data-testid="input-email-edit"
                          autoFocus
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={handleSaveEmail}
                          disabled={isSaving}
                          data-testid="button-save-email"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-500" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={cancelEditingEmail}
                          disabled={isSaving}
                          data-testid="button-cancel-email"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input 
                          value={editedEmail || ""} 
                          placeholder="Enter your email"
                          readOnly 
                          className="flex-1 bg-muted/30 border-border/20"
                          data-testid="input-email"
                        />
                        <Button variant="ghost" size="icon" data-testid="button-verify-email">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2" 
                          onClick={startEditingEmail}
                          data-testid="button-edit-email"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Client Seed */}
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Client Seed</label>
                  <div className="flex items-center gap-2">
                    {isEditingSeed ? (
                      <>
                        <Input 
                          type={showClientSeed ? "text" : "password"}
                          value={editedSeed}
                          onChange={(e) => setEditedSeed(e.target.value)}
                          className="flex-1 bg-muted/30 border-border/20 uppercase tracking-wide"
                          data-testid="input-client-seed-edit"
                          autoFocus
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setShowClientSeed(!showClientSeed)}
                          data-testid="button-toggle-seed"
                        >
                          {showClientSeed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={handleSaveSeed}
                          data-testid="button-save-seed"
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={cancelEditingSeed}
                          data-testid="button-cancel-seed"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input 
                          type={showClientSeed ? "text" : "password"}
                          value={editedSeed}
                          readOnly 
                          className="flex-1 bg-muted/30 border-border/20 uppercase tracking-wide"
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2" 
                          onClick={startEditingSeed}
                          data-testid="button-edit-seed"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Connect Account */}
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Connect Account</label>
                  <Input 
                    value={walletAddress || "Not Connected"} 
                    readOnly 
                    className="bg-muted/30 border-border/20 uppercase tracking-wide text-sm"
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleConnectSocial("Discord")}
                        data-testid="button-connect-discord"
                      >
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleConnectSocial("X / Twitter")}
                        data-testid="button-connect-twitter"
                      >
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
                    <Button 
                      size="sm" 
                      onClick={handleFollowTwitter}
                      style={{
                        background: 'linear-gradient(135deg, #EAB308, #FCD34D)',
                        color: 'white'
                      }} 
                      data-testid="button-follow-twitter"
                    >
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
                    <Button 
                      size="sm" 
                      onClick={handleJoinDiscord}
                      style={{
                        background: 'linear-gradient(135deg, #EAB308, #FCD34D)',
                        color: 'white'
                      }} 
                      data-testid="button-join-discord"
                    >
                      Join
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "statistics" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Statistics</h2>
                  
                  {/* Net Profit Card */}
                  <div className="p-6 rounded-xl" style={{
                    background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.15), rgba(59, 130, 246, 0.15))',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                  }}>
                    <div className="text-sm text-muted-foreground mb-2">Net Profit</div>
                    <div className="flex items-center gap-2">
                      <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                        <rect y="8" width="3" height="8" fill="#ef4444"/>
                        <rect x="5" y="0" width="3" height="16" fill="#22c55e"/>
                      </svg>
                      <span className="text-3xl font-bold font-mono">0.01</span>
                    </div>
                  </div>
                </div>

                {/* Wager Stats Chart */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Wager Stats</h3>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="w-40 bg-muted/30 border-border/20" data-testid="select-time-range">
                        <SelectValue placeholder="Last 7 Days" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Last 7 Days</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                        <SelectItem value="90days">Last 90 Days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-6 rounded-xl" style={{
                    background: 'rgba(30, 30, 40, 0.5)',
                    border: '1px solid rgba(60, 60, 70, 0.3)'
                  }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={EMPTY_CHART_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 100, 110, 0.2)" />
                        <XAxis 
                          dataKey="games" 
                          stroke="rgba(150, 150, 160, 0.5)"
                          label={{ value: 'GAMES PLAYED', position: 'insideBottom', offset: -5, fill: 'rgba(150, 150, 160, 0.5)' }}
                        />
                        <YAxis 
                          stroke="rgba(150, 150, 160, 0.5)"
                          label={{ value: 'NET PROFIT', angle: -90, position: 'insideLeft', fill: 'rgba(150, 150, 160, 0.5)' }}
                        />
                        <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Wager Stats Cards */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Wager Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl" style={{
                      background: 'rgba(30, 30, 40, 0.5)',
                      border: '1px solid rgba(60, 60, 70, 0.3)'
                    }}>
                      <div className="text-sm text-muted-foreground mb-2">Total Wagered</div>
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect width="16" height="16" rx="2" fill="rgba(139, 92, 246, 0.3)"/>
                          <path d="M8 4v8M4 8h8" stroke="#8b5cf6" strokeWidth="1.5"/>
                        </svg>
                        <span className="text-2xl font-bold font-mono">0.01</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl" style={{
                      background: 'rgba(30, 30, 40, 0.5)',
                      border: '1px solid rgba(60, 60, 70, 0.3)'
                    }}>
                      <div className="text-sm text-muted-foreground mb-2">Profit</div>
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect width="16" height="16" rx="2" fill="rgba(139, 92, 246, 0.3)"/>
                          <path d="M8 4v8M4 8h8" stroke="#8b5cf6" strokeWidth="1.5"/>
                        </svg>
                        <span className="text-2xl font-bold font-mono">-0.01</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Game Stats Cards */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Game Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl" style={{
                      background: 'rgba(30, 30, 40, 0.5)',
                      border: '1px solid rgba(60, 60, 70, 0.3)'
                    }}>
                      <div className="text-sm text-muted-foreground mb-3">Luckiest Win</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect width="16" height="16" rx="2" fill="rgba(139, 92, 246, 0.3)"/>
                            <path d="M8 4v8M4 8h8" stroke="#8b5cf6" strokeWidth="1.5"/>
                          </svg>
                          <span className="text-xl font-bold font-mono">0</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg font-bold text-sm" style={{
                          background: 'rgba(34, 197, 94, 0.15)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          color: '#22c55e'
                        }}>
                          0.00%
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl" style={{
                      background: 'rgba(30, 30, 40, 0.5)',
                      border: '1px solid rgba(60, 60, 70, 0.3)'
                    }}>
                      <div className="text-sm text-muted-foreground mb-3">Biggest Win</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect width="16" height="16" rx="2" fill="rgba(139, 92, 246, 0.3)"/>
                            <path d="M8 4v8M4 8h8" stroke="#8b5cf6" strokeWidth="1.5"/>
                          </svg>
                          <span className="text-xl font-bold font-mono">0</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg font-bold text-sm" style={{
                          background: 'rgba(139, 92, 246, 0.15)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          color: '#a78bfa'
                        }}>
                          0.00x
                        </div>
                      </div>
                    </div>
                  </div>
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

      <AvatarUploadModal
        open={showAvatarUpload}
        onOpenChange={setShowAvatarUpload}
        username={username}
        avatarColor={getAvatarColor()}
        onAvatarUpdate={handleAvatarUpdate}
        currentAvatar={avatarUrl}
      />
    </Dialog>
  );
}
