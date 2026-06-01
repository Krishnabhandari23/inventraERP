'use client';
import { useEffect, useState } from 'react';
import { AppShell } from "@/components/AppShell";
import { GlassPanel } from "@/components/GlassPanel";
import { BrandButton } from "@/components/BrandButton";
import { Modal } from "@/components/Modal";
import { TextInput, Select } from "@/components/Inputs";
import { productionService, ProductionJob } from '@/lib/api';

type FormData = {
  productId: string;
  productName: string;
  quantity: string;
  startDate: string;
  endDate: string;
  assignedTo: string;
  notes: string;
};

export default function ProductionPage() {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [formData, setFormData] = useState<FormData>({
    productId: '',
    productName: '',
    quantity: '',
    startDate: '',
    endDate: '',
    assignedTo: '',
    notes: '',
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await productionService.getJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load production jobs');
      console.error('Failed to load production jobs:', err);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!formData.productName || !formData.quantity || !formData.startDate) {
      alert('Please fill in product name, quantity, and start date');
      return;
    }

    try {
      setIsSubmitting(true);
      const jobData = {
        productId: formData.productId || `PROD-${Date.now()}`,
        productName: formData.productName,
        quantity: Number(formData.quantity),
        status: 'planned' as const,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        assignedTo: formData.assignedTo || undefined,
        materials: [],
        notes: formData.notes || undefined,
      };

      await productionService.createJob(jobData);
      await loadJobs();
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create job:', err);
      alert('Failed to create production job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (jobId: string, newStatus: ProductionJob['status']) => {
    try {
      await productionService.updateJobStatus(jobId, newStatus);
      await loadJobs();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId: string, jobNumber: string) => {
    if (!confirm(`Delete job ${jobNumber}?`)) return;

    try {
      await productionService.deleteJob(jobId);
      await loadJobs();
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert('Failed to delete production job');
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      productName: '',
      quantity: '',
      startDate: '',
      endDate: '',
      assignedTo: '',
      notes: '',
    });
    setSelectedJob(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'planned':
        return 'bg-amber-500';
      case 'on-hold':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-textc-secondary">Loading production jobs...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <header className="flex items-center gap-3 water-in">
          <h1 className="text-xl font-semibold">Production Planning</h1>
        </header>
        <GlassPanel>
          <div className="text-center py-8">
            <p className="text-rose-400 mb-4">{error}</p>
            <BrandButton onClick={loadJobs}>Retry</BrandButton>
          </div>
        </GlassPanel>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 water-in">
        <h1 className="text-xl font-semibold">Production Planning</h1>
        <div className="flex-1" />
        <BrandButton onClick={loadJobs}>Refresh</BrandButton>
        <BrandButton onClick={handleOpenCreate}>Create Work Order</BrandButton>
      </header>

      <GlassPanel>
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-textc-secondary">
            No production jobs found. Create your first work order to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {jobs.map(job => (
              <div key={job.id} className="rounded-xl p-4 border border-borderc-soft bg-bg-elevated water-in group relative">
                <div className="text-xs text-textc-muted">{job.jobNumber}</div>
                <div className="text-base font-medium mt-1">{job.productName}</div>
                <div className="text-sm text-textc-secondary mt-1">Qty: {job.quantity}</div>
                
                <div className="mt-2 flex items-center gap-2">
                  <Select 
                    value={job.status}
                    onChange={(e) => handleUpdateStatus(job.id, e.target.value as ProductionJob['status'])}
                    className="text-xs"
                  >
                    <option value="planned">Planned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                  
                  {job.progress > 0 && (
                    <span className="text-xs text-textc-secondary">{job.progress}%</span>
                  )}
                </div>

                {job.assignedTo && (
                  <div className="text-xs text-textc-muted mt-2">
                    Assigned: {job.assignedTo}
                  </div>
                )}

                <div className="text-xs text-textc-muted mt-2">
                  Start: {new Date(job.startDate).toLocaleDateString()}
                </div>

                <button
                  onClick={() => handleDeleteJob(job.id, job.jobNumber)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded bg-rose-500/10"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      <Modal open={open} onClose={() => { setOpen(false); resetForm(); }} title="New Work Order">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="small text-textc-secondary mb-1">Product Name *</div>
            <TextInput 
              placeholder="e.g., T-Shirt Black L" 
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            />
          </div>
          <div>
            <div className="small text-textc-secondary mb-1">Quantity *</div>
            <TextInput 
              type="number" 
              placeholder="e.g., 1200" 
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
          <div>
            <div className="small text-textc-secondary mb-1">Start Date *</div>
            <TextInput 
              type="date" 
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div>
            <div className="small text-textc-secondary mb-1">End Date</div>
            <TextInput 
              type="date" 
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <div className="small text-textc-secondary mb-1">Assigned To</div>
            <TextInput 
              placeholder="e.g., Team A" 
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <div className="small text-textc-secondary mb-1">Notes</div>
            <textarea 
              className="w-full px-3 py-2 rounded-md border border-borderc-soft bg-bg-base text-sm"
              rows={3}
              placeholder="Add any special instructions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button 
            onClick={() => { setOpen(false); resetForm(); }}
            className="px-3 py-2 text-sm rounded-md border border-borderc-soft"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleCreateJob}
            disabled={isSubmitting}
            className="px-3 py-2 text-sm rounded-md text-white bg-[color:var(--color-brand-solid)] quantum-snap disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}
