import { useState } from "react";
import GameNavigation from "@/components/GameNavigation";
import ProfileModal from "@/components/ProfileModal";
import { useGameState } from "@/hooks/useGameState";
import { useAuth } from "@/hooks/useAuth";

export default function PersistentHeader() {
  const { address, isConnecting, connect, disconnect, username } = useGameState();
  const { isAdmin } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 w-full z-50">
        <GameNavigation 
          onConnect={connect} 
          onDisconnect={disconnect} 
          isConnected={!!address} 
          isConnecting={isConnecting} 
          walletAddress={address || undefined} 
          username={username || undefined} 
          onOpenProfile={() => setShowProfileModal(true)}
          isAdmin={isAdmin}
        />
      </div>

      {username && (
        <ProfileModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          walletAddress={address || undefined}
          username={username}
        />
      )}
    </>
  );
}
