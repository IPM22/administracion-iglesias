"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const { signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      router.push("/login");
    }
  };

  return (
    <Button onClick={handleSignOut} variant="destructive" disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      Cerrar Sesión
    </Button>
  );
}
