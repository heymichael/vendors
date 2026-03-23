import { MessageSquare } from 'lucide-react';
import { Button } from '@haderach/shared-ui';

interface ChatToggleProps {
  open: boolean;
  onToggle: () => void;
}

export function ChatToggle({ open, onToggle }: ChatToggleProps) {
  if (open) return null;
  return (
    <button onClick={onToggle} aria-label="Open chat" className="rounded-md p-1 hover:bg-accent">
      <MessageSquare className="h-7 w-7 fill-primary text-primary" />
    </button>
  );
}
