import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";
import { useWorkspace } from "./WorkspaceContext";

const ChannelContext =
  createContext(null);

export function ChannelProvider({
  children,
}) {
  const {
    currentWorkspace,
  } = useWorkspace();

  const [channels, setChannels] =
    useState([]);

  const [
    currentChannel,
    setCurrentChannel,
  ] = useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const fetchChannels =
    async () => {
      if (!currentWorkspace) {
        setChannels([]);
        setCurrentChannel(null);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            `/channels/workspaces/${currentWorkspace._id}`
          );

        const data =
          response.data.channels ||
          [];

        setChannels(data);

        setCurrentChannel(
          (previous) => {
            if (previous) {
              const updated =
                data.find(
                  (channel) =>
                    channel._id ===
                    previous._id
                );

              if (updated) {
                return updated;
              }
            }

            return data[0] || null;
          }
        );
      } catch (error) {
        console.error(
          "Fetch channels error:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "Failed to load channels."
        );

        setChannels([]);
        setCurrentChannel(null);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchChannels();
  }, [
    currentWorkspace?._id,
  ]);

  return (
    <ChannelContext.Provider
      value={{
        channels,
        currentChannel,
        setCurrentChannel,
        loading,
        error,
        fetchChannels,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannel() {
  const context =
    useContext(
      ChannelContext
    );

  if (!context) {
    throw new Error(
      "useChannel must be used inside ChannelProvider"
    );
  }

  return context;
}