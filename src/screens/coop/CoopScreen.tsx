import { useState } from 'react';
import { CoopLegalTab } from './CoopLegalTab';
import { CoopOrdersTab } from './CoopOrdersTab';
import { CoopProductsTab } from './CoopProductsTab';
import { CoopWalletTab } from './CoopWalletTab';


type CoopTab = 'products' | 'orders' | 'wallet' | 'legal';

export function CoopScreen() {
  const [tab, setTab] = useState<CoopTab>('products');
  return (
    <div className="flex flex-1 flex-col space-y-4 p-4">
      {/* Coop Header */}
      <div className="bg-emerald-950 text-white rounded-3xl p-4 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Kênh Quản Trị Hợp Tác Xã
          </span>
          <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded-md text-emerald-200">
            Mã HTX: LC-BH-01
          </span>
        </div>
        <h3 className="text-base font-bold">HTX Nông Nghiệp Hữu Cơ Bắc Hà</h3>
        <p className="text-xs text-stone-300">Đại diện: Vàng A Sáng • Bắc Hà, Lào Cai</p>
      </div>

      {/* Sub-nav for Coop */}
      <div className="grid grid-cols-4 gap-1 bg-stone-200/70 p-1 rounded-2xl text-[11px] font-medium">
        <button
          onClick={() => setTab('products')}
          className={`py-2 rounded-xl transition-all ${
            tab === 'products' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
          }`}
        >
          Sản phẩm
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`py-2 rounded-xl transition-all ${
            tab === 'orders' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
          }`}
        >
          Đơn & Ticket
        </button>
        <button
          onClick={() => setTab('wallet')}
          className={`py-2 rounded-xl transition-all ${
            tab === 'wallet' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
          }`}
        >
          Ví đối soát
        </button>
        <button
          onClick={() => setTab('legal')}
          className={`py-2 rounded-xl transition-all ${
            tab === 'legal' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
          }`}
        >
          Hồ sơ
        </button>
      </div>

      {tab === 'products' && <CoopProductsTab />}
      {tab === 'orders' && <CoopOrdersTab />}
      {tab === 'wallet' && <CoopWalletTab />}
      {tab === 'legal' && <CoopLegalTab />}
    </div>
  );
}
