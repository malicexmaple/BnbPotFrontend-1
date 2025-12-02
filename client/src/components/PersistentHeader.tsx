import { useState } from "react";
import GameNavigation from "@/components/GameNavigation";
import ProfileModal from "@/components/ProfileModal";
import { useGameState } from "@/hooks/useGameState";
import { useAuth } from "@/hooks/useAuth";

type ProfileTab = "options" | "statistics" | "transactions" | "muted";

export default function PersistentHeader() {
  const { address, isConnecting, connect, disconnect, username, bnbBalance } = useGameState();
  const { isAdmin } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>("options");

  const openProfileTab = (tab: ProfileTab) => {
    setProfileTab(tab);
    setShowProfileModal(true);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 w-full z-[100]">
        <GameNavigation 
          onConnect={connect} 
          onDisconnect={disconnect} 
          isConnected={!!address} 
          isConnecting={isConnecting} 
          walletAddress={address || undefined} 
          username={username || undefined} 
          bnbBalance={bnbBalance || undefined}
          onOpenOptions={() => openProfileTab("options")}
          onOpenStatistics={() => openProfileTab("statistics")}
          onOpenTransactions={() => openProfileTab("transactions")}
          onOpenMutedUsers={() => openProfileTab("muted")}
          isAdmin={isAdmin}
        />
      </div>

      {username && (
        <ProfileModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          walletAddress={address || undefined}
          username={username}
          onDisconnect={disconnect}
          initialTab={profileTab}
        />
      )}
    </>
  );
}
