/**
 * @alvinahmad/blueprin-sdk - Real-time Collaboration Types
 *
 * Provides comprehensive TypeScript interfaces and types for:
 *   - Room lifecycle and user presence
 *   - Collaborator invitation and membership management
 *   - Role-based permissions matrix (Owner, PM, Site Engineer, Mandor, Supplier, etc.)
 *   - Cloud API session tokens and validation
 *   - Real-time cursor, viewport, and presence tracking
 *   - Commenting and discussion threads
 *   - Document snapshotting, versioning, and change history audit
 *   - In-app team chat with rich attachments
 *   - Operational Transform / CRDT synchronization
 */
export type CollabRoleName = 'owner' | 'project_manager' | 'site_engineer' | 'mandor' | 'supplier' | 'editor' | 'viewer' | 'estimator' | 'client';
export type CollabPermissionKey = 'viewBudget' | 'viewProgress' | 'approvePO' | 'approveChange' | 'editRAB' | 'inputDailyWork' | 'confirmDelivery' | 'manageMembers' | 'exportData' | 'comment';
export interface CollabRoleDefinition {
    id: CollabRoleName;
    label: string;
    description: string;
    permissions: Record<CollabPermissionKey, boolean>;
    defaultRoute?: string;
}
/** Pre-configured standard role definitions */
export declare const COLLAB_ROLE_DEFINITIONS: Record<CollabRoleName, CollabRoleDefinition>;
export interface CollabUser {
    userId: string;
    name: string;
    avatar?: string;
    color: string;
    role: CollabRoleName;
    joinedAt: string;
    lastActive: string;
    cursor?: {
        x: number;
        y: number;
        sheetId?: string;
    };
    selection?: string[];
}
export interface CollabRoom {
    roomId: string;
    projectId: string;
    name: string;
    activeUsers: CollabUser[];
    lockedElements: Record<string, {
        userId: string;
        lockedAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
}
export interface CollabMessage<T = any> {
    roomId: string;
    senderId: string;
    type: 'presence' | 'cursor' | 'selection' | 'patch' | 'lock' | 'unlock' | 'chat' | 'operation';
    payload: T;
    timestamp: string;
}
/** Operational Transform operation for CRDT-like conflict resolution */
export interface CollabOperation {
    id: string;
    userId: string;
    roomId: string;
    type: 'insert' | 'delete' | 'replace' | 'move';
    path: string;
    value?: any;
    oldValue?: any;
    vectorClock: Record<string, number>;
    timestamp: string;
}
export interface CollabCollaborator {
    id: string;
    projectId: string;
    userId: string;
    role: CollabRoleName;
    invitedAt: string;
    profile?: {
        id: string;
        fullName?: string;
        email?: string;
        avatarUrl?: string;
        displayName?: string;
    };
}
export interface InviteCollaboratorOptions {
    projectId: string;
    email: string;
    role?: CollabRoleName;
    projectName?: string;
    sendEmail?: boolean;
}
export interface CollabInviteResult {
    success: boolean;
    data?: CollabCollaborator | null;
    inviteUrl?: string;
    message?: string;
    error?: string;
    details?: string;
    statusCode?: number;
}
export interface CreateCollabSessionOptions {
    userId: string;
    projectId: string;
    apiKeyId?: string;
    permissions?: string[];
    expiresInHours?: number;
}
export interface CollabSession {
    id: string;
    userId: string;
    projectId: string;
    apiKeyId?: string;
    sessionToken: string;
    permissions: string[];
    status: 'active' | 'revoked' | 'expired';
    expiresAt: string;
    createdAt: string;
    lastActivityAt?: string;
}
export interface ValidateCollabSessionResult {
    valid: boolean;
    session?: CollabSession;
    error?: string;
}
export interface CollabCursorData {
    x: number;
    y: number;
    sheetId?: string;
    viewport?: {
        x: number;
        y: number;
        zoom: number;
    };
}
export interface CollabPresence {
    sessionId: string;
    userId: string;
    projectId: string;
    cursorPosition?: CollabCursorData;
    selectionState?: string[];
    viewport?: Record<string, any>;
    status: 'online' | 'idle' | 'offline';
    userAgent?: string;
    lastSeenAt: string;
    profile?: {
        displayName?: string;
        avatarUrl?: string;
    };
}
export interface CollabComment {
    id: string;
    projectId: string;
    userId: string;
    resourceType: string;
    resourceId: string;
    content: string;
    parentId?: string;
    isResolved: boolean;
    resolvedBy?: string;
    resolvedAt?: string;
    createdAt: string;
    profile?: {
        displayName?: string;
        avatarUrl?: string;
    };
}
export interface AddCommentOptions {
    projectId: string;
    userId: string;
    resourceType: string;
    resourceId: string;
    content: string;
    parentId?: string;
}
export interface CollabDocumentSnapshot {
    id: string;
    projectId: string;
    documentType: string;
    version: number;
    state: Record<string, any>;
    checksum: string;
    createdBy: string;
    createdAt: string;
}
export interface SaveDocumentSnapshotOptions {
    projectId: string;
    documentType: string;
    state: Record<string, any>;
    createdBy: string;
}
export interface CollabChangeHistoryItem {
    id: string;
    projectId: string;
    userId: string;
    operationId?: string;
    action: string;
    resourceType: string;
    resourceId: string;
    beforeState?: any;
    afterState?: any;
    metadata?: Record<string, any>;
    createdAt: string;
    profile?: {
        displayName?: string;
        avatarUrl?: string;
    };
}
export interface CollabChatMessage {
    id: string;
    projectId: string;
    userId: string;
    userName: string;
    role?: CollabRoleName;
    message: string;
    attachments?: Array<{
        url: string;
        name: string;
        type?: string;
        size?: number;
    }> | null;
    createdAt: string;
}
export interface SendChatMessagePayload {
    userId?: string;
    userName?: string;
    role?: CollabRoleName;
    message: string;
    attachments?: Array<{
        url: string;
        name: string;
        type?: string;
        size?: number;
    }> | null;
}
/** WebSocket transport configuration */
export interface CollabTransportConfig {
    /** WebSocket server URL (e.g., "wss://collab.blueprin.app") */
    url: string;
    /** Authentication token for the WebSocket connection */
    token: string;
    /** Reconnect interval in ms (default: 3000) */
    reconnectIntervalMs?: number;
    /** Max reconnect attempts (default: 10) */
    maxReconnectAttempts?: number;
    /** Heartbeat interval in ms (default: 30000) */
    heartbeatIntervalMs?: number;
}
/** Transport event callbacks */
export interface CollabTransportEvents {
    onConnect?: () => void;
    onDisconnect?: (reason: string) => void;
    onMessage?: (message: CollabMessage) => void;
    onPresence?: (users: CollabUser[]) => void;
    onError?: (error: Error) => void;
    onReconnecting?: (attempt: number) => void;
}
/** Document state for CRDT synchronization */
export interface CollabDocumentState {
    version: number;
    vectorClock: Record<string, number>;
    data: Record<string, any>;
    checksum: string;
}
