import {
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import { useWorkspace } from "../context/WorkspaceContext";
import { useChannel } from "../context/ChannelContext";
import { useTasks } from "../context/TaskContext";
import { useNotifications } from "../context/NotificationContext";

import AppSidebar from "../components/AppSidebar";
import AppTopbar from "../components/AppTopbar";

import WorkspaceMembers from "../components/WorkspaceMembers";
import WorkspaceSelector from "../components/WorkspaceSelector";
import CreateWorkspaceForm from "../components/CreateWorkspaceForm";

export default function Dashboard() {
  const {
    currentWorkspace,
    loading,
  } = useWorkspace();

  const {
    channels = [],
  } = useChannel();

  const {
    tasks = [],
  } = useTasks();

  const {
    notifications = [],
    totalUnread = 0,
  } = useNotifications();

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  const membersCount =
    currentWorkspace?.members
      ?.length || 0;

  const channelsCount =
    channels.length;

  const openTasksCount =
    tasks.filter(
      (task) =>
        task.status !== "done"
    ).length;

  const completedTasksCount =
    tasks.filter(
      (task) =>
        task.status === "done"
    ).length;

  const recentNotifications =
    notifications.slice(0, 5);

  const formatActivityTime = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const created =
      new Date(date);

    const now =
      new Date();

    const difference =
      Math.floor(
        (now - created) / 1000
      );

    if (difference < 60) {
      return "Just now";
    }

    if (difference < 3600) {
      return `${Math.floor(
        difference / 60
      )}m ago`;
    }

    if (difference < 86400) {
      return `${Math.floor(
        difference / 3600
      )}h ago`;
    }

    return `${Math.floor(
      difference / 86400
    )}d ago`;
  };

  const getActivityText = (
    notification
  ) => {
    const actor =
      notification.actor?.name ||
      "Someone";

    if (
      notification.type ===
      "channel_message"
    ) {
      const channel =
        notification.channel?.name ||
        "channel";

      return `${actor} sent a message in #${channel}`;
    }

    if (
      notification.type ===
      "direct_message"
    ) {
      return `${actor} sent you a direct message`;
    }

    return "New workspace activity";
  };

  if (loading) {
    return (
      <div className="full-page-state">
        <div className="loader" />

        <p>
          Loading TeamSpace...
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

        <main className="app-content dashboard-page">
          <section className="workspace-toolbar card">
            <div>
              <p className="section-label">
                Workspace
              </p>

              <h2>
                Switch Workspace
              </h2>
            </div>

            <WorkspaceSelector />
          </section>

          {currentWorkspace ? (
            <>
              {/* =====================
                  WELCOME HEADER
              ====================== */}

              <section className="dashboard-welcome">
                <div>
                  <p className="section-label">
                    Workspace Overview
                  </p>

                  <h1>
                    {
                      currentWorkspace.name
                    }
                  </h1>

                  <p>
                    {currentWorkspace.description ||
                      "Manage your team, conversations and work from one place."}
                  </p>
                </div>

                <div className="dashboard-welcome-badge">
                  <span>
                    Active Workspace
                  </span>
                </div>
              </section>

              {/* =====================
                  STATS
              ====================== */}

              <section className="dashboard-stats">
                <Link
                  to="/dashboard"
                  className="dashboard-stat-card"
                >
                  <div className="dashboard-stat-icon members">
                    ◉
                  </div>

                  <div>
                    <span>
                      Members
                    </span>

                    <strong>
                      {
                        membersCount
                      }
                    </strong>

                    <p>
                      Workspace members
                    </p>
                  </div>
                </Link>

                <Link
                  to="/channels"
                  className="dashboard-stat-card"
                >
                  <div className="dashboard-stat-icon channels">
                    #
                  </div>

                  <div>
                    <span>
                      Channels
                    </span>

                    <strong>
                      {
                        channelsCount
                      }
                    </strong>

                    <p>
                      Available channels
                    </p>
                  </div>
                </Link>

                <Link
                  to="/tasks"
                  className="dashboard-stat-card"
                >
                  <div className="dashboard-stat-icon tasks">
                    ✓
                  </div>

                  <div>
                    <span>
                      Open Tasks
                    </span>

                    <strong>
                      {
                        openTasksCount
                      }
                    </strong>

                    <p>
                      {
                        completedTasksCount
                      }{" "}
                      completed
                    </p>
                  </div>
                </Link>

                <Link
                  to="/messages"
                  className="dashboard-stat-card"
                >
                  <div className="dashboard-stat-icon unread">
                    🔔
                  </div>

                  <div>
                    <span>
                      Unread
                    </span>

                    <strong>
                      {
                        totalUnread
                      }
                    </strong>

                    <p>
                      New activity
                    </p>
                  </div>
                </Link>
              </section>

              {/* =====================
                  MAIN GRID
              ====================== */}

              <section className="dashboard-overview-grid">
                {/* MEMBERS */}

                <div className="dashboard-overview-card card">
                  <div className="dashboard-card-heading">
                    <div>
                      <p className="section-label">
                        Team
                      </p>

                      <h2>
                        Workspace Members
                      </h2>
                    </div>

                    <span className="dashboard-count">
                      {
                        membersCount
                      }
                    </span>
                  </div>

                  <WorkspaceMembers />
                </div>

                {/* RECENT ACTIVITY */}

                <div className="dashboard-overview-card card">
                  <div className="dashboard-card-heading">
                    <div>
                      <p className="section-label">
                        Activity
                      </p>

                      <h2>
                        Recent Activity
                      </h2>
                    </div>

                    {totalUnread >
                      0 && (
                      <span className="dashboard-unread-pill">
                        {
                          totalUnread
                        }{" "}
                        unread
                      </span>
                    )}
                  </div>

                  {recentNotifications.length ===
                  0 ? (
                    <div className="dashboard-activity-empty">
                      <div>
                        🔔
                      </div>

                      <strong>
                        No recent activity
                      </strong>

                      <p>
                        New messages and
                        notifications will
                        appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="dashboard-activity-list">
                      {recentNotifications.map(
                        (
                          notification
                        ) => (
                          <div
                            key={
                              notification._id
                            }
                            className={`dashboard-activity-item ${
                              !notification.read
                                ? "unread"
                                : ""
                            }`}
                          >
                            <div
                              className={`dashboard-activity-icon ${
                                notification.type ===
                                "direct_message"
                                  ? "dm"
                                  : "channel"
                              }`}
                            >
                              {notification.type ===
                              "direct_message"
                                ? "💬"
                                : "#"}
                            </div>

                            <div className="dashboard-activity-content">
                              <p>
                                {getActivityText(
                                  notification
                                )}
                              </p>

                              <span>
                                {formatActivityTime(
                                  notification.createdAt
                                )}
                              </span>
                            </div>

                            {!notification.read && (
                              <span className="dashboard-activity-dot" />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* =====================
                  QUICK ACTIONS
              ====================== */}

              <section className="content-panel dashboard-actions-section">
                <div className="section-heading">
                  <div>
                    <p className="section-label">
                      Quick Access
                    </p>

                    <h2>
                      Continue Working
                    </h2>

                    <p className="muted">
                      Jump directly into
                      the part of your
                      workspace you need.
                    </p>
                  </div>
                </div>

                <div className="dashboard-shortcuts">
                  <Link
                    to="/channels"
                    className="dashboard-shortcut-card"
                  >
                    <div className="dashboard-shortcut-icon">
                      #
                    </div>

                    <div>
                      <p className="section-label">
                        Team Chat
                      </p>

                      <h3>
                        Channels
                      </h3>

                      <p>
                        Open public and
                        private team
                        channels.
                      </p>
                    </div>

                    <span className="dashboard-shortcut-arrow">
                      →
                    </span>
                  </Link>

                  <Link
                    to="/messages"
                    className="dashboard-shortcut-card"
                  >
                    <div className="dashboard-shortcut-icon">
                      💬
                    </div>

                    <div>
                      <p className="section-label">
                        Conversations
                      </p>

                      <h3>
                        Direct Messages
                      </h3>

                      <p>
                        Talk privately
                        with workspace
                        members.
                      </p>
                    </div>

                    <span className="dashboard-shortcut-arrow">
                      →
                    </span>
                  </Link>

                  <Link
                    to="/tasks"
                    className="dashboard-shortcut-card"
                  >
                    <div className="dashboard-shortcut-icon">
                      ✓
                    </div>

                    <div>
                      <p className="section-label">
                        Productivity
                      </p>

                      <h3>
                        Tasks
                      </h3>

                      <p>
                        Create, assign and
                        track team work.
                      </p>
                    </div>

                    <span className="dashboard-shortcut-arrow">
                      →
                    </span>
                  </Link>
                </div>
              </section>

              {/* =====================
                  CREATE WORKSPACE
              ====================== */}

              <section className="content-panel">
                <div className="section-heading">
                  <div>
                    <p className="section-label">
                      Workspace Setup
                    </p>

                    <h2>
                      Create New Workspace
                    </h2>

                    <p className="muted">
                      Start another
                      workspace for a
                      different team,
                      department or
                      project.
                    </p>
                  </div>
                </div>

                <div className="create-workspace-card">
                  <div className="create-workspace-copy">
                    <div className="create-workspace-icon">
                      +
                    </div>

                    <div>
                      <h3>
                        Start a new
                        workspace
                      </h3>

                      <p>
                        Each workspace
                        gets independent
                        members,
                        channels,
                        conversations and
                        tasks.
                      </p>

                      <div className="create-workspace-benefits">
                        <div>
                          <span>
                            #
                          </span>

                          <p>
                            Dedicated
                            channels
                          </p>
                        </div>

                        <div>
                          <span>
                            💬
                          </span>

                          <p>
                            Private
                            conversations
                          </p>
                        </div>

                        <div>
                          <span>
                            ✓
                          </span>

                          <p>
                            Independent
                            task board
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="create-workspace-form-wrap">
                    <CreateWorkspaceForm />
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="empty-workspace card">
              <div className="empty-icon">
                +
              </div>

              <p className="section-label">
                Get Started
              </p>

              <h2>
                Create your first
                workspace
              </h2>

              <p className="muted">
                Create a workspace to
                unlock channels,
                messaging, tasks and
                team collaboration.
              </p>

              <div className="empty-workspace-form">
                <CreateWorkspaceForm />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}