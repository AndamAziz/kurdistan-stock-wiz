import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Download, FileUp, FileDown } from "lucide-react";
import { toast } from "sonner";

export default function ImportExport() {
  const handleImport = () => {
    toast.info('هێنانی فایل لە Excel - ئەم تایبەتمەندییە بەزوانە دێت');
  };

  const handleExport = () => {
    toast.success('ئێکسپۆرتکردن بۆ Excel - ئەم تایبەتمەندییە بەزوانە دێت');
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
              <h1 className="text-3xl font-bold text-foreground">ئیمپۆرت / ئێکسپۆرت</h1>
              <p className="mt-1 text-muted-foreground">
                هێنان و ناردنی داتا بە فۆرماتی Excel
              </p>
            </div>
          </div>
        </div>

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
              
              <div className="w-full rounded-xl border-2 border-dashed border-border p-8 mb-6 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    فایل بکێشە بۆ ئێرە یان کلیک بکە
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    تەنها .xlsx و .xls پەسەند دەکرێت
                  </p>
                </div>
              </div>

              <Button onClick={handleImport} className="gap-2 w-full">
                <Upload className="h-5 w-5" />
                هێنانی فایل
              </Button>
            </div>
          </div>

          {/* Export Section */}
          <div className="rounded-xl border border-border bg-card p-8 shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
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
                  <span className="text-sm">هەموو مادەکان</span>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    دابەزاندن
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <span className="text-sm">مادەی کەم ستۆک</span>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    دابەزاندن
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <span className="text-sm">مادەی بەسەرچوو</span>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    دابەزاندن
                  </Button>
                </div>
              </div>

              <Button onClick={handleExport} className="gap-2 w-full">
                <Download className="h-5 w-5" />
                ناردنی هەموو داتا
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
