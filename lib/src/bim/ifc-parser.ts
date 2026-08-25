/**
 * @alvinahmad/blueprin-sdk - IFC Parser
 *
 * Parses IFC (Industry Foundation Classes) files and extracts BIM elements
 * with their geometric properties, materials, and spatial hierarchy.
 *
 * Supports IFC2X3, IFC4, and IFC4X3 formats.
 * Uses regex-based entity extraction with property set resolution.
 */

import type { BimElement, BimElementType, BimDimensions } from './types.js';

/** IFC entity types we extract */
const SUPPORTED_IFC_TYPES: Record<string, BimElementType> = {
  IFCWALL: 'IfcWall',
  IFCWALLSTANDARDCASE: 'IfcWallStandardCase',
  IFCSLAB: 'IfcSlab',
  IFCBEAM: 'IfcBeam',
  IFCCOLUMN: 'IfcColumn',
  IFCDOOR: 'IfcDoor',
  IFCWINDOW: 'IfcWindow',
  IFCROOF: 'IfcRoof',
  IFCSTAIR: 'IfcStair',
  IFCRAILING: 'IfcRailing',
  IFCFOOTING: 'IfcFooting',
  IFCPIPE: 'IfcPipe',
  IFCDUCT: 'IfcDuct',
  IFCCOVERING: 'IfcCovering',
  IFCSPACE: 'IfcSpace',
  IFCBUILDINGELEMENTPROXY: 'IfcBuildingElementProxy',
  IFCMEMBER: 'IfcMember',
  IFCCURTAINWALL: 'IfcCurtainWall',
  IFCPLATE: 'IfcPlate',
  IFCFLOWSEGMENT: 'IfcFlowSegment',
  IFCDISTRIBUTIONPORT: 'IfcDistributionPort',
};

/** Map IFC type to default unit */
function defaultUnitForType(ifcType: string): string {
  const volumeTypes = ['IFCWALL', 'IFCWALLSTANDARDCASE', 'IFCSLAB', 'IFCBEAM', 'IFCCOLUMN', 'IFCROOF', 'IFCFOOTING', 'IFCCOVERING', 'IFCBUILDINGELEMENTPROXY'];
  const areaTypes = ['IFCDOOR', 'IFCWINDOW', 'IFCPLATE', 'IFCCURTAINWALL'];
  const lengthTypes = ['IFCPIPE', 'IFCDUCT', 'IFCRAILING', 'IFCMEMBER', 'IFCFLOWSEGMENT'];

  if (volumeTypes.includes(ifcType)) return 'm3';
  if (areaTypes.includes(ifcType)) return 'm2';
  if (lengthTypes.includes(ifcType)) return 'm';
  return 'unit';
}

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
export function parseIfcFile(
  buffer: ArrayBuffer | Uint8Array,
  options: IfcParseOptions = {}
): IfcParseResult {
  const startTime = Date.now();
  const {
    extractProperties = true,
    extractMaterials = true,
    extractSpatial = true,
    filterTypes,
  } = options;

  const text = new TextDecoder('utf-8').decode(
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  );

  // Detect IFC version
  const ifcVersion = detectIfcVersion(text);

  // Phase 1: Extract spatial structure (storeys)
  const storeyMap = extractSpatial ? extractStoreyHierarchy(text) : new Map<string, string>();

  // Phase 2: Extract materials
  const materialMap = extractMaterials ? extractMaterials_(text) : new Map<string, string>();

  // Phase 3: Extract property sets
  const psetMap = extractProperties ? extractPropertySets(text) : new Map<string, Record<string, string | number | boolean>>();

  // Phase 4: Extract geometry data (IfcExtrudedAreaSolid, IfcBoundingBox, etc.)
  const geometryMap = extractGeometryData(text);

  // Phase 5: Extract main entities
  const elements = extractEntities(text, storeyMap, materialMap, psetMap, geometryMap, filterTypes);

  const parseTimeMs = Date.now() - startTime;

  return {
    elements,
    ifcVersion,
    totalEntities: countAllEntities(text),
    parsedEntities: elements.length,
    storeys: [...new Set(elements.map(e => e.storey).filter((s): s is string => Boolean(s)))],
    materials: [...new Set(elements.map(e => e.material).filter((m): m is string => Boolean(m)))],
    parseTimeMs,
  };
}

/**
 * Detect IFC file version from header
 */
