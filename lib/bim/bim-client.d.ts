/**
 * @alvinahmad/blueprin-sdk - BimClient
 *
 * Domain client for managing BIM/IFC models and 3D quantity takeoffs.
 */
import { type IfcParseResult, type IfcParseOptions } from './ifc-parser.js';
import type { BimModel, BimElement, BimModelSummary } from './types.js';
export declare class BimClient {
    private _storage;
    private _hooks;
    private _events;
    constructor({ storage, hooks, events }: {
        storage: any;
        hooks: any;
        events: any;
    });
    listModels(projectId?: string): Promise<BimModel[]>;
    getModel(id: string): Promise<BimModel | null>;
    importModel(input: {
        projectId: string;
        name: string;
        filename: string;
        ifcVersion?: 'IFC2X3' | 'IFC4' | 'IFC4X3';
        elements?: BimElement[];
        schemaLOD?: 'LOD100' | 'LOD200' | 'LOD300' | 'LOD350' | 'LOD400';
    }): Promise<BimModel>;
    /**
     * Import an IFC file by parsing its buffer and extracting elements.
     * This is the primary method for ingesting IFC files into the SDK.
     */
    importFromIfcBuffer(projectId: string, filename: string, buffer: ArrayBuffer | Uint8Array, options?: IfcParseOptions & {
        name?: string;
        schemaLOD?: BimModel['schemaLOD'];
    }): Promise<{
        model: BimModel;
        parseResult: IfcParseResult;
    }>;
    calculateTakeoff(modelId: string): Promise<BimModelSummary>;
    exportToBoQ(modelId: string): Promise<{
        globalId: string;
        description: string;
        storey: string;
        category: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        totalPrice: number;
    }[]>;
    deleteModel(id: string): Promise<boolean>;
}
