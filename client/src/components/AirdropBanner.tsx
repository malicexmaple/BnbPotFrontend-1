import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface AirdropPool {
  balance: string;
  lastDistributionDate: string | null;
  totalDistributed: string;
}

export function AirdropBanner() {
  const [timeUntilDrop, setTimeUntilDrop] = useState<number>(0);
  const [isLive, setIsLive] = useState(false);

  const { data: pool } = useQuery<AirdropPool>({
    queryKey: ['/api/airdrop/pool'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nowUTC = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
      );

      const midnightUTC = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
      );

      const diff = midnightUTC - nowUTC;
      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      
      setTimeUntilDrop(hoursLeft);
      setIsLive(hoursLeft === 0 && diff < 60000);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const balance = pool?.balance ? parseFloat(pool.balance).toFixed(4) : "0.0000";

  return (
    <div className="relative inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border-2 border-yellow-500/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-1.5 border border-yellow-500/30">
        <div className={`relative ${isLive ? 'animate-pulse' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
            <span className="text-black font-bold text-xs">BNB</span>
          </div>
          {isLive && (
            <>
              <div className="absolute inset-0 rounded-full bg-yellow-400/50 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-md" />
            </>
          )}
        </div>
        <span className={`font-mono font-bold text-lg ${isLive ? 'text-yellow-300 animate-pulse' : 'text-yellow-400'}`}>
          {balance}
        </span>
      </div>

      <div className="relative">
        <h2 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500" style={{ fontFamily: 'Impact, sans-serif' }}>
          AIRDROP
        </h2>
        {isLive && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 blur-lg opacity-50 animate-pulse" />
        )}
      </div>

      <div className="bg-yellow-500 px-3 py-1 rounded border-2 border-yellow-300 shadow-lg">
        {isLive ? (
          <span className="font-bold text-black text-sm tracking-wider animate-pulse">
            LIVE
          </span>
        ) : (
          <span className="font-bold text-black text-sm tracking-wider">
            {timeUntilDrop}H
          </span>
        )}
      </div>

      <div className="absolute -top-2 -right-2">
        <div className="relative w-10 h-10">
          <div className={`w-10 h-10 ${isLive ? 'animate-bounce' : ''}`}>
            🎁
          </div>
          {isLive && (
            <>
              <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-md animate-ping" />
              <div className="absolute inset-0 bg-yellow-300/20 rounded-full blur-lg" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
