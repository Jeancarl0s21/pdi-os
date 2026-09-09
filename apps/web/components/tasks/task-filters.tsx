"use client";

import {
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
} from "@pdi-os/domain";
import { Select } from "@/components/ui/select";

export interface TaskFilterValues {
  category: string;
  priority: string;
  tag: string;
}

export const EMPTY_FILTERS: TaskFilterValues = { category: "", priority: "", tag: "" };

export function taskFiltersActive(values: TaskFilterValues): boolean {
  return Boolean(values.category || values.priority || values.tag);
}

export function TaskFilters({
  values,
  onChange,
  tagOptions,
}: {
  values: TaskFilterValues;
  onChange: (values: TaskFilterValues) => void;
  tagOptions: string[];
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:w-40">
        Categoria
        <Select
          value={values.category}
          onChange={(event) => onChange({ ...values, category: event.target.value })}
        >
          <option value="">Todas</option>
          {TASK_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {TASK_CATEGORY_LABELS[category]}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:w-40">
        Prioridade
        <Select
          value={values.priority}
          onChange={(event) => onChange({ ...values, priority: event.target.value })}
        >
          <option value="">Todas</option>
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {TASK_PRIORITY_LABELS[priority]}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:w-40">
        Tag
        <Select
          value={values.tag}
          onChange={(event) => onChange({ ...values, tag: event.target.value })}
        >
          <option value="">Todas</option>
          {tagOptions.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </Select>
      </label>
    </div>
  );
}
