import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import HomeView from "./views/HomeView";
import AuthCallback from "./views/AuthCallbackView";
import { InventoryView } from "./views/InventoryView";
import { useAuthStore } from "./store/authStore";
import { useManifest } from "./hooks/useManifest";
import { useTokenRefresh } from "./hooks/useTokenRefresh";

export default function App() {
  const { initFromStorage, isInitializing } = useAuthStore()
  useManifest()
  useTokenRefresh()

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  if (isInitializing) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/inventory" element={<InventoryView />} />
      </Routes>
    </BrowserRouter>
  )
}