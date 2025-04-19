import Link from "next/link";

export function Navbar() {
  return (
    <nav className="w-full flex justify-between items-center px-8 py-4 bg-gradient-to-r from-primary/90 via-secondary/90 to-accent/90 dark:from-[#181824] dark:via-[#232526] dark:to-[#414345] shadow-lg rounded-b-2xl border-b border-gray-800/30">
      <div className="font-extrabold text-2xl tracking-tight text-primary-foreground drop-shadow-lg">Plataforma</div>
      <div className="flex gap-6 items-center">
        <Link href="/dashboard" className="transition-colors px-3 py-1 rounded-lg hover:bg-primary/20 hover:text-primary font-medium">Dashboard</Link>
        <Link href="/projects" className="transition-colors px-3 py-1 rounded-lg hover:bg-primary/20 hover:text-primary font-medium">Proyectos</Link>
        <Link href="/profile" className="transition-colors px-3 py-1 rounded-lg hover:bg-primary/20 hover:text-primary font-medium">Perfil</Link>
      </div>
    </nav>
  );
}
