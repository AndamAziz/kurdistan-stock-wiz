import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp } from "lucide-react";

interface TopItem {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  minStock: number;
  totalOut: number;
}

interface TopItemsTableProps {
  items: TopItem[];
  title: string;
}

export function TopItemsTable({ items, title }: TopItemsTableProps) {
  return (
    <div className="rounded-lg sm:rounded-xl border border-border bg-card shadow-card animate-slide-up overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-3 border-b border-border px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="rounded-md sm:rounded-lg bg-primary/10 p-1.5 sm:p-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-card-foreground">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right text-[10px] sm:text-xs lg:text-sm whitespace-nowrap">مادە</TableHead>
              <TableHead className="text-right text-[10px] sm:text-xs lg:text-sm whitespace-nowrap hidden sm:table-cell">براند</TableHead>
              <TableHead className="text-center text-[10px] sm:text-xs lg:text-sm whitespace-nowrap">ماوە</TableHead>
              <TableHead className="text-center text-[10px] sm:text-xs lg:text-sm whitespace-nowrap">فرۆشراو</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-20 sm:h-24 text-center text-xs sm:text-sm text-muted-foreground">
                  هیچ داتایەک نییە
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <TableCell className="font-medium text-[11px] sm:text-xs lg:text-sm py-2 sm:py-3">
                    <span className="line-clamp-1">{item.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[11px] sm:text-xs lg:text-sm py-2 sm:py-3 hidden sm:table-cell">
                    {item.brand}
                  </TableCell>
                  <TableCell className="text-center text-[11px] sm:text-xs lg:text-sm py-2 sm:py-3">
                    <span className={item.quantity <= item.minStock ? 'text-destructive font-semibold' : ''}>
                      {item.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-[11px] sm:text-xs lg:text-sm py-2 sm:py-3">
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 text-success">
                      <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {item.totalOut}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
