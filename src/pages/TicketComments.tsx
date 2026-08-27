import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { DEMO_TICKETS, TicketComment } from "@/data/tickets";
import { CommentCard, CommentDetailSheet } from "./TicketDetails";

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

      <CommentDetailSheet comment={viewComment} onClose={() => setViewComment(null)} />
    </div>
  );
};

export default TicketComments;
