"use client";
import React from "react";
import { sidebarNav } from "./sidebar-icons";

interface SidebarClientProps {
  locale: string;
  dashboardLabel: string;
  projectsLabel: string;
}

export function SidebarClient({ locale, dashboardLabel, projectsLabel }: SidebarClientProps) {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  // Detecta swipe para cerrar el sidebar en mobile
  React.useEffect(() => {
    let startX: number | null = null;
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (startX !== null) {
        const diff = e.touches[0].clientX - startX;
        if (diff < -60) setOpen(false);
      }
    };
    const sidebar = document.getElementById("sidebar-mobile");
    if (sidebar) {
      sidebar.addEventListener("touchstart", handleTouchStart);
      sidebar.addEventListener("touchmove", handleTouchMove);
    }
    return () => {
      if (sidebar) {
        sidebar.removeEventListener("touchstart", handleTouchStart);
        sidebar.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [open]);
  const handleNav = () => setOpen(false);
  // Traducción dinámica para los labels
  const navItems = [
    { ...sidebarNav[0], label: dashboardLabel },
    { ...sidebarNav[1], label: projectsLabel },
    { ...sidebarNav[2] },
  ];
  return (
    <>
      {/* Botón hamburguesa (mobile) */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 md:hidden inline-flex items-center justify-center p-2 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Open sidebar"
        onClick={() => setOpen(true)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Sidebar overlay"
          onClick={() => setOpen(false)}
        />
      )}
      {/* Sidebar drawer (mobile) con swipe para cerrar */}
      <aside
        id="sidebar-mobile"
        className={`fixed z-50 inset-y-0 left-0 w-20 bg-neutral-950 border-r border-neutral-800 p-2 flex flex-col items-center transform transition-transform duration-200 ease-in-out md:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ transitionProperty: "transform" }}
      >
        <button
          type="button"
          className="absolute top-4 right-4 p-2 rounded-md bg-neutral-900 border border-neutral-800 shadow focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <nav className="flex flex-col gap-2 mt-12 w-full items-center">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href(locale)}
              className="group flex flex-col items-center justify-center w-12 h-12 rounded-lg hover:bg-neutral-900 transition-colors"
              onClick={handleNav}
            >
              <item.icon className="w-6 h-6 text-neutral-400 group-hover:text-primary" />
              <span className="sr-only">{item.label}</span>
            </a>
          ))}
        </nav>
        {/* Botón para volver a la landing desde dashboard/sidebar */}
        <nav className="flex flex-col gap-2 mt-6">
          <a href={`/${locale}`} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-gray-700 dark:text-gray-100 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary"><path d="M10 2a1 1 0 0 1 .707.293l7 7a1 1 0 0 1-1.414 1.414L16 10.414V17a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3H8v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6.586l-.293.293A1 1 0 0 1 2.293 9.293l7-7A1 1 0 0 1 10 2Z" /></svg>
            <span>Landing</span>
          </a>
        </nav>
      </aside>
      {/* Sidebar fijo (desktop) expandible */}
      <aside
        className={`hidden md:flex flex-col min-h-screen border-r border-neutral-800 bg-neutral-950 p-2 items-start group/sidebar transition-all duration-200 ${expanded ? "w-56" : "w-20"}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <nav className="flex flex-col gap-2 mt-12 w-full items-start">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href(locale)}
              className={`group flex items-center w-full h-12 rounded-lg hover:bg-neutral-900 transition-colors px-3 ${expanded ? "justify-start" : "justify-center"}`}
            >
              <item.icon className={`w-6 h-6 text-neutral-400 group-hover:text-primary ${!expanded ? "mx-auto" : ""}`} />
              {/* Siempre renderiza el ícono, el texto solo si expandido */}
              <span className={`ml-3 text-white text-sm font-medium transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0 pointer-events-none"}`}>{item.label}</span>
            </a>
          ))}
        </nav>
        {/* Botón para volver a la landing desde dashboard/sidebar */}
        <nav className="flex flex-col gap-2 mt-6">
          <a href={`/${locale}`} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-gray-700 dark:text-gray-100 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary"><path d="M10 2a1 1 0 0 1 .707.293l7 7a1 1 0 0 1-1.414 1.414L16 10.414V17a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3H8v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6.586l-.293.293A1 1 0 0 1 2.293 9.293l7-7A1 1 0 0 1 10 2Z" /></svg>
            <span>Landing</span>
          </a>
        </nav>
      </aside>
    </>
  );
}
