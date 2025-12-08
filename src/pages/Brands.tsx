import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBrands, useAddBrand, useDeleteBrand } from "@/hooks/useItems";
import { Building2, Plus, Trash2, Loader2 } from "lucide-react";

export default function Brands() {
  const [newBrand, setNewBrand] = useState('');
  const { data: brands, isLoading } = useBrands();
  const addBrand = useAddBrand();
  const deleteBrand = useDeleteBrand();

  const handleAdd = () => {
    if (!newBrand.trim()) return;
    addBrand.mutate(newBrand, {
      onSuccess: () => setNewBrand(''),
    });
  };

  const handleDelete = (id: string) => {
    deleteBrand.mutate(id);
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
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} className="gap-2" disabled={addBrand.isPending}>
              {addBrand.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              زیادکردن
            </Button>
          </div>
        </div>

        {/* Brands Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands?.map((brand, index) => (
              <div
                key={brand.id}
                className="rounded-xl border border-border bg-card p-6 shadow-card card-hover animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-accent/10 p-2">
                      <Building2 className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-semibold text-card-foreground">{brand.name}</h3>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(brand.id)}
                    disabled={deleteBrand.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
