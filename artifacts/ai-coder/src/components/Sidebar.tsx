import { 
  useListConversations, 
  useCreateConversation, 
  useDeleteConversation,
  useGetChatStats,
  getListConversationsQueryKey,
  getGetChatStatsQueryKey
} from "@workspace/api-client-react";
import { Plus, MessageSquare, Trash2, TerminalSquare, Activity } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export function Sidebar({ selectedId, onSelect }: SidebarProps) {
  const queryClient = useQueryClient();
  const { data: conversations, isLoading } = useListConversations();
  const { data: stats } = useGetChatStats();

  const createMutation = useCreateConversation({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetChatStatsQueryKey() });
        onSelect(data.id);
      }
    }
  });

  const deleteMutation = useDeleteConversation({
    mutation: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetChatStatsQueryKey() });
        if (selectedId === variables.id) {
          onSelect(null);
        }
      }
    }
  });

  const handleNewChat = () => {
    createMutation.mutate({ data: { title: "새 대화" } });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="w-64 flex-shrink-0 flex flex-col h-full bg-sidebar border-r border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-bold tracking-tight">
          <TerminalSquare className="w-5 h-5" />
          <span>CodeMind AI</span>
        </div>
      </div>

      <div className="p-4">
        <Button 
          onClick={handleNewChat} 
          disabled={createMutation.isPending}
          className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20 transition-all duration-200 shadow-none font-mono text-sm uppercase tracking-wider"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2">
                <Skeleton className="w-4 h-4 rounded bg-border/50" />
                <Skeleton className="h-4 flex-1 bg-border/50" />
              </div>
            ))
          ) : conversations?.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground font-mono">
              No conversations yet.
            </div>
          ) : (
            conversations?.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors duration-200 text-sm ${
                  selectedId === conv.id 
                    ? "bg-primary/15 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-70" />
                  <span className="truncate whitespace-nowrap font-medium">
                    {conv.title}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {conv.messageCount !== null && conv.messageCount !== undefined && (
                    <span className="text-[10px] bg-background border border-border px-1.5 rounded text-muted-foreground font-mono">
                      {conv.messageCount}
                    </span>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 hover:text-destructive rounded transition-all text-muted-foreground"
                        disabled={deleteMutation.isPending && deleteMutation.variables?.id === conv.id}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Delete conversation</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {stats && (
        <div className="p-4 border-t border-border bg-sidebar/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <Activity className="w-3.5 h-3.5" />
            System Stats
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-background border border-border p-2 rounded flex flex-col gap-1">
              <span className="text-muted-foreground">Chats</span>
              <span className="font-mono font-bold text-foreground text-sm">{stats.totalConversations}</span>
            </div>
            <div className="bg-background border border-border p-2 rounded flex flex-col gap-1">
              <span className="text-muted-foreground">Msgs Today</span>
              <span className="font-mono font-bold text-primary text-sm">{stats.todayMessages}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
