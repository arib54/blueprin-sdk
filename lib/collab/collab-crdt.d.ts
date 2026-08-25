/**
 * @alvinahmad/blueprin-sdk - CRDT Conflict Resolution
 *
 * Vector-clock based operational transform for conflict-free document editing.
 * Implements last-writer-wins with causal ordering for collaborative editing.
 */
import type { CollabOperation, CollabDocumentState } from './types.js';
/**
 * Increment vector clock for a user
 */
export declare function incrementClock(clock: Record<string, number>, userId: string): Record<string, number>;
/**
 * Check if operation A happened-before operation B
 */
export declare function happenedBefore(a: Record<string, number>, b: Record<string, number>): boolean;
/**
 * Check if two operations are concurrent (neither happened-before the other)
 */
export declare function areConcurrent(a: Record<string, number>, b: Record<string, number>): boolean;
/**
 * Merge two vector clocks
 */
export declare function mergeClocks(a: Record<string, number>, b: Record<string, number>): Record<string, number>;
/**
 * Apply a single operation to document state
 */
export declare function applyOperation(state: CollabDocumentState, operation: CollabOperation): CollabDocumentState;
/**
 * Resolve conflicts between concurrent operations using LWW (Last Writer Wins)
 * with timestamp tiebreaking
 */
export declare function resolveConflicts(operations: CollabOperation[]): CollabOperation[];
/**
 * Create a new operation
 */
export declare function createOperation(userId: string, roomId: string, type: CollabOperation['type'], path: string, value?: any, oldValue?: any, vectorClock?: Record<string, number>): CollabOperation;
