import { cn } from '@/lib/utils';
import type { CoachMessage as CoachMessageType } from '@/types';

interface CoachMessageProps {
  message: CoachMessageType;
}

export function CoachMessage({ message }: CoachMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex w-full',
        isAssistant ? 'justify-start' : 'justify-end'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isAssistant
            ? 'rounded-tl-sm bg-n-100 text-navy'
            : 'rounded-tr-sm bg-primary text-white'
        )}
        role={isAssistant ? 'status' : undefined}
      >
        {message.content}
      </div>
    </div>
  );
}
