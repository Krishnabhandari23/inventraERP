'use client';
import { useEffect, useMemo, useState } from 'react';
import { approvalsService } from '@/lib/api';
import { useToast } from '@/components/Toast';

type Step = { id: number; label: string; role: string; condition?: string };
type PendingApproval = {
  id: string;
  title?: string;
  entityName?: string;
  requestedBy?: string;
  amount?: number;
  status?: string;
};

export function ApprovalsBuilder() {
  const { push } = useToast();
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, label: 'Manager Review', role: 'manager' },
    { id: 2, label: 'Finance Approval', role: 'finance', condition: 'value > 500000' },
  ]);
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [flowStatus, setFlowStatus] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const hasInvalidSteps = useMemo(
    () => steps.some((s) => !s.label.trim() || !s.role.trim()),
    [steps],
  );

  async function loadPendingApprovals() {
    try {
      setIsLoadingPending(true);
      const data = await approvalsService.getPending();
      setPending(Array.isArray(data) ? (data as unknown as PendingApproval[]) : []);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
      setActionStatus('Failed to load pending approvals.');
      push({ title: 'Load failed', description: 'Failed to load pending approvals.', tone: 'error' });
      setPending([]);
    } finally {
      setIsLoadingPending(false);
    }
  }

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  function addStep() {
    setSteps((s) => [...s, { id: Date.now(), label: 'New Step', role: 'manager' }]);
    setFlowStatus(null);
  }

  function updateStep(id: number, patch: Partial<Step>) {
    setSteps((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setFlowStatus(null);
  }

  function removeStep(id: number) {
    setSteps((all) => all.filter((s) => s.id !== id));
    setFlowStatus(null);
  }

  function saveFlow() {
    if (hasInvalidSteps) {
      setFlowStatus('Please fill label and role for all steps before saving.');
      push({ title: 'Flow not saved', description: 'Please fill label and role for all steps.', tone: 'warning' });
      return;
    }
    setFlowStatus(`Flow saved with ${steps.length} step${steps.length === 1 ? '' : 's'}.`);
    push({ title: 'Flow saved', description: `Saved ${steps.length} step${steps.length === 1 ? '' : 's'}.`, tone: 'success' });
  }

  async function approveRequest(id: string) {
    try {
      setProcessingId(id);
      setActionStatus(null);
      await approvalsService.approve(id, 'Approved from approvals tab');
      setPending((all) => all.filter((item) => item.id !== id));
      setActionStatus(`Request ${id} approved.`);
      push({ title: 'Approval confirmed', description: `Request ${id} approved.`, tone: 'success' });
    } catch (error) {
      console.error('Approve failed:', error);
      setActionStatus(error instanceof Error ? error.message : 'Failed to approve request.');
      push({
        title: 'Approval failed',
        description: error instanceof Error ? error.message : 'Failed to approve request.',
        tone: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  }

  async function rejectRequest(id: string) {
    const reason = window.prompt('Enter rejection reason');
    if (!reason || !reason.trim()) return;

    try {
      setProcessingId(id);
      setActionStatus(null);
      await approvalsService.reject(id, reason.trim());
      setPending((all) => all.filter((item) => item.id !== id));
      setActionStatus(`Request ${id} rejected.`);
      push({ title: 'Request rejected', description: `Request ${id} rejected.`, tone: 'warning' });
    } catch (error) {
      console.error('Reject failed:', error);
      setActionStatus(error instanceof Error ? error.message : 'Failed to reject request.');
      push({
        title: 'Reject failed',
        description: error instanceof Error ? error.message : 'Failed to reject request.',
        tone: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="rounded-2xl p-4 border border-borderc-soft bg-bg-elevated">
      <div className="flex items-center">
        <div className="text-sm font-medium">Approval Flow</div>
        <div className="flex-1" />
        <button className="text-xs underline" onClick={addStep}>Add Step</button>
      </div>
      <ol className="mt-3 space-y-3">
        {steps.map((s, i) => (
          <li key={s.id} className="rounded-xl p-3 border border-borderc-soft bg-bg-subtle">
            <div className="flex items-center gap-2">
              <div className="text-xs text-textc-muted">Step {i + 1}</div>
              <div className="flex-1" />
              <button
                onClick={() => removeStep(s.id)}
                className="text-xs px-2 py-1 rounded border border-borderc-soft"
              >
                Remove
              </button>
            </div>
            <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                value={s.label}
                onChange={(e) => updateStep(s.id, { label: e.target.value })}
                className="rounded-md border border-borderc-soft bg-bg-elevated px-2 py-1 text-sm"
              />
              <select
                value={s.role}
                onChange={(e) => updateStep(s.id, { role: e.target.value })}
                className="rounded-md border border-borderc-soft bg-bg-elevated px-2 py-1 text-sm"
              >
                <option value="manager">Manager</option>
                <option value="finance">Finance</option>
                <option value="owner">Owner</option>
                <option value="qc">QC</option>
              </select>
              <input
                placeholder="Condition (optional)"
                value={s.condition || ''}
                onChange={(e) => updateStep(s.id, { condition: e.target.value })}
                className="rounded-md border border-borderc-soft bg-bg-elevated px-2 py-1 text-sm"
              />
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={saveFlow}
          className="px-3 py-2 text-sm rounded-md text-white bg-[color:var(--color-brand-solid)]"
        >
          Save Flow
        </button>
        <button
          onClick={() => {
            setSteps([
              { id: 1, label: 'Manager Review', role: 'manager' },
              { id: 2, label: 'Finance Approval', role: 'finance', condition: 'value > 500000' },
            ]);
            setFlowStatus('Flow reset to default steps.');
            push({ title: 'Flow reset', description: 'Approval flow reset to default steps.', tone: 'info' });
          }}
          className="px-3 py-2 text-sm rounded-md border border-borderc-soft"
        >
          Reset
        </button>
      </div>

      {flowStatus && <p className="mt-2 text-xs text-textc-secondary">{flowStatus}</p>}

      <div className="mt-6 border-t border-borderc-soft pt-4">
        <div className="text-sm font-medium">Pending Confirmations</div>
        {isLoadingPending ? (
          <p className="mt-2 text-xs text-textc-secondary">Loading pending approvals...</p>
        ) : pending.length === 0 ? (
          <p className="mt-2 text-xs text-textc-secondary">No pending approval requests.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {pending.map((p) => (
              <div key={p.id} className="rounded-xl p-3 border border-borderc-soft bg-bg-subtle">
                <div className="text-xs text-textc-muted">{p.id}</div>
                <div className="text-sm font-medium mt-1">{p.title || p.entityName || 'Approval Request'}</div>
                <div className="text-xs text-textc-secondary mt-1">
                  Requested by {p.requestedBy || 'unknown'}
                  {typeof p.amount === 'number' ? ` • Amount: ${p.amount}` : ''}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => approveRequest(p.id)}
                    disabled={processingId === p.id}
                    className="px-3 py-1.5 text-xs rounded-md bg-green-600 text-white disabled:opacity-50"
                  >
                    {processingId === p.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => rejectRequest(p.id)}
                    disabled={processingId === p.id}
                    className="px-3 py-1.5 text-xs rounded-md bg-rose-600 text-white disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {actionStatus && <p className="mt-2 text-xs text-textc-secondary">{actionStatus}</p>}
    </div>
  );
}
