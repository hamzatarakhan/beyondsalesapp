import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { FileText, Image as ImageIcon, Eye, Plus, Trash2, X } from "lucide-react";
import { DEMO_TICKETS, TicketComment, TicketDoc } from "@/data/tickets";
import { STATUS_LABEL, STATUS_STYLE } from "./Tickets";

const DocRow = ({ doc, onDelete, compact }: { doc: TicketDoc; onDelete?: () => void; compact?: boolean }) => (
  <div className={cn("flex items-center gap-3", compact ? "px-3 py-2" : "px-4 py-3")}>
    {doc.kind === "image" ? <ImageIcon className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
    <span className="flex-1 text-sm text-muted-foreground">{doc.name}</span>
    <button className={cn("rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center", compact ? "w-7 h-7" : "w-8 h-8")} aria-label="Preview document">
      <Eye className="w-4 h-4 text-sky-500" />
    </button>
    {onDelete && (
      <button onClick={onDelete} className={cn("rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center", compact ? "w-7 h-7" : "w-8 h-8")} aria-label="Delete document">
        <Trash2 className="w-4 h-4 text-primary" />
      </button>
    )}
  </div>
);

/* hexagon info badge — mirrors CreateVisit.tsx's confirmation-sheet icon */
const HexIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="relative mx-auto flex items-center justify-center w-12 h-12">
    <svg viewBox="0 0 24 24" className="w-12 h-12 text-sky-500" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5z" strokeLinejoin="round" />
    </svg>
    <span className="absolute text-sky-500">{children}</span>
  </span>
);

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const ticket = DEMO_TICKETS.find((t) => t.id === id) ?? DEMO_TICKETS[0];
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [commentDocs, setCommentDocs] = useState<TicketDoc[]>([]);
  const [comments, setComments] = useState<TicketComment[]>(ticket.comments ?? []);
  const [closed, setClosed] = useState(false);

  const addCommentDoc = () => {
    const isImage = commentDocs.length % 2 === 1;
    setCommentDocs((prev) => [
      ...prev,
      { id: `${Date.now()}`, name: isImage ? "Image Title" : "File Title", kind: isImage ? "image" : "file" },
    ]);
  };

  const closeCommentSheet = () => {
    setCommentOpen(false);
    setComment("");
    setCommentDocs([]);
  };

  const submitComment = () => {
    if (!comment.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: `${Date.now()}`, text: comment.trim(), documents: commentDocs, date: new Date().toLocaleDateString() },
    ]);
    closeCommentSheet();
  };

  const status = closed ? "closed" : ticket.status;
  const actionable = status === "pending" || status === "progress";

  const rows = [
    { label: "Ticket ID", value: ticket.id },
    { label: "Ticket Category", value: ticket.category },
    { label: "Sup Category", value: ticket.subCategory },
    { label: "Date", value: ticket.date },
    { label: "Priority Level", value: ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) },
  ];

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title="View Details" showBack />

      <div className="px-4">
        <div className="bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] px-4">
          <div className="flex items-center justify-between py-4 border-b border-border/60">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className={cn("px-3 py-1 rounded-full text-[11px] font-medium", STATUS_STYLE[status])}>
              {STATUS_LABEL[status]}
            </span>
          </div>
          {rows.map((row, i) => (
            <div key={row.label} className={cn("flex items-center justify-between py-4", i < rows.length - 1 && "border-b border-border/60")}>
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-semibold text-foreground">{row.value}</span>
            </div>
          ))}
        </div>

        <h3 className="mt-5 mb-2 text-sm font-semibold text-foreground">Documents</h3>
        <div className="rounded-2xl border border-dashed border-border bg-card divide-y divide-border/60">
          {ticket.documents.map((doc) => <DocRow key={doc.id} doc={doc} />)}
        </div>

        <h3 className="mt-5 mb-2 text-sm font-medium text-foreground">Description</h3>
        <div className="rounded-2xl bg-muted p-4 min-h-[90px] text-sm text-muted-foreground">
          {ticket.description}
        </div>

        {ticket.updates?.map((update, idx) => (
          <div key={idx} className="mt-5">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Update</h3>
            <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-4">
              <p className="text-sm font-semibold text-foreground mb-2">Documents</p>
              <div className="rounded-xl border border-dashed border-border divide-y divide-border/60">
                {update.documents.map((doc) => <DocRow key={doc.id} doc={doc} />)}
              </div>
              <p className="text-sm font-medium text-foreground mt-4 mb-2">Description</p>
              <div className="rounded-xl bg-muted p-4 min-h-[80px] text-sm text-muted-foreground">
                {update.description}
              </div>
            </div>
          </div>
        ))}

        {comments.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Comments</h3>
            <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] divide-y divide-border/60">
              {comments.map((c) => (
                <div key={c.id} className="px-4 py-2.5">
                  <div className="flex items-baseline gap-2">
                    <p className="flex-1 text-sm text-foreground">{c.text}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{c.date}</span>
                  </div>
                  {c.documents.length > 0 && (
                    <div className="mt-1.5 rounded-xl border border-dashed border-border divide-y divide-border/60">
                      {c.documents.map((doc) => <DocRow key={doc.id} doc={doc} compact />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {actionable && (
          <div className="mt-6 space-y-3">
            <button
              onClick={() => setClosed(true)}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold"
            >
              Close Ticket
            </button>
            <button
              onClick={() => setCommentOpen(true)}
              className="w-full h-11 text-primary font-semibold"
            >
              Add Comment
            </button>
          </div>
        )}
      </div>

      <Drawer open={commentOpen} onOpenChange={(o) => !o && closeCommentSheet()}>
        <DrawerContent className="px-4 pb-8">
          <button onClick={closeCommentSheet} aria-label="Close" className="absolute end-4 top-6 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-2 pb-1">
            <DrawerTitle className="text-lg font-semibold">Add New Comment</DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col items-center gap-2 mt-2">
            <HexIcon><span className="text-lg font-bold leading-none">i</span></HexIcon>
            <p className="text-base font-semibold text-sky-500">Add Comment</p>
            <p className="text-sm text-muted-foreground text-center">
              Please add a comment to support your ticket request.
            </p>
          </div>

          <label className="block text-sm font-medium text-foreground mt-5 mb-2">Add Comment Description</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="enter your comment Description"
            className="w-full rounded-2xl bg-card border border-border/60 p-4 text-base outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />

          <p className="text-sm font-semibold text-foreground mt-4 mb-2">Documents</p>
          {commentDocs.length === 0 ? (
            <button onClick={addCommentDoc} className="w-full rounded-2xl border border-dashed border-border bg-card py-6 flex flex-col items-center gap-2">
              <span className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </span>
              <span className="text-sm text-muted-foreground">Upload your files here</span>
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card divide-y divide-border/60">
              {commentDocs.map((doc) => (
                <DocRow key={doc.id} doc={doc} onDelete={() => setCommentDocs((prev) => prev.filter((d) => d.id !== doc.id))} />
              ))}
              <button onClick={addCommentDoc} className="w-full py-3 text-sm font-medium text-primary flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> Add another file
              </button>
            </div>
          )}

          <button
            onClick={submitComment}
            disabled={!comment.trim()}
            className="mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-40"
          >
            Submit
          </button>
          <button onClick={closeCommentSheet} className="mt-3 w-full h-11 text-primary font-semibold">
            Cancel
          </button>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default TicketDetails;
