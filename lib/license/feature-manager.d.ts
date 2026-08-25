/**
 * FeatureManager — SDK class for plugin feature entitlement checks.
 *
 * Provides methods to check feature access based on license tier,
 * list available features, and verify external connector auth.
 *
 * Similar to Salesforce's System.FeatureManagement.checkPackageBooleanValue().
 *
 * @example
 * ```ts
 * const featureMgr = new FeatureManager(sdk);
 *
 * // Check if a feature is available
 * const hasAccess = await featureMgr.checkFeature('my-plugin', 'advanced_reporting');
 *
 * // List all features for a plugin
 * const features = await featureMgr.listFeatures('my-plugin');
 *
 * // Check external connector auth
 * const hasAuth = await featureMgr.checkExternalAuth('my-plugin', 'erp_connector');
 * ```
 */
import type { BlueprinSDK } from '../core/sdk.js';
import type { FeatureEntitlement, PluginFeature, FeatureCheckResult, ExternalConnectorAuth } from '../types/index.js';
export interface FeatureManagerOptions {
    /** Base API URL (defaults to window.location.origin). */
    baseUrl?: string;
    /** Custom headers for API requests. */
    headers?: Record<string, string>;
}
export declare class FeatureManager {
    private sdk;
    private baseUrl;
    private headers;
    constructor(sdk: BlueprinSDK, options?: FeatureManagerOptions);
    /**
     * Check if a feature is available for the current org/user.
     *
     * This is the primary method plugins should use to gate features.
     * It checks both the org license tier and user license status.
     *
     * @param pluginId - Plugin ID to check features for.
     * @param featureKey - Feature key to check (e.g., 'advanced_reporting').
     * @param userId - User ID to check (optional, for per-user tier).
     * @returns Feature check result with availability info.
     */
    checkFeature(pluginId: string, featureKey: string, userId?: string): Promise<FeatureCheckResult>;
    /**
     * Check multiple features at once (batch check).
     *
     * @param pluginId - Plugin ID to check features for.
     * @param featureKeys - Array of feature keys to check.
     * @param userId - User ID to check (optional).
     * @returns Map of feature key to check result.
     */
    checkFeatures(pluginId: string, featureKeys: string[], userId?: string): Promise<Map<string, FeatureCheckResult>>;
    /**
     * List all features defined by a plugin.
     *
     * @param pluginId - Plugin ID to list features for.
     * @returns Array of plugin features.
     */
    listFeatures(pluginId: string): Promise<PluginFeature[]>;
    /**
     * Get all entitlements for a plugin (admin only).
     *
     * @param pluginId - Plugin ID to get entitlements for.
     * @returns Array of feature entitlements.
     */
    getEntitlements(pluginId: string): Promise<FeatureEntitlement[]>;
    /**
     * Update feature entitlement (admin only).
     *
     * @param pluginId - Plugin ID.
     * @param featureKey - Feature key to update.
     * @param tier - Minimum tier required.
     * @param enabled - Whether the feature is enabled.
     * @returns Success status.
     */
    updateEntitlement(pluginId: string, featureKey: string, tier: 'free' | 'premium' | 'enterprise', enabled: boolean): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Check if external connector auth is configured for a plugin.
     *
     * @param pluginId - Plugin ID to check.
     * @param connectorType - Connector type (e.g., 'erp', 'ai').
     * @param orgId - Organization ID (optional).
     * @returns External auth check result.
     */
    checkExternalAuth(pluginId: string, connectorType: string, orgId?: string): Promise<{
        configured: boolean;
        status: string;
        auth?: ExternalConnectorAuth;
    }>;
    /**
     * Save external connector auth credentials (admin only).
     *
     * Credentials are encrypted before storage.
     *
     * @param pluginId - Plugin ID.
     * @param connectorType - Connector type.
     * @param displayName - Display name for this connection.
     * @param credentials - Plain text credentials (will be encrypted).
     * @param refreshToken - OAuth refresh token (optional).
     * @param orgId - Organization ID (optional).
     * @returns Success status.
     */
    saveExternalAuth(pluginId: string, connectorType: string, displayName: string, credentials: string, refreshToken?: string, orgId?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
