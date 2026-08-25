/**
 * @alvinahmad/blueprin-sdk - FieldClient
 *
 * Domain client for construction field daily logs, K3 safety inspections,
 * site quality audits, photo evidence, and GPS-tagged reports.
 */
import type { FieldDailyLog, FieldInspection, InspectionChecklistItem, FieldPhoto, FieldGPSLocation, FieldDailyReport, FieldIssue } from './types.js';
export declare class FieldClient {
    private _storage;
    private _hooks;
    private _events;
    constructor({ storage, hooks, events }: {
        storage: any;
        hooks: any;
        events: any;
    });
    listDailyLogs(projectId?: string): Promise<FieldDailyLog[]>;
    getDailyLog(id: string): Promise<FieldDailyLog | null>;
    createDailyLog(input: Omit<FieldDailyLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<FieldDailyLog>;
    updateDailyLog(id: string, updates: Partial<FieldDailyLog>): Promise<FieldDailyLog | null>;
    deleteDailyLog(id: string): Promise<boolean>;
    listInspections(projectId?: string): Promise<FieldInspection[]>;
    getInspection(id: string): Promise<FieldInspection | null>;
    createInspection(input: {
        projectId: string;
        title: string;
        type: FieldInspection['type'];
        inspectorName: string;
        items: InspectionChecklistItem[];
        locationGPS?: FieldGPSLocation;
        photos?: FieldPhoto[];
    }): Promise<FieldInspection>;
    updateInspection(id: string, updates: Partial<FieldInspection>): Promise<FieldInspection | null>;
    deleteInspection(id: string): Promise<boolean>;
    /**
     * Add a photo to a daily log
     */
    addPhotoToDailyLog(dailyLogId: string, photo: Omit<FieldPhoto, 'id'>): Promise<FieldPhoto | null>;
    /**
     * Add a photo to an inspection
     */
    addPhotoToInspection(inspectionId: string, photo: Omit<FieldPhoto, 'id'>): Promise<FieldPhoto | null>;
    /**
     * Capture current GPS location (browser Geolocation API)
     */
    captureGPSLocation(): Promise<FieldGPSLocation | null>;
    /**
     * Generate a comprehensive daily report from daily log, workforce, equipment, and issues
     */
    generateDailyReport(projectId: string, date: string): Promise<FieldDailyReport | null>;
    listIssues(projectId?: string): Promise<FieldIssue[]>;
    createIssue(input: Omit<FieldIssue, 'id' | 'createdAt' | 'updatedAt'>): Promise<FieldIssue>;
    updateIssue(id: string, updates: Partial<FieldIssue>): Promise<FieldIssue | null>;
    resolveIssue(id: string, resolvedBy: string): Promise<FieldIssue | null>;
}
