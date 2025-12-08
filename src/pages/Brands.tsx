import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brands } from "@/lib/mockData";
import { Building2, Plus, Edit, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

export default function Brands() {
  const [newBrand, setNewBrand] = useState('');

  const handleAdd = () => {
    if (!newBrand.trim()) {
      toast.error('تکایە ناوی براند بنووسە');
      return;
    }
    toast.success(`براندی "${newBrand}" زیادکرا`);
    setNewBrand('');
  };

  const handleEdit = (name: string) => {
    toast.info(`دەستکاری ${name}`);
  };

  const handleDelete = (name: string) => {
    toast.error(`سڕینەوەی ${name}`);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">براندەکان</h1>
              <p className="mt-1 text-muted-foreground">
                بەڕێوەبردنی براندەکان
              </p>
            </div>
          </div>
        </div>

        {/* Add New Brand */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">
            زیادکردنی براندی نوێ
          </h2>
          <div className="flex gap-3">
            <Input
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              placeholder="ناوی براند..."
              className="flex-1"
            />
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              زیادکردن
            </Button>
          </div>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand, index) => (
            <div
              key={brand.id}
              className="rounded-xl border border-border bg-card p-6 shadow-card card-hover animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent/10 p-2">
                    <Building2 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{brand.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <Package className="h-3 w-3" />
                      <span>{brand.itemCount} مادە</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-accent"
                    onClick={() => handleEdit(brand.name)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(brand.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
