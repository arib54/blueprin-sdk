/**
 * IKKClient — SDK client for Indeks Kemahalan Konstruksi (Construction Cost Index).
 *
 * Provides methods to query IKK data for 38 provinces and 514 cities
 * in Indonesia, based on BPS (Badan Pusat Statistik) publications.
 *
 * The IKK measures relative construction costs across regions. A value of 100
 * means costs equal the reference city (Banjarmasin for 2024). Values above
 * 100 indicate higher costs; below 100 indicates lower costs.
 *
 * @example
 * ```ts
 * const ikk = new IKKClient(sdk);
 *
 * // Get IKK for all provinces
 * const provinces = await ikk.getProvinceIKK(2024);
 *
 * // Get IKK for a specific province
 * const aceh = await ikk.getProvinceIKK(2024, '1100');
 *
 * // Get IKK for cities in a province
 * const southSumatraCities = await ikk.getCityIKK(2024, '1600');
 *
 * // Calculate estimated cost
 * const estimate = await ikk.calculateCost(1000000000, '1600', 2024);
 * ```
 *
 * @see https://www.bps.go.id — BPS official website
 * @see /api/ikk — Backend API endpoint
 */
import type { BlueprinSDK } from '../core/sdk.js';
import type { IKKProvince, IKKCity, IKKHistory, IKKComparison, IKKCostEstimate, IKKRegion } from '../types/index.js';
export interface IKKClientOptions {
    /** Base API URL (defaults to window.location.origin). */
    baseUrl?: string;
    /** Custom headers for API requests. */
    headers?: Record<string, string>;
}
export declare class IKKClient {
    private sdk;
    private baseUrl;
    private headers;
    constructor(sdk: BlueprinSDK, options?: IKKClientOptions);
    /**
     * Get IKK data for provinces.
     *
     * @param year - Data year (default: 2024). BPS publishes IKK annually.
     * @param provinceCode - Optional BPS province code to filter (e.g., '1100' for Aceh).
     *                       If omitted, returns all 38 provinces.
     * @param region - Optional region filter (e.g., 'Sumatera', 'Jawa').
     *                 Useful for grouping by island.
     * @returns Array of province IKK data, sorted by ranking.
     */
    getProvinceIKK(year?: number, provinceCode?: string, region?: IKKRegion): Promise<IKKProvince[]>;
    /**
     * Get IKK data for cities/kabupaten within a province.
     *
     * @param year - Data year (default: 2024).
     * @param provinceCode - Parent province BPS code (e.g., '1600' for South Sumatra).
     * @param cityCode - Optional city code to filter (e.g., '1671' for Palembang).
     * @returns Array of city IKK data, sorted by ranking within the province.
     */
    getCityIKK(year: number | undefined, provinceCode: string, cityCode?: string): Promise<IKKCity[]>;
    /**
     * Get IKK historical data for a location (province or city).
     *
     * Useful for trend analysis — shows how construction costs have changed
     * over multiple years relative to the reference city.
     *
     * @param locationCode - Province or city BPS code.
     * @param locationType - 'province' or 'city'. Default: 'province'.
     * @param startYear - Start year for history range (default: 2019).
     * @param endYear - End year for history range (default: 2024).
     * @returns Historical IKK data with yearly values, or null if not found.
     */
    getIKKHistory(locationCode: string, locationType?: 'province' | 'city', startYear?: number, endYear?: number): Promise<IKKHistory | null>;
    /**
     * Compare IKK between multiple locations.
     *
     * Useful for side-by-side cost comparison across provinces or cities.
     *
     * @param codes - Array of location BPS codes to compare (e.g., ['1100', '3100', '6400']).
     * @param year - Data year (default: 2024).
     * @returns Comparison data with IKK values and rankings for each location.
     */
    compareIKK(codes: string[], year?: number): Promise<IKKComparison | null>;
    /**
     * Calculate estimated construction cost for a target location.
     *
     * Uses the formula: adjustedCost = baseCost × (ikk / 100)
     *
     * @param baseCost - Base cost in reference city (IDR). The reference city
     *                   has IKK = 100, so this is the "baseline" cost.
     * @param locationCode - Target province or city BPS code.
     * @param year - Data year (default: 2024).
     * @returns Cost estimate with IKK-adjusted amount, multiplier, and metadata.
     */
    calculateCost(baseCost: number, locationCode: string, year?: number): Promise<IKKCostEstimate | null>;
    /**
     * Get IKK rankings (most to least expensive provinces).
     *
     * @param year - Data year (default: 2024).
     * @param limit - Number of results to return (default: 10).
     * @param order - Sort order: 'desc' for most expensive first, 'asc' for cheapest first.
     * @returns Ranked array of province IKK data.
     */
    getIKKRankings(year?: number, limit?: number, order?: 'asc' | 'desc'): Promise<IKKProvince[]>;
    /**
     * Get static province list (no API call needed).
     *
     * Returns all 38 Indonesian provinces with their BPS codes and region groupings.
     * Useful for populating dropdowns or filtering without making network requests.
     *
     * @returns Array of { code, name, region } objects.
     */
    getProvinceList(): Array<{
        code: string;
        name: string;
        region: string;
    }>;
    /**
     * Get province name by BPS code.
     *
     * @param code - Province BPS code (e.g., '1100' for Aceh).
     * @returns Province name in Indonesian, or null if code not found.
     */
    getProvinceName(code: string): string | null;
    /**
     * Get provinces filtered by region/island group.
     *
     * @param region - Region name (e.g., 'Sumatera', 'Kalimantan').
     * @returns Array of { code, name } objects for provinces in that region.
     */
    getProvincesByRegion(region: IKKRegion): Array<{
        code: string;
        name: string;
    }>;
}
