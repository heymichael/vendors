import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  GlobalNav,
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
  Separator,
  ChatPanel,
  ChatToggle,
  Button,
  agentFetch,
} from '@haderach/shared-ui';
import type { ChatPanelHandle, ChatPendingAction } from '@haderach/shared-ui';
import { Loader2 } from 'lucide-react';
import { SpendToolbar } from './SpendToolbar';
import type { SpendViewMode } from './SpendToolbar';
import { SpendDataView } from './SpendDataView';
import { VendorList } from './VendorList';
import { useAuthUser } from './auth/AuthUserContext';
import { useVendors } from './useVendors';
import { fetchVendorSpend } from './fetchVendorSpend';
import { groupSpendRows } from './groupSpendRows';
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

const WRITE_TOOLS = new Set(['add_vendor', 'delete_vendor', 'modify_vendor']);

export function App() {
  const { vendors, loading: vendorsLoading, error: vendorsError, refresh: refreshVendors } = useVendors();
  const authUser = useAuthUser();

  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState(sixMonthsAgoISO);
  const [dateTo, setDateTo] = useState(todayISO);
  const [rows, setRows] = useState<SpendRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState<string | null>(null);
  const [view, setView] = useState<'spending' | 'vendors'>('vendors');
  const [spendViewMode, setSpendViewMode] = useState<SpendViewMode>('chart');
  const [chatOpen, setChatOpen] = useState(false);
  const [editVendorId, setEditVendorId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ChatPendingAction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const chatRef = useRef<ChatPanelHandle>(null);

  const handleToolResult = useCallback((toolNames: string[]) => {
    if (toolNames.some((t) => WRITE_TOOLS.has(t))) refreshVendors();
  }, [refreshVendors]);

  const handlePendingAction = useCallback((action: ChatPendingAction) => {
    if (action.type === 'confirm_delete') {
      setPendingDelete(action);
    } else if (action.type === 'open_edit') {
      setView('vendors');
      setEditVendorId(action.vendor_id as string);
    }
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const resp = await agentFetch(`/vendors/${pendingDelete.vendor_id}`, authUser.getIdToken, { method: 'DELETE' });
      if (resp.ok) {
        chatRef.current?.addMessage({ role: 'assistant', content: `**${pendingDelete.vendor_name}** has been deleted.` });
        refreshVendors();
      } else {
        const errText = await resp.text();
        chatRef.current?.addMessage({ role: 'assistant', content: `Failed to delete: ${errText}` });
      }
    } catch (err) {
      chatRef.current?.addMessage({ role: 'assistant', content: `Delete error: ${err instanceof Error ? err.message : err}` });
    } finally {
      setPendingDelete(null);
      setDeleting(false);
    }
  }, [pendingDelete, authUser.getIdToken, refreshVendors]);

  const cancelDelete = useCallback(() => {
    if (pendingDelete) {
      chatRef.current?.addMessage({ role: 'assistant', content: `Deletion of **${pendingDelete.vendor_name}** was cancelled.` });
      chatRef.current?.addMessage({ role: 'user', content: `I cancelled the deletion of ${pendingDelete.vendor_name}. If I ask to delete it again, call delete_vendor again.`, hidden: true });
    }
    setPendingDelete(null);
  }, [pendingDelete]);

  const initialized = useRef(false);
  const prevVendorIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (vendorsLoading || vendors.length === 0) return;

    const currentIds = new Set(vendors.map((v) => v.id));

    if (!initialized.current) {
      initialized.current = true;
      setSelectedVendors([...currentIds]);
      const depts = [...new Set(vendors.map((v) => v.department).filter(Boolean))] as string[];
      setSelectedDepartments(depts);
      prevVendorIds.current = currentIds;
      return;
    }

    const newIds = [...currentIds].filter((id) => !prevVendorIds.current.has(id));
    if (newIds.length > 0) {
      setSelectedVendors((prev) => [...prev, ...newIds]);
    }
    prevVendorIds.current = currentIds;
  }, [vendorsLoading, vendors]);

  const effectiveVendorIds = useMemo(() => {
    if (selectedDepartments.length === 0) return selectedVendors;
    const deptSet = new Set(selectedDepartments);
    const deptVendorIds = new Set(
      vendors.filter((v) => v.department && deptSet.has(v.department)).map((v) => v.id),
    );
    return selectedVendors.filter((id) => deptVendorIds.has(id));
  }, [selectedVendors, selectedDepartments, vendors]);

  useEffect(() => {
    if (view !== 'spending') return;
    if (effectiveVendorIds.length === 0 || !dateFrom || !dateTo) {
      setRows([]);
      setNoData(effectiveVendorIds.length === 0 ? 'Select vendors or departments to view spend data.' : null);
      return;
    }
    if (dateFrom > dateTo) return;

    const timer = setTimeout(async () => {
      setError(null);
      setNoData(null);
      setLoading(true);

      try {
        const raw = await fetchVendorSpend(effectiveVendorIds, dateFrom, dateTo, authUser.getIdToken);
        if (raw.length === 0) {
          setNoData('No spend data found for the selected vendors in that date range.');
        }
        setRows(groupSpendRows(raw));
      } catch (err) {
        setError(`Error fetching spend: ${err instanceof Error ? err.message : err}`);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [view, effectiveVendorIds, dateFrom, dateTo, authUser.getIdToken]);

  const handleDownloadCsv = useCallback(() => {
    if (rows.length === 0) return;
    const header = 'vendor,month,amount';
    const csvRows = rows.map((r) => `${r.vendor},${r.month},${r.amount}`);
    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendor-spend.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

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
                    Error loading vendors: {vendorsError}
                  </div>
                )}
                {view === 'spending' && (
                  <div className="flex flex-1 min-h-0 flex-col">
                    <SpendToolbar
                      vendors={vendors}
                      selectedVendors={selectedVendors}
                      onVendorsChange={setSelectedVendors}
                      selectedDepartments={selectedDepartments}
                      onDepartmentsChange={setSelectedDepartments}
                      dateFrom={dateFrom}
                      dateTo={dateTo}
                      onDateFromChange={setDateFrom}
                      onDateToChange={setDateTo}
                      viewMode={spendViewMode}
                      onViewModeChange={setSpendViewMode}
                      onDownload={handleDownloadCsv}
                    />
                    {error && (
                      <div className="px-4 pt-2 text-sm text-red-600">{error}</div>
                    )}
                    <div className="flex flex-1 min-h-0 flex-col px-4">
                      {loading && (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      {noData && <p className="no-data">{noData}</p>}
                      {!loading && <SpendDataView rows={rows} viewMode={spendViewMode} />}
                    </div>
                  </div>
                )}
                {view === 'vendors' && (
                  <VendorList
                    vendors={vendors}
                    editVendorId={editVendorId}
                    onEditDone={() => { setEditVendorId(null); refreshVendors(); }}
                  />
                )}
              </div>
            </div>

            <ChatPanel
              ref={chatRef}
              open={chatOpen}
              onClose={() => setChatOpen(false)}
              appContext="vendors"
              getIdToken={authUser.getIdToken}
              onToolResult={handleToolResult}
              onPendingAction={handlePendingAction}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Human verification needed</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Delete <strong>{pendingDelete.vendor_name as string}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={cancelDelete} disabled={deleting}>
                No, Do Not Delete
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
