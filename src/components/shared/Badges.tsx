import { RepairPriority, StatusCategory } from "@/lib/types/database";
import { getPriorityBadgeProps, getProjectStatusBadgeProps, getStatusBadgeProps } from "@/lib/utils";

export function StatusBadge({ name, category }: { name?: string; category?: StatusCategory }) {
  const { label, variantClass } = getStatusBadgeProps(name, category);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border whitespace-nowrap ${variantClass}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: RepairPriority }) {
  const { label, variantClass } = getPriorityBadgeProps(priority);
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border uppercase tracking-wider ${variantClass}`}>
      {label}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const { label, variantClass } = getProjectStatusBadgeProps(status);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border font-medium whitespace-nowrap ${variantClass}`}>
      {label}
    </span>
  );
}
