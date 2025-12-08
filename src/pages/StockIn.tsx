import { Layout } from "@/components/layout/Layout";
import { StockMovementForm } from "@/components/stock/StockMovementForm";
import { stockMovements } from "@/lib/mockData";
import { ArrowDownToLine, Clock, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function StockIn() {
  const inMovements = stockMovements.filter(m => m.type === 'IN').slice(0, 5);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-success/10 p-3">
              <ArrowDownToLine className="h-6 w-6 text-success" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">داخڵکردن بۆ کۆگا</h1>
              <p className="mt-1 text-muted-foreground">
                زیادکردنی مادە بۆ ستۆک
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up">
            <h2 className="mb-6 text-lg font-semibold text-card-foreground">
              داخڵکردنی مادە
            </h2>
            <StockMovementForm type="IN" />
          </div>

          {/* Recent Movements */}
          <div className="rounded-xl border border-border bg-card shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-card-foreground">کۆتا داخڵکردنەکان</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">مادە</TableHead>
                  <TableHead className="text-center">ژمارە</TableHead>
                  <TableHead className="text-center">بەروار</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                      هیچ ڕیکۆردێک نییە
                    </TableCell>
                  </TableRow>
                ) : (
                  inMovements.map((movement, index) => (
                    <TableRow key={movement.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                      <TableCell className="font-medium">{movement.itemName}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-success/10 text-success border-success/20">
                          +{movement.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground text-sm">
                        {movement.date}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
