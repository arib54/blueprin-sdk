/**
 * @alvinahmad/blueprin-sdk - BimClient
 *
 * Domain client for managing BIM/IFC models and 3D quantity takeoffs.
 */

import { generateId } from '../utils/index.js';
import { BimEngine } from './bim-engine.js';
import { parseIfcFile, type IfcParseResult, type IfcParseOptions } from './ifc-parser.js';
import type { BimModel, BimElement, BimModelSummary } from './types.js';

export class BimClient {
  private _storage: any;
  private _hooks: any;
  private _events: any;

  constructor({ storage, hooks, events }: { storage: any; hooks: any; events: any }) {
    this._storage = storage;
    this._hooks = hooks;
    this._events = events;
  }

  async listModels(projectId?: string): Promise<BimModel[]> {
    const models: BimModel[] = (await this._storage.get('bim_models')) || [];
    if (projectId) {
      return models.filter((m) => m.projectId === projectId);
    }
    return models;
  }

  async getModel(id: string): Promise<BimModel | null> {
    const models = await this.listModels();
    return models.find((m) => m.id === id) || null;
  }

  async importModel(input: {
    projectId: string;
    name: string;
    filename: string;
    ifcVersion?: 'IFC2X3' | 'IFC4' | 'IFC4X3';
    elements?: BimElement[];
    schemaLOD?: 'LOD100' | 'LOD200' | 'LOD300' | 'LOD350' | 'LOD400';
  }): Promise<BimModel> {
    const ctx = await this._hooks.executeBefore('blueprin:before:bim:import', { input });

    const model: BimModel = {
      id: generateId(),
      projectId: ctx.input.projectId,
      name: ctx.input.name,
      filename: ctx.input.filename,
      ifcVersion: ctx.input.ifcVersion || 'IFC4',
      elements: ctx.input.elements || [],
      schemaLOD: ctx.input.schemaLOD || 'LOD300',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const models = await this.listModels();
    models.push(model);
    await this._storage.set('bim_models', models);

    await this._hooks.executeAfter('blueprin:after:bim:import', { model });
    this._events.emit('blueprin:bim:model:imported', { model });

    return model;
  }

  /**
   * Import an IFC file by parsing its buffer and extracting elements.
   * This is the primary method for ingesting IFC files into the SDK.
   */
  async importFromIfcBuffer(
    projectId: string,
    filename: string,
    buffer: ArrayBuffer | Uint8Array,
    options: IfcParseOptions & { name?: string; schemaLOD?: BimModel['schemaLOD'] } = {}
  ): Promise<{ model: BimModel; parseResult: IfcParseResult }> {
    const { name, schemaLOD, ...parseOptions } = options;

    const parseResult = parseIfcFile(buffer, parseOptions);

    const model = await this.importModel({
      projectId,
      name: name || filename.replace(/\.(ifc|IFC)$/, ''),
      filename,
      ifcVersion: parseResult.ifcVersion as BimModel['ifcVersion'],
      elements: parseResult.elements,
      schemaLOD,
    });

    this._events.emit('blueprin:bim:model:imported:ifc', {
      model,
      parseResult: {
        totalEntities: parseResult.totalEntities,
        parsedEntities: parseResult.parsedEntities,
        storeys: parseResult.storeys,
        materials: parseResult.materials,
        parseTimeMs: parseResult.parseTimeMs,
      },
    });

    return { model, parseResult };
  }

  async calculateTakeoff(modelId: string): Promise<BimModelSummary> {
    const model = await this.getModel(modelId);
    if (!model) throw new Error(`BIM Model "${modelId}" not found`);

    return BimEngine.calculateSummary(model);
  }

  async exportToBoQ(modelId: string) {
    const model = await this.getModel(modelId);
    if (!model) throw new Error(`BIM Model "${modelId}" not found`);

    const boq = BimEngine.exportToBoQ(model);
    this._events.emit('blueprin:bim:exported:boq', { modelId, count: boq.length });
    return boq;
  }

  async deleteModel(id: string): Promise<boolean> {
    const models = await this.listModels();
    const filtered = models.filter((m) => m.id !== id);
    if (filtered.length === models.length) return false;

    await this._storage.set('bim_models', filtered);
    this._events.emit('blueprin:bim:model:deleted', { modelId: id });
    return true;
  }
}
