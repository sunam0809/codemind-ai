import { useState, useRef, useEffect } from "react";
import { 
  useGetConversation, 
  useSendMessage,
  getListConversationsQueryKey,
  getGetConversationQueryKey,
  useCreateConversation
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, CornerDownLeft, Cpu, Code2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatMessage } from "./ChatMessage";

interface ChatAreaProps {
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
}

export function ChatArea({ conversationId, onConversationCreated }: ChatAreaProps) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const { data: conversation, isLoading } = useGetConversation(conversationId ?? 0, {
    query: {
      enabled: !!conversationId,
      queryKey: getGetConversationQueryKey(conversationId ?? 0)
    }
  });

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const createMutation = useCreateConversation({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        onConversationCreated(data.id);
        // Continue to send message
        sendMutation.mutate({
          data: {
            content: input,
            conversationId: data.id,
            model
          }
        });
        setInput("");
      }
    }
  });

  const sendMutation = useSendMessage({
    mutation: {
      onSuccess: (data, variables) => {
        // Optimistically update conversation
        queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(variables.data.conversationId) });
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      }
    }
  });

  const handleSubmit = () => {
    if (!input.trim()) return;

    if (!conversationId) {
      // Create conversation first
      createMutation.mutate({ data: { title: input.slice(0, 30) + (input.length > 30 ? "..." : "") } });
      return;
    }

    sendMutation.mutate({
      data: {
        content: input,
        conversationId,
        model
      }
    });
    
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!conversationId && !createMutation.isPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
        {/* Decorative background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background pointer-events-none"></div>

        <div className="relative max-w-2xl w-full text-center space-y-8 z-10">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 border border-primary/20 rounded-2xl shadow-[0_0_40px_rgba(var(--primary),0.2)]">
            <Cpu className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">CodeMind <span className="text-primary">AI</span></h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Your elite coding companion. Dark, focused, technical, and blazingly fast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur hover:border-primary/50 transition-colors">
              <Code2 className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Architecture & Design</h3>
              <p className="text-sm text-muted-foreground">Design system architecture, write UI components, or generate full websites.</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur hover:border-primary/50 transition-colors">
              <Zap className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Low-Level Systems</h3>
              <p className="text-sm text-muted-foreground">Analyze exe/dll/sys files, optimize algorithms, or write kernel-level code.</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-3xl mt-12 z-10">
           <div className="relative border border-border focus-within:border-primary/50 rounded-xl bg-card shadow-lg transition-colors flex flex-col">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What are we building today? (Press Enter to send)"
              className="min-h-[100px] border-0 focus-visible:ring-0 resize-none bg-transparent p-4 text-base font-mono"
            />
            <div className="flex items-center justify-between p-3 border-t border-border/50 bg-background/50 rounded-b-xl">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-[200px] h-8 text-xs border-border bg-background focus:ring-primary">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B (Versatile)</SelectItem>
                  <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                  <SelectItem value="gemma2-9b-it">Gemma2 9B IT</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleSubmit}
                disabled={!input.trim()}
                size="sm"
                className="gap-2 font-mono"
              >
                Execute
                <CornerDownLeft className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      <div className="flex-1 overflow-y-auto z-10 scroll-smooth px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse flex items-center gap-2 text-primary font-mono text-sm">
                <Cpu className="w-4 h-4 animate-spin" />
                Initializing core modules...
              </div>
            </div>
          ) : (
            conversation?.messages?.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}
          
          {(sendMutation.isPending || createMutation.isPending) && (
             <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30 text-primary flex-shrink-0">
                  <Cpu className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
             </div>
          )}
          
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      <div className="p-4 border-t border-border bg-background/80 backdrop-blur z-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative border border-border focus-within:border-primary/50 rounded-xl bg-card shadow-lg transition-colors flex flex-col">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your command..."
              className="min-h-[80px] max-h-[300px] border-0 focus-visible:ring-0 resize-none bg-transparent p-4 text-base font-mono"
            />
            <div className="flex items-center justify-between p-3 border-t border-border/50 bg-background/50 rounded-b-xl">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-[180px] h-8 text-xs border-border bg-background focus:ring-primary font-mono">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B</SelectItem>
                  <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                  <SelectItem value="gemma2-9b-it">Gemma2 9B</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleSubmit}
                disabled={!input.trim() || sendMutation.isPending || createMutation.isPending}
                size="sm"
                className="gap-2 font-mono h-8 shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-shadow"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
