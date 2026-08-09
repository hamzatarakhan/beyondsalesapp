import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus, FileText, Image as ImageIcon, Eye, Trash2, CheckCircle2 } from "lucide-react";
import { TICKET_CATEGORIES, TICKET_SUB_CATEGORIES, TicketDoc, TicketPriority } from "@/data/tickets";

const PRIORITIES: TicketPriority[] = ["high", "medium", "low"];

const NewTicket = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("high");
  const [documents, setDocuments] = useState<TicketDoc[]>([]);
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);

  const addDocument = () => {
    const isImage = documents.length % 2 === 1;
    setDocuments((prev) => [
      ...prev,
      { id: `${Date.now()}`, name: isImage ? "Image Title" : "File Title", kind: isImage ? "image" : "file" },
    ]);
  };

  const canSubmit = category && subCategory && description.trim();

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="New Tickets" showBack />

      <div className="px-4 space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Ticket Category</label>
          <Select value={category} onValueChange={(v) => { setCategory(v); setSubCategory(""); }}>
            <SelectTrigger className="h-12 rounded-xl bg-card border-border/60 text-base">
              <SelectValue placeholder="Select the category" />
            </SelectTrigger>
            <SelectContent>
              {TICKET_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Sup Category</label>
          <Select value={subCategory} onValueChange={setSubCategory} disabled={!category}>
            <SelectTrigger className="h-12 rounded-xl bg-card border-border/60 text-base">
              <SelectValue placeholder="Select sub category" />
            </SelectTrigger>
            <SelectContent>
              {(TICKET_SUB_CATEGORIES[category] ?? []).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Priority Level</label>
          <div className="flex gap-3">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={cn(
                  "px-6 h-10 rounded-full text-sm font-medium border capitalize transition-colors",
                  priority === p
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-primary border-primary"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Documents</label>
          {documents.length === 0 ? (
            <button
              onClick={addDocument}
              className="w-full rounded-2xl border border-dashed border-border bg-card py-8 flex flex-col items-center gap-2"
            >
              <span className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </span>
              <span className="text-sm text-muted-foreground">Upload your files here</span>
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card divide-y divide-border/60">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                  {doc.kind === "image" ? <ImageIcon className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                  <span className="flex-1 text-sm text-muted-foreground">{doc.name}</span>
                  <button className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center" aria-label="Preview document">
                    <Eye className="w-4 h-4 text-sky-500" />
                  </button>
                  <button
                    onClick={() => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
                    className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center"
                    aria-label="Delete document"
                  >
                    <Trash2 className="w-4 h-4 text-primary" />
                  </button>
                </div>
              ))}
              <button onClick={addDocument} className="w-full py-3 text-sm font-medium text-primary flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> Add another file
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description <span className="text-primary">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Placeholder"
            className="w-full rounded-2xl bg-card border border-border/60 p-4 text-base outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur px-4 py-4 border-t border-border/60">
        <button
          disabled={!canSubmit}
          onClick={() => setSuccess(true)}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-40"
        >
          Submit
        </button>
      </div>

      <Dialog open={success} onOpenChange={setSuccess}>
        <DialogContent className="rounded-2xl max-w-[320px] text-center">
          <div className="flex flex-col items-center gap-3 pt-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <h2 className="text-lg font-semibold text-foreground">Ticket Submitted</h2>
            <p className="text-sm text-muted-foreground">Your ticket has been created successfully.</p>
            <button
              onClick={() => navigate("/tickets")}
              className="mt-2 w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold"
            >
              Go to Tickets
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewTicket;
