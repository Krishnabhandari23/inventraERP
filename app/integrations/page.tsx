'use client';
import { AppShell } from '@/components/AppShell';
import { GlassPanel } from '@/components/GlassPanel';
import { useState } from 'react';
import { CsvMappingWizard } from '@/components/CsvMappingWizard';
import { inventoryService, webhooksService } from '@/lib/api';

type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(current.trim());
      current = '';
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    current += ch;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headers, ...dataRows] = rows;
  return { headers, rows: dataRows.filter((r) => r.some((c) => c !== '')) };
}

export default function IntegrationsPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [csv, setCsv] = useState<ParsedCsv>({
    headers: ['Item Code', 'Description', 'UoM', 'Qty', 'CoverDays'],
    rows: [],
  });
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);

  const handleFileChange = async (file?: File | null) => {
    setFileName(file?.name || null);
    setStatus(null);
    if (!file) {
      setCsv({ headers: ['Item Code', 'Description', 'UoM', 'Qty', 'CoverDays'], rows: [] });
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0) {
        setStatus('Selected file has no usable CSV rows.');
        return;
      }
      setCsv(parsed);
      setStatus(`Loaded ${parsed.rows.length} rows from ${file.name}.`);
    } catch (error) {
      console.error('Failed to parse CSV:', error);
      setStatus('Failed to read CSV file. Please try another file.');
    }
  };

  const handleImport = async (mapping: Record<string, string>) => {
    if (csv.rows.length === 0) {
      setStatus('Please select a CSV file before importing.');
      return;
    }

    const indexByHeader: Record<string, number> = {};
    csv.headers.forEach((h, idx) => {
      indexByHeader[h] = idx;
    });

    setImporting(true);
    setStatus('Import started...');

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of csv.rows) {
      const read = (field: string) => {
        const idx = indexByHeader[mapping[field]];
        return typeof idx === 'number' ? row[idx] || '' : '';
      };

      const sku = read('sku').trim();
      const name = read('name').trim();
      if (!sku || !name) {
        skipped += 1;
        continue;
      }

      const unit = read('uom').trim() || 'pcs';
      const quantity = Number(read('onHand')) || 0;
      const reorderPoint = Number(read('coverDays')) || 0;

      try {
        await inventoryService.create({
          sku,
          name,
          unit,
          quantity,
          reorderPoint,
          description: `Imported from ${fileName || 'CSV import'}`,
        });
        imported += 1;
      } catch (error) {
        failed += 1;
        console.error('Import row failed:', { sku, name, error });
      }
    }

    setImporting(false);
    setStatus(`Import complete: ${imported} imported, ${skipped} skipped, ${failed} failed.`);
  };

  const handleSendTestEvent = async () => {
    setTestingWebhook(true);
    setStatus(null);
    try {
      await webhooksService.sendInventraEvent('integration.test', {
        source: 'integrations-page',
        at: new Date().toISOString(),
        message: 'Manual test event',
      });

      setStatus('Webhook test event sent. Check the Webhooks tab for the new log.');
    } catch (error) {
      console.error('Webhook test failed:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to send test event');
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <AppShell>
      <header className="flex items-center gap-3 water-in">
        <h1 className="text-xl font-semibold">Integrations Hub</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassPanel>
          <div className="text-sm font-medium">Tally / CSV Import</div>
          <p className="text-sm text-textc-secondary mt-1">Import inventory & opening balances from CSV.</p>
          <label className="mt-3 inline-block">
            <input type="file" accept=".csv" className="hidden" onChange={e => handleFileChange(e.target.files?.[0] || null)} />
            <span className="px-3 py-2 text-sm rounded-md border border-borderc-soft cursor-pointer">Select CSV…</span>
          </label>
          {fileName && <div className="text-xs mt-2">Selected: {fileName}</div>}
          <div className="mt-4">
            <CsvMappingWizard
              sampleHeaders={csv.headers}
              onImport={handleImport}
              importing={importing}
              rowCount={csv.rows.length}
            />
          </div>
          {status && <p className="text-xs mt-3 text-textc-secondary">{status}</p>}
        </GlassPanel>

        <GlassPanel>
          <div className="text-sm font-medium">Webhooks</div>
          <p className="text-sm text-textc-secondary mt-1">Receive events (order.created, invoice.paid…).</p>
          <div className="mt-2 text-xs">POST /api/webhooks/inventra</div>
          <div className="mt-1 text-xs">Stripe: /api/webhooks/stripe</div>
          <button
            onClick={handleSendTestEvent}
            disabled={testingWebhook}
            className="mt-3 px-3 py-2 text-sm rounded-md border border-borderc-soft disabled:opacity-50"
          >
            {testingWebhook ? 'Sending...' : 'Send Test Event'}
          </button>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
