import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categories } from "@/lib/mockData";
import { Tags, Plus, Edit, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

export default function Categories() {
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = () => {
    if (!newCategory.trim()) {
      toast.error('تکایە ناوی هاوپۆل بنووسە');
      return;
    }
    toast.success(`هاوپۆلی "${newCategory}" زیادکرا`);
    setNewCategory('');
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
              <Tags className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">هاوپۆلەکان</h1>
              <p className="mt-1 text-muted-foreground">
                بەڕێوەبردنی هاوپۆلەکانی مادە
              </p>
            </div>
          </div>
        </div>

        {/* Add New Category */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">
            زیادکردنی هاوپۆلی نوێ
          </h2>
          <div className="flex gap-3">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="ناوی هاوپۆل..."
              className="flex-1"
            />
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              زیادکردن
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="rounded-xl border border-border bg-card p-6 shadow-card card-hover animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Tags className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{category.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <Package className="h-3 w-3" />
                      <span>{category.itemCount} مادە</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-accent"
                    onClick={() => handleEdit(category.name)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(category.name)}
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
