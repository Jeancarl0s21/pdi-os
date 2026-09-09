import "server-only";
import { isTaskOverdue } from "@pdi-os/domain";
import { createClient } from "@/lib/supabase/server";
import type { Task, TaskCounts } from "./types";

const TASK_COLUMNS =
  "id,title,description,category,priority,status,due_date,position,created_at,task_tags(tags(name))";

type RawTask = {
  id: string;
  title: string;
  description: string | null;
  category: Task["category"];
  priority: Task["priority"];
  status: Task["status"];
  due_date: string | null;
  position: number;
  created_at: string;
  task_tags: { tags: { name: string } | null }[] | null;
};

function mapTask(row: RawTask): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date,
    position: row.position,
    createdAt: row.created_at,
    tags: (row.task_tags ?? [])
      .map((link) => link.tags?.name)
      .filter((name): name is string => Boolean(name))
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  };
}

export async function listActiveTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawTask[]).map(mapTask);
}

export async function getTaskCounts(): Promise<TaskCounts> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("status,due_date")
    .is("archived_at", null);
  if (error) throw error;

  const rows = (data ?? []) as { status: Task["status"]; due_date: string | null }[];
  return {
    pending: rows.filter((row) => row.status !== "done").length,
    overdue: rows.filter((row) => isTaskOverdue(row.due_date, row.status)).length,
    done: rows.filter((row) => row.status === "done").length,
  };
}

export async function listTags(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("name").order("name");
  if (error) throw error;
  return ((data ?? []) as { name: string }[]).map((row) => row.name);
}
