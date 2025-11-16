import PlayerSlot from '../PlayerSlot';
import avatar1 from '@assets/generated_images/Gaming_avatar_placeholder_1_a3c2368d.png';

export default function PlayerSlotExample() {
  return (
    <div className="flex gap-4 p-8 bg-background">
      <PlayerSlot 
        username="Player1"
        avatarUrl={avatar1}
        betAmount={0.25}
        winChance={32.5}
        level={12}
        isWaiting={false}
        position={1}
      />
      <PlayerSlot 
        isWaiting={true}
        position={2}
      />
    </div>
  );
}
