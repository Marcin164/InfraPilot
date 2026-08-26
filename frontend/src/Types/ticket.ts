export type TicketState =
  | "New"
  | "Assigned"
  | "In progress"
  | "Awaiting for user"
  | "Awaiting for vendor"
  | "Resolved"
  | "Closed"
  | "Cancelled";

export type TicketPriority = "Low" | "Medium" | "High" | "Critical";
export type TicketImpact = "Single user" | "Multiple users" | "Whole company";
export type TicketUrgency = "Low" | "Medium" | "High";
export type TicketType = "Incident" | "Service";
export type ClosureCode = "Solved Permanently" | "Solved temporarily" | "Not actioned" | "No reply" | "Workaround";
export type ApprovalDecision = "approved" | "rejected";

export interface Ticket {
  id: string;
  type: TicketType;
  number: string;
  state: TicketState;
  priority: TicketPriority;
  impact: TicketImpact;
  urgency: TicketUrgency;
  title?: string;
  description: string;
  createdAt: string;
  assignee?: string;
  assignmentGroup?: string;
  affectedUsers?: { id: string; name: string; surname: string; email?: string }[];
  requester: { id: string; distinguishedName: string };
  requesterId: string;
  device?: { id: string; assetName: string; serialNumber: string };
  comments: Comment[];
  approvals: Approval[];
  closureCode?: ClosureCode;
  closureNotes?: string;
  customFieldValues?: Record<
    string,
    { label: string; type: string; value: unknown }
  > | null;
}

export interface Comment {
  id: string;
  type: string;
  createdAt: string;
  author: { id: string; distinguishedName: string } | null;
  content?: string;
  attachmentName?: string;
  attachmentMimetype?: string;
  attachmentSize?: number;
  optimistic?: boolean;
}

export interface Approval {
  id: string;
  createdAt: string;
  decidedAt?: string;
  decision: ApprovalDecision | null;
  approver: { id: string; distinguishedName: string };
}

// GET /tickets/approve/mine — unlike `Approval` (nested under a known
// Ticket), this carries its own ticket reference since it's a flat list
// spanning any ticket the current user is the assigned approver for.
export interface MyApproval {
  id: string;
  createdAt: string;
  ticket: {
    id: string;
    number: string;
    title?: string;
    type: TicketType;
    priority: TicketPriority;
    requester?: { name?: string; surname?: string; email?: string };
  };
}

export interface UpdateTicketData {
  state?: TicketState;
  assignee?: string;
  assignmentGroup?: string;
  priority?: TicketPriority;
  impact?: TicketImpact;
  urgency?: TicketUrgency;
  affectedUserIds?: string[];
  title?: string;
  description?: string;
}
