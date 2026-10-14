import { Component, type ReactNode } from 'react';
import { ErrorState } from './EmptyState';

/**
 * Trạng thái lỗi cho danh sách và màn (Giai đoạn 6, mục 10.5): một phần giao diện gặp lỗi
 * (dữ liệu trên trình duyệt bị hỏng, không tải được mã của màn) thì chỉ phần đó báo lỗi, phần còn lại vẫn dùng được.
 * Đặt `key` theo tab hoặc màn để chuyển tab là thử lại. `resetKey` đổi (vd. dữ liệu vừa được khôi phục) cũng thử lại.
 */
export class ListBoundary extends Component<{ children: ReactNode; label?: string; wrap?: (node: ReactNode) => ReactNode; resetKey?: unknown }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  componentDidUpdate(prev: { resetKey?: unknown }) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const wrap = this.props.wrap ?? ((n: ReactNode) => n);
    return wrap(
      <ErrorState
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => this.setState({ error: null })} className="min-h-11 rounded-xl bg-white px-4 font-semibold text-rose-900 ring-1 ring-rose-300 hover:bg-rose-100">
              Thử lại
            </button>
            <button onClick={() => window.location.reload()} className="min-h-11 rounded-xl bg-white px-4 font-semibold text-rose-900 ring-1 ring-rose-300 hover:bg-rose-100">
              Tải lại trang
            </button>
          </div>
        }
      >
        <p className="font-semibold">Không hiển thị được {this.props.label ?? 'nội dung này'}.</p>
        <p className="mt-1">Nếu lỗi lặp lại, mở "Công cụ demo" và bấm "Khôi phục dữ liệu mẫu".</p>
      </ErrorState>,
    );
  }
}