function detectIfcVersion(text: string): string {
  const versionMatch = text.match(/FILE_SCHEMA\s*\(\s*\(([^)]+)\)/i);
  if (versionMatch) {
    const schema = versionMatch[1].trim().replace(/'/g, '');
    if (schema.includes('IFC4X3')) return 'IFC4X3';
    if (schema.includes('IFC4')) return 'IFC4';
    if (schema.includes('IFC2X3')) return 'IFC2X3';
  }
  return 'IFC2X3';
}

/**
 * Count total IFC entities in the file
 */
function countAllEntities(text: string): number {
  const matches = text.match(/#\d+\s*=/g);
  return matches ? matches.length : 0;
}

/**
 * Extract IfcBuildingStorey hierarchy
 * Maps express ID -> storey name
 */
function extractStoreyHierarchy(text: string): Map<string, string> {
  const storeyMap = new Map<string, string>();

  // Extract IfcBuildingStorey entities
  const storeyPattern = /#(\d+)\s*=\s*IFCBUILDINGSTOREY\s*\([^)]*'([^']*)'/gi;
  let match;
  while ((match = storeyPattern.exec(text)) !== null) {
    storeyMap.set(match[1], match[2]);
  }

  return storeyMap;
}

/**
 * Extract material associations (IfcMaterial, IfcMaterialLayerSetUsage, etc.)
 */
function extractMaterials_(text: string): Map<string, string> {
  const materialMap = new Map<string, string>();

  // IfcMaterial entities: #id=IFCMATERIAL('name');
  const materialPattern = /#(\d+)\s*=\s*IFCMATERIAL\s*\(\s*'([^']*)'/gi;
  let match;
  while ((match = materialPattern.exec(text)) !== null) {
    materialMap.set(match[1], match[2]);
  }

  // IfcMaterialLayerSetUsage -> relates to IfcMaterialLayer
  const layerSetPattern = /#(\d+)\s*=\s*IFCMATERIALLAYERSETUSAGE\s*\(\s*\.\.\.\s*,\s*\.\.\.\s*,\s*#(\d+)/gi;
  const layerToMaterial = new Map<string, string>();

  while ((match = layerSetPattern.exec(text)) !== null) {
    const usageId = match[1];
    const layerSetId = match[2];

    // Find the layer set -> layers -> material
    const layerSetPattern2 = new RegExp(
      `#${layerSetId}\\s*=\\s*IFCMATERIALLAYERSET\\s*\\([^)]*\\)`,
      'gi'
    );
    const layerSetMatch = layerSetPattern2.exec(text);
    if (layerSetMatch) {
      // Extract layer references from the set
      const layerRefs = layerSetMatch[0].match(/#(\d+)/g);
      if (layerRefs) {
        for (const ref of layerRefs) {
          const refId = ref.substring(1);
          if (refId === layerSetId || refId === usageId) continue;

          // Check if this is an IfcMaterialLayer
          const layerPattern = new RegExp(
            `#${refId}\\s*=\\s*IFCMATERIALLAYER\\s*\\([^)]*#(\\d+)`,
            'gi'
          );
          const layerMatch = layerPattern.exec(text);
          if (layerMatch) {
            const matId = layerMatch[1];
            if (materialMap.has(matId)) {
              layerToMaterial.set(usageId, materialMap.get(matId)!);
            }
          }
        }
      }
    }
  }

  // Merge layer materials into main map
  for (const [key, value] of layerToMaterial) {
    materialMap.set(key, value);
  }

  return materialMap;
}

/**
 * Extract property sets (IfcPropertySingleValue, IfcElementQuantity)
 */
function extractPropertySets(text: string): Map<string, Record<string, string | number | boolean>> {
  const psetMap = new Map<string, Record<string, string | number | boolean>>();

  // Find IfcRelDefinesByProperties -> connects elements to property sets
  const relPattern = /#(\d+)\s*=\s*IFCRELDEFINESBYPROPERTIES\s*\(\s*[^,]*,\s*[^,]*,\s*[^,]*,\s*\(([^)]*)\)\s*,\s*#(\d+)/gi;
  let match;

  while ((match = relPattern.exec(text)) !== null) {
    const elementRefs = match[2];
    const psetDefId = match[3];

    // Resolve the property set definition
    const props = resolvePropertySet(text, psetDefId);
    if (props && Object.keys(props).length > 0) {
      // Apply to all referenced elements
      const ids = elementRefs.match(/#(\d+)/g);
      if (ids) {
        for (const id of ids) {
          psetMap.set(id.substring(1), props);
        }
      }
    }
  }

  return psetMap;
}

/**
 * Resolve a property set definition to key-value pairs
 */
function resolvePropertySet(
  text: string,
  psetDefId: string
): Record<string, string | number | boolean> | null {
  const props: Record<string, string | number | boolean> = {};

  // IfcPropertySet -> contains IfcPropertySingleValue
  const psetPattern = new RegExp(
    `#${psetDefId}\\s*=\\s*IFCPROPERTYSET\\s*\\([^)]*\\(([^)]*)\\)`,
    'gi'
  );
  const psetMatch = psetPattern.exec(text);
  if (!psetMatch) return null;

  const propRefs = psetMatch[1].match(/#(\d+)/g);
  if (!propRefs) return null;

  for (const ref of propRefs) {
    const refId = ref.substring(1);

    // IfcPropertySingleValue('name', ..., IfcLabel('value'), ...)
    const svPattern = new RegExp(
      `#${refId}\\s*=\\s*IFCPROPERTYSINGLEVALUE\\s*\\(\\s*'([^']*)'\\s*,[^,]*,\\s*(?:IFC(?:LABEL|REAL|INTEGER|BOOLEAN|LENGTHMEASURE|AREAMEASURE|VOLUMEMEASURE|MASSMEASURE))\\s*\\(\\s*([^)]*)\\s*\\)`,
      'gi'
    );
    const svMatch = svPattern.exec(text);
    if (svMatch) {
      const name = svMatch[1];
      let value: string | number | boolean = svMatch[2].trim().replace(/'/g, '');

      // Try to parse numeric values
      const num = Number(value);
      if (!isNaN(num) && value !== '') {
        value = num;
      } else if (value.toUpperCase() === 'TRUE') {
        value = true;
      } else if (value.toUpperCase() === 'FALSE') {
        value = false;
      }

      props[name] = value;
    }
  }

  return Object.keys(props).length > 0 ? props : null;
}

/**
 * Extract geometry data from IfcExtrudedAreaSolid, IfcBoundingBox, etc.
 */
function extractGeometryData(text: string): Map<string, BimDimensions> {
  const geometryMap = new Map<string, BimDimensions>();

  // IfcExtrudedAreaSolid has depth (height of extrusion)
  const extrudePattern = /#(\d+)\s*=\s*IFCEXTRUDEDAREASOLID\s*\([^)]*#(\d+)[^)]*,[^)]*,[^)]*,#(\d+)/gi;
  let match;

  while ((match = extrudePattern.exec(text)) !== null) {
    const solidId = match[1];
    const depth = parseFloat(match[3]);
    if (!isNaN(depth)) {
      const existing = geometryMap.get(solidId) || {};
      existing.height = depth;
      geometryMap.set(solidId, existing);
    }
  }

  // IfcBoundingBox: Width, Height, Depth
  const bboxPattern = /#(\d+)\s*=\s*IFCBOUNDINGBOX\s*\([^)]*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*,\s*([^)]+)\s*\)/gi;
  while ((match = bboxPattern.exec(text)) !== null) {
    const bboxId = match[1];
    const x = parseFloat(match[2]);
    const y = parseFloat(match[3]);
    const z = parseFloat(match[4]);

    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      geometryMap.set(bboxId, {
        length: Math.max(x, y),
        width: Math.min(x, y),
        height: z,
      });
    }
  }

  return geometryMap;
}

/**
 * Extract main IFC entities (walls, slabs, beams, etc.)
 */
function extractEntities(
  text: string,
  storeyMap: Map<string, string>,
  materialMap: Map<string, string>,
  psetMap: Map<string, Record<string, string | number | boolean>>,
  geometryMap: Map<string, BimDimensions>,
  filterTypes?: BimElementType[]
): BimElement[] {
  const elements: BimElement[] = [];
  const supportedTypes = Object.keys(SUPPORTED_IFC_TYPES);

  // Build regex for all supported types
  const typePattern = supportedTypes.join('|');
  const entityRegex = new RegExp(
    `#(\\d+)\\s*=\\s*(${typePattern})\\s*\\(([^)]*)\\)`,
    'gi'
  );

  let match;
  while ((match = entityRegex.exec(text)) !== null) {
    const expressId = match[1];
    const ifcType = match[2].toUpperCase();
    const data = match[3];

    const elementType = SUPPORTED_IFC_TYPES[ifcType];
    if (!elementType) continue;

    if (filterTypes && !filterTypes.includes(elementType)) continue;

    // Extract GlobalId (first string argument usually)
    const globalId = extractIfcGuid(data);

    // Extract Name
    const name = extractIfcName(data);

    // Try to extract dimensions from property sets or geometry
    const psetProps = psetMap.get(expressId) || {};
    const geoDims = geometryMap.get(expressId);

    const dimensions = resolveDimensions(elementType, psetProps, geoDims);

    // Try to find storey assignment
    const storey = findStoreyForElement(text, expressId, storeyMap);

    // Try to find material
    const material = findMaterialForElement(text, expressId, materialMap);

    elements.push({
      globalId: globalId || `EXP_${expressId}`,
      name: name || `${elementType.replace('Ifc', '')} ${elements.length + 1}`,
      type: elementType,
      storey: storey || 'Unassigned',
      material,
      dimensions,
      properties: Object.keys(psetProps).length > 0 ? psetProps : undefined,
    });
  }

  return elements;
}

/**
 * Extract IFC GUID from entity data (22-char base64 string)
 */
function extractIfcGuid(data: string): string | null {
  // IFC GUID is typically the first quoted string in the entity
  const guidMatch = data.match(/'([A-Za-z0-9_$]{22})'/);
  return guidMatch ? guidMatch[1] : null;
}

/**
 * Extract name from entity data
 */
function extractIfcName(data: string): string | null {
  // Name is usually a quoted string, skip GUIDs
  const parts = data.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      const val = trimmed.slice(1, -1);
      // Skip GUIDs (22 chars, alphanumeric + _ $)
      if (val.length !== 22 || !/^[A-Za-z0-9_$]+$/.test(val)) {
        return val;
      }
    }
  }
  return null;
}

/**
 * Find storey assignment for an element via IfcContainedInSpatialStructure
 */
function findStoreyForElement(
  text: string,
  elementExpressId: string,
  storeyMap: Map<string, string>
): string | undefined {
  // IfcContainedInSpatialStructure connects elements to storeys
  const pattern = new RegExp(
    `#\\d+\\s*=\\s*IFCCONTAINEDINSPATIALSTRUCTURE\\s*\\(\\s*\\(\\s*#${elementExpressId}[^)]*\\)\\s*,\\s*#(\\d+)`,
    'gi'
  );
  const match = pattern.exec(text);
  if (match) {
    const storeyId = match[1];
    return storeyMap.get(storeyId) || undefined;
  }
  return undefined;
}

/**
 * Find material for an element via IfcRelAssociatesMaterial
 */
function findMaterialForElement(
  text: string,
  elementExpressId: string,
  materialMap: Map<string, string>
): string | undefined {
  // IfcRelAssociatesMaterial connects elements to materials
  const pattern = new RegExp(
    `#\\d+\\s*=\\s*IFCRELASSOCIATESMATERIAL\\s*\\([^)]*\\(\\s*#${elementExpressId}[^)]*\\)\\s*,\\s*#(\\d+)`,
    'gi'
  );
  const match = pattern.exec(text);
  if (match) {
    const matId = match[1];
    return materialMap.get(matId) || undefined;
  }
  return undefined;
}

/**
 * Resolve dimensions from property sets and geometry data
 */
function resolveDimensions(
  elementType: BimElementType,
  psetProps: Record<string, string | number | boolean>,
  geoDims?: BimDimensions
): BimDimensions {
  const dims: BimDimensions = { ...geoDims };

  // Try to extract from property sets (common IFC property names)
  const propMappings: Record<string, keyof BimDimensions> = {
    // Length
    'Length': 'length',
    'Reference': 'length',
    'IfcQuantityLength': 'length',
    // Width
    'Width': 'width',
    'NominalWidth': 'width',
    // Height
    'Height': 'height',
    'NominalHeight': 'height',
    // Thickness
    'Thickness': 'thickness',
    'NominalThickness': 'thickness',
    // Area
    'GrossSurfaceArea': 'grossArea',
    'NetSurfaceArea': 'netArea',
    'CrossSectionArea': 'grossArea',
    // Volume
    'GrossVolume': 'grossVolume',
    'NetVolume': 'netVolume',
    'Volume': 'grossVolume',
    // Perimeter
    'Perimeter': 'perimeter',
  };

  for (const [propName, dimKey] of Object.entries(propMappings)) {
    if (psetProps[propName] !== undefined && dims[dimKey] === undefined) {
      const val = Number(psetProps[propName]);
      if (!isNaN(val) && val > 0) {
        dims[dimKey] = val;
      }
    }
  }

  // Calculate derived dimensions if missing
  if (!dims.grossVolume && dims.length && dims.width && dims.height) {
    dims.grossVolume = Math.round(dims.length * dims.width * dims.height * 1000) / 1000;
  }
  if (!dims.grossArea && dims.length && dims.width) {
    dims.grossArea = Math.round(dims.length * dims.width * 1000) / 1000;
  }

  return dims;
}
