import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";
import { useWorkspace } from "./WorkspaceContext";

const TaskContext =
  createContext(null);

export function TaskProvider({
  children,
}) {
  const { currentWorkspace } =
    useWorkspace();

  const [tasks, setTasks] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const fetchTasks = async () => {
    if (!currentWorkspace) {
      setTasks([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          `/tasks/workspaces/${currentWorkspace._id}`
        );

      setTasks(
        response.data.tasks || []
      );
    } catch (error) {
      setError(
        error.response?.data
          ?.message ||
          "Failed to load tasks."
      );

      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [
    currentWorkspace?._id,
  ]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        fetchTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context =
    useContext(TaskContext);

  if (!context) {
    throw new Error(
      "useTasks must be used inside TaskProvider"
    );
  }

  return context;
}