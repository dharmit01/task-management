import { Badge } from "../ui/badge";

export function StatBadge({ count, className }: { count: number; className: string }) {
    if (count === 0) return <span className="text-muted-foreground text-sm">—</span>;
    return (
        <Badge className={`text-xs tabular-nums ${className}`}>
            {count}
        </Badge>
    );
}