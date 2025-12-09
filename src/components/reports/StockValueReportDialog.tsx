import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, X, Package, DollarSign, Boxes, FileSpreadsheet, Filter } from "lucide-react";
import { ItemWithRelations } from "@/hooks/useItems";
import { format } from "date-fns";
import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface StockValueReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ItemWithRelations[];
}

export function StockValueReportDialog({
  open,
  onOpenChange,
  items,
}: StockValueReportDialogProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [themeColor, setThemeColor] = useState<string>("#1a7f64");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get unique brands and categories
  const brands = useMemo(() => {
    const uniqueBrands = new Map<string, string>();
    items.forEach(item => {
      if (item.brands?.id && item.brands?.name) {
        uniqueBrands.set(item.brands.id, item.brands.name);
      }
    });
    return Array.from(uniqueBrands, ([id, name]) => ({ id, name }));
  }, [items]);

  const categories = useMemo(() => {
    const uniqueCategories = new Map<string, string>();
    items.forEach(item => {
      if (item.categories?.id && item.categories?.name) {
        uniqueCategories.set(item.categories.id, item.categories.name);
      }
    });
    return Array.from(uniqueCategories, ([id, name]) => ({ id, name }));
  }, [items]);

  // Filter items based on selections
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const brandMatch = selectedBrand === "all" || item.brands?.id === selectedBrand;
      const categoryMatch = selectedCategory === "all" || item.categories?.id === selectedCategory;
      return brandMatch && categoryMatch;
    });
  }, [items, selectedBrand, selectedCategory]);

  useEffect(() => {
    const savedLogo = localStorage.getItem('invoiceLogo');
    const savedTheme = localStorage.getItem('invoiceTheme');
    if (savedLogo) setLogoUrl(savedLogo);
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        setThemeColor(theme.primary || "#1a7f64");
      } catch {
        setThemeColor("#1a7f64");
      }
    }
  }, [open]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredItems.map((item, index) => {
        let itemTotalValue = 0;
        if (item.box_price && item.box_price > 0) {
          itemTotalValue = (item.box_price || 0) * item.current_quantity;
        } else if (item.piece_price && item.piece_price > 0) {
          itemTotalValue = (item.piece_price || 0) * item.current_quantity;
        } else if (item.price_per_kg && item.price_per_kg > 0) {
          itemTotalValue = (item.price_per_kg || 0) * item.current_quantity;
        }

        return {
          '#': index + 1,
          'ئایدی': item.id,
          'ناوی بەرهەم': item.name,
          'باڕکۆد': item.barcode,
          'براند': item.brands?.name || '-',
          'کەتەگۆری': item.categories?.name || '-',
          'ستۆک': item.current_quantity,
          'نرخی بۆکس (د.ع)': item.box_price || 0,
          'نرخی دانە (د.ع)': item.piece_price || 0,
          'نرخی کیلۆ (د.ع)': item.price_per_kg || 0,
          'کۆی بەها (د.ع)': itemTotalValue,
        };
      });

      // Add totals row
      excelData.push({
        '#': '',
        'ئایدی': '',
        'ناوی بەرهەم': 'کۆی گشتی',
        'باڕکۆد': '',
        'براند': '',
        'کەتەگۆری': '',
        'ستۆک': totals.totalQuantity,
        'نرخی بۆکس (د.ع)': '',
        'نرخی دانە (د.ع)': '',
        'نرخی کیلۆ (د.ع)': '',
        'کۆی بەها (د.ع)': totals.totalValue,
      } as any);

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // #
        { wch: 38 },  // ID
        { wch: 30 },  // Name
        { wch: 15 },  // Barcode
        { wch: 15 },  // Brand
        { wch: 15 },  // Category
        { wch: 10 },  // Stock
        { wch: 15 },  // Box Price
        { wch: 15 },  // Piece Price
        { wch: 15 },  // Kg Price
        { wch: 18 },  // Total Value
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'ڕاپۆرتی نرخەکان');

      // Generate filename with date
      const filename = `stock-value-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, filename);
      toast.success('فایلی Excel دروستکرا');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('هەڵە لە دروستکردنی Excel');
    }
  };

  const currentDate = format(new Date(), 'yyyy/MM/dd');

  // Calculate totals based on filtered items
  const totals = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const boxValue = (item.box_price || 0) * item.current_quantity;
      const pieceValue = (item.piece_price || 0) * item.current_quantity;
      const kgValue = (item.price_per_kg || 0) * item.current_quantity;
      
      // Estimate total value based on available prices
      let itemTotalValue = 0;
      if (item.box_price && item.box_price > 0) {
        itemTotalValue = boxValue;
      } else if (item.piece_price && item.piece_price > 0) {
        itemTotalValue = pieceValue;
      } else if (item.price_per_kg && item.price_per_kg > 0) {
        itemTotalValue = kgValue;
      }

      return {
        totalItems: acc.totalItems + 1,
        totalQuantity: acc.totalQuantity + item.current_quantity,
        totalValue: acc.totalValue + itemTotalValue,
      };
    }, { totalItems: 0, totalQuantity: 0, totalValue: 0 });
  }, [filteredItems]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US') + ' د.ع';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 print:max-w-none print:h-auto print:overflow-visible">
        {/* Print Styles */}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body * {
              visibility: hidden;
            }
            .stock-report-container,
            .stock-report-container * {
              visibility: visible;
            }
            .stock-report-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
            .stock-report-table {
              page-break-inside: auto;
            }
            .stock-report-table tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        `}</style>

        {/* Action Buttons */}
        <div className="sticky top-0 z-10 flex flex-col gap-3 p-4 bg-background border-b no-print">
          <div className="flex items-center justify-between gap-2">
            <DialogHeader className="flex-1">
              <DialogTitle className="text-lg font-bold">ڕاپۆرتی نرخ و بەهای ستۆک</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <Button onClick={handleExportExcel} variant="outline" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                پرێنت
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">فلتەر:</span>
            </div>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="هەموو براندەکان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">هەموو براندەکان</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="هەموو کەتەگۆریەکان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">هەموو کەتەگۆریەکان</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(selectedBrand !== "all" || selectedCategory !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedBrand("all");
                  setSelectedCategory("all");
                }}
                className="text-muted-foreground"
              >
                پاککردنەوەی فلتەر
              </Button>
            )}
          </div>
        </div>

        {/* Report Content */}
        <div className="stock-report-container p-6 bg-white text-black" dir="rtl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2" style={{ borderColor: themeColor }}>
            <div className="flex-1">
              <h1 className="text-2xl font-bold" style={{ color: themeColor }}>
                ڕاپۆرتی نرخ و بەهای ستۆک
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                بەروار: {currentDate}
              </p>
            </div>
            {logoUrl && (
              <div className="w-20 h-20 flex items-center justify-center">
                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: `${themeColor}15`, border: `1px solid ${themeColor}30` }}>
              <Package className="h-8 w-8 mx-auto mb-2" style={{ color: themeColor }} />
              <p className="text-sm text-gray-600">کۆی جۆرەکان</p>
              <p className="text-2xl font-bold" style={{ color: themeColor }}>{totals.totalItems}</p>
            </div>
            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: `${themeColor}15`, border: `1px solid ${themeColor}30` }}>
              <Boxes className="h-8 w-8 mx-auto mb-2" style={{ color: themeColor }} />
              <p className="text-sm text-gray-600">کۆی بڕ</p>
              <p className="text-2xl font-bold" style={{ color: themeColor }}>{totals.totalQuantity.toLocaleString()}</p>
            </div>
            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: `${themeColor}15`, border: `1px solid ${themeColor}30` }}>
              <DollarSign className="h-8 w-8 mx-auto mb-2" style={{ color: themeColor }} />
              <p className="text-sm text-gray-600">کۆی بەها</p>
              <p className="text-xl font-bold" style={{ color: themeColor }}>{formatCurrency(totals.totalValue)}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="stock-report-table w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: themeColor }}>
                <th className="text-white p-2 text-center border border-gray-300 w-10">#</th>
                <th className="text-white p-2 text-center border border-gray-300">ئایدی</th>
                <th className="text-white p-2 text-right border border-gray-300">ناوی بەرهەم</th>
                <th className="text-white p-2 text-center border border-gray-300">براند</th>
                <th className="text-white p-2 text-center border border-gray-300">کەتەگۆری</th>
                <th className="text-white p-2 text-center border border-gray-300 w-20">ستۆک</th>
                <th className="text-white p-2 text-center border border-gray-300">نرخی بۆکس</th>
                <th className="text-white p-2 text-center border border-gray-300">نرخی دانە</th>
                <th className="text-white p-2 text-center border border-gray-300">نرخی کیلۆ</th>
                <th className="text-white p-2 text-center border border-gray-300">کۆی بەها</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => {
                // Calculate item total value
                let itemTotalValue = 0;
                if (item.box_price && item.box_price > 0) {
                  itemTotalValue = (item.box_price || 0) * item.current_quantity;
                } else if (item.piece_price && item.piece_price > 0) {
                  itemTotalValue = (item.piece_price || 0) * item.current_quantity;
                } else if (item.price_per_kg && item.price_per_kg > 0) {
                  itemTotalValue = (item.price_per_kg || 0) * item.current_quantity;
                }

                return (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-2 text-center border border-gray-300 font-medium">{index + 1}</td>
                    <td className="p-2 text-center border border-gray-300 text-[10px] font-mono text-gray-500">{item.id.slice(0, 8)}...</td>
                    <td className="p-2 text-right border border-gray-300">
                      <div className="flex items-center gap-2">
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.barcode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center border border-gray-300">{item.brands?.name || '-'}</td>
                    <td className="p-2 text-center border border-gray-300">{item.categories?.name || '-'}</td>
                    <td className="p-2 text-center border border-gray-300 font-semibold" style={{ color: themeColor }}>
                      {item.current_quantity}
                    </td>
                    <td className="p-2 text-center border border-gray-300">
                      {item.box_price && item.box_price > 0 ? formatCurrency(item.box_price) : '-'}
                    </td>
                    <td className="p-2 text-center border border-gray-300">
                      {item.piece_price && item.piece_price > 0 ? formatCurrency(item.piece_price) : '-'}
                    </td>
                    <td className="p-2 text-center border border-gray-300">
                      {item.price_per_kg && item.price_per_kg > 0 ? formatCurrency(item.price_per_kg) : '-'}
                    </td>
                    <td className="p-2 text-center border border-gray-300 font-semibold">
                      {itemTotalValue > 0 ? formatCurrency(itemTotalValue) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: `${themeColor}20` }}>
                <td colSpan={5} className="p-3 text-right border border-gray-300 font-bold" style={{ color: themeColor }}>
                  کۆی گشتی
                </td>
                <td className="p-3 text-center border border-gray-300 font-bold" style={{ color: themeColor }}>
                  {totals.totalQuantity.toLocaleString()}
                </td>
                <td colSpan={3} className="p-3 border border-gray-300"></td>
                <td className="p-3 text-center border border-gray-300 font-bold text-lg" style={{ color: themeColor }}>
                  {formatCurrency(totals.totalValue)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t-2 flex items-center justify-between text-sm text-gray-500" style={{ borderColor: themeColor }}>
            <p>ئەم ڕاپۆرتە لە {currentDate} دروستکراوە</p>
            <p>کۆی مادە: {totals.totalItems} | کۆی بڕ: {totals.totalQuantity.toLocaleString()} | کۆی بەها: {formatCurrency(totals.totalValue)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}