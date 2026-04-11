import { useState, useCallback, useRef, useMemo } from 'react';
import {
  AppRail,
  useRailExpanded,
  PaneToolbar,
  PaneLayout,
  ChatPanel,
  Button,
  agentFetch,
  useTableViewState,
} from '@haderach/shared-ui';
import type { ChatPanelHandle, ChatPendingAction, PaneId, PaneLayoutHandle, TableViewContext } from '@haderach/shared-ui';
import { DEFAULT_COLUMNS } from './vendor-columns';

import { Loader2 } from 'lucide-react';
import { VendorList } from './VendorList';
import { VendorConfirmEdit } from './VendorConfirmEdit';
import { VendorConfirmCsvBatch } from './VendorConfirmCsvBatch';
import { useAuthUser } from './auth/AuthUserContext';
import { useVendors } from './useVendors';

const WRITE_TOOLS = new Set(['add_vendor', 'delete_vendor', 'modify_vendor', 'process_vendor_csv']);

export function App() {
  const { vendors, error: vendorsError, refresh: refreshVendors } = useVendors();
  const authUser = useAuthUser();

  const [editVendorId, setEditVendorId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ChatPendingAction | null>(null);
  const [editQueue, setEditQueue] = useState<ChatPendingAction[]>([]);
  const [pendingCsvBatch, setPendingCsvBatch] = useState<ChatPendingAction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [railExpanded, toggleRail] = useRailExpanded();
  const [chatOpen, setChatOpen] = useState(true);
  const [detailPane, setDetailPane] = useState<'analytics' | 'data' | null>('data');

  const tableView = useTableViewState('vendors', DEFAULT_COLUMNS);

  const tableViewContext = useMemo<TableViewContext>(() => ({
    visibleColumns: tableView.visibleColumns ?? DEFAULT_COLUMNS,
    activeFilters: tableView.columnFilters.map((f) => ({
      column: f.id,
      values: f.value as string[],
    })),
    dataPaneOpen: detailPane === 'data',
  }), [tableView.visibleColumns, tableView.columnFilters, detailPane]);

  const chatRef = useRef<ChatPanelHandle>(null);
  const paneRef = useRef<PaneLayoutHandle>(null);

  const handleToolResult = useCallback((toolNames: string[]) => {
    if (toolNames.some((t) => WRITE_TOOLS.has(t))) refreshVendors();
  }, [refreshVendors]);

  const handlePendingActions = useCallback((actions: ChatPendingAction[]) => {
    const edits: ChatPendingAction[] = [];
    for (const action of actions) {
      if (action.type === 'confirm_csv_batch') {
        setPendingCsvBatch(action);
      } else if (action.type === 'confirm_delete') {
        setPendingDelete(action);
      } else if (action.type === 'open_edit') {
        paneRef.current?.togglePane('data');
        setEditVendorId(action.vendor_id as string);
      } else if (action.type === 'confirm_edit') {
        edits.push(action);
      } else if (action.type === 'set_columns') {
        tableView.setVisibleColumns(action.view_columns as string[]);
      } else if (action.type === 'set_filters') {
        const agentFilters = action.table_filters as Array<{ column: string; values: string[] }>;
        tableView.setColumnFilters(
          agentFilters.map((f) => ({
            id: f.column,
            value: f.values.map((v) => (v === 'none' ? '' : v)),
          })),
        );
      }
    }
    if (edits.length) setEditQueue((prev) => [...prev, ...edits]);
  }, [tableView]);

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

  const pendingEdit = editQueue[0] ?? null;

  const confirmEdit = useCallback(() => {
    if (pendingEdit) {
      chatRef.current?.addMessage({ role: 'assistant', content: `**${pendingEdit.vendor_name as string}** has been updated.` });
      refreshVendors();
    }
    setEditQueue((prev) => prev.slice(1));
  }, [pendingEdit, refreshVendors]);

  const cancelEdit = useCallback(() => {
    if (pendingEdit) {
      chatRef.current?.addMessage({ role: 'assistant', content: `Changes to **${pendingEdit.vendor_name as string}** were cancelled.` });
      chatRef.current?.addMessage({ role: 'user', content: `I cancelled the edit. If I ask to modify this vendor again, call modify_vendor again.`, hidden: true });
    }
    setEditQueue((prev) => prev.slice(1));
  }, [pendingEdit]);

  const confirmCsvBatch = useCallback(() => {
    if (pendingCsvBatch) {
      const summary = pendingCsvBatch.summary as { vendor_count: number } | undefined;
      const count = summary?.vendor_count ?? 0;
      chatRef.current?.addMessage({
        role: 'assistant',
        content: `Batch update complete — **${count}** vendor${count === 1 ? '' : 's'} updated.`,
      });
      refreshVendors();
    }
    setPendingCsvBatch(null);
  }, [pendingCsvBatch, refreshVendors]);

  const cancelCsvBatch = useCallback(() => {
    if (pendingCsvBatch) {
      chatRef.current?.addMessage({ role: 'assistant', content: 'Batch update was cancelled.' });
    }
    setPendingCsvBatch(null);
  }, [pendingCsvBatch]);

  const handlePaneToggle = useCallback((id: PaneId) => {
    paneRef.current?.togglePane(id);
  }, []);

  const handleLayoutChange = useCallback((chat: boolean, detail: 'analytics' | 'data' | null) => {
    setChatOpen(chat);
    setDetailPane(detail);
  }, []);

  return (
    <div className="app-shell">
      <AppRail
        apps={authUser.accessibleApps}
        activeAppId="vendors"
        expanded={railExpanded}
        onToggle={toggleRail}
        userEmail={authUser.email}
        userPhotoURL={authUser.photoURL}
        userDisplayName={authUser.displayName}
        onSignOut={authUser.signOut}
        openPanes={{ chat: chatOpen, analytics: false, data: detailPane === 'data' }}
        getIdToken={authUser.getIdToken}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <PaneToolbar
          activePanes={{
            chat: chatOpen,
            analytics: false,
            data: detailPane === 'data',
          }}
          panes={['chat', 'data']}
          onPaneToggle={handlePaneToggle}
        />

        <PaneLayout
          ref={paneRef}
          chatOpen={chatOpen}
          detailPane={detailPane}
          onLayoutChange={handleLayoutChange}
          chatContent={
            <ChatPanel
              ref={chatRef}
              mode="panel"
              appContext="vendors"
              tableViewContext={tableViewContext}
              getIdToken={authUser.getIdToken}
              onToolResult={handleToolResult}
              onPendingAction={handlePendingActions}
            />
          }
          dataContent={
            <div className="flex flex-1 min-h-0 flex-col p-2">
              {vendorsError && (
                <div className="p-4 text-sm text-red-600 bg-red-50 rounded m-4">
                  Error loading vendors: {vendorsError}
                </div>
              )}
              <VendorList
                vendors={vendors}
                editVendorId={editVendorId}
                onEditDone={() => { setEditVendorId(null); refreshVendors(); }}
                visibleColumns={tableView.visibleColumns}
                onResetColumns={tableView.resetColumns}
                columnFilters={tableView.columnFilters}
                onColumnFiltersChange={(updaterOrValue) => {
                  tableView.setColumnFilters(
                    typeof updaterOrValue === 'function'
                      ? updaterOrValue(tableView.columnFilters)
                      : updaterOrValue,
                  );
                }}
                onClearFilters={tableView.clearFilters}
                isCustomView={tableView.isCustomView}
                hasActiveFilters={tableView.hasActiveFilters}
              />
            </div>
          }
        />
      </div>

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

      {pendingEdit && (
        <VendorConfirmEdit
          vendorId={pendingEdit.vendor_id as string}
          vendorName={pendingEdit.vendor_name as string}
          displayFields={pendingEdit.display_fields as Array<{
            key: string; label: string;
            currentValue?: string | null; currentDisplay: string;
            newValue: string; newDisplay: string;
            inputType: 'select' | 'text'; source?: string; options?: string[];
          }>}
          open
          onConfirm={confirmEdit}
          onCancel={cancelEdit}
        />
      )}

      {pendingCsvBatch && (
        <VendorConfirmCsvBatch
          updates={pendingCsvBatch.updates as Array<{ vendor_id: string; vendor_name: string; changes: Record<string, unknown>; display_changes: Array<{ label: string; from: string; to: string }> }>}
          summary={pendingCsvBatch.summary as { vendor_count: number; field_counts: Record<string, number> }}
          open
          onConfirm={confirmCsvBatch}
          onCancel={cancelCsvBatch}
        />
      )}
    </div>
  );
}
