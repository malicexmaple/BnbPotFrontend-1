import BettingPanel from '../BettingPanel';

export default function BettingPanelExample() {
  return (
    <div className="flex items-center justify-center p-8 bg-background">
      <BettingPanel 
        onPlaceBet={(amount) => console.log('Bet placed:', amount)}
        yourWager={0.25}
        yourChance={32.5}
        totalBets={11283195}
      />
    </div>
  );
}
