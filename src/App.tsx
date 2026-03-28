import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  GlobalNav,
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
  Separator,
} from '@haderach/shared-ui';
import { Controls } from './Controls';
import { VendorFilters } from './VendorFilters';
import { SpendDataView } from './SpendDataView';
import { VendorList } from './VendorList';
import { ChatPanel } from './ChatPanel';
import { ChatToggle } from './ChatToggle';
import { useAuthUser } from './auth/AuthUserContext';
import { useVendors } from './useVendors';
import { fetchVendorSpend } from './fetchVendorSpend';
import type { SpendRow } from './types';
import './App.css';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function sixMonthsAgoISO(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function resolveEffectiveVendorIds(
  vendors: import('./types').VendorInfo[],
  allowedDepartments: string[],
  allowedVendorIds: string[],
  deniedVendorIds: string[],
): Set<string> {
  const deptSet = new Set(allowedDepartments)
  const denied = new Set(deniedVendorIds)
  const ids = new Set<string>()

  for (const v of vendors) {
    if (v.department && deptSet.has(v.department)) {
      ids.add(v.id)
    }
  }
  for (const id of allowedVendorIds) {
    ids.add(id)
  }
  for (const id of denied) {
    ids.delete(id)
  }
  return ids
}

export function App() {
  const { vendors, loading: vendorsLoading, error: vendorsError, refresh: refreshVendors } = useVendors();
  const authUser = useAuthUser();

  const accessibleVendors = useMemo(() => {
    if (authUser.isFinanceAdmin) return vendors;
    const effectiveIds = resolveEffectiveVendorIds(
      vendors,
      authUser.allowedDepartments,
      authUser.allowedVendorIds,
      authUser.deniedVendorIds,
    );
    return vendors.filter((v) => effectiveIds.has(v.id));
  }, [vendors, authUser.isFinanceAdmin, authUser.allowedDepartments, authUser.allowedVendorIds, authUser.deniedVendorIds]);

  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState(sixMonthsAgoISO);
  const [dateTo, setDateTo] = useState(todayISO);
  const [rows, setRows] = useState<SpendRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState<string | null>(null);
  const [view, setView] = useState<'spending' | 'vendors'>('vendors');
  const [chatOpen, setChatOpen] = useState(false);
  const [editVendorId, setEditVendorId] = useState<string | null>(null);

  const initialized = useRef(false);
  const prevVendorIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (vendorsLoading || accessibleVendors.length === 0) return;

    const currentIds = new Set(accessibleVendors.map((v) => v.id));

    if (!initialized.current) {
      initialized.current = true;
      setSelectedVendors([...currentIds]);
      prevVendorIds.current = currentIds;
      return;
    }

    const newIds = [...currentIds].filter((id) => !prevVendorIds.current.has(id));
    if (newIds.length > 0) {
      setSelectedVendors((prev) => [...prev, ...newIds]);
    }
    prevVendorIds.current = currentIds;
  }, [vendorsLoading, accessibleVendors]);

  const filteredVendors = useMemo(
    () => accessibleVendors.filter((v) => selectedVendors.includes(v.id)),
    [accessibleVendors, selectedVendors],
  );

  const effectiveVendorIdSet = useMemo(() => {
    if (authUser.isFinanceAdmin) return null;
    return resolveEffectiveVendorIds(
      vendors,
      authUser.allowedDepartments,
      authUser.allowedVendorIds,
      authUser.deniedVendorIds,
    );
  }, [vendors, authUser.isFinanceAdmin, authUser.allowedDepartments, authUser.allowedVendorIds, authUser.deniedVendorIds]);

  const handleFetch = useCallback(async () => {
    if (selectedVendors.length === 0) {
      setError('Please select at least one vendor.');
      return;
    }
    if (!dateFrom || !dateTo) {
      setError('Please select both a start and end date.');
      return;
    }
    if (dateFrom > dateTo) {
      setError("'From' date must be on or before 'To' date.");
      return;
    }

    setError(null);
    setNoData(null);
    setRows([]);
    setLoading(true);

    try {
      const data = await fetchVendorSpend(selectedVendors, accessibleVendors, dateFrom, dateTo, effectiveVendorIdSet);

      if (data.length === 0) {
        setNoData('No spend data found for the selected vendors in that date range.');
        return;
      }

      setRows(data);
    } catch (err) {
      setError(`Error fetching spend: ${err instanceof Error ? err.message : err}`);
    } finally {
      setLoading(false);
    }
  }, [selectedVendors, accessibleVendors, dateFrom, dateTo, effectiveVendorIdSet]);

  return (
    <div className="app-shell">
      <GlobalNav
        apps={authUser.accessibleApps}
        adminApps={authUser.accessibleAdminApps}
        activeAppId="vendors"
        userEmail={authUser.email}
        userPhotoURL={authUser.photoURL}
        userDisplayName={authUser.displayName}
        onSignOut={authUser.signOut}
        logo={
          <img
            className="h-12 w-auto"
            src="/assets/landing/logo.svg"
            alt="Haderach"
          />
        }
      />

      <SidebarProvider className="min-h-0 flex-1">
        <Sidebar collapsible="offcanvas">
          <SidebarContent>
            <SidebarGroup className="pt-14">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={view === 'vendors'} onClick={() => setView('vendors')}>
                    Vendors
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={view === 'spending'} onClick={() => setView('spending')}>
                    Spending
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <Separator className="mx-2" />

            <SidebarGroup className="pt-2">
              <SidebarGroupContent>
                {view === 'spending' ? (
                  <Controls
                    vendors={accessibleVendors}
                    selectedVendors={selectedVendors}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    loading={loading}
                    onVendorsChange={setSelectedVendors}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateTo}
                    onFetch={handleFetch}
                  />
                ) : (
                  <div className="flex flex-col gap-3 px-2">
                    <VendorFilters
                      vendors={accessibleVendors}
                      selectedVendors={selectedVendors}
                      onVendorsChange={setSelectedVendors}
                    />
                  </div>
                )}
                {error && <div className="error">{error}</div>}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="overflow-hidden">
          <div className="flex h-full min-w-0">
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="flex h-12 items-center gap-2 border-b px-4">
                <SidebarTrigger />
                <Separator orientation="vertical" className="h-4" />
            <h1 className="text-lg font-semibold">
              Vendor Management
            </h1>
                <div className="ml-auto">
                  <ChatToggle open={chatOpen} onToggle={() => setChatOpen((o) => !o)} />
                </div>
              </header>

              <div className="display-panel">
                {vendorsError && (
                  <div className="p-4 text-sm text-red-600 bg-red-50 rounded m-4">
                    Firestore error: {vendorsError}
                  </div>
                )}
                {view === 'spending' && (
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {noData && <p className="no-data">{noData}</p>}
                    <SpendDataView rows={rows} />
                  </div>
                )}
                {view === 'vendors' && (
                  <VendorList
                    vendors={filteredVendors}
                    editVendorId={editVendorId}
                    onEditDone={() => { setEditVendorId(null); refreshVendors(); }}
                  />
                )}
              </div>
            </div>

            <ChatPanel
              open={chatOpen}
              onClose={() => setChatOpen(false)}
              onVendorsChanged={refreshVendors}
              onEditVendor={(id) => { setView('vendors'); setEditVendorId(id); }}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
