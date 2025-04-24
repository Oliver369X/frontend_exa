"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CopyIcon, RefreshCwIcon } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export type LinkAccessLevel = "none" | "read" | "write";

/**
 * Panel para gestionar el acceso por enlace a un proyecto.
 * Permite copiar el enlace, cambiar el nivel de acceso y muestra mensajes claros de éxito/error.
 */
export function ProjectLinkAccessPanel({
  projectId,
  initialAccess,
  initialToken,
  apiBaseUrl = "http://localhost:4000",
  isLoading = false,
  t = (v: string) => v
}: {
  projectId: string;
  initialAccess: LinkAccessLevel;
  initialToken: string;
  apiBaseUrl?: string;
  isLoading?: boolean;
  t?: (key: string, options?: Record<string, unknown>) => string;
}) {
  const [linkAccess, setLinkAccess] = useState<LinkAccessLevel>(initialAccess);
  const [linkToken, setLinkToken] = useState(initialToken);
  const [isPending, setIsPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleChangeAccess = async (value: LinkAccessLevel) => {
    setIsPending(true);
    try {
      const res = await fetch(`${apiBaseUrl}/projects/${projectId}/link-access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ linkAccess: value })
      });
      if (!res.ok) throw new Error("Error actualizando acceso");
      const data = await res.json();
      setLinkAccess(data.linkAccess);
      setLinkToken(data.linkToken);
      toast.success(t("linkAccessUpdated"));
    } catch {
      toast.error(t("linkAccessUpdateError"));
    } finally {
      setIsPending(false);
    }
  };

  const handleRegenerate = async () => {
    setIsPending(true);
    try {
      const res = await fetch(`${apiBaseUrl}/projects/${projectId}/link-access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ regenerate: true })
      });
      if (!res.ok) throw new Error("Error regenerando token");
      const data = await res.json();
      setLinkToken(data.linkToken);
      toast.success(t("linkTokenRegenerated"));
    } catch {
      toast.error(t("linkTokenRegenerateError"));
    } finally {
      setIsPending(false);
    }
  };

  const handleCopy = () => {
    const url = `${origin}/project/link/${linkToken}`;
    navigator.clipboard.writeText(url);
    toast.success(t("linkCopied"));
  };

  useEffect(() => {
    if (hasError) {
      toast.error(t("linkAccess.loadError", { defaultValue: "Error al cargar acceso por enlace" }));
    }
  }, [hasError, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="w-full"
          disabled={isLoading || isPending}
          aria-label={t("shareLinkButton", { defaultValue: "Compartir" })}
        >
          {isPending ? <span className="animate-spin mr-2">⏳</span> : <span className="mr-2">🔗</span>}
          {t("shareLinkButton", { defaultValue: "Compartir" })}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t("linkAccessTitle")}</DialogTitle>
        <DialogDescription>{t("shareLinkDescription", { defaultValue: "Elige el nivel de acceso y comparte el enlace con quien quieras." })}</DialogDescription>
        <div className="space-y-3">
          <Select value={linkAccess} onValueChange={handleChangeAccess} disabled={isLoading || isPending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read">{t("linkAccessRead")}</SelectItem>
              <SelectItem value="write">{t("linkAccessWrite")}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input readOnly value={`${origin}/project/link/${linkToken}`} className="flex-1" />
            <Button size="icon" variant="outline" onClick={handleCopy} title={t("copyLinkTooltip", { defaultValue: "Copiar enlace" })}>
              <CopyIcon className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleRegenerate} disabled={isLoading || isPending} title={t("regenerateTokenTooltip", { defaultValue: "Regenerar token" })}>
              <RefreshCwIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}