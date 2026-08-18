import { describe, expect, it } from "vitest";
import { PROJECT_PUBLICATION_STATUSES, TASK_STATUSES, TOPIC_STATUSES } from "./index";

describe("architecture status contracts", () => {
  it("preserves closed status vocabularies", () => {
    expect(TASK_STATUSES).toEqual(["backlog", "in_progress", "done"]);
    expect(TOPIC_STATUSES).toEqual(["not_started", "studying", "completed"]);
    expect(PROJECT_PUBLICATION_STATUSES).toEqual(["draft", "published"]);
  });
});
