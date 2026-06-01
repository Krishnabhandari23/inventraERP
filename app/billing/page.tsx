'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { GlassPanel } from '@/components/GlassPanel';
import { BrandButton } from '@/components/BrandButton';
import { billingService, Subscription, usageService } from '@/lib/api';

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setActionError(null);
      const subData = await billingService.getSubscription();
      let usageData: any = null;
      try {
        usageData = await usageService.getStats();
      } catch (usageErr) {
        console.warn('Usage stats unavailable:', usageErr);
      }
      setSubscription(subData);
      setUsage(usageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
      console.error('Failed to load billing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'starter' | 'growth' | 'enterprise') => {
    try {
      setIsUpgrading(true);
      setActionError(null);
      const { url } = await billingService.createCheckout(plan);
      window.location.href = url;
    } catch (err) {
      console.error('Failed to create checkout:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsManaging(true);
      setActionError(null);
      const { url } = await billingService.createPortal();
      window.location.href = url;
    } catch (err) {
      console.error('Failed to create portal session:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setIsManaging(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-textc-secondary">Loading billing information...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <header className="flex items-center gap-3 water-in">
          <h1 className="text-xl font-semibold">Billing & Plans</h1>
        </header>
        <GlassPanel>
          <div className="text-center py-8">
            <p className="text-rose-400 mb-4">{error}</p>
            <BrandButton onClick={loadBillingData}>Retry</BrandButton>
          </div>
        </GlassPanel>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 water-in">
        <h1 className="text-xl font-semibold">Billing & Plans</h1>
        <div className="flex-1" />
        <BrandButton onClick={loadBillingData}>Refresh</BrandButton>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassPanel>
          <div className="text-sm font-medium mb-2">Current Plan</div>
          <div className="text-lg font-semibold capitalize">{subscription?.plan || 'Free'}</div>
          <div className="text-sm text-textc-secondary mt-1">
            Status: <span className="capitalize">{subscription?.status || 'active'}</span>
          </div>
          {subscription?.currentPeriodEnd && (
            <div className="text-xs text-textc-muted mt-1">
              Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </div>
          )}
          <button
            onClick={handleManageSubscription}
            disabled={isManaging}
            className="mt-3 px-3 py-2 text-sm rounded-md border border-borderc-soft disabled:opacity-50"
          >
            {isManaging ? 'Opening Portal...' : 'Manage Subscription'}
          </button>
        </GlassPanel>

        <GlassPanel>
          <div className="text-sm font-medium mb-2">Usage Stats</div>
          {usage ? (
            <div className="space-y-1 text-sm">
              <div>Total Events: {usage.totalEvents || 0}</div>
              <div className="text-textc-secondary">This Period</div>
            </div>
          ) : (
            <div className="text-sm text-textc-secondary">No usage data available</div>
          )}
        </GlassPanel>

        <GlassPanel>
          <div className="text-sm font-medium mb-2">Upgrade</div>
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>Higher limits</li>
            <li>Priority support</li>
            <li>Advanced approvals</li>
          </ul>
          <button 
            onClick={() => handleUpgrade('enterprise')}
            disabled={isUpgrading}
            className="mt-3 px-3 py-2 text-sm rounded-md text-white bg-[color:var(--color-brand-solid)]"
          >
            {isUpgrading ? 'Creating Checkout...' : 'Upgrade to Enterprise'}
          </button>
        </GlassPanel>
      </div>

      {actionError && (
        <GlassPanel>
          <p className="text-sm text-rose-400">{actionError}</p>
        </GlassPanel>
      )}
    </AppShell>
  );
}
