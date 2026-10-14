import { useState } from 'react';
import type { AdminSubGroup } from '../../domain/types';
import { AdminApprovalsTab } from './AdminApprovalsTab';
import { AdminLedgerTab } from './AdminLedgerTab';
import { AdminParamsTab } from './AdminParamsTab';
import { AdminTicketsTab } from './AdminTicketsTab';

type AdminTab = 'approvals' | 'params' | 'ledger' | 'tickets';

export function AdminScreen() {
  const [group, setGroup] = useState<AdminSubGroup>('operations');
  const [tab, setTab] = useState<AdminTab>('approvals');
  return (
    <div className="flex flex-1 flex-col space-y-4 p-4">
      {/* Admin Banner & Permission Selector */}
      <div className="bg-rose-950 text-white rounded-3xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
            Bàn Quản Trị Tối Cao
          </span>
          <span className="text-[10px] bg-rose-800 px-2 py-0.5 rounded-md text-rose-200">
            Admin Root
          </span>
        </div>
        <h3 className="text-base font-bold">Quản Trị Viên Di Động (Admin Mobile)</h3>

        {/* 4 Group Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-stone-900/90 p-1 rounded-2xl text-[10px] font-bold">
          {(['operations', 'quality', 'finance', 'cskh'] as AdminSubGroup[]).map((grp) => (
            <button
              key={grp}
              onClick={() => setGroup(grp)}
              className={`py-1.5 rounded-xl capitalize transition-all ${
                group === grp
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {grp === 'operations' && 'Vận hành'}
              {grp === 'quality' && 'Chất lượng'}
              {grp === 'finance' && 'Tài chính'}
              {grp === 'cskh' && 'CSKH'}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-nav for Admin Mobile */}
      <div className="grid grid-cols-4 gap-1 bg-stone-200/80 p-1 rounded-2xl text-[11px] font-medium">
        <button
          onClick={() => setTab('approvals')}
          className={`py-1.5 rounded-xl transition-all ${
            tab === 'approvals' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
          }`}
        >
          Duyệt HTX
        </button>
        <button
          onClick={() => setTab('params')}
          className={`py-1.5 rounded-xl transition-all ${
            tab === 'params' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
          }`}
        >
          Tham số
        </button>
        <button
          onClick={() => setTab('ledger')}
          className={`py-1.5 rounded-xl transition-all ${
            tab === 'ledger' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
          }`}
        >
          Sổ cái 4 mục
        </button>
        <button
          onClick={() => setTab('tickets')}
          className={`py-1.5 rounded-xl transition-all ${
            tab === 'tickets' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
          }`}
        >
          CSKH & Log
        </button>
      </div>

      {tab === 'approvals' && <AdminApprovalsTab />}
      {tab === 'params' && <AdminParamsTab />}
      {tab === 'ledger' && <AdminLedgerTab group={group} />}
      {tab === 'tickets' && <AdminTicketsTab />}
    </div>
  );
}
