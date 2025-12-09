import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Upload,
  Download,
  FileUp,
  FileDown,
  Loader2,
  FileWarning,
  Store,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useItems, useBrands, useCategories } from "@/hooks/useItems";
import { useMarkets } from "@/hooks/useMarkets";
import { format } from "date-fns";
import {
  ImportResultDialog,
  ImportedItem,
} from "@/components/import/ImportResultDialog";
import {
  MarketImportResultDialog,
  ImportedMarket,
} from "@/components/import/MarketImportResultDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ImportExport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importedItems, setImportedItems] = useState<ImportedItem[]>([]);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [importedMarkets, setImportedMarkets] = useState<ImportedMarket[]>([]);
  const [showMarketResultDialog, setShowMarketResultDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const marketFileInputRef = useRef<HTMLInputElement>(null);

  const { data: items = [], refetch } = useItems();
  const { data: brands = [] } = useBrands();
  const { data: categories = [] } = useCategories();
  const { data: markets = [], refetch: refetchMarkets } = useMarkets();

  // Column name mappings for items (Kurdish -> English)
  const columnMappings: Record<string, keyof ImportedItem> = {
    "ناوی مادە": "name",
    "ناو": "name",
    "name": "name",
    "باڕکۆد": "barcode",
    "barcode": "barcode",
    "براند": "brand",
    "brand": "brand",
    "کەتەگۆری": "category",
    "category": "category",
    "ستۆک": "quantity",
    "بڕ": "quantity",
    "quantity": "quantity",
    "نرخی بۆکس (د.ع)": "box_price",
    "نرخی بۆکس": "box_price",
    "box_price": "box_price",
    "نرخی دانە (د.ع)": "piece_price",
    "نرخی دانە": "piece_price",
    "piece_price": "piece_price",
    "نرخی کیلۆ (د.ع)": "price_per_kg",
    "نرخی کیلۆ": "price_per_kg",
    "price_per_kg": "price_per_kg",
    "یەکە": "unit",
    "unit": "unit",
    "کەمترین ستۆک": "min_stock",
    "min_stock": "min_stock",
    "بەرواری بەرهەمهێنان": "mfg_date",
    "mfg_date": "mfg_date",
    "بەرواری بەسەرچوون": "exp_date",
    "exp_date": "exp_date",
    "بەرواری بیرخستنەوە": "remind_date",
    "remind_date": "remind_date",
  };

  // Column name mappings for markets
  const marketColumnMappings: Record<string, keyof ImportedMarket> = {
    "key": "code",
    "code": "code",
    "کۆد": "code",
    "Code": "code",
    "name": "name",
    "Name": "name",
    "ناو": "name",
    "traderCategory": "trader_category",
    "TraderCategory": "trader_category",
    "trader_category": "trader_category",
    "جۆر": "trader_category",
    "جۆری بازرگان": "trader_category",
    "phone": "phone",
    "Phone": "phone",
    "مۆبایل": "phone",
    "تەلەفۆن": "phone",
    "ژمارە": "phone",
    "address": "address",
    "Address": "address",
    "ناونیشان": "address",
    "city": "city",
    "City": "city",
    "شار": "city",
    "zone": "zone",
    "Zone": "zone",
    "ناوچە": "zone",
  };

  const parseExcelDate = (value: any): string | null => {
    if (!value) return null;

    // If it's already a string in date format
    if (typeof value === "string") {
      // Try parsing common formats
      const dateRegex = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/;
      if (dateRegex.test(value)) {
        return value.replace(/\//g, "-");
      }
      return null;
    }

    // If it's an Excel date number
    if (typeof value === "number") {
      const date = new Date((value - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return format(date, "yyyy-MM-dd");
      }
    }

    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("تەنها فایلی Excel پەسەند دەکرێت (.xlsx یان .xls)");
      return;
    }

    setIsImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("فایلەکە بەتاڵە یان فۆرماتی نادروستە");
        setIsImporting(false);
        return;
      }

      // Parse each row
      const parsedItems: ImportedItem[] = jsonData.map((row: any, index) => {
        const item: ImportedItem = {
          id: `import-${index}-${Date.now()}`,
          name: "",
          barcode: "",
          brand: "",
          category: "",
          quantity: 0,
          box_price: 0,
          piece_price: 0,
          price_per_kg: 0,
          unit: "دانە",
          min_stock: 10,
          mfg_date: null,
          exp_date: null,
          remind_date: null,
          hasError: false,
          isComplete: false,
        };

        // Map columns
        Object.keys(row).forEach((key) => {
          const mappedKey = columnMappings[key.trim()];
          if (mappedKey) {
            const value = row[key];

            switch (mappedKey) {
              case "name":
              case "barcode":
              case "brand":
              case "category":
              case "unit":
                item[mappedKey] = value?.toString().trim() || "";
                break;
              case "quantity":
              case "box_price":
              case "piece_price":
              case "price_per_kg":
              case "min_stock":
                item[mappedKey] = parseFloat(value) || 0;
                break;
              case "mfg_date":
              case "exp_date":
              case "remind_date":
                item[mappedKey] = parseExcelDate(value);
                break;
            }
          }
        });

        // Skip # column and total row
        if (item.name === "کۆی گشتی" || item.name === "#") {
          return null;
        }

        // Validate required fields
        const isComplete =
          item.name?.trim() !== "" &&
          item.barcode?.trim() !== "" &&
          item.quantity >= 0;

        item.isComplete = isComplete;
        item.hasError = !isComplete;
        if (!isComplete) {
          item.errorMessage = "ناو و باڕکۆد پێویستن";
        }

        return item;
      }).filter((item): item is ImportedItem => item !== null);

      if (parsedItems.length === 0) {
        toast.error("هیچ مادەیەکی دروست نەدۆزرایەوە لە فایلەکەدا");
        setIsImporting(false);
        return;
      }

      setImportedItems(parsedItems);
      setShowResultDialog(true);
      toast.success(`${parsedItems.length} مادە خوێندرایەوە لە فایلەکە`);
    } catch (error) {
      console.error("Excel parse error:", error);
      toast.error("هەڵە لە خوێندنەوەی فایلەکە");
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleMarketFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("تەنها فایلی Excel پەسەند دەکرێت (.xlsx یان .xls)");
      return;
    }

    setIsImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("فایلەکە بەتاڵە یان فۆرماتی نادروستە");
        setIsImporting(false);
        return;
      }

      // Parse each row for markets
      const parsedMarkets: ImportedMarket[] = jsonData.map((row: any, index) => {
        const market: ImportedMarket = {
          id: `import-market-${index}-${Date.now()}`,
          code: "",
          name: "",
          trader_category: "",
          phone: "",
          address: "",
          city: "",
          zone: "",
          hasError: false,
          isComplete: false,
        };

        // Map columns
        Object.keys(row).forEach((key) => {
          const mappedKey = marketColumnMappings[key.trim()];
          if (mappedKey) {
            const value = row[key];
            (market as any)[mappedKey] = value?.toString().trim() || "";
          }
        });

        // Use key as code if code is not set
        if (!market.code && row.key !== undefined) {
          market.code = row.key.toString();
        }

        // Validate required fields
        const isComplete =
          market.name?.trim() !== "" && market.code?.trim() !== "";

        market.isComplete = isComplete;
        market.hasError = !isComplete;
        if (!isComplete) {
          market.errorMessage = "ناو و کۆد پێویستن";
        }

        return market;
      }).filter((market): market is ImportedMarket => market !== null);

      if (parsedMarkets.length === 0) {
        toast.error("هیچ ماڕکێتێکی دروست نەدۆزرایەوە لە فایلەکەدا");
        setIsImporting(false);
        return;
      }

      setImportedMarkets(parsedMarkets);
      setShowMarketResultDialog(true);
      toast.success(`${parsedMarkets.length} ماڕکێت خوێندرایەوە لە فایلەکە`);
    } catch (error) {
      console.error("Excel parse error:", error);
      toast.error("هەڵە لە خوێندنەوەی فایلەکە");
    } finally {
      setIsImporting(false);
      // Reset file input
      if (marketFileInputRef.current) {
        marketFileInputRef.current.value = "";
      }
    }
  };

  const handleExportAll = () => {
    try {
      const excelData = items.map((item, index) => {
        let itemTotalValue = 0;
        if (item.box_price && item.box_price > 0) {
          itemTotalValue = (item.box_price || 0) * item.current_quantity;
        } else if (item.piece_price && item.piece_price > 0) {
          itemTotalValue = (item.piece_price || 0) * item.current_quantity;
        } else if (item.price_per_kg && item.price_per_kg > 0) {
          itemTotalValue = (item.price_per_kg || 0) * item.current_quantity;
        }

        return {
          "#": index + 1,
          "ئایدی": item.id,
          "ناوی بەرهەم": item.name,
          "باڕکۆد": item.barcode,
          "براند": item.brands?.name || "",
          "کەتەگۆری": item.categories?.name || "",
          "ستۆک": item.current_quantity,
          "یەکە": item.unit,
          "کەمترین ستۆک": item.min_stock,
          "نرخی بۆکس (د.ع)": item.box_price || 0,
          "نرخی دانە (د.ع)": item.piece_price || 0,
          "نرخی کیلۆ (د.ع)": item.price_per_kg || 0,
          "کۆی بەها (د.ع)": itemTotalValue,
          "بەرواری بەرهەمهێنان": item.mfg_date || "",
          "بەرواری بەسەرچوون": item.exp_date || "",
          "بەرواری بیرخستنەوە": item.remind_date || "",
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      ws["!cols"] = [
        { wch: 5 },
        { wch: 38 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "مادەکان");
      const filename = `inventory-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("فایلی Excel دروستکرا");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("هەڵە لە دروستکردنی فایل");
    }
  };

  const handleExportLowStock = () => {
    const lowStockItems = items.filter(
      (item) => item.current_quantity < item.min_stock
    );

    if (lowStockItems.length === 0) {
      toast.info("هیچ مادەیەکی کەم ستۆک نییە");
      return;
    }

    try {
      const excelData = lowStockItems.map((item, index) => ({
        "#": index + 1,
        "ئایدی": item.id,
        "ناوی بەرهەم": item.name,
        "باڕکۆد": item.barcode,
        "براند": item.brands?.name || "",
        "کەتەگۆری": item.categories?.name || "",
        "ستۆکی ئێستا": item.current_quantity,
        "کەمترین ستۆک": item.min_stock,
        "کەمبوون": item.min_stock - item.current_quantity,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, "کەم ستۆک");
      const filename = `low-stock-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`${lowStockItems.length} مادەی کەم ستۆک ئێکسپۆرت کرا`);
    } catch (error) {
      toast.error("هەڵە لە دروستکردنی فایل");
    }
  };

  const handleExportExpired = () => {
    const today = new Date().toISOString().split("T")[0];
    const expiredItems = items.filter(
      (item) => item.exp_date && item.exp_date < today
    );

    if (expiredItems.length === 0) {
      toast.info("هیچ مادەیەکی بەسەرچوو نییە");
      return;
    }

    try {
      const excelData = expiredItems.map((item, index) => ({
        "#": index + 1,
        "ئایدی": item.id,
        "ناوی بەرهەم": item.name,
        "باڕکۆد": item.barcode,
        "براند": item.brands?.name || "",
        "کەتەگۆری": item.categories?.name || "",
        "ستۆک": item.current_quantity,
        "بەرواری بەسەرچوون": item.exp_date || "",
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, "بەسەرچوو");
      const filename = `expired-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`${expiredItems.length} مادەی بەسەرچوو ئێکسپۆرت کرا`);
    } catch (error) {
      toast.error("هەڵە لە دروستکردنی فایل");
    }
  };

  const handleExportMarkets = () => {
    if (markets.length === 0) {
      toast.info("هیچ ماڕکێتێک نییە");
      return;
    }

    try {
      const excelData = markets.map((market, index) => ({
        "#": index + 1,
        "کۆد": market.code,
        "ناو": market.name,
        "جۆر": market.trader_category || "",
        "مۆبایل": market.phone || "",
        "ناونیشان": market.address || "",
        "شار": market.city || "",
        "ناوچە": market.zone || "",
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      ws["!cols"] = [
        { wch: 5 },
        { wch: 10 },
        { wch: 35 },
        { wch: 15 },
        { wch: 15 },
        { wch: 40 },
        { wch: 15 },
        { wch: 15 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "ماڕکێتەکان");
      const filename = `markets-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`${markets.length} ماڕکێت ئێکسپۆرت کرا`);
    } catch (error) {
      toast.error("هەڵە لە دروستکردنی فایل");
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "ناوی بەرهەم": "نموونە - پێپسی ١ لیتر",
        "باڕکۆد": "123456789",
        "براند": "پێپسی",
        "کەتەگۆری": "خواردنەوە",
        "ستۆک": 100,
        "یەکە": "دانە",
        "کەمترین ستۆک": 20,
        "نرخی بۆکس (د.ع)": 15000,
        "نرخی دانە (د.ع)": 1500,
        "نرخی کیلۆ (د.ع)": 0,
        "بەرواری بەرهەمهێنان": "2024-01-01",
        "بەرواری بەسەرچوون": "2025-06-01",
        "بەرواری بیرخستنەوە": "2025-05-01",
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    ws["!cols"] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "نموونە");
    XLSX.writeFile(wb, "import-template.xlsx");
    toast.success("فایلی نموونە دابەزێندرا");
  };

  const handleDownloadMarketTemplate = () => {
    const templateData = [
      {
        "کۆد": "1",
        "ناو": "ماركیت نموونە",
        "جۆر": "ماركیت",
        "مۆبایل": "7701234567",
        "ناونیشان": "سلێمانی / بازار",
        "شار": "سلێمانی",
        "ناوچە": "بازار",
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    ws["!cols"] = [
      { wch: 10 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "نموونە");
    XLSX.writeFile(wb, "market-import-template.xlsx");
    toast.success("فایلی نموونە دابەزێندرا");
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                ئیمپۆرت / ئێکسپۆرت
              </h1>
              <p className="mt-1 text-muted-foreground">
                هێنان و ناردنی داتا بە فۆرماتی Excel
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="items" className="gap-2">
              <Package className="h-4 w-4" />
              مادەکان
            </TabsTrigger>
            <TabsTrigger value="markets" className="gap-2">
              <Store className="h-4 w-4" />
              ماڕکێتەکان
            </TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Import Section */}
              <div className="rounded-xl border border-border bg-card p-8 shadow-card animate-slide-up">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-2xl bg-success/10 p-4 mb-6">
                    <FileUp className="h-12 w-12 text-success" />
                  </div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-2">
                    هێنانی داتا (Import)
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    فایلی Excel هەڵبژێرە بۆ هێنانی مادەکان بۆ ناو سیستەم
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="excel-input"
                  />

                  <label
                    htmlFor="excel-input"
                    className="w-full rounded-xl border-2 border-dashed border-border p-8 mb-6 hover:border-primary/50 transition-colors cursor-pointer block"
                  >
                    <div className="flex flex-col items-center">
                      {isImporting ? (
                        <Loader2 className="h-10 w-10 text-primary mb-3 animate-spin" />
                      ) : (
                        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                      )}
                      <p className="text-sm text-muted-foreground">
                        {isImporting ? "چاوەڕوان بە..." : "فایل بکێشە بۆ ئێرە یان کلیک بکە"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        تەنها .xlsx و .xls پەسەند دەکرێت
                      </p>
                    </div>
                  </label>

                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    className="gap-2 w-full"
                  >
                    <FileWarning className="h-5 w-5" />
                    دابەزاندنی فایلی نموونە
                  </Button>
                </div>
              </div>

              {/* Export Section */}
              <div
                className="rounded-xl border border-border bg-card p-8 shadow-card animate-slide-up"
                style={{ animationDelay: "100ms" }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-2xl bg-primary/10 p-4 mb-6">
                    <FileDown className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-2">
                    ناردنی داتا (Export)
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    هەموو داتای کۆگا دابەزێنە وەک فایلی Excel بۆ بەکاپ یان کاری تر
                  </p>

                  <div className="w-full space-y-3 mb-6">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                      <span className="text-sm">هەموو مادەکان ({items.length})</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={handleExportAll}
                      >
                        <Download className="h-4 w-4" />
                        دابەزاندن
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                      <span className="text-sm">
                        مادەی کەم ستۆک (
                        {
                          items.filter((i) => i.current_quantity < i.min_stock)
                            .length
                        }
                        )
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={handleExportLowStock}
                      >
                        <Download className="h-4 w-4" />
                        دابەزاندن
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                      <span className="text-sm">
                        مادەی بەسەرچوو (
                        {
                          items.filter(
                            (i) =>
                              i.exp_date &&
                              i.exp_date < new Date().toISOString().split("T")[0]
                          ).length
                        }
                        )
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={handleExportExpired}
                      >
                        <Download className="h-4 w-4" />
                        دابەزاندن
                      </Button>
                    </div>
                  </div>

                  <Button onClick={handleExportAll} className="gap-2 w-full">
                    <Download className="h-5 w-5" />
                    ناردنی هەموو داتا
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Markets Tab */}
          <TabsContent value="markets">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Import Section */}
              <div className="rounded-xl border border-border bg-card p-8 shadow-card animate-slide-up">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-2xl bg-success/10 p-4 mb-6">
                    <Store className="h-12 w-12 text-success" />
                  </div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-2">
                    هێنانی ماڕکێتەکان (Import)
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    فایلی Excel هەڵبژێرە بۆ هێنانی زانیاری ماڕکێتەکان
                  </p>

                  <input
                    ref={marketFileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleMarketFileSelect}
                    className="hidden"
                    id="market-excel-input"
                  />

                  <label
                    htmlFor="market-excel-input"
                    className="w-full rounded-xl border-2 border-dashed border-border p-8 mb-6 hover:border-primary/50 transition-colors cursor-pointer block"
                  >
                    <div className="flex flex-col items-center">
                      {isImporting ? (
                        <Loader2 className="h-10 w-10 text-primary mb-3 animate-spin" />
                      ) : (
                        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                      )}
                      <p className="text-sm text-muted-foreground">
                        {isImporting ? "چاوەڕوان بە..." : "فایل بکێشە بۆ ئێرە یان کلیک بکە"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        تەنها .xlsx و .xls پەسەند دەکرێت
                      </p>
                    </div>
                  </label>

                  <Button
                    onClick={handleDownloadMarketTemplate}
                    variant="outline"
                    className="gap-2 w-full"
                  >
                    <FileWarning className="h-5 w-5" />
                    دابەزاندنی فایلی نموونە
                  </Button>
                </div>
              </div>

              {/* Export Section */}
              <div
                className="rounded-xl border border-border bg-card p-8 shadow-card animate-slide-up"
                style={{ animationDelay: "100ms" }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-2xl bg-primary/10 p-4 mb-6">
                    <FileDown className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-2">
                    ناردنی ماڕکێتەکان (Export)
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    هەموو زانیاری ماڕکێتەکان دابەزێنە وەک فایلی Excel
                  </p>

                  <div className="w-full space-y-3 mb-6">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                      <span className="text-sm">هەموو ماڕکێتەکان ({markets.length})</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={handleExportMarkets}
                      >
                        <Download className="h-4 w-4" />
                        دابەزاندن
                      </Button>
                    </div>
                  </div>

                  <Button onClick={handleExportMarkets} className="gap-2 w-full">
                    <Download className="h-5 w-5" />
                    ناردنی هەموو ماڕکێتەکان
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Import Result Dialog for Items */}
      <ImportResultDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        importedItems={importedItems}
        onImportComplete={() => refetch()}
      />

      {/* Import Result Dialog for Markets */}
      <MarketImportResultDialog
        open={showMarketResultDialog}
        onOpenChange={setShowMarketResultDialog}
        importedMarkets={importedMarkets}
        onImportComplete={() => refetchMarkets()}
      />
    </Layout>
  );
}
