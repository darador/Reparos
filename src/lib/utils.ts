import { type ClassValue, clsx } from "clsx";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import { RepairPriority, StatusCategory } from "./types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "-";
  try {
    const date = parseISO(dateString);
    return format(date, "dd/MM/yyyy", { locale: es });
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return "-";
  try {
    const date = parseISO(dateString);
    return format(date, "dd MMM yyyy HH:mm", { locale: es });
  } catch (e) {
    return dateString;
  }
}

export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "-";
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch (e) {
    return dateString;
  }
}

export function getStatusBadgeProps(statusName?: string, category?: StatusCategory): {
  variantClass: string;
  label: string;
} {
  const label = statusName || "PENDIENTE";
  const norm = label.toLowerCase();

  if (norm.includes("verificación") || norm.includes("resuelto") || category === "resolved") {
    return {
      label: statusName || "VERIFICACIÓN RESUELTO",
      variantClass: "bg-blue-100 text-blue-900 border-blue-300 font-bold"
    };
  }
  if (norm.includes("finalizado") || norm.includes("cerrado") || category === "closed") {
    return {
      label: statusName || "FINALIZADO",
      variantClass: "bg-slate-100 text-slate-800 border-slate-300 font-semibold opacity-85"
    };
  }
  return {
    label: statusName || "PENDIENTE",
    variantClass: "bg-amber-100 text-amber-900 border-amber-300 font-semibold"
  };
}

export function getPriorityBadgeProps(priority: RepairPriority): {
  variantClass: string;
  label: string;
} {
  switch (priority) {
    case "Crítica":
      return {
        label: "Crítica",
        variantClass: "bg-red-100 text-red-800 border-red-300 font-semibold"
      };
    case "Alta":
      return {
        label: "Alta",
        variantClass: "bg-amber-100 text-amber-800 border-amber-300 font-medium"
      };
    case "Normal":
    default:
      return {
        label: "Normal",
        variantClass: "bg-slate-100 text-slate-700 border-slate-200 font-normal"
      };
  }
}

export function getProjectStatusBadgeProps(status: string): {
  variantClass: string;
  label: string;
} {
  switch (status) {
    case "En ejecución":
      return { label: status, variantClass: "bg-blue-100 text-blue-900 border-blue-200" };
    case "Rediseño":
      return { label: status, variantClass: "bg-amber-100 text-amber-900 border-amber-200" };
    case "Demorado":
      return { label: status, variantClass: "bg-red-100 text-red-900 border-red-200" };
    case "Finalizado":
      return { label: status, variantClass: "bg-emerald-100 text-emerald-900 border-emerald-200" };
    case "En preparación":
    case "Asignado":
    default:
      return { label: status, variantClass: "bg-slate-100 text-slate-800 border-slate-200" };
  }
}
