/**
 * @alvinahmad/blueprin-sdk - TakeoffEngine
 *
 * Mathematical computation engine for Digital Takeoff:
 * - Scale calibration from known distances & ratio presets
 * - Linear perimeter & segment calculations
 * - Polygon area via Shoelace algorithm & deduction holes
 * - Wall surface area & slab volume extrusions
 * - Waste factor allowance and item cost estimation
 */
import type { TakeoffPoint, TakeoffScale, TakeoffUnit, TakeoffItem, TakeoffSheet, TakeoffLayer, TakeoffItemCalculation, TakeoffSummary } from './types.js';
export declare class TakeoffEngine {
    /**
     * Calculate a scale configuration from 2 points with a known real-world distance.
     */
    static calculateScaleFromKnownDistance(p1: TakeoffPoint, p2: TakeoffPoint, knownDistance: number, unit?: TakeoffUnit): TakeoffScale;
    /**
     * Calculate scale from an architectural ratio preset (e.g. "1:100", "1:50") at a given DPI.
     * Standard PDF rendering is commonly 72 or 300 DPI.
     * 1 inch = 0.0254 meters.
     */
    static calculateScaleFromPreset(ratio: string, dpi?: number, unit?: TakeoffUnit): TakeoffScale;
    /**
     * Convert measurement values between units across dimensions (1 = linear, 2 = area, 3 = volume).
     */
    static convertUnit(value: number, from: TakeoffUnit, to: TakeoffUnit, dimension?: 1 | 2 | 3): number;
    /**
     * Calculate polyline length (in pixels and scaled real-world unit).
     */
    static calculatePolylineLength(points: TakeoffPoint[], scale?: TakeoffScale): {
        pixelLength: number;
        scaledLength: number;
        unit: string;
    };
    /**
     * Calculate polygon area using the Shoelace (Gauss's area) formula.
     */
    static calculatePolygonArea(points: TakeoffPoint[], scale?: TakeoffScale): {
        pixelArea: number;
        scaledArea: number;
        unit: string;
    };
    /**
     * Calculate net polygon area with deduction holes subtracted.
     */
    static calculateNetPolygonArea(outerPoints: TakeoffPoint[], deductions?: TakeoffPoint[][], scale?: TakeoffScale): {
        grossArea: number;
        deductionsArea: number;
        netArea: number;
        unit: string;
    };
    /**
     * Calculate vertical wall surface area (Linear perimeter * wall height - openings).
     */
    static calculateWallSurfaceArea(points: TakeoffPoint[], height: number, deductions?: {
        width: number;
        height: number;
    }[], scale?: TakeoffScale): {
        wallLength: number;
        grossArea: number;
        deductionsArea: number;
        netArea: number;
        unit: string;
    };
    /**
     * Calculate slab / volume extrusion (Net Area * depth/thickness).
     */
    static calculateSlabVolume(points: TakeoffPoint[], depth: number, deductions?: TakeoffPoint[][], scale?: TakeoffScale): {
        netArea: number;
        volume: number;
        unit: string;
    };
    /**
     * Check if a 2D point lies inside a polygon (Ray Casting algorithm).
     */
    static pointInPolygon(pt: TakeoffPoint, poly: TakeoffPoint[]): boolean;
    /**
     * Calculate complete item metrics including deductions, waste factor, and total cost.
     */
    static calculateItem(item: TakeoffItem, scale?: TakeoffScale): TakeoffItemCalculation;
    /**
     * Compute aggregate summary across all sheet items, grouped by category/layer.
     */
    static calculateSummary(sheet: TakeoffSheet, layers?: TakeoffLayer[]): TakeoffSummary;
}
