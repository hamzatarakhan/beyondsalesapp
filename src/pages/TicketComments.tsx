import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { X } from "lucide-react";
import { DEMO_TICKETS, TicketComment } from "@/data/tickets";
import { DocRow, CommentCard } from "./TicketDetails";

const TicketComments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const ticket = DEMO_TICKETS.find((t) => t.id === id) ?? DEMO_TICKETS[0];
  const comments = ticket.comments ?? [];
  const [viewComment, setViewComment] = useState<TicketComment | null>(null);

  return (
    <div className="min-h-screen bg-background pb-4">
      <AppHeader title="Comments" showBack onBackClick={() => navigate(`/tickets/${ticket.id}`)} />

      <div className="px-4 space-y-2">
        {comments.map((c) => (
          <CommentCard key={c.id} c={c} onClick={() => setViewComment(c)} tone="white" />
        ))}
      </div>

      <Drawer open={!!viewComment} onOpenChange={(o) => !o && setViewComment(null)}>
        <DrawerContent className="px-4 pb-8 max-h-[80vh]">
          <button onClick={() => setViewComment(null)} aria-label="Close" className="absolute end-4 top-6 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-2 pb-1">
            <DrawerTitle className="text-lg font-semibold">Comment</DrawerTitle>
          </DrawerHeader>

          <div className="overflow-y-auto scrollbar-hide">
            <span className="block mb-2 text-[11px] text-muted-foreground">{viewComment?.date}</span>
            <p className="text-sm text-foreground whitespace-pre-wrap">{viewComment?.text}</p>

            {viewComment && viewComment.documents.length > 0 && (
              <>
                <p className="text-sm font-semibold text-foreground mt-4 mb-2">Documents</p>
                <div className="rounded-2xl border border-dashed border-border divide-y divide-border/60">
                  {viewComment.documents.map((doc) => <DocRow key={doc.id} doc={doc} />)}
                </div>
              </>
            )}
          </div>

          <button onClick={() => setViewComment(null)} className="mt-5 w-full h-11 text-primary font-semibold shrink-0">
            Close
          </button>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default TicketComments;
