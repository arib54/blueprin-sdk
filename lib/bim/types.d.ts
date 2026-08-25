/**
 * @alvinahmad/blueprin-sdk - BIM / 3D IFC Types
 *
 * Types for 3D Building Information Modeling (BIM),
 * IFC (Industry Foundation Classes) quantity takeoff, and LOD hierarchy.
 */
export type BimElementType = 'IfcWall' | 'IfcWallStandardCase' | 'IfcSlab' | 'IfcColumn' | 'IfcBeam' | 'IfcDoor' | 'IfcWindow' | 'IfcRoof' | 'IfcFooting' | 'IfcCovering' | 'IfcSpace' | 'IfcBuildingElementProxy' | 'IfcStair' | 'IfcRailing' | 'IfcPipe' | 'IfcDuct' | 'IfcMember' | 'IfcCurtainWall' | 'IfcPlate' | 'IfcFlowSegment' | 'IfcDistributionPort';
export interface BimDimensions {
    length?: number;
    width?: number;
    height?: number;
    thickness?: number;
    grossArea?: number;
    netArea?: number;
    grossVolume?: number;
    netVolume?: number;
    perimeter?: number;
}
export interface BimElement {
    globalId: string;
    name: string;
    type: BimElementType;
    storey: string;
    material?: string;
    dimensions: BimDimensions;
    properties?: Record<string, string | number | boolean>;
    ahsCode?: string;
    unitPrice?: number;
}
export interface BimStoreySummary {
    storey: string;
    elementCount: number;
    totalVolumeM3: number;
    totalAreaM2: number;
    totalCost: number;
    byType: Record<string, {
        count: number;
        volumeM3: number;
        areaM2: number;
        cost: number;
    }>;
}
export interface BimModelSummary {
    modelId: string;
    name: string;
    totalElements: number;
    totalVolumeM3: number;
    totalAreaM2: number;
    totalCost: number;
    storeys: Record<string, BimStoreySummary>;
    categories: Record<string, {
        count: number;
        volumeM3: number;
        areaM2: number;
        cost: number;
    }>;
}
export interface BimModel {
    id: string;
    projectId: string;
    name: string;
    filename: string;
    ifcVersion: 'IFC2X3' | 'IFC4' | 'IFC4X3';
    elements: BimElement[];
    schemaLOD?: 'LOD100' | 'LOD200' | 'LOD300' | 'LOD350' | 'LOD400';
    createdAt: string;
    updatedAt: string;
}
