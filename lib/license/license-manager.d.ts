/**
 * LicenseManager — SDK class for plugin license management.
 *
 * Provides methods to check license status, verify user access,
 * and manage org/user licenses. Works with the LMA (License Management
 * Application) backend.
 *
 * @example
 * ```ts
 * const licenseMgr = new LicenseManager(sdk);
 *
 * // Check if org has valid license
 * const orgLicense = await licenseMgr.checkOrgLicense('my-plugin');
 *
 * // Check if current user has access
 * const userAccess = await licenseMgr.checkUserLicense('my-plugin', userId);
 *
 * // Get all licenses for an org
 * const licenses = await licenseMgr.getOrgLicenses(orgId);
 * ```
 */
import type { BlueprinSDK } from '../core/sdk.js';
import type { OrgLicense, UserLicense, LicenseCheckResult, LicenseTier } from '../types/index.js';
export interface LicenseManagerOptions {
    /** Base API URL (defaults to window.location.origin). */
    baseUrl?: string;
    /** Custom headers for API requests. */
    headers?: Record<string, string>;
}
export declare class LicenseManager {
    private sdk;
    private baseUrl;
    private headers;
    constructor(sdk: BlueprinSDK, options?: LicenseManagerOptions);
    /**
     * Check if an org has a valid license for a plugin.
     *
     * @param pluginId - Plugin ID or slug to check.
     * @param orgId - Organization ID (optional, uses current org).
     * @returns License check result with status and tier info.
     */
    checkOrgLicense(pluginId: string, orgId?: string): Promise<LicenseCheckResult>;
    /**
     * Check if a specific user has access to a plugin.
     *
     * For site-wide licenses, all users automatically have access.
     * For per-user licenses, checks if the user is in the assigned list.
     *
     * @param pluginId - Plugin ID or slug to check.
     * @param userId - User ID to check.
     * @returns License check result with user-specific info.
     */
    checkUserLicense(pluginId: string, userId: string): Promise<LicenseCheckResult>;
    /**
     * Get all org licenses for the current organization.
     *
     * @param orgId - Organization ID (optional, uses current org).
     * @returns Array of org licenses.
     */
    getOrgLicenses(orgId?: string): Promise<OrgLicense[]>;
    /**
     * Get all user licenses for a plugin in the current org.
     *
     * @param pluginId - Plugin ID to get user licenses for.
     * @param orgId - Organization ID (optional).
     * @returns Array of user licenses.
     */
    getUserLicenses(pluginId: string, orgId?: string): Promise<UserLicense[]>;
    /**
     * Assign a license to a user (admin only).
     *
     * @param pluginId - Plugin ID to assign.
     * @param userId - User ID to assign license to.
     * @param orgId - Organization ID (optional).
     * @returns Success status.
     */
    assignUserLicense(pluginId: string, userId: string, orgId?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Revoke a license from a user (admin only).
     *
     * @param pluginId - Plugin ID to revoke.
     * @param userId - User ID to revoke license from.
     * @param orgId - Organization ID (optional).
     * @returns Success status.
     */
    revokeUserLicense(pluginId: string, userId: string, orgId?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Update org license tier (admin only).
     *
     * @param pluginId - Plugin ID to update.
     * @param tier - New license tier.
     * @param maxSeats - Maximum seats (for per-user tier).
     * @param orgId - Organization ID (optional).
     * @returns Success status.
     */
    updateOrgLicense(pluginId: string, tier: LicenseTier, maxSeats?: number, orgId?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
