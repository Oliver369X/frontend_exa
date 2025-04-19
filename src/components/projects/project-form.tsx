"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getClientToken } from "@/lib/auth-client";

const ProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

type ProjectFormProps = {
  onSuccess?: () => void;
  initialData?: {
    name?: string;
    description?: string;
    id?: string;
  };
};

export function ProjectForm({ onSuccess, initialData }: ProjectFormProps) {
  const t = useTranslations("projects");
  const [values, setValues] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasError("");
    const parse = ProjectSchema.safeParse(values);
    if (!parse.success) {
      setHasError(t("form.invalid"));
      return;
    }
    setIsLoading(true);
    try {
      const token = getClientToken();
      let res;
      if (initialData?.id) {
        // PATCH para editar proyecto existente
        res = await fetch(`http://localhost:4000/projects/${initialData.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(values),
        });
      } else {
        // POST para crear nuevo proyecto
        res = await fetch("http://localhost:4000/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(values),
        });
      }
      const debugText = await res.clone().text();
      console.log("[DEBUG] /projects POST/PATCH status:", res.status, debugText);
      if (!res.ok) throw new Error("Error");
      if (onSuccess) onSuccess();
    } catch {
      setHasError(t("form.error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-md mx-auto bg-white/10 dark:bg-neutral-900/10 border border-gray-300 dark:border-gray-700 shadow-[0_0_40px_0_#ffffff55] dark:shadow-[0_0_40px_0_#00000055] backdrop-blur-2xl rounded-2xl px-6 py-8 sm:px-8 sm:py-10"
    >
      <label htmlFor="name" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
        {t("form.name")}
      </label>
      <Input
        id="name"
        name="name"
        type="text"
        autoComplete="off"
        required
        minLength={3}
        className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/70 text-gray-900 dark:text-gray-100 text-base sm:text-lg placeholder-gray-400"
        placeholder={t("form.name")}
        value={values.name}
        onChange={handleChange}
      />
      <label htmlFor="description" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
        {t("form.description")}
      </label>
      <Textarea
        id="description"
        name="description"
        rows={3}
        className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/70 text-gray-900 dark:text-gray-100 text-base sm:text-lg placeholder-gray-400"
        placeholder={t("form.description")}
        value={values.description}
        onChange={handleChange}
      />
      {hasError && <div className="text-sm text-red-400 text-center mt-2">{hasError}</div>}
      <Button
        type="submit"
        disabled={isLoading}
        className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-black dark:text-white font-bold shadow-lg hover:scale-105 transition-transform border-2 border-primary/60 backdrop-blur-md disabled:opacity-60 text-base sm:text-lg"
      >
        {isLoading ? t("form.saving") : initialData?.id ? t("form.update") : t("form.create")}
      </Button>
    </form>
  );
}
