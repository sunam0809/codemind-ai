import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground dark">
      <Sidebar 
        selectedId={selectedConversationId} 
        onSelect={setSelectedConversationId} 
      />
      <main className="flex-1 flex flex-col h-full min-w-0 border-l border-border bg-background">
        <ChatArea 
          conversationId={selectedConversationId} 
          onConversationCreated={(id) => setSelectedConversationId(id)}
        />
      </main>
    </div>
  );
}
