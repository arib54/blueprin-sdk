import { describe, it, expect, beforeEach } from 'vitest';
import { BlueprinSDK } from '../lib/src/core/sdk.ts';
import {
  COLLAB_ROLE_DEFINITIONS,
  createOperation,
  applyOperation,
  resolveConflicts,
  incrementClock,
  mergeClocks,
  happenedBefore,
  areConcurrent,
} from '../lib/src/collab/index.ts';

describe('Real-time Collaboration SDK & Workflow Suite', () => {
  let sdk: BlueprinSDK;

  beforeEach(async () => {
    sdk = new BlueprinSDK({ appId: 'test-collab-suite' });
    await sdk.init();
  });

  describe('1. Room & Member Lifecycle', () => {
    it('creates, joins, and manages active collaboration rooms', async () => {
      const room = await sdk.collab.createRoom('proj-101', 'Architectural Review');
      expect(room.roomId).toBeDefined();
      expect(room.projectId).toBe('proj-101');

      const joined = await sdk.collab.joinRoom(room.roomId, {
        userId: 'u-1',
        name: 'Alvin Ahmad',
        color: '#2563EB',
        role: 'owner',
      });

      expect(joined.activeUsers.length).toBe(1);
      expect(sdk.collab.getCurrentRoom()?.roomId).toBe(room.roomId);
      expect(sdk.collab.getCurrentUser()?.userId).toBe('u-1');

      const left = await sdk.collab.leaveRoom(room.roomId, 'u-1');
      expect(left).toBe(true);
      expect(sdk.collab.getCurrentRoom()).toBeNull();
    });
  });

  describe('2. Collaborator Invitations & Role Management', () => {
    it('generates invitation links and manages project team members', async () => {
      const inviteResult = await sdk.collab.inviteUser(
        'proj-101',
        'engineer@blueprin.io',
        'site_engineer',
        'Villa Ubud Project'
      );

      expect(inviteResult.success).toBe(true);
      expect(inviteResult.data?.role).toBe('site_engineer');
      expect(inviteResult.inviteUrl).toContain('proj-101');

      const members = await sdk.collab.getProjectCollaborators('proj-101');
      expect(members.length).toBe(1);
      expect(members[0].role).toBe('site_engineer');

      // Update role
      const updated = await sdk.collab.updateCollaboratorRole(
        members[0].id,
        'project_manager',
        'proj-101'
      );
      expect(updated.role).toBe('project_manager');

      // Remove collaborator
      const removed = await sdk.collab.removeCollaborator(members[0].id, {
        projectId: 'proj-101',
        currentUserId: 'owner-id',
      });
      expect(removed.success).toBe(true);
    });

    it('rejects invalid email formats gracefully', async () => {
      const badInvite = await sdk.collab.inviteUser('proj-101', 'invalid-email', 'viewer');
      expect(badInvite.success).toBe(false);
      expect(badInvite.error).toContain('Invalid email');
    });
  });

  describe('3. Cloud API Sessions & Tokens', () => {
    it('creates, validates, and revokes collaboration sessions', async () => {
      const session = await sdk.collab.createCollabSession({
        userId: 'user-ext-1',
        projectId: 'proj-101',
        permissions: ['read', 'write'],
        expiresInHours: 12,
      });

      expect(session.sessionToken.startsWith('bcoll_')).toBe(true);
      expect(session.status).toBe('active');

      const validCheck = await sdk.collab.validateCollabSession(session.sessionToken);
      expect(validCheck.valid).toBe(true);
      expect(validCheck.session?.id).toBe(session.id);

      const activeList = await sdk.collab.listActiveSessions('proj-101');
      expect(activeList.length).toBe(1);

      await sdk.collab.revokeCollabSession(session.id);
      const postRevokeCheck = await sdk.collab.validateCollabSession(session.sessionToken);
      expect(postRevokeCheck.valid).toBe(false);
    });
  });

  describe('4. Presence, Cursors & Element Locking', () => {
    it('tracks presence and prevents element lock conflicts', async () => {
      const presence = await sdk.collab.updatePresence('sess-1', 'u-1', 'proj-101', {
        cursorPosition: { x: 240, y: 180, sheetId: 'sheet-ground-floor' },
        status: 'online',
        userAgent: 'Blueprin Desktop/2.0',
      });

      expect(presence.cursorPosition?.x).toBe(240);

      const presences = await sdk.collab.getProjectPresences('proj-101');
      expect(presences.length).toBe(1);

      const room = await sdk.collab.createRoom('proj-101', 'Structural Grid');
      await sdk.collab.joinRoom(room.roomId, {
        userId: 'u-1',
        name: 'Alvin',
        color: '#10B981',
        role: 'editor',
      });

      const lock1 = await sdk.collab.lockElement(room.roomId, 'u-1', 'column-c1');
      expect(lock1).toBe(true);
      expect(sdk.collab.isElementLocked(room.roomId, 'column-c1')).toBe(true);

      // Conflict: u-2 cannot lock
      const lock2 = await sdk.collab.lockElement(room.roomId, 'u-2', 'column-c1');
      expect(lock2).toBe(false);

      const unlock = await sdk.collab.unlockElement(room.roomId, 'u-1', 'column-c1');
      expect(unlock).toBe(true);
      expect(sdk.collab.isElementLocked(room.roomId, 'column-c1')).toBe(false);
    });
  });

  describe('5. Comments, Snapshots & Team Chat', () => {
    it('adds and resolves comments on drawings and tasks', async () => {
      const comment = await sdk.collab.addComment({
        projectId: 'proj-101',
        userId: 'u-1',
        resourceType: 'drawing_node',
        resourceId: 'wall-204',
        content: 'Check concrete grade K-350 specification.',
      });

      expect(comment.id).toBeDefined();
      expect(comment.isResolved).toBe(false);

      const comments = await sdk.collab.getComments('drawing_node', 'wall-204');
      expect(comments.length).toBe(1);

      const resolved = await sdk.collab.resolveComment(
        comment.id,
        'lead-engineer',
        'drawing_node',
        'wall-204'
      );
      expect(resolved?.isResolved).toBe(true);
    });

    it('saves and retrieves document version snapshots', async () => {
      const snap1 = await sdk.collab.saveDocumentSnapshot({
        projectId: 'proj-101',
        documentType: 'rab_sheet',
        state: { totalCost: 1500000000, itemsCount: 45 },
        createdBy: 'u-1',
      });

      expect(snap1.version).toBe(1);

      const snap2 = await sdk.collab.saveDocumentSnapshot({
        projectId: 'proj-101',
        documentType: 'rab_sheet',
        state: { totalCost: 1620000000, itemsCount: 48 },
        createdBy: 'u-1',
      });

      expect(snap2.version).toBe(2);

      const history = await sdk.collab.getDocumentHistory('proj-101', 'rab_sheet');
      expect(history.length).toBe(2);

      const v1 = await sdk.collab.getDocumentSnapshot('proj-101', 'rab_sheet', 1);
      expect(v1?.state.totalCost).toBe(1500000000);
    });

    it('sends and fetches project discussion chat messages', async () => {
      const msg = await sdk.collab.sendChatMessage('proj-101', {
        userId: 'u-1',
        userName: 'Alvin Ahmad',
        role: 'owner',
        message: 'Material delivery scheduled for tomorrow morning.',
        attachments: [
          {
            url: 'https://storage.blueprin.io/delivery_manifest.pdf',
            name: 'manifest.pdf',
            size: 1048576,
          },
        ],
      });

      expect(msg.id).toBeDefined();
      expect(msg.attachments?.length).toBe(1);

      const chatHistory = await sdk.collab.fetchChatMessages('proj-101');
      expect(chatHistory.length).toBe(1);
      expect(chatHistory[0].message).toContain('delivery scheduled');
    });
  });

  describe('6. Roles, Permissions Matrix & CRDT Engine', () => {
    it('evaluates role permissions correctly across the 9 standard roles', () => {
      expect(sdk.collab.can('owner', 'viewBudget')).toBe(true);
      expect(sdk.collab.can('owner', 'approvePO')).toBe(true);
      expect(sdk.collab.can('owner', 'editRAB')).toBe(false);

      expect(sdk.collab.can('site_engineer', 'viewBudget')).toBe(false);
      expect(sdk.collab.can('site_engineer', 'editRAB')).toBe(true);
      expect(sdk.collab.can('site_engineer', 'inputDailyWork')).toBe(true);

      expect(sdk.collab.can('mandor', 'inputDailyWork')).toBe(true);
      expect(sdk.collab.can('mandor', 'viewBudget')).toBe(false);

      expect(sdk.collab.can('supplier', 'confirmDelivery')).toBe(true);
      expect(sdk.collab.can('supplier', 'manageMembers')).toBe(false);
    });

    it('handles CRDT vector clocks and concurrent operation resolution', () => {
      let clockA = { 'u-1': 1 };
      let clockB = { 'u-2': 1 };

      expect(areConcurrent(clockA, clockB)).toBe(true);

      const merged = mergeClocks(clockA, clockB);
      expect(merged).toEqual({ 'u-1': 1, 'u-2': 1 });

      const opA = createOperation('u-1', 'room-1', 'replace', 'title', 'New Title A', 'Old', clockA);
      const opB = createOperation('u-2', 'room-1', 'replace', 'title', 'New Title B', 'Old', clockB);

      const resolved = resolveConflicts([opA, opB]);
      expect(resolved.length).toBe(1);
    });
  });
});
