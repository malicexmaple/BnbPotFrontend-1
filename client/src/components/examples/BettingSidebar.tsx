import BettingSidebar from '../BettingSidebar';

export default function BettingSidebarExample() {
  return (
    <div className="h-[600px] w-80">
      <BettingSidebar 
        onPlaceBet={(amount) => console.log('Bet placed:', amount)}
        totalBets={11283195}
      />
    </div>
  );
}
