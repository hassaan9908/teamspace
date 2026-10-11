import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { ChannelProvider } from "./context/ChannelContext";
import { DirectMessageProvider } from "./context/DirectMessageContext";
import { TaskProvider } from "./context/TaskContext";
import { NotificationProvider } from "./context/NotificationContext";

import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Channels from "./pages/Channels";
import Messages from "./pages/Messages";
import Tasks from "./pages/Tasks";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <ChannelProvider>
            <DirectMessageProvider>
              <TaskProvider>
                <NotificationProvider>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <Navigate
                          to="/dashboard"
                          replace
                        />
                      }
                    />

                    <Route
                      path="/login"
                      element={
                        <Login />
                      }
                    />

                    <Route
                      path="/register"
                      element={
                        <Register />
                      }
                    />

                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/channels"
                      element={
                        <ProtectedRoute>
                          <Channels />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/messages"
                      element={
                        <ProtectedRoute>
                          <Messages />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/tasks"
                      element={
                        <ProtectedRoute>
                          <Tasks />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="*"
                      element={
                        <Navigate
                          to="/dashboard"
                          replace
                        />
                      }
                    />
                  </Routes>
                </NotificationProvider>
              </TaskProvider>
            </DirectMessageProvider>
          </ChannelProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}