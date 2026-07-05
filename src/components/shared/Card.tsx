import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]',
        className,
      )}
      {...rest}
    />
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  // Cifras largas (ej. "$2.365.180") no caben a text-3xl en tarjetas de media
  // pantalla en móvil; se reduce la fuente según el largo del valor.
  const str = String(value);
  const sizeClass =
    str.length > 11 ? 'text-lg' : str.length > 9 ? 'text-xl' : str.length > 7 ? 'text-2xl' : 'text-3xl';
  return (
    <Card className={cn(accent && 'border-primary/40')}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('mt-2 font-bold leading-snug', sizeClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
