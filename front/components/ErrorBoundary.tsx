import React from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
};

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'خطای ناشناخته در رندر' };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // برای دیباگ سریع
    console.error('Render error captured by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-red-200 rounded-xl p-6 shadow">
            <div className="text-red-500 text-5xl mb-3">⚠️</div>
            <h2 className="text-xl font-bold text-red-700 mb-2">خطا در رندر برنامه</h2>
            <p className="text-red-600 mb-4 text-sm break-words">{this.state.errorMessage}</p>
            <button
              onClick={() => this.setState({ hasError: false, errorMessage: undefined })}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
            >
              تلاش مجدد
            </button>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactNode;
  }
}

export default ErrorBoundary;


