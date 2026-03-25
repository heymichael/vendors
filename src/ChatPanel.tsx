import { useState, useRef, useEffect, useCallback } from 'react';
import Markdown from 'react-markdown';
import { Send, Loader2, PanelRightClose } from 'lucide-react';
import { Button, Separator, cn } from '@haderach/shared-ui';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean;
}

interface PendingAction {
  type: string;
  vendor_id: string;
  vendor_name: string;
}

interface ChatResponse {
  reply: string;
  tool_calls_executed: string[];
  pending_action?: PendingAction | null;
}

const WRITE_TOOLS = new Set(['add_vendor', 'delete_vendor', 'modify_vendor']);

export function ChatPanel({ open, onClose, onVendorsChanged, onEditVendor }: { open: boolean; onClose: () => void; onVendorsChanged?: () => void; onEditVendor?: (vendorId: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingAction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch('/agent/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          context: { app: 'vendors' },
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error ${resp.status}: ${errText}` },
        ]);
        return;
      }

      const data: ChatResponse = await resp.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);

      if (data.pending_action?.type === 'confirm_delete') {
        setPendingDelete(data.pending_action);
      } else if (data.pending_action?.type === 'open_edit') {
        onEditVendor?.(data.pending_action.vendor_id);
      } else if (data.tool_calls_executed.some((t) => WRITE_TOOLS.has(t))) {
        onVendorsChanged?.();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Network error: ${err instanceof Error ? err.message : err}` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const resp = await fetch(`/agent/api/vendors/${pendingDelete.vendor_id}`, { method: 'DELETE' });
      if (resp.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `**${pendingDelete.vendor_name}** has been deleted.` },
        ]);
        onVendorsChanged?.();
      } else {
        const errText = await resp.text();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Failed to delete: ${errText}` },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Delete error: ${err instanceof Error ? err.message : err}` },
      ]);
    } finally {
      setPendingDelete(null);
      setDeleting(false);
    }
  }, [pendingDelete, onVendorsChanged]);

  const cancelDelete = useCallback(() => {
    if (pendingDelete) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Deletion of **${pendingDelete.vendor_name}** was cancelled.` },
        { role: 'user', content: `I cancelled the deletion of ${pendingDelete.vendor_name}. If I ask to delete it again, call delete_vendor again.`, hidden: true },
      ]);
    }
    setPendingDelete(null);
  }, [pendingDelete]);

  if (!open) return null;

  return (
    <div className="flex h-full w-[25rem] flex-col border-l border-border bg-background">
      <div className="flex h-12 items-center gap-2 border-b px-4">
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose} aria-label="Close chat">
          <PanelRightClose />
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <h2 className="text-sm font-semibold">Agent</h2>
        {messages.length > 0 && (
          <button
            type="button"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setMessages([])}
          >
            Clear
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.filter((m) => !m.hidden).map((m, i) => (
          <div
            key={i}
            className={cn(
              'max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed',
              m.role === 'user'
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'bg-muted text-foreground chat-markdown',
            )}
          >
            {m.role === 'assistant' ? (
              <Markdown
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                      {children}
                    </a>
                  ),
                }}
              >
                {m.content}
              </Markdown>
            ) : (
              m.content
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 border-t p-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Message the agent…"
          disabled={loading}
          rows={5}
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        />
        <Button size="icon" variant="ghost" disabled={loading || !input.trim()} onClick={send}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Human verification needed</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Delete <strong>{pendingDelete.vendor_name}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={cancelDelete} disabled={deleting}>
                No, Do Not Delete
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
