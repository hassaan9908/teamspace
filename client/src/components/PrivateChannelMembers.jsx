import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useChannel } from "../context/ChannelContext";

export default function PrivateChannelMembers() {
  const { user } = useAuth();

  const {
    currentWorkspace,
  } = useWorkspace();

  const {
    currentChannel,
    fetchChannels,
  } = useChannel();

  const [members, setMembers] =
    useState([]);

  const [
    selectedUserId,
    setSelectedUserId,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const currentMembership =
    currentWorkspace?.members?.find(
      (member) =>
        member.user?._id ===
        user?.id
    );

  const currentRole =
    currentMembership?.role;

  const canManage =
    ["owner", "admin"].includes(
      currentRole
    );

  const fetchMembers = async () => {
    if (
      !currentChannel ||
      currentChannel.type !==
        "private"
    ) {
      setMembers([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          `/channels/${currentChannel._id}/members`
        );

      setMembers(
        response.data.members ||
          []
      );
    } catch (error) {
      setError(
        error.response?.data
          ?.message ||
          "Failed to load private channel members."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    setSelectedUserId("");
    setSuccess("");
  }, [
    currentChannel?._id,
  ]);

  if (
    !currentChannel ||
    currentChannel.type !==
      "private"
  ) {
    return null;
  }

  const availableMembers =
    currentWorkspace?.members?.filter(
      (workspaceMember) => {
        const workspaceUser =
          workspaceMember.user;

        const alreadyAdded =
          members.some(
            (channelMember) =>
              channelMember._id ===
              workspaceUser?._id
          );

        return !alreadyAdded;
      }
    ) || [];

  const addMember = async () => {
    if (!selectedUserId) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response =
        await api.post(
          `/channels/${currentChannel._id}/members`,
          {
            userId:
              selectedUserId,
          }
        );

      setSuccess(
        response.data.message ||
          "Member added successfully."
      );

      setSelectedUserId("");

      await fetchMembers();
      await fetchChannels();
    } catch (error) {
      setError(
        error.response?.data
          ?.message ||
          "Failed to add member."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const removeMember = async (
    memberId
  ) => {
    const confirmed =
      window.confirm(
        "Remove this member from the private channel?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response =
        await api.delete(
          `/channels/${currentChannel._id}/members/${memberId}`
        );

      setSuccess(
        response.data.message ||
          "Member removed successfully."
      );

      await fetchMembers();
      await fetchChannels();
    } catch (error) {
      setError(
        error.response?.data
          ?.message ||
          "Failed to remove member."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        border:
          "1px solid #555",
        borderRadius: "8px",
      }}
    >
      <h3>
        Private Channel Members
      </h3>

      {loading && (
        <p>
          Loading members...
        </p>
      )}

      {error && (
        <p
          style={{
            color: "red",
          }}
        >
          {error}
        </p>
      )}

      {success && (
        <p
          style={{
            color: "green",
          }}
        >
          {success}
        </p>
      )}

      {!loading &&
        members.length === 0 && (
          <p>
            No members found.
          </p>
        )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginTop: "10px",
        }}
      >
        {members.map(
          (member) => {
            const isCreator =
              currentChannel
                .createdBy?._id ===
              member._id;

            return (
              <div
                key={member._id}
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "10px",
                  padding:
                    "8px 0",
                }}
              >
                <div>
                  <strong>
                    {
                      member.name
                    }
                  </strong>

                  <div>
                    <small>
                      {
                        member.email
                      }
                    </small>
                  </div>

                  {isCreator && (
                    <small>
                      Channel Creator
                    </small>
                  )}
                </div>

                {canManage &&
                  !isCreator && (
                    <button
                      type="button"
                      disabled={
                        actionLoading
                      }
                      onClick={() =>
                        removeMember(
                          member._id
                        )
                      }
                    >
                      Remove
                    </button>
                  )}
              </div>
            );
          }
        )}
      </div>

      {canManage && (
        <div
          style={{
            marginTop: "20px",
          }}
        >
          <h4>
            Add Member
          </h4>

          {availableMembers.length ===
          0 ? (
            <p>
              All workspace
              members already have
              access.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <select
                value={
                  selectedUserId
                }
                disabled={
                  actionLoading
                }
                onChange={(event) =>
                  setSelectedUserId(
                    event.target
                      .value
                  )
                }
              >
                <option value="">
                  Select workspace
                  member
                </option>

                {availableMembers.map(
                  (
                    workspaceMember
                  ) => (
                    <option
                      key={
                        workspaceMember
                          .user
                          ?._id
                      }
                      value={
                        workspaceMember
                          .user
                          ?._id
                      }
                    >
                      {
                        workspaceMember
                          .user
                          ?.name
                      }
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                disabled={
                  actionLoading ||
                  !selectedUserId
                }
                onClick={
                  addMember
                }
              >
                {actionLoading
                  ? "Updating..."
                  : "Add Member"}
              </button>
            </div>
          )}
        </div>
      )}

      {!canManage && (
        <p
          style={{
            marginTop: "15px",
          }}
        >
          Only workspace owners
          and admins can manage
          private channel members.
        </p>
      )}
    </div>
  );
}