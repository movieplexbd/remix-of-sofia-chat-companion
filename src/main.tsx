import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message || String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "24px", textAlign: "center", fontFamily: "sans-serif", background: "#0f0f0f", color: "#fff" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h1 style={{ fontSize: "20px", marginBottom: "8px", color: "#f87171" }}>অ্যাপ লোড হয়নি</h1>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "16px", maxWidth: "360px" }}>
            কিছু একটা সমস্যা হয়েছে। পেজ রিফ্রেশ করুন
          </p>
          <pre style={{ fontSize: "11px", color: "#6b7280", background: "#1f1f1f", padding: "12px 16px", borderRadius: "8px", maxWidth: "400px", wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
            {this.state.error}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "20px", padding: "10px 24px", borderRadius: "12px", background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}
          >
            🔄 রিফ্রেশ করুন
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Background: pull shared training data once per session (non-blocking, errors ignored)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    import('./lib/firebaseTraining')
      .then(m => m.pullFromFirebase())
      .catch(() => {/* silent */});
  }, 4000);
}
