import { useEffect } from 'react';
import { useUi } from '../../app/UiContext';
import { ChatFab } from '../../components/ChatInbox';
import { ListBoundary } from '../../components/ListBoundary';
import { useStore } from '../../store/AppDataContext';
import { AccountTab } from './AccountTab';
import { CustomerBottomNav } from './CustomerBottomNav';
import { CustomerTopBar } from './CustomerTopBar';
import { ExploreTab } from './ExploreTab';
import { SeasonTab } from './SeasonTab';

export function CustomerScreen() {
  const { customerTab } = useUi();
  const { state } = useStore();
  // Đổi tab thì về đầu trang, không giữ vị trí cuộn của tab trước. Không trả về kết quả của scrollTo (xem AppShell).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [customerTab]);
  return (
    <div className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <CustomerTopBar />
      <ListBoundary key={customerTab} label="mục này" resetKey={state}>
        {customerTab === 'explore' && <ExploreTab />}
        {customerTab === 'season' && <SeasonTab />}
        {customerTab === 'account' && <AccountTab />}
      </ListBoundary>
      <ChatFab />
      <CustomerBottomNav />
    </div>
  );
}
