import { useEffect } from "react";
import { useManifestStore } from "../store/manifestStore";
import { useAuthStore } from "../store/authStore";
import { getManifest } from "../services/manifest";

export function useManifest() {
    const { setVersion, setLoaded, setError, setData, setTitleData } = useManifestStore()
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)

    useEffect(() => {
        if (!isAuthenticated) return

        async function loadManifest() {
            try {
                const { data, currentManifestVersion, titleData } = await getManifest()
                setLoaded(true)
                setVersion(currentManifestVersion)
                setData(data)
                setTitleData(titleData)
            } catch {
                setError("Error loading Manifest")
            }
        }
        loadManifest()
    }, [isAuthenticated, setVersion, setLoaded, setError, setData, setTitleData])
}