import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import { useWorkspace } from "../context/WorkspaceContext";

import AppSidebar from "../components/AppSidebar";
import AppTopbar from "../components/AppTopbar";

import WorkspaceSelector from "../components/WorkspaceSelector";
import TaskForm from "../components/TaskForm";
import TaskBoard from "../components/TaskBoard";

export default function Tasks() {
  const location =
    useLocation();

  const {
    currentWorkspace,
    loading,
  } = useWorkspace();

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  const [
    highlightedTaskId,
    setHighlightedTaskId,
  ] = useState(
    location.state
      ?.highlightTaskId ||
      null
  );

  useEffect(() => {
    if (
      location.state
        ?.highlightTaskId
    ) {
      setHighlightedTaskId(
        location.state
          .highlightTaskId
      );
    }
  }, [
    location.state
      ?.highlightTaskId,
  ]);

  if (loading) {
    return (
      <div className="full-page-state">
        <div className="loader" />

        <p>
          Loading tasks...
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
                Productivity
              </p>

              <h2>
                Workspace Tasks
              </h2>

              <p className="muted">
                Create, assign and
                track team work in one
                focused board.
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
            <>
              <div className="task-create-card card">
                <div className="task-create-heading">
                  <div>
                    <p className="section-label">
                      New Task
                    </p>

                    <h3>
                      Create Task
                    </h3>

                    <p className="muted">
                      Add work to your
                      workspace board.
                    </p>
                  </div>

                  <div className="task-create-icon">
                    ✓
                  </div>
                </div>

                <TaskForm />
              </div>

              <TaskBoard
                highlightTaskId={
                  highlightedTaskId
                }
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}