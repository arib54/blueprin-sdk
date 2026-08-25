/**
 * @alvinahmad/blueprin-sdk - BimEngine
 *
 * Computational engine for extracting 3D quantities from BIM/IFC models:
 * - Aggregation of gross/net volume, surface area, and linear lengths
 * - Storey / floor breakdown and category grouping
 * - Automatic BoQ item generation linking to AHSP unit rates
 */
import type { BimModel, BimElement, BimModelSummary } from './types.js';
export declare class BimEngine {
    /**
     * Calculate aggregated 3D quantity takeoff metrics across an entire BIM model.
     */
    static calculateSummary(model: BimModel): BimModelSummary;
    /**
     * Filter elements by storey, type, or material.
     */
    static filterElements(elements: BimElement[], filters: {
        storey?: string;
        type?: string;
        material?: string;
    }): BimElement[];
    /**
     * Convert BIM elements into Bill of Quantities (BoQ) items.
     */
    static exportToBoQ(model: BimModel): Array<{
        globalId: string;
        description: string;
        storey: string;
        category: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        totalPrice: number;
    }>;
}
