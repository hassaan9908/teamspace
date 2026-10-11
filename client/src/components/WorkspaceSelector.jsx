import { useWorkspace } from "../context/WorkspaceContext";

export default function WorkspaceSelector() {
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
  } = useWorkspace();

  if (!workspaces?.length) {
    return (
      <div className="workspace-selector-empty">
        No workspaces yet
      </div>
    );
  }

  const handleChange = (event) => {
    const workspace =
      workspaces.find(
        (item) =>
          item._id ===
          event.target.value
      );

    if (workspace) {
      setCurrentWorkspace(
        workspace
      );
    }
  };

  return (
    <div className="workspace-selector">
      <div className="workspace-selector-icon">
        {currentWorkspace?.name
          ?.charAt(0)
          ?.toUpperCase() ||
          "W"}
      </div>

      <div className="workspace-selector-content">
        <span className="workspace-selector-label">
          Current workspace
        </span>

        <select
          value={
            currentWorkspace?._id ||
            ""
          }
          onChange={
            handleChange
          }
        >
          {workspaces.map(
            (workspace) => (
              <option
                key={
                  workspace._id
                }
                value={
                  workspace._id
                }
              >
                {workspace.name}
              </option>
            )
          )}
        </select>
      </div>
    </div>
  );
}