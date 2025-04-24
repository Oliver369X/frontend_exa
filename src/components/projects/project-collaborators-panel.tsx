"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useSession } from 'next-auth/react';

/**
 * Panel para gestionar los colaboradores de un proyecto.
 * Permite listar, agregar y eliminar colaboradores, y muestra feedback visual.
 */
export function ProjectCollaboratorsPanel({ projectId, isOwner }: { projectId: string; isOwner: boolean }) {
  const t = useTranslations("projects");
  const { data: session } = useSession();
  const [collaborators, setCollaborators] = useState<{ userId: string; email: string; permission: "read" | "write" }[]>([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"read" | "write">("read");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCollaborators();
    // eslint-disable-next-line
  }, [projectId]);

  async function fetchCollaborators() {
    setIsLoading(true);
    setHasError("");
    try {
      const token = session?.backendToken;
      if (!token) {
        setHasError(t("auth.missingToken", { defaultValue: "No autorizado. Inicia sesión nuevamente." }));
        return;
      }
      const res = await fetch(`http://localhost:4000/projects/${projectId}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setCollaborators(Array.isArray(data) ? data : []);
    } catch {
      setHasError(t("collaborators.error", { defaultValue: "Error al cargar colaboradores" }));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddOrUpdate() {
    setIsSubmitting(true);
    setHasError("");
    try {
      const token = session?.backendToken;
      if (!token) {
        setHasError(t("auth.missingToken", { defaultValue: "No autorizado. Inicia sesión nuevamente." }));
        toast.error(t("auth.missingToken", { defaultValue: "No autorizado. Inicia sesión nuevamente." }));
        setIsSubmitting(false);
        return;
      }
      const res = await fetch(`http://localhost:4000/projects/${projectId}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, permission }),
      });
      if (!res.ok) throw new Error("Error");
      setEmail("");
      setPermission("read");
      fetchCollaborators();
      toast.success(t("collaborators.added", { defaultValue: "Colaborador agregado" }));
    } catch {
      setHasError(t("collaborators.addError", { defaultValue: "Error al agregar colaborador" }));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(userId: string) {
    setIsSubmitting(true);
    setHasError("");
    try {
      const token = session?.backendToken;
      if (!token) {
        setHasError(t("auth.missingToken", { defaultValue: "No autorizado. Inicia sesión nuevamente." }));
        toast.error(t("auth.missingToken", { defaultValue: "No autorizado. Inicia sesión nuevamente." }));
        setIsSubmitting(false);
        return;
      }
      const res = await fetch(`http://localhost:4000/projects/${projectId}/permissions/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Error");
      fetchCollaborators();
      toast.success(t("collaborators.removed", { defaultValue: "Colaborador eliminado" }));
    } catch {
      setHasError(t("collaborators.removeError", { defaultValue: "Error al eliminar colaborador" }));
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (hasError) {
      toast.error(hasError);
    }
  }, [hasError]);

  return (
    <div className="space-y-2">
      <div className="font-semibold text-lg mb-2">{t("collaborators.title", { defaultValue: "Colaboradores" })}</div>
      {isOwner && (
        <form className="flex flex-col gap-2 mb-4" onSubmit={e => { e.preventDefault(); handleAddOrUpdate(); }}>
          <Input
            type="email"
            placeholder={t("collaborators.emailPlaceholder", { defaultValue: "Correo del usuario" })}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <select
            className="rounded border px-2 py-1"
            value={permission}
            onChange={e => setPermission(e.target.value as "read" | "write")}
            disabled={isSubmitting}
          >
            <option value="read">{t("collaborators.read", { defaultValue: "Lectura" })}</option>
            <option value="write">{t("collaborators.write", { defaultValue: "Escritura" })}</option>
          </select>
          <Button type="submit" disabled={isSubmitting || !email}>
            {t("collaborators.add", { defaultValue: "Agregar" })}
          </Button>
        </form>
      )}
      {isLoading ? (
        <div>{t("loading", { defaultValue: "Cargando..." })}</div>
      ) : (
        <div className="divide-y divide-muted bg-muted rounded-lg">
          {collaborators.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">{t("collaborators.empty", { defaultValue: "No hay colaboradores aún" })}</div>
          ) : (
            collaborators.map((c) => (
              <div key={c.userId} className="flex items-center gap-2 border-b last:border-b-0 py-2">
                <div className="flex-1">
                  <div className="font-mono text-xs text-muted-foreground">{c.email}</div>
                  <div className="text-sm font-medium">{t(`collaborators.${c.permission}`, { defaultValue: c.permission })}</div>
                </div>
                {isOwner && (
                  <Button
                    size="default"
                    variant="destructive"
                    onClick={() => handleRemove(c.userId)}
                    disabled={isSubmitting}
                    aria-label={t("removeCollaborator", { defaultValue: "Eliminar colaborador" })}
                  >
                    {isSubmitting ? <span className="animate-spin mr-2">⏳</span> : <span className="mr-2">🗑️</span>}
                    {t("remove", { defaultValue: "Eliminar" })}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}