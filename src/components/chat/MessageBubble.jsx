import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Zap, Copy, CheckCircle2, Clock, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function ToolCallDisplay({ toolCall }) {
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
    pending: { icon: Clock, color: 'text-muted-foreground', spin: false },
    running: { icon: Loader2, color: 'text-primary', spin: true },
    in_progress: { icon: Loader2, color: 'text-primary', spin: true },
    completed: isError
      ? { icon: AlertCircle, color: 'text-red-400', spin: false }
      : { icon: CheckCircle2, color: 'text-emerald-400', spin: false },
    success: { icon: CheckCircle2, color: 'text-emerald-400', spin: false },
    failed: { icon: AlertCircle, color: 'text-red-400', spin: false },
    error: { icon: AlertCircle, color: 'text-red-400', spin: false },
  }[status] || { icon: Zap, color: 'text-muted-foreground', spin: false };

  const Icon = statusConfig.icon;

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-all"
      >
        <Icon className={cn('h-3 w-3', statusConfig.color, statusConfig.spin && 'animate-spin')} />
        <span className="text-muted-foreground">{name.split('.').reverse().join(' ')}</span>
        {!statusConfig.spin && (toolCall.arguments_string || results) && (
          <ChevronRight className={cn('h-3 w-3 text-muted-foreground transition-transform ml-auto', expanded && 'rotate-90')} />
        )}
      </button>
      {expanded && !statusConfig.spin && (
        <div className="mt-1.5 ml-3 pl-3 border-l-2 border-border space-y-2">
          {toolCall.arguments_string && (
            <pre className="bg-secondary rounded-md p-2 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
              {(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch { return toolCall.arguments_string; } })()}
            </pre>
          )}
          {parsedResults && (
            <pre className="bg-secondary rounded-md p-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-48 overflow-auto font-mono">
              {typeof parsedResults === 'object' ? JSON.stringify(parsedResults, null, 2) : parsedResults}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 max-w-3xl', isUser ? 'ml-auto justify-end' : 'mr-auto')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-1">
          <Zap className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div className={cn('max-w-[85%] min-w-0', isUser && 'flex flex-col items-end')}>
        {message.content && (
          <div className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border'
          )}>
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="text-sm prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed text-foreground">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc text-foreground">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal text-foreground">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5 text-foreground">{children}</li>,
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="px-1.5 py-0.5 rounded bg-secondary text-primary text-xs font-mono">{children}</code>
                    ) : (
                      <pre className="bg-secondary rounded-lg p-3 overflow-x-auto my-2 relative group">
                        <button
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-muted"
                          onClick={() => { navigator.clipboard.writeText(String(children)); toast.success('Copied'); }}
                        >
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <code className="text-xs font-mono text-foreground">{children}</code>
                      </pre>
                    ),
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {message.tool_calls?.length > 0 && (
          <div className="space-y-1 mt-1">
            {message.tool_calls.map((tc, i) => <ToolCallDisplay key={i} toolCall={tc} />)}
          </div>
        )}
      </div>
    </div>
  );
}