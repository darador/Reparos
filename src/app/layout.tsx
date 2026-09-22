import { MainHeader } from "@/components/layout/MainHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema de Reparos FTTH | Trazabilidad Operacional",
  description: "Sistema empresarial de gestión y trazabilidad de reparos en proyectos de despliegue FTTH.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full bg-slate-50">
      <body className="h-full flex flex-col font-sans text-slate-900 overflow-x-hidden antialiased">
        <MainHeader />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
            <div className="max-w-7xl mx-auto space-y-5">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
