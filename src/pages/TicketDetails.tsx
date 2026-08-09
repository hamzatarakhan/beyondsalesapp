import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { FileText, Image as ImageIcon, Eye, Plus, AlertCircle } from "lucide-react";
import { DEMO_TICKETS, TicketDoc } from "@/data/tickets";
import { STATUS_LABEL, STATUS_STYLE } from "./Tickets";

const DocRow = ({ doc }: { doc: TicketDoc }) => (
  <div className="flex items-center gap-3 px-4 py-3">
    {doc.kind === "image" ? <ImageIcon className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
    <span className="flex-1 text-sm text-muted-foreground">{doc.name}</span>
    <button className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center" aria-label="Preview document">
      <Eye className="w-4 h-4 text-sky-500" />
    </button>
  </div>
);

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const ticket = DEMO_TICKETS.find((t) => t.id === id) ?? DEMO_TICKETS[0];
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [closed, setClosed] = useState(false);

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

      <Drawer open={commentOpen} onOpenChange={setCommentOpen}>
        <DrawerContent className="px-4 pb-8">
          <div className="pt-2 pb-3 text-center">
            <h2 className="text-lg font-semibold text-foreground">Confirmation Message</h2>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="w-10 h-10 text-sky-500" />
            <p className="text-base font-semibold text-sky-500">Add Comment</p>
            <p className="text-sm text-muted-foreground text-center">
              Please add a comment to support your ticket request.
            </p>
          </div>

          <label className="block text-sm font-medium text-foreground mt-5 mb-2">Add Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Enter your comment"
            className="w-full rounded-2xl bg-card border border-border/60 p-4 text-base outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />

          <p className="text-sm font-semibold text-foreground mt-4 mb-2">Documents</p>
          <button className="w-full rounded-2xl border border-dashed border-border bg-card py-6 flex flex-col items-center gap-2">
            <span className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </span>
            <span className="text-sm text-muted-foreground">Upload your files here</span>
          </button>

          <button
            onClick={() => { setCommentOpen(false); setComment(""); }}
            className="mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold"
          >
            Submit
          </button>
          <button onClick={() => setCommentOpen(false)} className="mt-3 w-full h-11 text-primary font-semibold">
            Close
          </button>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default TicketDetails;
