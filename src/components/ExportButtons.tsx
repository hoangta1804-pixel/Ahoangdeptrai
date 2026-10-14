import { Download } from 'lucide-react';
import { useUi } from '../app/UiContext';
import { exportReport, type ReportKind } from '../domain/reports';
import { useStore } from '../store/AppDataContext';
import { SecondaryButton } from './form';

/** Xuất báo cáo CSV không có dữ liệu cá nhân (FR-BCTK-02, 03). */
export function ExportButtons() {
  const { state, now } = useStore();
  const { actor, showToast } = useUi();
  const download = (kind: ReportKind) => {
    const r = exportReport(state, actor, kind, now());
    if (!r.ok) return showToast(r.error);
    const url = URL.createObjectURL(new Blob([r.value.content], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = r.value.filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Đã xuất ${r.value.filename}.`);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <SecondaryButton className="flex items-center gap-2" onClick={() => download('summary')}>
        <Download size={16} /> Xuất báo cáo tổng hợp (CSV)
      </SecondaryButton>
      <SecondaryButton className="flex items-center gap-2" onClick={() => download('orders')}>
        <Download size={16} /> Xuất danh sách đơn ẩn danh (CSV)
      </SecondaryButton>
    </div>
  );
}
