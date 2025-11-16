import GameCanvas from '../GameCanvas';
import avatar1 from '@assets/generated_images/Gaming_avatar_placeholder_1_a3c2368d.png';
import avatar2 from '@assets/generated_images/Gaming_avatar_placeholder_2_b74e6961.png';
import avatar3 from '@assets/generated_images/Gaming_avatar_placeholder_3_f673a9f2.png';

export default function GameCanvasExample() {
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
    }
  ];

  return (
    <GameCanvas 
      players={mockPlayers}
      jackpotValue={0.312}
      timeRemaining={125}
      roundNumber={186401}
      blockStatus="Mining Block"
    />
  );
}
