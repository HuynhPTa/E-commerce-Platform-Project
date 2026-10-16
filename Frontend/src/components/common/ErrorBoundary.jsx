import { Component } from "react";

// Tầng 1B — "Error boundary/Suspense phù hợp với thư viện và kiến trúc đang dùng".
// Bọc theo ROUTE (xem App.jsx), không bọc 1 lần duy nhất ở ngoài cùng — để lỗi ở
// trang Seller không kéo sập luôn trang Buyer đang mở ở tab khác trong cùng SPA.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Route error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="error-fallback">
          <p>Đã có lỗi xảy ra khi hiển thị trang này.</p>
          <button onClick={() => this.setState({ error: null })}>Thử lại</button>
        </div>
      );
    }
    return this.props.children;
  }
}
