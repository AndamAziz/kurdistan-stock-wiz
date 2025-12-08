import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  itemName?: string;
}

export function ImagePreviewDialog({ 
  open, 
  onOpenChange, 
  imageUrl,
  itemName = "وێنەی مادە"
}: ImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[80vw] lg:max-w-[60vw] p-0 overflow-hidden bg-background/95 backdrop-blur-sm border-border">
        <VisuallyHidden>
          <DialogTitle>{itemName}</DialogTitle>
        </VisuallyHidden>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        
        {/* Image Container */}
        <div className="relative flex items-center justify-center min-h-[50vh] max-h-[80vh] p-4">
          <img 
            src={imageUrl} 
            alt={itemName}
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
          />
        </div>
        
        {/* Item name footer */}
        <div className="px-4 py-3 bg-muted/50 border-t border-border">
          <p className="text-center text-sm font-medium text-foreground">
            {itemName}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}