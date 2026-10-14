import { useUi } from '../../app/UiContext';
import { AccountTab } from './AccountTab';
import { CustomerBottomNav } from './CustomerBottomNav';
import { CustomerTopBar } from './CustomerTopBar';
import { ExploreTab } from './ExploreTab';
import { OrdersTab } from './OrdersTab';
import { SeasonTab } from './SeasonTab';

export function CustomerScreen() {
  const { customerTab } = useUi();
  return (
    <div className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <CustomerTopBar />
      {customerTab === 'explore' && <ExploreTab />}
      {customerTab === 'season' && <SeasonTab />}
      {customerTab === 'orders' && <OrdersTab />}
      {customerTab === 'account' && <AccountTab />}
      <CustomerBottomNav />
    </div>
  );
}
