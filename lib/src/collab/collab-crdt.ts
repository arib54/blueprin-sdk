/**
 * @alvinahmad/blueprin-sdk - CRDT Conflict Resolution
 *
 * Vector-clock based operational transform for conflict-free document editing.
 * Implements last-writer-wins with causal ordering for collaborative editing.
 */

import type { CollabOperation, CollabDocumentState } from './types.js';

/**
 * Generate a unique operation ID
 */
function generateOpId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Increment vector clock for a user
 */
export function incrementClock(
  clock: Record<string, number>,
  userId: string
): Record<string, number> {
  return {
    ...clock,
    [userId]: (clock[userId] || 0) + 1,
  };
}

/**
 * Check if operation A happened-before operation B
 */
export function happenedBefore(
  a: Record<string, number>,
  b: Record<string, number>
): boolean {
  let dominated = false;
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const aVal = a[key] || 0;
    const bVal = b[key] || 0;
    if (aVal > bVal) return false;
    if (aVal < bVal) dominated = true;
  }
  return dominated;
}

/**
 * Check if two operations are concurrent (neither happened-before the other)
 */
export function areConcurrent(
  a: Record<string, number>,
  b: Record<string, number>
): boolean {
  return !happenedBefore(a, b) && !happenedBefore(b, a);
}

/**
 * Merge two vector clocks
 */
export function mergeClocks(
  a: Record<string, number>,
  b: Record<string, number>
): Record<string, number> {
  const merged: Record<string, number> = { ...a };
  for (const [key, val] of Object.entries(b)) {
    merged[key] = Math.max(merged[key] || 0, val);
  }
  return merged;
}

/**
 * Apply a single operation to document state
 */
export function applyOperation(
  state: CollabDocumentState,
  operation: CollabOperation
): CollabDocumentState {
  const newData = JSON.parse(JSON.stringify(state.data));
  const pathParts = operation.path.split('.').filter(Boolean);

  let target: any = newData;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const key = isNaN(Number(pathParts[i])) ? pathParts[i] : Number(pathParts[i]);
    target = target[key];
    if (target === undefined) return state;
  }

  const lastKey = isNaN(Number(pathParts[pathParts.length - 1]))
    ? pathParts[pathParts.length - 1]
    : Number(pathParts[pathParts.length - 1]);

  switch (operation.type) {
    case 'insert':
      if (Array.isArray(target) && typeof lastKey === 'number') {
        target.splice(lastKey, 0, operation.value);
      } else {
        target[lastKey] = operation.value;
      }
      break;

    case 'delete':
      if (Array.isArray(target) && typeof lastKey === 'number') {
        target.splice(lastKey, 1);
      } else {
        delete target[lastKey];
      }
      break;

    case 'replace':
      target[lastKey] = operation.value;
      break;

    case 'move': {
      if (Array.isArray(target) && typeof lastKey === 'number' && typeof operation.value === 'number') {
        const [removed] = target.splice(lastKey, 1);
        target.splice(operation.value, 0, removed);
      }
      break;
    }
  }

  return {
    version: state.version + 1,
    vectorClock: incrementClock(state.vectorClock, operation.userId),
    data: newData,
    checksum: '',
  };
}

/**
 * Resolve conflicts between concurrent operations using LWW (Last Writer Wins)
 * with timestamp tiebreaking
 */
export function resolveConflicts(
  operations: CollabOperation[]
): CollabOperation[] {
  // Group by path
  const byPath = new Map<string, CollabOperation[]>();
  for (const op of operations) {
    const existing = byPath.get(op.path) || [];
    existing.push(op);
    byPath.set(op.path, existing);
  }

  const resolved: CollabOperation[] = [];

  for (const [, ops] of byPath) {
    if (ops.length === 1) {
      resolved.push(ops[0]);
      continue;
    }

    // Sort by vector clock (causal order), then by timestamp (LWW)
    ops.sort((a, b) => {
      if (happenedBefore(a.vectorClock, b.vectorClock)) return -1;
      if (happenedBefore(b.vectorClock, a.vectorClock)) return 1;
      // Concurrent: use timestamp LWW
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    // Keep only the latest non-dominated operation per path
    resolved.push(ops[ops.length - 1]);
  }

  return resolved;
}

/**
 * Create a new operation
 */
export function createOperation(
  userId: string,
  roomId: string,
  type: CollabOperation['type'],
  path: string,
  value?: any,
  oldValue?: any,
  vectorClock: Record<string, number> = {}
): CollabOperation {
  return {
    id: generateOpId(),
    userId,
    roomId,
    type,
    path,
    value,
    oldValue,
    vectorClock: incrementClock(vectorClock, userId),
    timestamp: new Date().toISOString(),
  };
}
