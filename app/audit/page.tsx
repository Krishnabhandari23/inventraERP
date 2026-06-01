'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { GlassPanel } from '@/components/GlassPanel';
import { BrandButton } from '@/components/BrandButton';
import { auditService, AuditLog } from '@/lib/api';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await auditService.getLogs({ limit: 50 });
      setLogs(response.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-textc-secondary">Loading audit logs...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <header className="flex items-center gap-3 water-in">
          <h1 className="text-xl font-semibold">Audit Trail</h1>
        </header>
        <GlassPanel>
          <div className="text-center py-8">
            <p className="text-rose-400 mb-4">{error}</p>
            <BrandButton onClick={loadLogs}>Retry</BrandButton>
          </div>
        </GlassPanel>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 water-in">
        <h1 className="text-xl font-semibold">Audit Trail</h1>
        <div className="flex-1" />
        <BrandButton onClick={loadLogs}>Refresh</BrandButton>
      </header>

      <GlassPanel>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-textc-secondary">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-textc-secondary">
                  <th className="py-2">Time</th>
                  <th className="py-2">Actor</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Entity</th>
                  <th className="py-2">Entity ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-borderc-soft">
                    <td className="py-2">{new Date(log.at).toLocaleString()}</td>
                    <td className="py-2">{log.actor}</td>
                    <td className="py-2">{log.action}</td>
                    <td className="py-2">{log.entity}</td>
                    <td className="py-2 font-mono text-xs">{log.entityId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </AppShell>
  );
}
