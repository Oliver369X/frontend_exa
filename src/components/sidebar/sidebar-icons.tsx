import { Home, Folder, PlusCircle } from "lucide-react";

export const sidebarNav = [
  {
    href: (locale: string) => `/${locale}/dashboard`,
    label: "Dashboard",
    icon: Home,
  },
  {
    href: (locale: string) => `/${locale}/projects`,
    label: "Proyectos",
    icon: Folder,
  },
  {
    href: (locale: string) => `/${locale}/projects`,
    label: "Crear proyecto",
    icon: PlusCircle,
  },
];
