import AsyncStorage from '@react-native-async-storage/async-storage';
import { claimSlot, slotAvailable, type RoleSlot } from './roleSlots';

const storageKey = 'stc.demo.role-slots.v1';
const identityKey = 'stc.demo.account.v1';
let queue: Promise<unknown> = Promise.resolve();
// Serializes local claims. Production requires a database unique constraint and
// an authenticated, manager-authorized transaction; device storage cannot do that.
export function checkDemoRole(slot: Omit<RoleSlot, 'ownerId'>, claim = false): Promise<boolean> {
  const operation = queue.then(async () => {
    let ownerId = await AsyncStorage.getItem(identityKey);
    if (!ownerId) {
      ownerId = `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await AsyncStorage.setItem(identityKey, ownerId);
    }
    const saved = await AsyncStorage.getItem(storageKey);
    const slots: RoleSlot[] = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(slots) || slots.some(slot => !slot || typeof slot.residence !== 'string' || typeof slot.ownerId !== 'string' || !['staff', 'manager'].includes(slot.role) || (slot.service !== null && typeof slot.service !== 'string'))) throw new Error('Invalid role registry');
    const candidate = { ...slot, ownerId };
    if (!claim) return slotAvailable(slots, candidate);
    const next = claimSlot(slots, candidate);
    if (!next) return false;
    await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    return true;
  });
  queue = operation.catch(() => {});
  return operation;
}
