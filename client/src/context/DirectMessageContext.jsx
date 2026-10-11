import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";
import { useAuth } from "./AuthContext";
import { useWorkspace } from "./WorkspaceContext";

const DirectMessageContext =
  createContext(null);

export function DirectMessageProvider({
  children,
}) {
  const { user } = useAuth();
  const { currentWorkspace } =
    useWorkspace();

  const [conversations, setConversations] =
    useState([]);

  const [
    currentConversation,
    setCurrentConversation,
  ] = useState(null);

  const [loading, setLoading] =
    useState(false);

  const fetchConversations =
    async () => {
      if (
        !user ||
        !currentWorkspace
      ) {
        setConversations([]);
        setCurrentConversation(
          null
        );
        return;
      }

      try {
        setLoading(true);

        const response =
          await api.get(
            `/conversations/workspaces/${currentWorkspace._id}`
          );

        const data =
          response.data
            .conversations || [];

        setConversations(data);

        setCurrentConversation(
          (previous) => {
            if (previous) {
              const stillExists =
                data.find(
                  (conversation) =>
                    conversation._id ===
                    previous._id
                );

              if (
                stillExists
              ) {
                return stillExists;
              }
            }

            return null;
          }
        );
      } catch (error) {
        console.error(
          "Failed to fetch conversations:",
          error
        );

        setConversations([]);
        setCurrentConversation(
          null
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchConversations();
  }, [
    user?.id,
    currentWorkspace?._id,
  ]);

  return (
    <DirectMessageContext.Provider
      value={{
        conversations,
        currentConversation,
        setCurrentConversation,
        loading,
        fetchConversations,
      }}
    >
      {children}
    </DirectMessageContext.Provider>
  );
}

export function useDirectMessage() {
  const context =
    useContext(
      DirectMessageContext
    );

  if (!context) {
    throw new Error(
      "useDirectMessage must be used inside DirectMessageProvider"
    );
  }

  return context;
}