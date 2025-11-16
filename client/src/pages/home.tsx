import { useState, useEffect } from "react";
import GameNavigation from "@/components/GameNavigation";
import DegenChatSidebar from "@/components/DegenChatSidebar";
import JackpotMainArea from "@/components/JackpotMainArea";
import BettingControlsSidebar from "@/components/BettingControlsSidebar";
import GameFooter from "@/components/GameFooter";
import avatar1 from '@assets/generated_images/Gaming_avatar_placeholder_1_a3c2368d.png';
import avatar2 from '@assets/generated_images/Gaming_avatar_placeholder_2_b74e6961.png';
import avatar3 from '@assets/generated_images/Gaming_avatar_placeholder_3_f673a9f2.png';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(13);
  
  //todo: remove mock functionality
  const mockPlayers = [
    {
      id: '1',
      username: 'B0ZO',
      avatarUrl: avatar1,
      betAmount: 0.033,
      winChance: 8.22,
      level: 10
    },
    {
      id: '2',
      username: 'B0Zo',
      avatarUrl: avatar2,
      betAmount: 0.005,
      winChance: 1.24,
      level: 15
    },
    {
      id: '3',
      username: 'shayand',
      avatarUrl: avatar3,
      betAmount: 0.050,
      winChance: 12.46,
      level: 12
    },
    {
      id: '4',
      username: 'B0Zo',
      betAmount: 0.005,
      winChance: 1.24,
      level: 10
    }
  ];

  //todo: remove mock functionality
  const mockChatPlayers = [
    {
      id: '1',
      username: 'Rosstopus',
      avatarUrl: avatar1,
      amount: 0.01,
      level: 10
    },
    {
      id: '2',
      username: 'Rust Bucket Worth...',
      amount: 0.0,
      level: 15
    },
    {
      id: '3',
      username: 'shayand',
      avatarUrl: avatar2,
      amount: 0.0,
      level: 12
    },
    {
      id: '4',
      username: 'B0Zo',
      avatarUrl: avatar3,
      amount: 0.0,
      level: 10
    },
    {
      id: '5',
      username: 'B0000',
      amount: 0.01,
      level: 10
    },
    {
      id: '6',
      username: 'B0Zo',
      amount: 0.0,
      level: 15
    },
    {
      id: '7',
      username: 'B0Zo',
      amount: 0.0,
      level: 10
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) return 13;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleConnect = () => {
    console.log('Connecting wallet...');
    //todo: remove mock functionality - implement real wallet connection
    setTimeout(() => {
      setIsConnected(true);
      setWalletAddress('8kTx...9mKp');
    }, 1000);
  };

  const handlePlaceBet = (amount: number) => {
    console.log('Placing bet:', amount);
    //todo: remove mock functionality - implement real bet placement
    if (!isConnected) {
      console.log('Please connect wallet first');
      return;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <GameNavigation 
        onConnect={handleConnect}
        isConnected={isConnected}
        walletAddress={walletAddress}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 flex-shrink-0">
          <DegenChatSidebar 
            players={mockChatPlayers}
            onlineCount={302}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <JackpotMainArea 
            players={mockPlayers}
            jackpotValue={0.401}
            yourWager={0.000}
            yourChance={0.00}
            timeRemaining={timeRemaining}
            roundNumber={186407}
            totalPlayers={11}
          />
        </div>

        <div className="w-72 flex-shrink-0">
          <BettingControlsSidebar 
            onPlaceBet={handlePlaceBet}
          />
        </div>
      </div>

      <GameFooter />
    </div>
  );
}
