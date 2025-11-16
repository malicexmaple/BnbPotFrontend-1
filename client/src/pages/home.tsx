import { useState, useEffect } from "react";
import GameNavigation from "@/components/GameNavigation";
import GameCanvas from "@/components/GameCanvas";
import BettingPanel from "@/components/BettingPanel";
import ChatSidebar from "@/components/ChatSidebar";
import GameFooter from "@/components/GameFooter";
import avatar1 from '@assets/generated_images/Gaming_avatar_placeholder_1_a3c2368d.png';
import avatar2 from '@assets/generated_images/Gaming_avatar_placeholder_2_b74e6961.png';
import avatar3 from '@assets/generated_images/Gaming_avatar_placeholder_3_f673a9f2.png';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(305);
  
  //todo: remove mock functionality
  const mockPlayers = [
    {
      id: '1',
      username: 'charzard',
      avatarUrl: avatar1,
      betAmount: 0.05,
      winChance: 16.01,
      level: 47
    },
    {
      id: '2',
      username: 'B0ZO',
      avatarUrl: avatar2,
      betAmount: 0.001,
      winChance: 0.32,
      level: 59
    },
    {
      id: '3',
      username: '999BW',
      avatarUrl: avatar3,
      betAmount: 0.12,
      winChance: 38.46,
      level: 59
    },
    {
      id: '4',
      username: 'QweezyLovesBizzy',
      betAmount: 0.08,
      winChance: 25.64,
      level: 8
    },
    {
      id: '5',
      username: 'blueontops',
      betAmount: 0.06,
      winChance: 19.23,
      level: 10
    }
  ];

  //todo: remove mock functionality
  const mockMessages = [
    {
      id: '1',
      username: 'charzard',
      avatarUrl: avatar1,
      message: '31% and didn\'t see my name lol',
      timestamp: '13:55',
      level: 47
    },
    {
      id: '2',
      username: 'QweezyLovesBizzy',
      avatarUrl: avatar2,
      message: 'GGs snowy',
      timestamp: '13:58',
      level: 8
    },
    {
      id: '3',
      username: '999BW',
      avatarUrl: avatar3,
      message: 'Kinda need sol to do that my G...',
      timestamp: '13:59',
      level: 59
    },
    {
      id: '4',
      username: 'blueontops',
      message: 'If im 1st and 4h left id sell my stuff to remain 1st',
      timestamp: '13:59',
      level: 10
    },
    {
      id: '5',
      username: 'dankus',
      message: 'bro zardi on a tear',
      timestamp: '13:58',
      level: 12
    },
    {
      id: '6',
      username: 'Terp',
      message: 'Noice',
      timestamp: '13:56',
      level: 14
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) return 305;
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

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-auto">
          <div className="flex-1 flex flex-col gap-6">
            <GameCanvas 
              players={mockPlayers}
              jackpotValue={0.312}
              timeRemaining={timeRemaining}
              roundNumber={186401}
              blockStatus="Mining Block"
            />
          </div>

          <div className="w-full lg:w-auto flex justify-center lg:justify-start">
            <BettingPanel 
              onPlaceBet={handlePlaceBet}
              yourWager={0.25}
              yourChance={32.5}
              totalBets={11283195}
            />
          </div>
        </div>

        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border flex-shrink-0">
          <div className="h-full">
            <ChatSidebar 
              messages={mockMessages}
              onlineCount={313}
            />
          </div>
        </div>
      </div>

      <GameFooter />
    </div>
  );
}
