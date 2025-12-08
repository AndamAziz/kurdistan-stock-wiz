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
    <div className="rounded-xl border border-border bg-card shadow-card animate-slide-up">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div className="rounded-lg bg-primary/10 p-2">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-card-foreground">{title}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">مادە</TableHead>
            <TableHead className="text-right">براند</TableHead>
            <TableHead className="text-center">ماوە</TableHead>
            <TableHead className="text-center">فرۆشراو</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                هیچ داتایەک نییە
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-muted-foreground">{item.brand}</TableCell>
                <TableCell className="text-center">
                  <span className={item.quantity <= item.minStock ? 'text-destructive font-semibold' : ''}>
                    {item.quantity}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 text-success">
                    <TrendingUp className="h-3 w-3" />
                    {item.totalOut}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
