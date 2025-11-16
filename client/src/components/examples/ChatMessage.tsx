import ChatMessage from '../ChatMessage';
import avatar1 from '@assets/generated_images/Gaming_avatar_placeholder_1_a3c2368d.png';

export default function ChatMessageExample() {
  return (
    <div className="space-y-2 p-4 bg-background max-w-md">
      <ChatMessage 
        username="charzard"
        avatarUrl={avatar1}
        message="31% and didn't see my name lol"
        timestamp="13:55"
        level={47}
      />
      <ChatMessage 
        username="QweezyLovesBizzy"
        message="GGs snowy"
        timestamp="13:58"
        level={8}
      />
    </div>
  );
}
