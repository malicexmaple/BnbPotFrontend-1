import ChatSidebar from '../ChatSidebar';
import avatar1 from '@assets/generated_images/Gaming_avatar_placeholder_1_a3c2368d.png';
import avatar2 from '@assets/generated_images/Gaming_avatar_placeholder_2_b74e6961.png';
import avatar3 from '@assets/generated_images/Gaming_avatar_placeholder_3_f673a9f2.png';

export default function ChatSidebarExample() {
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
    }
  ];

  return (
    <div className="h-[600px] w-full max-w-md">
      <ChatSidebar messages={mockMessages} onlineCount={313} />
    </div>
  );
}
