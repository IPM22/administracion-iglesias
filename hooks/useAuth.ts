// Re-exporta desde el AuthContext para compatibilidad con todos los componentes existentes.
// La lógica real vive en contexts/AuthContext.tsx (singleton compartido por toda la app).
export { useAuth } from "@/contexts/AuthContext";
