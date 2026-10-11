import NotificationPanel from "./NotificationPanel";
import SearchBar from "./SearchBar";

import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";

export default function AppTopbar({
  onTaskSelect,
  onOpenSidebar,
}) {
  const {
    user,
    logout,
  } = useAuth();

  const {
    currentWorkspace,
  } = useWorkspace();

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          aria-label="Open navigation"
          onClick={
            onOpenSidebar
          }
        >
          ☰
        </button>

        <div>
          <p className="topbar-eyebrow">
            Workspace
          </p>

          <h1>
            {currentWorkspace?.name ||
              "TeamSpace"}
          </h1>
        </div>
      </div>

      <div className="topbar-search">
        <SearchBar
          onTaskSelect={
            onTaskSelect
          }
        />
      </div>

      <div className="topbar-actions">
        <NotificationPanel />

        <div className="user-chip">
          <div className="avatar">
            {user?.name
              ?.charAt(0)
              ?.toUpperCase() ||
              "U"}
          </div>

          <div className="user-chip-text">
            <strong>
              {user?.name}
            </strong>

            <span>
              {user?.email}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}