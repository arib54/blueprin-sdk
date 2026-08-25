/**
 * @alvinahmad/blueprin-sdk - FieldClient
 *
 * Domain client for construction field daily logs, K3 safety inspections,
 * site quality audits, photo evidence, and GPS-tagged reports.
 */

import { generateId } from '../utils/index.js';
import type {
  FieldDailyLog,
  FieldInspection,
  InspectionChecklistItem,
  FieldPhoto,
  FieldGPSLocation,
  FieldDailyReport,
  FieldWorkforceEntry,
  FieldEquipmentEntry,
  FieldIssue,
} from './types.js';

export class FieldClient {
  private _storage: any;
  private _hooks: any;
  private _events: any;

  constructor({ storage, hooks, events }: { storage: any; hooks: any; events: any }) {
    this._storage = storage;
    this._hooks = hooks;
    this._events = events;
  }

  // ─── Daily Logs ─────────────────────────────────────────────────────────

  async listDailyLogs(projectId?: string): Promise<FieldDailyLog[]> {
    const logs: FieldDailyLog[] = (await this._storage.get('field_daily_logs')) || [];
    if (projectId) {
      return logs.filter((l) => l.projectId === projectId);
    }
    return logs;
  }

  async getDailyLog(id: string): Promise<FieldDailyLog | null> {
    const logs = await this.listDailyLogs();
    return logs.find((l) => l.id === id) || null;
  }

