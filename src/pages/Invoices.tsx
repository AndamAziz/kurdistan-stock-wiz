import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInvoices, useInvoiceWithItems, useDeleteInvoice, Invoice } from "@/hooks/useInvoices";
import { useUserRoles } from "@/hooks/useUserRoles";
import { FileText, Search, Eye, Printer, Trash2, ArrowDownToLine, ArrowUpFromLine, Loader2, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useInvoiceSettings, colorThemes } from "@/pages/Settings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'stock_in' | 'stock_out'>('all');
  
  const { isAdmin } = useUserRoles();
  const { settings: invoiceSettings } = useInvoiceSettings();
  const deleteInvoice = useDeleteInvoice();
  
  const { data: allInvoices, isLoading } = useInvoices();
  const { data: selectedInvoice } = useInvoiceWithItems(selectedInvoiceId);
  
  const filteredInvoices = allInvoices?.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.recipient_phone?.includes(searchQuery);
    
    const matchesType = activeTab === 'all' || invoice.invoice_type === activeTab;
    
    return matchesSearch && matchesType;
  }) || [];

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoiceId(invoice.id);
    setPreviewOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteInvoice.mutateAsync(id);
  };

  const theme = colorThemes[invoiceSettings.colorTheme];

  const handlePrint = () => {
    if (!selectedInvoice) return;
    
    const isStockOut = selectedInvoice.invoice_type === 'stock_out';
    const totalBoxes = selectedInvoice.items.reduce((sum, item) => sum + (item.boxes || 0), 0);
    const totalPieces = selectedInvoice.items.reduce((sum, item) => sum + (item.pieces || 0), 0);
    const totalGifts = selectedInvoice.items.reduce((sum, item) => sum + (item.gifts || 0), 0);
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("ناتوانرێت پەنجەرەی چاپ بکرێتەوە");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ku">
      <head>
        <meta charset="UTF-8">
        <title>${isStockOut ? 'پسولەی دەرچوون' : 'پسولەی داخڵکردن'} - ${selectedInvoice.invoice_number}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Noto Sans Arabic', sans-serif; 
            padding: 20px; 
            direction: rtl; 
            background: #fff;
            color: #1a1a1a;
          }
          .invoice-wrapper { max-width: 800px; margin: 0 auto; }
          .invoice-header {
            background: ${theme.primary};
            color: white;
            padding: 25px 30px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .company-section { display: flex; align-items: center; gap: 15px; }
          .company-logo { width: 60px; height: 60px; border-radius: 10px; background: white; padding: 5px; object-fit: contain; }
          .company-info h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
          .company-info p { font-size: 12px; opacity: 0.9; }
          .invoice-badge { text-align: left; background: rgba(255,255,255,0.15); padding: 12px 20px; border-radius: 8px; }
          .invoice-badge h2 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
          .invoice-badge .number { font-size: 11px; font-family: monospace; opacity: 0.9; }
          .invoice-body { border: 2px solid ${theme.light}; border-top: none; border-radius: 0 0 12px 12px; padding: 30px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .meta-box { background: ${theme.light}; padding: 18px; border-radius: 10px; border-right: 4px solid ${theme.primary}; }
          .meta-box .label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .meta-box .value { font-size: 16px; font-weight: 600; color: #1a1a1a; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .items-table thead th { background: ${theme.primary}; color: white; padding: 14px 12px; font-size: 12px; font-weight: 600; }
          .items-table thead th:first-child { border-radius: 8px 0 0 0; }
          .items-table thead th:last-child { border-radius: 0 8px 0 0; }
          .items-table tbody tr { border-bottom: 2px solid ${theme.light}; }
          .items-table tbody tr:nth-child(even) { background: ${theme.light}40; }
          .items-table td { padding: 14px 12px; font-size: 13px; }
          .text-center { text-align: center; }
          .totals-section { display: flex; justify-content: flex-end; }
          .totals-box { width: 280px; border-radius: 10px; overflow: hidden; border: 2px solid ${theme.light}; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid ${theme.light}; font-size: 14px; }
          .total-row .label { color: #666; }
          .total-row .value { font-weight: 600; }
          .grand-total { background: ${theme.primary}; color: white; display: flex; justify-content: space-between; align-items: center; padding: 16px 18px; }
          .grand-total .label { font-size: 14px; }
          .grand-total .value { font-size: 22px; font-weight: 700; font-family: 'Courier New', monospace; }
          @media print { body { padding: 10px; } .invoice-wrapper { max-width: 100%; } }
        </style>
      </head>
      <body>
        <div class="invoice-wrapper">
          <div class="invoice-header">
            <div class="company-section">
              ${invoiceSettings.logoUrl ? `<img src="${invoiceSettings.logoUrl}" alt="Logo" class="company-logo" />` : ''}
              <div class="company-info">
                <h1>${invoiceSettings.companyName}</h1>
                <p>سیستەمی بەڕێوەبردنی کۆگا</p>
              </div>
            </div>
            <div class="invoice-badge">
              <h2>${isStockOut ? 'پسولەی دەرچوون' : 'پسولەی داخڵکردن'}</h2>
              <p class="number">${selectedInvoice.invoice_number}</p>
            </div>
          </div>
          
          <div class="invoice-body">
            <div class="meta-grid">
              <div class="meta-box">
                <p class="label">${isStockOut ? 'زانیاری وەرگر' : 'زانیاری'}</p>
                <p class="value">${selectedInvoice.recipient_name || '-'}</p>
                ${selectedInvoice.recipient_phone ? `<p style="font-size: 13px; color: #666; margin-top: 3px;" dir="ltr">${selectedInvoice.recipient_phone}</p>` : ''}
              </div>
              <div class="meta-box">
                <p class="label">زانیاری پسولە</p>
                <p class="value">${selectedInvoice.invoice_date}</p>
                <p style="font-size: 13px; color: #666; margin-top: 3px;">چاپکرا: ${format(new Date(), 'yyyy/MM/dd')}</p>
              </div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ناوی مادە</th>
                  ${isStockOut ? '<th class="text-center">بۆکس</th><th class="text-center">دانە</th><th class="text-center">🎁</th>' : '<th class="text-center">بڕ</th>'}
                  <th class="text-center">نرخ</th>
                  <th class="text-center">کۆ</th>
                </tr>
              </thead>
              <tbody>
                ${selectedInvoice.items.map((item, idx) => `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td>
                      <div style="font-weight: 600;">${item.item_name}</div>
                      ${item.item_brand ? `<div style="font-size: 11px; color: #888;">${item.item_brand}</div>` : ''}
                    </td>
                    ${isStockOut ? `
                      <td class="text-center">${item.boxes || 0}</td>
                      <td class="text-center">${item.pieces || 0}</td>
                      <td class="text-center">${item.gifts || 0}</td>
                    ` : `
                      <td class="text-center">${item.quantity}</td>
                    `}
                    <td class="text-center">${item.price.toLocaleString()}</td>
                    <td class="text-center" style="font-weight: 600;">${item.total_price.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals-section">
              <div class="totals-box">
                ${isStockOut ? `
                  <div class="total-row"><span class="label">کۆی بۆکس</span><span class="value">${totalBoxes}</span></div>
                  <div class="total-row"><span class="label">کۆی دانە</span><span class="value">${totalPieces}</span></div>
                  ${totalGifts > 0 ? `<div class="total-row"><span class="label">کۆی هەدیە</span><span class="value">${totalGifts}</span></div>` : ''}
                ` : `
                  <div class="total-row"><span class="label">کۆی ئایتم</span><span class="value">${selectedInvoice.items.length}</span></div>
                `}
                <div class="grand-total">
                  <span class="label">کۆی گشتی</span>
                  <span class="value">${selectedInvoice.total_amount.toLocaleString()} د.ع</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleWhatsApp = () => {
    if (!selectedInvoice || !selectedInvoice.recipient_phone) {
      toast.error("ژمارەی مۆبایل نییە");
      return;
    }

    const isStockOut = selectedInvoice.invoice_type === 'stock_out';
    const totalBoxes = selectedInvoice.items.reduce((sum, item) => sum + (item.boxes || 0), 0);
    const totalPieces = selectedInvoice.items.reduce((sum, item) => sum + (item.pieces || 0), 0);
    const totalGifts = selectedInvoice.items.reduce((sum, item) => sum + (item.gifts || 0), 0);

    let itemsList = selectedInvoice.items.map((item, idx) => {
      let qtyParts = [];
      if (item.boxes > 0) qtyParts.push(`📦 بۆکس: ${item.boxes}`);
      if (item.pieces > 0) qtyParts.push(`🔢 دانە: ${item.pieces}`);
      if (item.gifts > 0) qtyParts.push(`🎁 هەدیە: ${item.gifts}`);
      
      return `${idx + 1}. *${item.item_name}*\n   ${qtyParts.join(' | ')}\n   💰 نرخ: ${item.price.toLocaleString()} د.ع\n   🧾 کۆ: *${item.total_price.toLocaleString()}* د.ع${item.note ? `\n   📝 ${item.note}` : ''}`;
    }).join('\n\n');

    const message = `
╔══════════════════════╗
       *${invoiceSettings.companyName}*
      ${isStockOut ? 'پسولەی دەرچوون' : 'پسولەی داخڵکردن'}
╚══════════════════════╝

📋 *ژمارەی پسولە:* ${selectedInvoice.invoice_number}
📅 *بەروار:* ${selectedInvoice.invoice_date}
👤 *${isStockOut ? 'وەرگر' : 'ناو'}:* ${selectedInvoice.recipient_name}

━━━━━━━━━━━━━━━━━━━━

*لیستی مادەکان:*

${itemsList}

━━━━━━━━━━━━━━━━━━━━

📦 *کۆی بۆکس:* ${totalBoxes}
🔢 *کۆی دانە:* ${totalPieces}
${totalGifts > 0 ? `🎁 *کۆی هەدیە:* ${totalGifts}\n` : ''}💰 *کۆی گشتی:* *${selectedInvoice.total_amount.toLocaleString()}* د.ع

━━━━━━━━━━━━━━━━━━━━
✨ سوپاس بۆ هاوکاریکردنتان ✨
    `.trim();

    const phone = selectedInvoice.recipient_phone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">ئینڤۆیسەکان</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                بینین و دووبارە پرێنتکردنی ئینڤۆیسەکان
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card animate-slide-up">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="گەڕان بە ژمارەی پسولە، ناو، یان مۆبایل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all" className="gap-2">
              <FileText className="h-4 w-4" />
              هەموو
            </TabsTrigger>
            <TabsTrigger value="stock_in" className="gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              داخڵکردن
            </TabsTrigger>
            <TabsTrigger value="stock_out" className="gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              دەرکردن
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-2 opacity-20" />
                  <p>هیچ ئینڤۆیسێک نەدۆزرایەوە</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">ژمارەی پسولە</TableHead>
                        <TableHead className="text-right">جۆر</TableHead>
                        <TableHead className="text-right">ناو</TableHead>
                        <TableHead className="text-right">بەروار</TableHead>
                        <TableHead className="text-right">کۆی گشتی</TableHead>
                        <TableHead className="text-center">کردارەکان</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell>
                            <Badge variant={invoice.invoice_type === 'stock_out' ? 'destructive' : 'default'}>
                              {invoice.invoice_type === 'stock_out' ? (
                                <><ArrowUpFromLine className="h-3 w-3 ml-1" /> دەرکردن</>
                              ) : (
                                <><ArrowDownToLine className="h-3 w-3 ml-1" /> داخڵکردن</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>{invoice.recipient_name || '-'}</TableCell>
                          <TableCell>{invoice.invoice_date}</TableCell>
                          <TableCell className="font-semibold">
                            {invoice.total_amount.toLocaleString()} د.ع
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewInvoice(invoice)}
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {isAdmin && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>سڕینەوەی ئینڤۆیس</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        دڵنیایت لە سڕینەوەی ئەم ئینڤۆیسە؟ ئەم کردارە ناگەڕێتەوە.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(invoice.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        سڕینەوە
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Invoice Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                پیشاندانی ئینڤۆیس
              </DialogTitle>
            </DialogHeader>

            {selectedInvoice && (
              <div className="space-y-4">
                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">ژمارەی پسولە</p>
                    <p className="font-mono font-semibold">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">بەروار</p>
                    <p className="font-semibold">{selectedInvoice.invoice_date}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">ناو</p>
                    <p className="font-semibold">{selectedInvoice.recipient_name || '-'}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">مۆبایل</p>
                    <p className="font-semibold" dir="ltr">{selectedInvoice.recipient_phone || '-'}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">#</TableHead>
                        <TableHead className="text-right">ناوی مادە</TableHead>
                        <TableHead className="text-center">بڕ</TableHead>
                        <TableHead className="text-center">نرخ</TableHead>
                        <TableHead className="text-center">کۆ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <div className="font-semibold">{item.item_name}</div>
                            {item.item_brand && (
                              <div className="text-xs text-muted-foreground">{item.item_brand}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {selectedInvoice.invoice_type === 'stock_out' ? (
                              <div className="flex flex-wrap justify-center gap-1">
                                {item.boxes > 0 && <Badge variant="outline">{item.boxes} بۆکس</Badge>}
                                {item.pieces > 0 && <Badge variant="outline">{item.pieces} دانە</Badge>}
                                {item.gifts > 0 && <Badge variant="secondary">🎁 {item.gifts}</Badge>}
                              </div>
                            ) : (
                              item.quantity
                            )}
                          </TableCell>
                          <TableCell className="text-center">{item.price.toLocaleString()}</TableCell>
                          <TableCell className="text-center font-semibold">
                            {item.total_price.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Total */}
                <div className="flex justify-end">
                  <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 min-w-[200px]">
                    <p className="text-sm text-muted-foreground mb-1">کۆی گشتی</p>
                    <p className="text-2xl font-bold text-primary">
                      {selectedInvoice.total_amount.toLocaleString()} د.ع
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  <Button onClick={handlePrint} className="gap-2">
                    <Printer className="h-4 w-4" />
                    پرێنت
                  </Button>
                  {selectedInvoice.recipient_phone && (
                    <Button variant="outline" onClick={handleWhatsApp} className="gap-2">
                      <Send className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
