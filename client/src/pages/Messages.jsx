import {
  useState,
} from "react";

import { useWorkspace } from "../context/WorkspaceContext";

import AppSidebar from "../components/AppSidebar";
import AppTopbar from "../components/AppTopbar";
import DirectMessageView from "../components/DirectMessageView";
import WorkspaceSelector from "../components/WorkspaceSelector";

export default function Messages() {
  const {
    currentWorkspace,
    loading,
  } = useWorkspace();

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  if (loading) {
    return (
      <div className="full-page-state">
        <div className="loader" />

        <p>
          Loading conversations...
        </p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AppSidebar
        mobileOpen={
          mobileSidebarOpen
        }
        onClose={() =>
          setMobileSidebarOpen(
            false
          )
        }
      />

      <div className="app-main">
        <AppTopbar
          onOpenSidebar={() =>
            setMobileSidebarOpen(
              true
            )
          }
        />

        <main className="app-content focused-page">
          <section className="focused-page-header">
            <div>
              <p className="section-label">
                Conversations
              </p>

              <h2>
                Direct Messages
              </h2>

              <p className="muted">
                Private one-to-one
                conversations with
                workspace members.
              </p>
            </div>

            <WorkspaceSelector />
          </section>

          {!currentWorkspace ? (
            <div className="focused-empty card">
              <h3>
                No workspace selected
              </h3>

              <p className="muted">
                Select or create a
                workspace first.
              </p>
            </div>
          ) : (
            <div className="focused-chat-card card">
              <DirectMessageView />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}