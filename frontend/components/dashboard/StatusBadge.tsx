import { Circle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'online' | 'offline';
  testId?: string;
}

export function StatusBadge({ status, testId }: StatusBadgeProps) {
  const isOnline = status === 'online';
  
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
        isOnline
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground'
      }`}
      data-testid={testId}
    >
      <Circle
        className={`h-2 w-2 ${isOnline ? 'fill-primary text-primary' : 'fill-muted-foreground text-muted-foreground'}`}
      />
      <span className="capitalize">{status}</span>
    </div>
  );
}
