# Real-time Collaboration SDK (`@alvinahmad/blueprin-sdk/collab`)

The Real-time Collaboration module provides comprehensive tools for multi-user coordination, live cursor sync, element locking, member invitations, role-based access control, document version snapshots, review comments, and conflict-free CRDT synchronization across Blueprin web and desktop applications.

---

## Features

- **Room & Session Management**: Create, join, and leave collaborative project rooms with active presence detection.
- **Team Invitations & Roles**: Invite collaborators via email with granular roles (`owner`, `project_manager`, `site_engineer`, `mandor`, `supplier`, `estimator`, `editor`, `viewer`, `client`).
- **Cloud API Sessions & Tokens**: Generate and validate secure `bcoll_` session tokens for external SDK agents and integrations.
- **Live Cursors & Presence**: Broadcast real-time cursor positions, active sheet coordinates, selection states, and user viewports.
- **Exclusive Element Locking**: Lock drawing nodes, BOQ items, and budget cells to prevent race-condition edits with timestamp conflict resolution.
- **Comments & Review Threads**: Add and resolve threaded review notes attached to any CAD drawing, material item, or task.
- **Document Snapshots & Version History**: Save point-in-time document states, compute checksums, and audit change histories.
- **In-App Team Chat**: Send and retrieve project discussion messages with rich file attachments.
- **CRDT / Operational Transform**: Vector-clock based conflict resolution (`createOperation`, `applyOperation`, `resolveConflicts`).

---

## Quick Start

```ts
import { BlueprinSDK } from '@alvinahmad/blueprin-sdk';

const sdk = new BlueprinSDK({ appId: 'my-collab-app' });
await sdk.init();

// 1. Create and join a room
const room = await sdk.collab.createRoom('proj-123', 'Structural Review');
await sdk.collab.joinRoom(room.roomId, {
  userId: 'user-1',
  name: 'Alvin Ahmad',
  color: '#2563EB',
  role: 'project_manager',
});

// 2. Invite a team member
const invite = await sdk.collab.inviteUser(
  'proj-123',
  'engineer@example.com',
  'site_engineer',
  'Villa Ubud'
);
console.log('Invite link:', invite.inviteUrl);

// 3. Lock an element for exclusive editing
const locked = await sdk.collab.lockElement(room.roomId, 'user-1', 'beam-b204');
if (locked) {
  // Perform modifications safely
  await sdk.collab.unlockElement(room.roomId, 'user-1', 'beam-b204');
}

// 4. Send chat message with attachment
await sdk.collab.sendChatMessage('proj-123', {
  userId: 'user-1',
  userName: 'Alvin Ahmad',
  role: 'project_manager',
  message: 'Concrete test results ready for review.',
  attachments: [
    { url: 'https://storage.blueprin.io/test_result.pdf', name: 'test_result.pdf' }
  ]
});
```

---

## Role Permissions Matrix

The SDK enforces 9 distinct roles with pre-configured permissions:

| Role | View Budget | View Progress | Approve PO | Approve Change | Edit RAB | Input Daily | Confirm Delivery | Manage Members |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Project Manager** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Site Engineer** | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Mandor** | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Supplier** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Estimator** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Editor** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Viewer** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Client** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

Check permissions programmatically:
```ts
if (sdk.collab.can(userRole, 'editRAB')) {
  // Allow BOQ editing
}
```

---

## WebSocket Real-Time Transport

Connect to a live WebSocket server for low-latency multi-client synchronization:

```ts
sdk.collab.connectTransport({
  url: 'wss://collab.blueprin.io',
  token: 'bcoll_your_session_token',
}, {
  onConnect: () => console.log('Connected to live collab server'),
  onPresence: (users) => console.log('Active users:', users),
  onMessage: (msg) => console.log('Received live message:', msg),
});
```
