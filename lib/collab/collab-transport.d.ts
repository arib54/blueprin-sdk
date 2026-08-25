/**
 * @alvinahmad/blueprin-sdk - Collab Transport
 *
 * WebSocket transport layer for real-time collaboration.
 * Handles connection management, reconnection, heartbeat, and message serialization.
 */
import type { CollabMessage, CollabTransportConfig, CollabTransportEvents } from './types.js';
export declare class CollabTransport {
    private _config;
    private _events;
    private _ws;
    private _reconnectTimer;
    private _heartbeatTimer;
    private _reconnectAttempts;
    private _isConnected;
    private _messageQueue;
    constructor(config: CollabTransportConfig, events?: CollabTransportEvents);
    get isConnected(): boolean;
    /**
     * Connect to the WebSocket server
     */
    connect(): void;
    /**
     * Disconnect from the WebSocket server
     */
    disconnect(): void;
    /**
     * Send a message to the server
     */
    send(message: CollabMessage): void;
    /**
     * Send a message and wait for acknowledgment
     */
    sendAndWait(message: CollabMessage, timeoutMs?: number): Promise<CollabMessage>;
    private _flushQueue;
    private _scheduleReconnect;
    private _startHeartbeat;
    private _stopHeartbeat;
}
