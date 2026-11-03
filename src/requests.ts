export type ResidenceRequest = {
  id: string;
  title: string;
  service: string;
  residence: string;
  createdAt: number;
  status: 'queued' | 'done';
  adminRepliedAt: number | null;
};
export const RESPONSE_LIMIT = 3 * 24 * 60 * 60 * 1000;
export type RequestAccess = {
  role: 'student' | 'staff' | 'manager';
  residence: string;
  assignedService: string | null;
};
// The server must enforce this same rule when connected accounts are introduced.
export function canManageRequest(access: RequestAccess, request: ResidenceRequest): boolean {
  if (request.residence !== access.residence) return false;
  return access.role === 'manager' || (access.role === 'staff' && access.assignedService !== null && request.service === access.assignedService);
}
export function requestState(request: ResidenceRequest, now: number): 'done' | 'queued' | 'overdue' {
  if (request.status === 'done') return 'done';
  if (request.adminRepliedAt === null && now - request.createdAt >= RESPONSE_LIMIT) return 'overdue';
  return 'queued';
}
