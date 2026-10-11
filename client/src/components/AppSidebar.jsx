import {
  NavLink,
  useLocation,
} from "react-router-dom";

import ChannelSidebar from "./ChannelSidebar";
import DirectMessageSidebar from "./DirectMessageSidebar";

import { useWorkspace } from "../context/WorkspaceContext";

export default function AppSidebar({
  mobileOpen,
  onClose,
}) {
  const {
    currentWorkspace,
  } = useWorkspace();

  const location =
    useLocation();

  const isChannelsPage =
    location.pathname ===
    "/channels";

  const isMessagesPage =
    location.pathname ===
    "/messages";

  const navigation = [
    {
      to: "/dashboard",
      label: "Overview",
      icon: "⌂",
    },
    {
      to: "/channels",
      label: "Channels",
      icon: "#",
    },
    {
      to: "/messages",
      label: "Direct Messages",
      icon: "💬",
    },
    {
      to: "/tasks",
      label: "Tasks",
      icon: "✓",
    },
  ];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="mobile-sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      )}

      <aside
        className={`app-sidebar ${
          mobileOpen
            ? "mobile-open"
            : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            T
          </div>

          <div className="sidebar-brand-copy">
            <h2>
              TeamSpace
            </h2>

            <p>
              {currentWorkspace
                ? currentWorkspace.name
                : "No workspace"}
            </p>
          </div>

          <button
            type="button"
            className="mobile-sidebar-close"
            aria-label="Close menu"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="sidebar-scroll">
          <nav className="main-sidebar-nav">
            <p className="main-sidebar-label">
              Navigation
            </p>

            {navigation.map(
              (item) => (
                <NavLink
                  key={
                    item.to
                  }
                  to={item.to}
                  onClick={
                    onClose
                  }
                  className={({
                    isActive,
                  }) =>
                    `main-sidebar-link ${
                      isActive
                        ? "active"
                        : ""
                    }`
                  }
                >
                  <span className="main-sidebar-icon">
                    {
                      item.icon
                    }
                  </span>

                  <span>
                    {
                      item.label
                    }
                  </span>
                </NavLink>
              )
            )}
          </nav>

          {isChannelsPage && (
            <>
              <div className="sidebar-divider" />

              <div className="sidebar-context-section">
                <ChannelSidebar />
              </div>
            </>
          )}

          {isMessagesPage && (
            <>
              <div className="sidebar-divider" />

              <div className="sidebar-context-section">
                <DirectMessageSidebar />
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}