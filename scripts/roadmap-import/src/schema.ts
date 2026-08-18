import { z } from "zod";

const materialSchema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  source: z.string().min(1),
  url: z.string().url(),
});

const exampleSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("scenario"),
      context: z.string().min(1),
      content: z.string().min(1),
      result_explanation: z.string().min(1),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("code"),
      context: z.string().min(1),
      language: z.string().min(1),
      code: z.string().min(1),
      result_explanation: z.string().min(1),
    })
    .passthrough(),
]);

const contentSchema = z.object({
  order: z.number().int().positive(),
  title: z.string().min(1),
  explanation: z.string().min(1),
  key_points: z.array(z.string().min(1)).min(1),
  example: exampleSchema,
  when_to_use: z.string().min(1),
  pitfalls: z.string().min(1),
});

const activitySchema = z.object({
  id: z.string().regex(/^M\d{2}-T\d{2}-A\d{2}$/),
  order: z.number().int().positive(),
  title: z.string().min(1),
  instruction: z.string().min(1),
  external_environment: z.string().min(1),
  execution_context: z.string().min(1),
  dataset_or_source: z.string().min(1),
  resources: z.array(z.string().min(1)).min(1),
  expected_output: z.string().min(1),
  suggested_evidence: z.string().min(1),
  external_url: z.string().url().optional(),
});

const topicSchema = z.object({
  id: z.string().regex(/^M\d{2}-T\d{2}$/),
  order: z.number().int().positive(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  recommended_level: z.string().min(1),
  priority: z.enum(["Core", "High", "Advanced"]),
  contents: z.array(contentSchema).min(1),
  activities: z.array(activitySchema).min(1),
  materials: z.array(materialSchema).min(1),
  suggested_projects: z.array(z.string().regex(/^PRJ-\d{2}$/)),
});

const moduleSchema = z.object({
  id: z.string().regex(/^M\d{2}$/),
  order: z.number().int().positive(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["Core", "High", "Advanced"]),
  future_level_band: z.string().min(1),
  topics: z.array(topicSchema).min(1),
});

const projectSchema = z.object({
  id: z.string().regex(/^PRJ-\d{2}$/),
  title: z.string().min(1),
  level: z.string().min(1),
  scope: z.string().min(1),
  evidence: z.string().min(1),
  maps_to: z.array(z.string()),
  mapping_note: z.string().min(1),
});

export const seedSchema = z.object({
  metadata: z
    .object({
      version: z.literal("V1.2"),
      validation_summary: z
        .object({
          modules: z.literal(14),
          topics: z.literal(74),
          contents: z.literal(336),
          activities: z.literal(74),
          materials: z.literal(144),
          projects: z.literal(5),
        })
        .passthrough(),
      amd_001: z.object({ title: z.literal("Content Didático") }).passthrough(),
    })
    .passthrough(),
  track: z
    .object({
      slug: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      modules: z.array(moduleSchema).length(14),
    })
    .passthrough(),
  suggested_projects: z.array(projectSchema).length(5),
});

export type Seed = z.infer<typeof seedSchema>;
