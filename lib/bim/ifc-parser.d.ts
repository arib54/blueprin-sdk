/**
 * @alvinahmad/blueprin-sdk - IFC Parser
 *
 * Parses IFC (Industry Foundation Classes) files and extracts BIM elements
 * with their geometric properties, materials, and spatial hierarchy.
 *
 * Supports IFC2X3, IFC4, and IFC4X3 formats.
 * Uses regex-based entity extraction with property set resolution.
 */
import type { BimElement, BimElementType } from './types.js';
export interface IfcParseResult {
    elements: BimElement[];
    ifcVersion: string;
    totalEntities: number;
    parsedEntities: number;
    storeys: string[];
    materials: string[];
    parseTimeMs: number;
}
export interface IfcParseOptions {
    /** Extract property sets (Pset_*) for detailed attributes */
    extractProperties?: boolean;
    /** Extract material associations */
    extractMaterials?: boolean;
    /** Extract spatial structure (storeys, buildings) */
    extractSpatial?: boolean;
    /** Filter to specific IFC types only */
    filterTypes?: BimElementType[];
}
/**
 * Parse an IFC file buffer and extract BIM elements.
 *
 * @param buffer - The IFC file content as ArrayBuffer or Uint8Array
 * @param options - Parsing options
 * @returns Parsed elements with metadata
 */
export declare function parseIfcFile(buffer: ArrayBuffer | Uint8Array, options?: IfcParseOptions): IfcParseResult;