  async createDailyLog(input: Omit<FieldDailyLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<FieldDailyLog> {
    const ctx = await this._hooks.executeBefore('blueprin:before:field:dailylog:create', { input });

    const log: FieldDailyLog = {
      id: generateId(),
      ...ctx.input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const logs = await this.listDailyLogs();
    logs.push(log);
    await this._storage.set('field_daily_logs', logs);

    await this._hooks.executeAfter('blueprin:after:field:dailylog:create', { log });
    this._events.emit('blueprin:field:dailylog:created', { log });

    return log;
  }

  async updateDailyLog(id: string, updates: Partial<FieldDailyLog>): Promise<FieldDailyLog | null> {
    const logs = await this.listDailyLogs();
    const idx = logs.findIndex((l) => l.id === id);
    if (idx === -1) return null;

    logs[idx] = { ...logs[idx], ...updates, updatedAt: new Date().toISOString() };
    await this._storage.set('field_daily_logs', logs);
    this._events.emit('blueprin:field:dailylog:updated', { log: logs[idx] });
    return logs[idx];
  }

  async deleteDailyLog(id: string): Promise<boolean> {
    const logs = await this.listDailyLogs();
    const filtered = logs.filter((l) => l.id !== id);
    if (filtered.length === logs.length) return false;

    await this._storage.set('field_daily_logs', filtered);
    this._events.emit('blueprin:field:dailylog:deleted', { id });
    return true;
  }

  // ─── Field Inspections ──────────────────────────────────────────────────

  async listInspections(projectId?: string): Promise<FieldInspection[]> {
    const list: FieldInspection[] = (await this._storage.get('field_inspections')) || [];
    if (projectId) {
      return list.filter((i) => i.projectId === projectId);
    }
    return list;
  }

  async getInspection(id: string): Promise<FieldInspection | null> {
    const list = await this.listInspections();
    return list.find((i) => i.id === id) || null;
  }

  async createInspection(input: {
    projectId: string;
    title: string;
    type: FieldInspection['type'];
    inspectorName: string;
    items: InspectionChecklistItem[];
    locationGPS?: FieldGPSLocation;
    photos?: FieldPhoto[];
  }): Promise<FieldInspection> {
    const ctx = await this._hooks.executeBefore('blueprin:before:field:inspection:create', { input });

    // Calculate score
    const evaluatedItems = ctx.input.items.filter((i: InspectionChecklistItem) => i.status !== 'na');
    const passedItems = evaluatedItems.filter((i: InspectionChecklistItem) => i.status === 'pass');
    const scorePercent = evaluatedItems.length > 0 ? Math.round((passedItems.length / evaluatedItems.length) * 100) : 100;
    const hasFail = evaluatedItems.some((i: InspectionChecklistItem) => i.status === 'fail');
    const status = hasFail ? 'rejected' : 'approved';

    const inspection: FieldInspection = {
      id: generateId(),
      projectId: ctx.input.projectId,
      title: ctx.input.title,
      type: ctx.input.type,
      inspectorName: ctx.input.inspectorName,
      status,
      scorePercent,
      items: ctx.input.items,
      photos: ctx.input.photos,
      locationGPS: ctx.input.locationGPS,
      signedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = await this.listInspections();
    list.push(inspection);
    await this._storage.set('field_inspections', list);

    await this._hooks.executeAfter('blueprin:after:field:inspection:create', { inspection });
    this._events.emit('blueprin:field:inspection:created', { inspection });

    return inspection;
  }

  async updateInspection(id: string, updates: Partial<FieldInspection>): Promise<FieldInspection | null> {
    const list = await this.listInspections();
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    await this._storage.set('field_inspections', list);
    this._events.emit('blueprin:field:inspection:updated', { inspection: list[idx] });
    return list[idx];
  }

  async deleteInspection(id: string): Promise<boolean> {
    const list = await this.listInspections();
    const filtered = list.filter((i) => i.id !== id);
    if (filtered.length === list.length) return false;

    await this._storage.set('field_inspections', filtered);
    this._events.emit('blueprin:field:inspection:deleted', { id });
    return true;
  }

  // ─── Photo Evidence ─────────────────────────────────────────────────────

  /**
   * Add a photo to a daily log
   */
  async addPhotoToDailyLog(
    dailyLogId: string,
    photo: Omit<FieldPhoto, 'id'>
  ): Promise<FieldPhoto | null> {
    const log = await this.getDailyLog(dailyLogId);
    if (!log) return null;

    const newPhoto: FieldPhoto = {
      id: generateId(),
      ...photo,
    };

    log.photos = [...(log.photos || []), newPhoto];
    log.updatedAt = new Date().toISOString();

    const logs = await this.listDailyLogs();
    const idx = logs.findIndex((l) => l.id === dailyLogId);
    if (idx !== -1) {
      logs[idx] = log;
      await this._storage.set('field_daily_logs', logs);
    }

    this._events.emit('blueprin:field:photo:added', { dailyLogId, photo: newPhoto });
    return newPhoto;
  }

  /**
   * Add a photo to an inspection
   */
  async addPhotoToInspection(
    inspectionId: string,
    photo: Omit<FieldPhoto, 'id'>
  ): Promise<FieldPhoto | null> {
    const inspection = await this.getInspection(inspectionId);
    if (!inspection) return null;

    const newPhoto: FieldPhoto = {
      id: generateId(),
      ...photo,
    };

    inspection.photos = [...(inspection.photos || []), newPhoto];
    inspection.updatedAt = new Date().toISOString();

    const list = await this.listInspections();
    const idx = list.findIndex((i) => i.id === inspectionId);
    if (idx !== -1) {
      list[idx] = inspection;
      await this._storage.set('field_inspections', list);
    }

    this._events.emit('blueprin:field:photo:added', { inspectionId, photo: newPhoto });
    return newPhoto;
  }

  // ─── GPS Location ───────────────────────────────────────────────────────

  /**
   * Capture current GPS location (browser Geolocation API)
   */
  async captureGPSLocation(): Promise<FieldGPSLocation | null> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
            capturedAt: new Date().toISOString(),
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  // ─── Daily Reports (aggregated) ────────────────────────────────────────

  /**
   * Generate a comprehensive daily report from daily log, workforce, equipment, and issues
   */
  async generateDailyReport(
    projectId: string,
    date: string
  ): Promise<FieldDailyReport | null> {
    const logs = await this.listDailyLogs(projectId);
    const dailyLog = logs.find((l) => l.date === date);
    if (!dailyLog) return null;

    const workforce: FieldWorkforceEntry[] = (await this._storage.get(`field_workforce_${date}`)) || [];
    const equipment: FieldEquipmentEntry[] = (await this._storage.get(`field_equipment_${date}`)) || [];
    const issues: FieldIssue[] = (await this._storage.get(`field_issues_${date}`)) || [];

    // Calculate scores
    const weatherSummary = `${dailyLog.weatherMorning.condition} → ${dailyLog.weatherAfternoon.condition}`;
    const productivityIndex = dailyLog.completedActivities.length > 0
      ? Math.min(100, Math.round((dailyLog.completedActivities.length / Math.max(dailyLog.completedActivities.length + (dailyLog.plannedNextActivities?.length || 0), 1)) * 100))
      : 0;

    const report: FieldDailyReport = {
      id: generateId(),
      projectId,
      date,
      dailyLog,
      workforce,
      equipment,
      issues,
      weatherSummary,
      productivityIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this._events.emit('blueprin:field:report:generated', { report });
    return report;
  }

  // ─── Issues Tracking ───────────────────────────────────────────────────

  async listIssues(projectId?: string): Promise<FieldIssue[]> {
    const list: FieldIssue[] = (await this._storage.get('field_issues')) || [];
    if (projectId) {
      return list.filter((i) => i.category || true); // All issues for project
    }
    return list;
  }

  async createIssue(input: Omit<FieldIssue, 'id' | 'createdAt' | 'updatedAt'>): Promise<FieldIssue> {
    const issue: FieldIssue = {
      id: generateId(),
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = await this.listIssues();
    list.push(issue);
    await this._storage.set('field_issues', list);

    this._events.emit('blueprin:field:issue:created', { issue });
    return issue;
  }

  async updateIssue(id: string, updates: Partial<FieldIssue>): Promise<FieldIssue | null> {
    const list = await this.listIssues();
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    await this._storage.set('field_issues', list);
    this._events.emit('blueprin:field:issue:updated', { issue: list[idx] });
    return list[idx];
  }

  async resolveIssue(id: string, resolvedBy: string): Promise<FieldIssue | null> {
    return this.updateIssue(id, { status: 'resolved' });
  }
}
