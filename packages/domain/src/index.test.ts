import { describe, expect, it } from "vitest";
import {
  isTaskOverdue,
  PROJECT_PUBLICATION_STATUSES,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  TOPIC_STATUSES,
} from "./index";

describe("architecture status contracts", () => {
  it("preserves closed status vocabularies", () => {
    expect(TASK_STATUSES).toEqual(["backlog", "in_progress", "done"]);
    expect(TOPIC_STATUSES).toEqual(["not_started", "studying", "completed"]);
    expect(PROJECT_PUBLICATION_STATUSES).toEqual(["draft", "published"]);
  });

  it("labels every member of each task vocabulary", () => {
    for (const s of TASK_STATUSES) expect(TASK_STATUS_LABELS[s]).toBeTruthy();
    for (const p of TASK_PRIORITIES) expect(TASK_PRIORITY_LABELS[p]).toBeTruthy();
    for (const c of TASK_CATEGORIES) expect(TASK_CATEGORY_LABELS[c]).toBeTruthy();
  });
});

describe("isTaskOverdue", () => {
  const today = new Date(2026, 8, 9); // 2026-09-09 local

  it("is false without a due date", () => {
    expect(isTaskOverdue(null, "backlog", today)).toBe(false);
    expect(isTaskOverdue(undefined, "in_progress", today)).toBe(false);
  });

  it("is false when the task is done, even if the date passed", () => {
    expect(isTaskOverdue("2026-09-01", "done", today)).toBe(false);
  });

  it("is false on the due date itself", () => {
    expect(isTaskOverdue("2026-09-09", "backlog", today)).toBe(false);
  });

  it("is true for a past date on an unfinished task", () => {
    expect(isTaskOverdue("2026-09-08", "backlog", today)).toBe(true);
    expect(isTaskOverdue("2025-12-31", "in_progress", today)).toBe(true);
  });

  it("is false for a future date", () => {
    expect(isTaskOverdue("2026-09-10", "backlog", today)).toBe(false);
  });
});
