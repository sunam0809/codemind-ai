import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Cpu } from "lucide-react";
import { Message } from "@workspace/api-client-react";
import { CodeBlock } from "./CodeBlock";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div 
        className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border shadow-sm
          ${isUser 
            ? "bg-secondary text-secondary-foreground border-border" 
            : "bg-primary/10 text-primary border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.15)]"
          }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div 
        className={`flex-1 min-w-0 p-4 rounded-xl border
          ${isUser 
            ? "bg-secondary border-border text-foreground ml-12" 
            : "bg-card border-border/50 text-foreground mr-12 shadow-sm"
          }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap font-sans leading-relaxed text-sm">
            {message.content}
          </div>
        ) : (
          <div className="prose prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-p:leading-relaxed prose-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  if (!inline && match) {
                    return (
                      <CodeBlock
                        language={match[1]}
                        value={String(children).replace(/\n$/, "")}
                        {...props}
                      />
                    );
                  }
                  return (
                    <code className="bg-muted px-1.5 py-0.5 rounded-md text-primary font-mono text-[13px] border border-border" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
