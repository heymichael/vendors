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
import { useAuthUser } from './auth/AuthUserContext';
import { useVendors } from './useVendors';
import type { SpendRow, SpendResponse, SpendErrorResponse } from './types';
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

export function App() {
  const { vendors, loading: vendorsLoading, error: vendorsError } = useVendors();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState(sixMonthsAgoISO);
  const [dateTo, setDateTo] = useState(todayISO);
  const [rows, setRows] = useState<SpendRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState<string | null>(null);
  const [view, setView] = useState<'spending' | 'vendors'>('vendors');

  const initialized = useRef(false);
  useEffect(() => {
    if (!vendorsLoading && vendors.length > 0 && !initialized.current) {
      initialized.current = true;
      setSelectedCategories([...new Set(vendors.map((v) => v.category))].sort());
      setSelectedVendors(vendors.map((v) => v.id));
    }
  }, [vendorsLoading, vendors]);

  const filteredVendors = useMemo(
    () => vendors.filter((v) => selectedVendors.includes(v.id)),
    [vendors, selectedVendors],
  );

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

    const params = new URLSearchParams({
      vendors: selectedVendors.join(','),
      from: dateFrom,
      to: dateTo,
    });

    try {
      const resp = await fetch(`/vendors/api/spend?${params}`);
      const body: SpendResponse | SpendErrorResponse = await resp.json();

      if (!resp.ok) {
        const err = body as SpendErrorResponse;
        setError(`Error ${resp.status}: ${err.error} — ${err.details}`);
        return;
      }

      const data = body as SpendResponse;
      if (!data.data || data.data.length === 0) {
        setNoData('No spend data found for the selected vendors in that date range.');
        return;
      }

      setRows(data.data);
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : err}`);
    } finally {
      setLoading(false);
    }
  }, [selectedVendors, dateFrom, dateTo]);

  const authUser = useAuthUser();

  return (
    <div className="app-shell">
      <GlobalNav
        apps={authUser.accessibleApps}
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

            <SidebarGroup>
              <SidebarGroupContent>
                {view === 'spending' ? (
                  <Controls
                    vendors={vendors}
                    selectedCategories={selectedCategories}
                    selectedVendors={selectedVendors}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    loading={loading}
                    onCategoriesChange={setSelectedCategories}
                    onVendorsChange={setSelectedVendors}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateTo}
                    onFetch={handleFetch}
                  />
                ) : (
                  <div className="flex flex-col gap-3 px-2">
                    <VendorFilters
                      vendors={vendors}
                      selectedCategories={selectedCategories}
                      selectedVendors={selectedVendors}
                      onCategoriesChange={setSelectedCategories}
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

        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <h1 className="text-lg font-semibold">
              Vendor Spend Management
            </h1>
          </header>

          <div className="display-panel">
            {vendorsError && (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded m-4">
                Firestore error: {vendorsError}
              </div>
            )}
            {view === 'spending' && (
              <>
                {noData && <p className="no-data">{noData}</p>}
                <SpendDataView rows={rows} />
              </>
            )}
            {view === 'vendors' && <VendorList vendors={filteredVendors} />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
