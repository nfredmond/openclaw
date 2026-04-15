import { describe, expect, it } from "vitest";
import {
  buildFullWorkflowArgs,
  buildSampleWorkflowArgs,
  countJsonLines,
  displayArtifactPath,
  manifestOutputCategories,
  normalizePathList,
  normalizeScenarios,
  sampleWorkspaceFields,
  summarizeQa,
  workspaceRunSummary,
} from "./workbench.js";

describe("clawmodeler workbench helpers", () => {
  it("normalizes paths from newlines and commas", () => {
    expect(normalizePathList("zones.geojson, socio.csv\nprojects.csv\n")).toEqual([
      "zones.geojson",
      "socio.csv",
      "projects.csv",
    ]);
  });

  it("defaults scenarios to baseline", () => {
    expect(normalizeScenarios("")).toEqual(["baseline"]);
    expect(normalizeScenarios("baseline, build")).toEqual(["baseline", "build"]);
  });

  it("builds the full workflow sidecar args", () => {
    expect(
      buildFullWorkflowArgs({
        workspace: "/tmp/demo",
        inputs: ["zones.geojson", "socio.csv"],
        question: "question.json",
        runId: "demo",
        scenarios: ["baseline"],
        skipBridges: true,
      }),
    ).toEqual([
      "workflow",
      "full",
      "--workspace",
      "/tmp/demo",
      "--inputs",
      "zones.geojson",
      "socio.csv",
      "--question",
      "question.json",
      "--run-id",
      "demo",
      "--scenarios",
      "baseline",
      "--skip-bridges",
    ]);
  });

  it("maps sample workspace payloads into form fields", () => {
    expect(
      sampleWorkspaceFields({
        workspace: "/tmp/clawmodeler-workbench",
        run_id: "demo",
        input_paths: ["/tmp/zones.geojson", "/tmp/socio.csv"],
        question_path: "/tmp/question.json",
        scenarios: ["baseline", "infill-growth"],
      }),
    ).toEqual({
      workspace: "/tmp/clawmodeler-workbench",
      runId: "demo",
      inputPaths: "/tmp/zones.geojson\n/tmp/socio.csv",
      questionPath: "/tmp/question.json",
      scenarios: "baseline infill-growth",
    });
  });

  it("builds full workflow args from a sample workspace payload", () => {
    expect(
      buildSampleWorkflowArgs(
        {
          workspace: "/tmp/clawmodeler-workbench",
          run_id: "demo",
          input_paths: ["/tmp/zones.geojson", "/tmp/socio.csv"],
          question_path: "/tmp/question.json",
          scenarios: ["baseline", "infill-growth"],
        },
        true,
      ),
    ).toEqual([
      "workflow",
      "full",
      "--workspace",
      "/tmp/clawmodeler-workbench",
      "--inputs",
      "/tmp/zones.geojson",
      "/tmp/socio.csv",
      "--question",
      "/tmp/question.json",
      "--run-id",
      "demo",
      "--scenarios",
      "baseline",
      "infill-growth",
      "--skip-bridges",
    ]);
  });

  it("summarizes QA reports", () => {
    expect(summarizeQa({ export_ready: true, blockers: [] }).tone).toBe("ready");
    expect(summarizeQa({ export_ready: false, blockers: ["manifest_missing"] })).toEqual({
      label: "Export blocked",
      tone: "blocked",
      blockers: ["manifest_missing"],
    });
  });

  it("counts JSONL rows and manifest output categories", () => {
    expect(countJsonLines('{"a":1}\n\n{"b":2}\n')).toBe(2);
    expect(manifestOutputCategories({ outputs: { tables: [], maps: [], bridges: [] } })).toEqual([
      "bridges",
      "maps",
      "tables",
    ]);
  });

  it("summarizes run evidence and shortens artifact paths", () => {
    expect(
      workspaceRunSummary({
        workspace: "/tmp/clawmodeler-workbench",
        runId: "demo",
        manifest: {
          input_hashes: [{ path: "zones.geojson" }, { path: "socio.csv" }],
          output_hashes: [{ path: "accessibility.csv" }],
          fact_block_count: 7,
        },
        qaReport: null,
        workflowReport: {
          workflow: "full",
          scenarios: ["baseline", "infill-growth"],
          artifacts: { report: "/tmp/clawmodeler-workbench/reports/demo_report.md" },
        },
        reportMarkdown: null,
        files: [],
      }),
    ).toEqual({
      inputCount: 2,
      outputCount: 1,
      factBlockCount: 7,
      scenarios: ["baseline", "infill-growth"],
      reportPath: "/tmp/clawmodeler-workbench/reports/demo_report.md",
      workflow: "full",
    });
    expect(
      displayArtifactPath(
        "/tmp/clawmodeler-workbench/runs/demo/manifest.json",
        "/tmp/clawmodeler-workbench",
      ),
    ).toBe("runs/demo/manifest.json");
  });
});
