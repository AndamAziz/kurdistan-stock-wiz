import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { categories, brands } from "@/lib/mockData";

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedBrand: string;
  onBrandChange: (value: string) => void;
  stockFilter: string;
  onStockFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export function SearchFilter({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedBrand,
  onBrandChange,
  stockFilter,
  onStockFilterChange,
  onClearFilters,
}: SearchFilterProps) {
  const hasFilters = searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all' || stockFilter !== 'all';

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card animate-slide-up">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="گەڕان بە ناو یان باڕکۆد..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="هاوپۆل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">هەموو هاوپۆلەکان</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Brand Filter */}
        <Select value={selectedBrand} onValueChange={onBrandChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="براند" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">هەموو براندەکان</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stock Filter */}
        <Select value={stockFilter} onValueChange={onStockFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="دۆخی ستۆک" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">هەموو</SelectItem>
            <SelectItem value="low">کەم ستۆک</SelectItem>
            <SelectItem value="out">نەماوە</SelectItem>
            <SelectItem value="expired">بەسەرچوو</SelectItem>
            <SelectItem value="soon-expire">نزیک بەسەرچوون</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4 ml-1" />
            پاککردنەوە
          </Button>
        )}
      </div>
    </div>
  );
}
