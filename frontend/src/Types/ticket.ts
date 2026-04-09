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
  description: string;
  createdAt: string;
  assignee?: string;
  assignmentGroup?: string;
  requester: { id: string; distinguishedName: string };
  requesterId: string;
  device?: { id: string; assetName: string; serialNumber: string };
  comments: Comment[];
  approvals: Approval[];
  closureCode?: ClosureCode;
  closureNotes?: string;
}

export interface Comment {
  id: string;
  type: string;
  createdAt: string;
  author: { id: string; distinguishedName: string };
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

export interface UpdateTicketData {
  state?: TicketState;
  assignee?: string;
  assignmentGroup?: string;
  priority?: TicketPriority;
  impact?: TicketImpact;
  urgency?: TicketUrgency;
}
