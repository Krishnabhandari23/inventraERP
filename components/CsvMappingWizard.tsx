'use client';
import { useEffect, useMemo, useState } from 'react';

type Mapping = Record<string, string>;

const FIELD_ALIASES: Record<string, string[]> = {
  sku: ['sku', 'item_code', 'itemcode', 'code', 'item', 'item id', 'item_id'],
  name: ['name', 'description', 'item_name', 'itemname', 'product', 'title'],
  uom: ['uom', 'unit', 'unit_of_measure', 'unit of measure'],
  onHand: ['onhand', 'on_hand', 'qty', 'quantity', 'stock', 'balance'],
  coverDays: ['coverdays', 'covered_days', 'cover_days', 'days', 'reorder_days'],
};

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getDefaultMapping(sampleHeaders: string[], fields: string[]) {
  const normalizedHeaders = sampleHeaders.map((h) => ({
    raw: h,
    normalized: normalizeHeader(h),
  }));

  const mapping: Mapping = Object.fromEntries(fields.map((f) => [f, '']));

  fields.forEach((field) => {
    const aliases = FIELD_ALIASES[field] || [field];
    const normalizedAliases = aliases.map((a) => normalizeHeader(a));
    const match = normalizedHeaders.find((header) => normalizedAliases.includes(header.normalized));
    if (match) {
      mapping[field] = match.raw;
    }
  });

  return mapping;
}

export function CsvMappingWizard({
  sampleHeaders,
  onImport,
  importing = false,
  rowCount = 0,
}: {
  sampleHeaders: string[];
  onImport?: (mapping: Mapping) => void;
  importing?: boolean;
  rowCount?: number;
}) {
  const fields = ['sku', 'name', 'uom', 'onHand', 'coverDays'];
  const [map, setMap] = useState<Mapping>(() => getDefaultMapping(sampleHeaders, fields));

  useEffect(() => {
    setMap(getDefaultMapping(sampleHeaders, fields));
  }, [sampleHeaders]);

  const missingFields = useMemo(() => fields.filter((f) => !map[f]), [fields, map]);
  const canImport = missingFields.length === 0;

  return (
    <div className="rounded-2xl p-4 border border-borderc-soft bg-bg-elevated">
      <div className="text-sm font-medium">Map CSV Columns</div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2">
        {fields.map(f => (
          <div key={f}>
            <div className="small text-textc-secondary mb-1">{f}</div>
            <select value={map[f]} onChange={e=>setMap(s=>({ ...s, [f]: e.target.value }))}
              className="w-full rounded-md border border-borderc-soft bg-bg-elevated px-2 py-2 text-sm">
              <option value="">— Select —</option>
              {sampleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        ))}
      </div>
      {missingFields.length > 0 && (
        <p className="mt-2 text-xs text-textc-secondary">
          Map required fields to continue: {missingFields.join(', ')}
        </p>
      )}
      <div className="mt-3">
        <button
          disabled={!canImport || importing}
          onClick={() => onImport?.(map)}
          className="px-3 py-2 text-sm rounded-md border border-borderc-soft disabled:opacity-50"
        >
          {importing ? 'Importing...' : rowCount > 0 ? `Import ${rowCount} Rows` : 'Import CSV'}
        </button>
      </div>
    </div>
  );
}
