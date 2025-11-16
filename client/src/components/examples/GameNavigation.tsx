import GameNavigation from '../GameNavigation';

export default function GameNavigationExample() {
  return (
    <GameNavigation 
      onConnect={() => console.log('Connect wallet clicked')}
      isConnected={false}
    />
  );
}
