import { useEffect, useRef } from "react";

import { MessageBubble } from "@/components/chat/message-bubble";

interface MessageListProps {
  messages: { id: string; senderId: string; body: string; createdAt: Date }[];
  otherParticipantId: string;
}

export function MessageList({ messages, otherParticipantId }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  return (
    <div ref={containerRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          body={message.body}
          createdAt={message.createdAt}
          isOwn={message.senderId !== otherParticipantId}
        />
      ))}
    </div>
  );
}
