import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Function';
  const status = toolCall?.status || 'pending';
  const results = toolCall?.results;

  const parsedResults = (() => {
    if (!results) return null;
    try { return typeof results === 'string' ? JSON.parse(results) : results; }
    catch { return results; }
  })();

  const isError = results && (
    (typeof results === 'string' && /error|failed/i.test(results)) ||
    (parsedResults?.success === false)
  );

  const statusConfig = {
    pending: { icon: Clock, color: 'text-slate-400', text: 'Pendente' },
    running: { icon: Loader2, color: 'text-slate-500', text: 'Executando...', spin: true },
    in_progress: { icon: Loader2, color: 'text-slate-500', text: 'Executando...', spin: true },
    completed: isError ? { icon: AlertCircle, color: 'text-red-500', text: 'Falhou' } : { icon: CheckCircle2, color: 'text-green-600', text: 'Sucesso' },
    success: { icon: CheckCircle2, color: 'text-green-600', text: 'Sucesso' },
    failed: { icon: AlertCircle, color: 'text-red-500', text: 'Falhou' },
    error: { icon: AlertCircle, color: 'text-red-500', text: 'Falhou' },
  }[status] || { icon: Clock, color: 'text-slate-500', text: '' };

  const Icon = statusConfig.icon;
  const formattedName = name.split('.').reverse().join(' ').toLowerCase();

  return (
    <div className="mt-2 text-xs">
      <button onClick={() => setExpanded(!expanded)}
        className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:bg-white/5", expanded ? "bg-white/5 border-white/20" : "bg-transparent border-white/10")}>
        <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
        <span className="text-slate-400">{formattedName}</span>
        {statusConfig.text && <span className={cn("text-slate-500", isError && "text-red-600")}>• {statusConfig.text}</span>}
        {!statusConfig.spin && (toolCall.arguments_string || results) && (
          <ChevronRight className={cn("h-3 w-3 text-slate-400 transition-transform ml-auto", expanded && "rotate-90")} />
        )}
      </button>
      {expanded && !statusConfig.spin && (
        <div className="mt-1.5 ml-3 pl-3 border-l-2 border-white/10 space-y-2">
          {parsedResults && (
            <pre className="bg-white/5 rounded-md p-2 text-xs text-slate-400 whitespace-pre-wrap max-h-48 overflow-auto">
              {typeof parsedResults === 'object' ? JSON.stringify(parsedResults, null, 2) : parsedResults}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-7 w-7 rounded-lg bg-violet-500/20 flex items-center justify-center mt-0.5 shrink-0">
          <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
        </div>
      )}
      <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
        {message.content && (
          <div className={cn("rounded-2xl px-4 py-2.5", isUser ? "bg-teal-500/20 text-white border border-teal-500/20" : "bg-white/5 border border-white/10")}>
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  h1: ({ children }) => <h1 className="text-base font-bold my-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold my-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold my-1">{children}</h3>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  code: ({ children }) => <code className="px-1 py-0.5 rounded bg-white/10 text-xs">{children}</code>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {message.tool_calls?.length > 0 && (
          <div className="space-y-1">
            {message.tool_calls.map((tc, i) => <FunctionDisplay key={i} toolCall={tc} />)}
          </div>
        )}
      </div>
    </div>
  );
}