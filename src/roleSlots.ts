export type RoleSlot = { residence: string; service: string | null; role: 'staff' | 'manager'; ownerId: string };
export function slotAvailable(slots: RoleSlot[], candidate: RoleSlot): boolean {
  return !slots.some(slot => slot.residence === candidate.residence && slot.role === candidate.role &&
    (candidate.role === 'manager' || slot.service === candidate.service) && slot.ownerId !== candidate.ownerId);
}
export function claimSlot(slots: RoleSlot[], candidate: RoleSlot): RoleSlot[] | null {
  if (!slotAvailable(slots, candidate)) return null;
  if (slots.some(slot => slot.residence === candidate.residence && slot.role === candidate.role &&
    (candidate.role === 'manager' || slot.service === candidate.service) && slot.ownerId === candidate.ownerId)) return slots;
  return [...slots, candidate];
}
