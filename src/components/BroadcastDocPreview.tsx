import { FileText, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { BroadcastDoc } from "@/data/broadcasts";

// Opens a broadcast document for review. Demo only: there is no real file behind it yet,
// so it shows the file's name and type in place of the content.
const BroadcastDocPreview = ({ doc, onClose }: { doc: BroadcastDoc | null; onClose: () => void }) => {
  const Icon = doc?.kind === "image" ? ImageIcon : FileText;
  return (
    <Dialog open={!!doc} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl max-w-[340px] p-4">
        <DialogTitle className="text-sm font-semibold text-foreground truncate pe-8" dir="ltr">{doc?.name}</DialogTitle>
        <div className="aspect-[3/4] rounded-xl bg-muted/50 border border-border/60 flex items-center justify-center">
          <Icon className="w-12 h-12 text-muted-foreground" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BroadcastDocPreview;
