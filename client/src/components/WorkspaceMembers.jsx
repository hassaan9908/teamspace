import {
  useMemo,
  useState,
} from "react";

import api from "../services/api";

import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";

export default function WorkspaceMembers() {
  const { user } = useAuth();

  const {
    currentWorkspace,
    fetchWorkspaces,
  } = useWorkspace();

  const [email, setEmail] =
    useState("");

  const [
    addingMember,
    setAddingMember,
  ] = useState(false);

  const [
    actionMemberId,
    setActionMemberId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const currentUserId =
    user?.id || user?._id;

  const currentMembership =
    currentWorkspace?.members?.find(
      (member) => {
        const memberUserId =
          member.user?._id ||
          member.user?.id ||
          member.user;

        return (
          memberUserId ===
          currentUserId
        );
      }
    );

  const currentRole =
    currentMembership?.role;

  const canManageMembers =
    ["owner", "admin"].includes(
      currentRole
    );

  const isOwner =
    currentRole === "owner";

  const members =
    useMemo(() => {
      const workspaceMembers =
        currentWorkspace?.members ||
        [];

      return [
        ...workspaceMembers,
      ].sort((a, b) => {
        const roleOrder = {
          owner: 1,
          admin: 2,
          member: 3,
        };

        const roleDifference =
          (roleOrder[a.role] ||
            99) -
          (roleOrder[b.role] ||
            99);

        if (
          roleDifference !== 0
        ) {
          return roleDifference;
        }

        const aName =
          a.user?.name || "";

        const bName =
          b.user?.name || "";

        return aName.localeCompare(
          bName
        );
      });
    }, [
      currentWorkspace?.members,
    ]);

  if (!currentWorkspace) {
    return null;
  }

  const refreshWorkspace =
    async () => {
      await fetchWorkspaces();
    };

  const clearMessages =
    () => {
      setError("");
      setSuccess("");
    };

  const handleAddMember =
    async (event) => {
      event.preventDefault();

      if (!email.trim()) {
        return;
      }

      try {
        clearMessages();
        setAddingMember(true);

        await api.post(
          `/workspaces/${currentWorkspace._id}/members`,
          {
            email:
              email
                .trim()
                .toLowerCase(),
          }
        );

        setEmail("");

        setSuccess(
          "Member added successfully."
        );

        await refreshWorkspace();
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Failed to add member."
        );
      } finally {
        setAddingMember(false);
      }
    };

  const handleRoleChange =
    async (
      memberUserId,
      role
    ) => {
      try {
        clearMessages();

        setActionMemberId(
          memberUserId
        );

        await api.patch(
          `/workspaces/${currentWorkspace._id}/members/${memberUserId}/role`,
          {
            role,
          }
        );

        setSuccess(
          "Member role updated."
        );

        await refreshWorkspace();
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Failed to update role."
        );
      } finally {
        setActionMemberId(
          null
        );
      }
    };

  const handleRemoveMember =
    async (
      memberUserId,
      memberName
    ) => {
      const confirmed =
        window.confirm(
          `Remove ${memberName} from this workspace?`
        );

      if (!confirmed) {
        return;
      }

      try {
        clearMessages();

        setActionMemberId(
          memberUserId
        );

        await api.delete(
          `/workspaces/${currentWorkspace._id}/members/${memberUserId}`
        );

        setSuccess(
          "Member removed successfully."
        );

        await refreshWorkspace();
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Failed to remove member."
        );
      } finally {
        setActionMemberId(
          null
        );
      }
    };

  const getInitials = (
    name
  ) => {
    if (!name) {
      return "U";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part
          .charAt(0)
          .toUpperCase()
      )
      .join("");
  };

  return (
    <div className="workspace-members">
      <div className="workspace-members-header">
        <div>
          <h3>
            Team Members
          </h3>

          <p>
            Manage workspace access
            and member roles.
          </p>
        </div>

        <div className="members-count-pill">
          <strong>
            {members.length}
          </strong>

          <span>
            {members.length === 1
              ? "member"
              : "members"}
          </span>
        </div>
      </div>

      {canManageMembers && (
        <form
          className="member-invite-form"
          onSubmit={
            handleAddMember
          }
        >
          <div className="member-invite-copy">
            <strong>
              Add member
            </strong>

            <span>
              Add an existing
              TeamSpace user by
              email.
            </span>
          </div>

          <div className="member-invite-controls">
            <input
              type="email"
              placeholder="teammate@example.com"
              value={email}
              onChange={(event) => {
                setEmail(
                  event.target.value
                );

                clearMessages();
              }}
            />

            <button
              type="submit"
              className="member-add-btn"
              disabled={
                addingMember ||
                !email.trim()
              }
            >
              {addingMember
                ? "Adding..."
                : "Add Member"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="workspace-member-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="workspace-member-alert success">
          {success}
        </div>
      )}

      <div className="members-list">
        {members.map(
          (member) => {
            const memberUser =
              member.user;

            const memberUserId =
              memberUser?._id ||
              memberUser?.id ||
              memberUser;

            const isCurrentMember =
              memberUserId ===
              currentUserId;

            const memberIsOwner =
              member.role ===
              "owner";

            const canChangeRole =
              isOwner &&
              !memberIsOwner;

            const canRemove =
              canManageMembers &&
              !memberIsOwner &&
              !isCurrentMember;

            const busy =
              actionMemberId ===
              memberUserId;

            return (
              <div
                key={
                  memberUserId
                }
                className="member-row"
              >
                <div className="member-avatar-wrap">
                  <div className="member-avatar">
                    {getInitials(
                      memberUser?.name
                    )}
                  </div>

                  {isCurrentMember && (
                    <span className="member-you-dot" />
                  )}
                </div>

                <div className="member-details">
                  <div className="member-name-row">
                    <strong>
                      {memberUser?.name ||
                        "Unknown User"}
                    </strong>

                    {isCurrentMember && (
                      <span className="member-you-badge">
                        You
                      </span>
                    )}
                  </div>

                  <span>
                    {memberUser?.email ||
                      "No email"}
                  </span>
                </div>

                <div className="member-role-area">
                  {canChangeRole ? (
                    <select
                      className="member-role-select"
                      value={
                        member.role
                      }
                      disabled={
                        busy
                      }
                      onChange={(
                        event
                      ) =>
                        handleRoleChange(
                          memberUserId,
                          event.target
                            .value
                        )
                      }
                    >
                      <option value="admin">
                        Admin
                      </option>

                      <option value="member">
                        Member
                      </option>
                    </select>
                  ) : (
                    <span
                      className={`member-role-badge role-${member.role}`}
                    >
                      {member.role}
                    </span>
                  )}
                </div>

                <div className="member-actions">
                  {canRemove ? (
                    <button
                      type="button"
                      className="member-remove-btn"
                      disabled={
                        busy
                      }
                      onClick={() =>
                        handleRemoveMember(
                          memberUserId,
                          memberUser?.name ||
                            "this member"
                        )
                      }
                    >
                      {busy
                        ? "..."
                        : "Remove"}
                    </button>
                  ) : (
                    <span className="member-action-placeholder">
                      {memberIsOwner
                        ? "Workspace owner"
                        : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}