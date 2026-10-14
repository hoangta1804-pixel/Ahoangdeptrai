import { FileText, Sparkles, User, Wheat, type LucideIcon } from 'lucide-react';
import { useUi, type CustomerTab } from '../../app/UiContext';

const TABS: { key: CustomerTab; label: string; Icon: LucideIcon }[] = [
  { key: 'explore', label: 'Khám phá', Icon: Sparkles },
  { key: 'season', label: 'Vụ mùa', Icon: Wheat },
  { key: 'orders', label: 'Đơn hàng', Icon: FileText },
  { key: 'account', label: 'Tài khoản', Icon: User },
];

export function CustomerBottomNav() {
  const { customerTab, setCustomerTab } = useUi();
  return (
    <nav
      aria-label="Điều hướng khách hàng"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[640px] items-center justify-around border-t border-stone-200/80 bg-white/95 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur-md"
    >
      {TABS.map(({ key, label, Icon }) => {
        const active = customerTab === key;
        return (
          <button
            key={key}
            onClick={() => setCustomerTab(key)}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-xl px-3 transition-colors ${active ? 'font-bold text-emerald-900' : 'font-medium text-stone-600'}`}
          >
            <Icon size={20} />
            <span className="text-xs">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
