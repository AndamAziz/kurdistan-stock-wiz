import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories, useAddCategory, useDeleteCategory } from "@/hooks/useItems";
import { Tags, Plus, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Categories() {
  const [newCategory, setNewCategory] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string } | null>(null);
  const { data: categories, isLoading } = useCategories();
  const addCategory = useAddCategory();
  const deleteCategory = useDeleteCategory();

  const handleAdd = () => {
    if (!newCategory.trim()) return;
    addCategory.mutate(newCategory, {
      onSuccess: () => setNewCategory(''),
    });
  };

  const handleConfirmDelete = () => {
    if (deletingCategory) {
      deleteCategory.mutate(deletingCategory.id);
    }
    setDeletingCategory(null);
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
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} className="gap-2" disabled={addCategory.isPending}>
              {addCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              زیادکردن
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories?.map((category, index) => (
              <div
                key={category.id}
                className="rounded-xl border border-border bg-card p-6 shadow-card card-hover animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Tags className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-card-foreground">{category.name}</h3>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeletingCategory({ id: category.id, name: category.name })}
                    disabled={deleteCategory.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>دڵنیای لە سڕینەوە؟</AlertDialogTitle>
            <AlertDialogDescription>
              ئایا دڵنیای دەتەوێت هاوپۆلی "{deletingCategory?.name}" بسڕیتەوە؟ ئەم کردارە ناگەڕێتەوە.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              سڕینەوە
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
