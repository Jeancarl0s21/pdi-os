import { describe, expect, it } from "vitest";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  groupTasksByTimeframe,
  isTaskOverdue,
  PLANNING_CUTS,
  PLANNING_CUT_LABELS,
  type PlannableTask,
  PROJECT_EXECUTION_STATUS_LABELS,
  PROJECT_EXECUTION_STATUSES,
  PROJECT_PUBLICATION_STATUS_LABELS,
  PROJECT_PUBLICATION_STATUSES,
  PROJECT_PUBLISH_REQUIREMENT_LABELS,
  PROJECT_PUBLISH_REQUIREMENTS,
  projectPublishReadiness,
  startOfMonth,
  startOfWeek,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  taskMatchesCut,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  toISODate,
  TOPIC_STATUSES,
  TOPIC_STATUS_LABELS,
  roadmapProgress,
  parseContentDidacticBody,
  slugify,
} from "./index";

// 2026-09-09 is a Wednesday.
const TODAY = new Date(2026, 8, 9);

function task(partial: Partial<PlannableTask>): PlannableTask {
  return {
    dueDate: null,
    status: "backlog",
    priority: "medium",
    createdAt: "2026-09-01T00:00:00Z",
    ...partial,
  };
}

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

  it("labels every member of each project vocabulary", () => {
    for (const s of PROJECT_EXECUTION_STATUSES) {
      expect(PROJECT_EXECUTION_STATUS_LABELS[s]).toBeTruthy();
    }
    for (const s of PROJECT_PUBLICATION_STATUSES) {
      expect(PROJECT_PUBLICATION_STATUS_LABELS[s]).toBeTruthy();
    }
    for (const r of PROJECT_PUBLISH_REQUIREMENTS) {
      expect(PROJECT_PUBLISH_REQUIREMENT_LABELS[r]).toBeTruthy();
    }
  });
});

