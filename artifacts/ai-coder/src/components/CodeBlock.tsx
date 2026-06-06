import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Download, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  language: string;
  value: string;
  filename?: string;
}

const EXTENSION_MAP: Record<string, string> = {
  javascript: "js", typescript: "ts", python: "py", py: "py",
  c: "c", cpp: "cpp", csharp: "cs", cs: "cs", java: "java",
  rust: "rs", go: "go", php: "php", ruby: "rb", swift: "swift",
  kotlin: "kt", bash: "sh", shell: "sh", sh: "sh", bat: "bat",
  powershell: "ps1", html: "html", css: "css", scss: "scss",
  json: "json", yaml: "yml", xml: "xml", sql: "sql",
  dockerfile: "Dockerfile", makefile: "Makefile",
  asm: "asm", assembly: "asm", nasm: "asm",
};

function inferFilename(language: string, value: string): string {
  const ext = EXTENSION_MAP[language.toLowerCase()] ?? language.toLowerCase();
  // Try to detect a filename from first comment line
  const firstLine = value.split("\n")[0];
  const nameMatch = firstLine.match(/(?:\/\/|#|;)\s*(?:file|filename|name):\s*(\S+)/i);
  if (nameMatch) return nameMatch[1];
  if (ext === "Dockerfile" || ext === "Makefile") return ext;
  return `code.${ext}`;
}

export function CodeBlock({ language, value, filename }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const displayFilename = filename ?? inferFilename(language, value);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = displayFilename;
    a.click();
    URL.revokeObjectURL(url);
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-border/60 bg-[#1e1e1e] shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#404040]">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-mono text-gray-400 font-semibold lowercase truncate">
            {displayFilename}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
            onClick={handleDownload}
            title="파일로 저장"
            data-testid="button-download-file"
          >
            {isDownloaded ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Download className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
            onClick={handleCopy}
            title="복사"
            data-testid="button-copy-code"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "transparent",
          fontSize: "13px",
          fontFamily: "var(--app-font-mono)",
        }}
        wrapLongLines={true}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
