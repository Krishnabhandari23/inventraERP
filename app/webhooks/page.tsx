'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { GlassPanel } from '@/components/GlassPanel';
import { BrandButton } from '@/components/BrandButton';
import { TextInput, Select } from '@/components/Inputs';
import { webhooksService, WebhookLog } from '@/lib/api';

export default function WebhooksPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [limitFilter, setLimitFilter] = useState<string>('50');

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await webhooksService.getLogs({
        source: sourceFilter || undefined,
        limit: Number(limitFilter) || 50,
        search: searchFilter || undefined,
      });
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhook logs');
      console.error('Failed to load webhook logs:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [sourceFilter, limitFilter]);

  return (
    <AppShell>
      <header className="flex items-center gap-3 water-in">
        <h1 className="text-xl font-semibold">Webhook Logs</h1>
        <div className="flex-1" />
        <BrandButton onClick={loadLogs}>Refresh</BrandButton>
      </header>

      <GlassPanel>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">All Sources</option>
            <option value="inventra">Inventra</option>
            <option value="stripe">Stripe</option>
            <option value="custom">Custom</option>
          </Select>

          <Select value={limitFilter} onChange={(e) => setLimitFilter(e.target.value)}>
            <option value="20">Last 20</option>
            <option value="50">Last 50</option>
            <option value="100">Last 100</option>
          </Select>

          <TextInput
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
            placeholder="Search event or payload..."
          />

          <BrandButton onClick={loadLogs}>Apply Filters</BrandButton>
        </div>
      </GlassPanel>

      {isLoading ? (
        <GlassPanel>
          <div className="text-center py-8 text-textc-secondary">Loading webhook logs...</div>
        </GlassPanel>
      ) : error ? (
        <GlassPanel>
          <div className="text-center py-8">
            <p className="text-rose-400 mb-4">{error}</p>
            <BrandButton onClick={loadLogs}>Retry</BrandButton>
          </div>
        </GlassPanel>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-borderc-soft bg-bg-elevated p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-textc-secondary">
                <th className="py-2">Time</th>
                <th className="py-2">Source</th>
                <th className="py-2">Event</th>
                <th className="py-2">Payload</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td className="py-4 text-textc-secondary" colSpan={4}>No webhook logs found for the selected filters.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-borderc-soft align-top">
                    <td className="py-2">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-2">{log.source}</td>
                    <td className="py-2">{log.event}</td>
                    <td className="py-2 whitespace-pre-wrap max-w-[640px]">
                      {typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