describe("projectPublishReadiness", () => {
  const full = {
    shortDescription: "curta",
    fullDescription: "completa",
    technologies: ["Postgres"],
    coverPath: "u/p/cover",
  };

  it("is ready when every requirement is present", () => {
    expect(projectPublishReadiness(full)).toEqual({ ready: true, missing: [] });
  });

  it("lists each missing requirement", () => {
    expect(projectPublishReadiness({ ...full, shortDescription: "  " }).missing).toEqual([
      "shortDescription",
    ]);
    expect(projectPublishReadiness({ ...full, fullDescription: null }).missing).toEqual([
      "fullDescription",
    ]);
    expect(projectPublishReadiness({ ...full, technologies: [] }).missing).toEqual([
      "technologies",
    ]);
    expect(projectPublishReadiness({ ...full, coverPath: null }).missing).toEqual(["cover"]);
  });

  it("is not ready with anything missing", () => {
    expect(projectPublishReadiness({ ...full, coverPath: null }).ready).toBe(false);
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

describe("date helpers", () => {
  it("formats and shifts ISO dates without timezone drift", () => {
    expect(toISODate(TODAY)).toBe("2026-09-09");
    expect(addDays("2026-09-09", 7)).toBe("2026-09-16");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("bounds the ISO week (Mon..Sun) and the month", () => {
    expect(startOfWeek(TODAY)).toBe("2026-09-07");
    expect(endOfWeek(TODAY)).toBe("2026-09-13");
    expect(startOfMonth(TODAY)).toBe("2026-09-01");
    expect(endOfMonth(TODAY)).toBe("2026-09-30");
    expect(endOfMonth(new Date(2028, 1, 15))).toBe("2028-02-29"); // leap year
  });
});

describe("taskMatchesCut", () => {
  it("labels every cut", () => {
    for (const cut of PLANNING_CUTS) expect(PLANNING_CUT_LABELS[cut]).toBeTruthy();
  });

  it("excludes completed tasks from every cut except overdue's exclusion too", () => {
    for (const cut of PLANNING_CUTS) {
      expect(taskMatchesCut(task({ status: "done", dueDate: "2026-09-09" }), cut, TODAY)).toBe(
        false,
      );
    }
  });

  it("week / month / next7 include dated tasks in the window and all undated tasks", () => {
    expect(taskMatchesCut(task({ dueDate: "2026-09-10" }), "week", TODAY)).toBe(true);
    expect(taskMatchesCut(task({ dueDate: "2026-09-14" }), "week", TODAY)).toBe(false);
    expect(taskMatchesCut(task({ dueDate: null }), "week", TODAY)).toBe(true);
    expect(taskMatchesCut(task({ dueDate: "2026-09-30" }), "month", TODAY)).toBe(true);
    expect(taskMatchesCut(task({ dueDate: "2026-10-01" }), "month", TODAY)).toBe(false);
    expect(taskMatchesCut(task({ dueDate: "2026-09-16" }), "next7", TODAY)).toBe(true);
    expect(taskMatchesCut(task({ dueDate: "2026-09-17" }), "next7", TODAY)).toBe(false);
  });

  it("overdue is past-due and unfinished only", () => {
    expect(taskMatchesCut(task({ dueDate: "2026-09-08" }), "overdue", TODAY)).toBe(true);
    expect(taskMatchesCut(task({ dueDate: "2026-09-09" }), "overdue", TODAY)).toBe(false);
    expect(taskMatchesCut(task({ dueDate: null }), "overdue", TODAY)).toBe(false);
    expect(taskMatchesCut(task({ dueDate: "2026-09-08", status: "done" }), "overdue", TODAY)).toBe(
      false,
    );
  });

  it("undated / unfinished", () => {
    expect(taskMatchesCut(task({ dueDate: null }), "undated", TODAY)).toBe(true);
    expect(taskMatchesCut(task({ dueDate: "2026-09-09" }), "undated", TODAY)).toBe(false);
    expect(taskMatchesCut(task({ dueDate: "2020-01-01" }), "unfinished", TODAY)).toBe(true);
  });

  it("custom needs a full range", () => {
    const range = { from: "2026-09-01", to: "2026-09-05" };
    expect(taskMatchesCut(task({ dueDate: "2026-09-03" }), "custom", TODAY, range)).toBe(true);
    expect(taskMatchesCut(task({ dueDate: "2026-09-09" }), "custom", TODAY, range)).toBe(false);
    expect(taskMatchesCut(task({ dueDate: "2026-09-09" }), "custom", TODAY)).toBe(false);
    expect(taskMatchesCut(task({ dueDate: null }), "custom", TODAY, range)).toBe(true);
  });
});

describe("groupTasksByTimeframe", () => {
  it("orders groups and drops empty ones, undated last", () => {
    const groups = groupTasksByTimeframe(
      [
        task({ dueDate: "2026-09-08" }), // overdue
        task({ dueDate: "2026-09-09" }), // today
        task({ dueDate: "2026-09-20" }), // upcoming
        task({ dueDate: null }), // undated
      ],
      TODAY,
    );
    expect(groups.map((g) => g.key)).toEqual(["overdue", "today", "upcoming", "undated"]);
  });

  it("sorts within a group by due date, then priority, then createdAt", () => {
    const [group] = groupTasksByTimeframe(
      [
        task({ dueDate: "2026-09-20", priority: "low", createdAt: "2026-09-01T00:00:00Z" }),
        task({ dueDate: "2026-09-18", priority: "low", createdAt: "2026-09-02T00:00:00Z" }),
        task({ dueDate: "2026-09-20", priority: "high", createdAt: "2026-09-03T00:00:00Z" }),
      ],
      TODAY,
    );
    expect(group.tasks.map((t) => [t.dueDate, t.priority])).toEqual([
      ["2026-09-18", "low"],
      ["2026-09-20", "high"],
      ["2026-09-20", "low"],
    ]);
  });

  it("puts a done task with a past date under today, not overdue", () => {
    const groups = groupTasksByTimeframe([task({ dueDate: "2026-09-01", status: "done" })], TODAY);
    expect(groups.map((g) => g.key)).toEqual(["today"]);
  });
});

describe("roadmapProgress", () => {
  const topic = (
    status: "not_started" | "studying" | "completed",
    archivedAt: string | null = null,
  ) => ({
    status,
    archivedAt,
  });

  it("is 0/0 → 0% with no topics", () => {
    expect(roadmapProgress([])).toEqual({ completed: 0, total: 0, pct: 0 });
  });

  it("counts only completed active topics", () => {
    expect(roadmapProgress([topic("completed"), topic("studying"), topic("not_started")])).toEqual({
      completed: 1,
      total: 3,
      pct: 33,
    });
  });

  it("drops archived topics from both numerator and denominator", () => {
    expect(
      roadmapProgress([
        topic("completed"),
        topic("completed", "2026-01-01T00:00:00Z"),
        topic("studying"),
      ]),
    ).toEqual({ completed: 1, total: 2, pct: 50 });
  });

  it("is 100% when every active topic is completed", () => {
    expect(roadmapProgress([topic("completed"), topic("completed")]).pct).toBe(100);
  });

  it("maps topic status labels to PT-BR", () => {
    expect(TOPIC_STATUS_LABELS.studying).toBe("Estudando");
    expect(TOPIC_STATUS_LABELS.completed).toBe("Concluído");
  });
});

describe("parseContentDidacticBody", () => {
  it("returns an empty shape for a missing or non-object payload", () => {
    expect(parseContentDidacticBody(null)).toEqual({
      explanation: null,
      keyPoints: [],
      example: null,
      whenToUse: null,
      pitfalls: null,
    });
  });

  it("extracts the editorial fields and camelCases the example", () => {
    const body = parseContentDidacticBody({
      explanation: "O que é",
      key_points: ["a", "b", ""],
      example: { type: "scenario", context: "ctx", content: "code", result_explanation: "res" },
      when_to_use: "quando",
      pitfalls: "cuidado",
    });
    expect(body.keyPoints).toEqual(["a", "b"]);
    expect(body.example).toEqual({
      type: "scenario",
      context: "ctx",
      content: "code",
      resultExplanation: "res",
    });
    expect(body.whenToUse).toBe("quando");
  });

  it("drops an example that has no meaningful fields", () => {
    expect(parseContentDidacticBody({ example: {} }).example).toBeNull();
  });
});

describe("slugify", () => {
  it("lowercases, strips accents, collapses separators", () => {
    expect(slugify("Engenharia de Dados")).toBe("engenharia-de-dados");
    expect(slugify("  Modelagem & ETL!! ")).toBe("modelagem-etl");
    expect(slugify("Já É Ção")).toBe("ja-e-cao");
  });

  it("returns an empty string for input with no alphanumerics", () => {
    expect(slugify("--- !!! ---")).toBe("");
  });
});
