/**
 * @alvinahmad/blueprin-sdk - TakeoffClient
 *
 * Domain client for Digital Takeoff (PDF/CAD measurement) management:
 * - Documents, sheets, and markup layer lifecycle
 * - Interactive scale calibration
 * - Real-time quantity takeoff calculation
 * - Direct BoQ and RAB cost estimation export
 */
import type { TakeoffDocument, TakeoffSheet, TakeoffLayer, TakeoffItem, TakeoffPoint, TakeoffScale, TakeoffUnit, TakeoffSummary, BoQExportItem } from './types.js';
export declare class TakeoffClient {
    private _storage;
    private _hooks;
    private _events;
    constructor({ storage, hooks, events }: {
        storage: any;
        hooks: any;
        events: any;
    });
    /**
     * List all takeoff documents for a specific project.
     */
    listDocuments(projectId?: string): Promise<TakeoffDocument[]>;
    /**
     * Get a single takeoff document by ID.
     */
    getDocument(id: string): Promise<TakeoffDocument | null>;
    /**
     * Create a new takeoff document (e.g. uploaded architectural PDF or DWG drawing).
     */
    createDocument(input: {
        projectId: string;
        title: string;
        filename: string;
        fileType?: 'pdf' | 'dwg' | 'dxf' | 'image';
        layers?: TakeoffLayer[];
    }): Promise<TakeoffDocument>;
    /**
     * Update document title, layers, or metadata.
     */
    updateDocument(id: string, patch: Partial<TakeoffDocument>): Promise<TakeoffDocument>;
    /**
     * Delete a takeoff document.
     */
    deleteDocument(id: string): Promise<boolean>;
    /**
     * Add a sheet (drawing page) to a takeoff document.
     */
    addSheet(documentId: string, sheetInput: {
        name: string;
        pageNumber?: number;
        imageUrl?: string;
        pdfUrl?: string;
        width?: number;
        height?: number;
        scale?: Partial<TakeoffScale>;
    }): Promise<TakeoffSheet>;
    /**
     * Calibrate scale for a specific sheet using two reference points and known real distance.
     */
    calibrateSheetScale(documentId: string, sheetId: string, p1: TakeoffPoint, p2: TakeoffPoint, knownDistance: number, unit?: TakeoffUnit): Promise<TakeoffScale>;
    /**
     * Add a measurement markup item to a sheet.
     */
    addItem(documentId: string, sheetId: string, itemInput: Omit<TakeoffItem, 'id' | 'sheetId'>): Promise<TakeoffItem>;
    /**
     * Update an existing takeoff measurement item.
     */
    updateItem(documentId: string, sheetId: string, itemId: string, patch: Partial<TakeoffItem>): Promise<TakeoffItem>;
    /**
     * Delete a takeoff item.
     */
    deleteItem(documentId: string, sheetId: string, itemId: string): Promise<boolean>;
    /**
     * Calculate takeoff summary for a specific sheet.
     */
    calculateSheet(documentId: string, sheetId: string): Promise<TakeoffSummary>;
    /**
     * Calculate aggregated takeoff summary for an entire document across all sheets.
     */
    calculateDocument(documentId: string): Promise<TakeoffSummary>;
    /**
     * Export takeoff items directly into a Bill of Quantities (BoQ) structure.
     */
    exportToBoQ(documentId: string): Promise<BoQExportItem[]>;
}
