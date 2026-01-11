import { useCallback, useEffect, useState } from "react";
import { getUserRoles } from "@/lib/azureFunctions";

type AppRole = "admin" | "moderator" | "user";

interface UseUserRoleResult {
  roles: AppRole[];
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useUserRole = (userId?: string): UseUserRoleResult => {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState<boolean>(!!userId);

  const fetchRoles = useCallback(async () => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await getUserRoles();
      if (error) {
        throw error;
      }

      const normalized = (data?.roles || [])
        .map((role) => role.toLowerCase())
        .filter((role): role is AppRole => role === "admin" || role === "moderator" || role === "user");

      setRoles(normalized);
    } catch (error) {
      console.warn("[useUserRole] Failed to fetch user roles from Azure Functions:", error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    isAdmin: roles.includes("admin"),
    loading,
    refresh: fetchRoles,
  };
};
