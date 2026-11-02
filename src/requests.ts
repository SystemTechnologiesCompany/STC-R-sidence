export type ResidenceRequest = {
  id: string;
  title: string;
  service: string;
  residence: string;
  createdAt: number;
  status: 'queued' | 'done';
  adminRepliedAt: number | null;
  demo?: boolean;
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
export function demoRequests(residence: string, now = Date.now()): ResidenceRequest[] {
  return [
    { id: 'SR-021', title: 'Repas du soir', service: 'Restauration', residence, createdAt: now - 5 * 86400000, status: 'done', adminRepliedAt: now - 4 * 86400000, demo: true },
    { id: 'SR-023', title: 'Chambres & équipements', service: 'Hébergement', residence, createdAt: now - 86400000, status: 'queued', adminRepliedAt: null, demo: true },
    { id: 'SR-024', title: 'Éclairage du couloir', service: 'Maintenance', residence, createdAt: now - 4 * 86400000, status: 'queued', adminRepliedAt: null, demo: true },
  ];
}
