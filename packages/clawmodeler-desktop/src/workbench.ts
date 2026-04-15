export type RunMode = "demo-full" | "full" | "diagnose" | "report-only";

export type QaSummary = {
  label: string;
  tone: "ready" | "blocked" | "unknown";
  blockers: string[];
};

export type WorkspaceArtifacts = {
  workspace: string;
  runId: string;
  manifest: Record<string, unknown> | null;
  qaReport: Record<string, unknown> | null;
  workflowReport: Record<string, unknown> | null;
  reportMarkdown: string | null;
  files: string[];
};

export type RunSummary = {
  inputCount: number;
  outputCount: number;
  factBlockCount: number;
  scenarios: string[];
  reportPath: string;
  workflow: string;
};

export type SampleWorkspace = {
  workspace: string;
  run_id?: string;
  runId?: string;
  input_paths?: string[];
  inputPaths?: string[];
  question_path?: string;
  questionPath?: string;
  scenarios?: string[];
};

export type SampleWorkspaceFields = {
  workspace: string;
  runId: string;
  inputPaths: string;
  questionPath: string;
  scenarios: string;
};

export function normalizePathList(input: string): string[] {
  return input
    .split(/\r?\n|,/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeScenarios(input: string): string[] {
  const values = input
    .split(/\s|,/u)
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length > 0 ? values : ["baseline"];
}

export function buildFullWorkflowArgs(params: {
  workspace: string;
  inputs: string[];
  question: string;
  runId: string;
  scenarios: string[];
  skipBridges: boolean;
}): string[] {
  const args = [
    "workflow",
    "full",
    "--workspace",
    params.workspace,
    "--inputs",
    ...params.inputs,
    "--question",
    params.question,
    "--run-id",
    params.runId,
    "--scenarios",
    ...params.scenarios,
  ];
  if (params.skipBridges) {
    args.push("--skip-bridges");
  }
  return args;
}

export function sampleWorkspaceFields(sample: SampleWorkspace): SampleWorkspaceFields {
  const inputPaths = sample.inputPaths ?? sample.input_paths ?? [];
  return {
    workspace: sample.workspace,
    runId: sample.runId ?? sample.run_id ?? "demo",
    inputPaths: inputPaths.join("\n"),
    questionPath: sample.questionPath ?? sample.question_path ?? "",
    scenarios: (sample.scenarios?.length ? sample.scenarios : ["baseline"]).join(" "),
  };
}

export function buildSampleWorkflowArgs(sample: SampleWorkspace, skipBridges = false): string[] {
  const fields = sampleWorkspaceFields(sample);
  return buildFullWorkflowArgs({
    workspace: fields.workspace,
    inputs: normalizePathList(fields.inputPaths),
    question: fields.questionPath,
    runId: fields.runId,
    scenarios: normalizeScenarios(fields.scenarios),
    skipBridges,
  });
}

export function summarizeQa(qaReport: Record<string, unknown> | null): QaSummary {
  if (!qaReport) {
    return { label: "No QA report", tone: "unknown", blockers: [] };
  }

  const rawBlockers = qaReport.blockers;
  const blockers = Array.isArray(rawBlockers) ? rawBlockers.map((item) => String(item)) : [];

  if (qaReport.export_ready === true) {
    return { label: "Export ready", tone: "ready", blockers };
  }
  if (qaReport.export_ready === false) {
    return { label: "Export blocked", tone: "blocked", blockers };
  }
  return { label: "QA status unknown", tone: "unknown", blockers };
}

export function countJsonLines(input: string | null): number {
  if (!input) {
    return 0;
  }
  return input
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

export function manifestOutputCategories(manifest: Record<string, unknown> | null): string[] {
  const outputs = manifest?.outputs;
  if (!outputs || typeof outputs !== "object" || Array.isArray(outputs)) {
    return [];
  }
  return Object.keys(outputs).toSorted();
}

export function manifestLimitations(manifest: Record<string, unknown> | null): string[] {
  const assumptions = manifest?.assumptions;
  if (Array.isArray(assumptions)) {
    const values = assumptions.map((item) => String(item).trim()).filter(Boolean);
    if (values.length > 0) {
      return values;
    }
  }
  return [
    "Run outputs are screening-level until a manifest records the selected methods, assumptions, and limitations.",
  ];
}

function arrayFieldLength(source: Record<string, unknown> | null, key: string): number {
  const value = source?.[key];
  return Array.isArray(value) ? value.length : 0;
}

function stringArrayField(source: Record<string, unknown> | null, key: string): string[] {
  const value = source?.[key];
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export function workspaceRunSummary(artifacts: WorkspaceArtifacts | null): RunSummary {
  const manifest = artifacts?.manifest ?? null;
  const workflowReport = artifacts?.workflowReport ?? null;
  const workflowArtifacts = workflowReport?.artifacts;
  const reportValue =
    workflowArtifacts && typeof workflowArtifacts === "object" && !Array.isArray(workflowArtifacts)
      ? (workflowArtifacts as Record<string, unknown>).report
      : undefined;
  return {
    inputCount: arrayFieldLength(manifest, "input_hashes"),
    outputCount: arrayFieldLength(manifest, "output_hashes"),
    factBlockCount: typeof manifest?.fact_block_count === "number" ? manifest.fact_block_count : 0,
    scenarios: stringArrayField(workflowReport, "scenarios"),
    reportPath: typeof reportValue === "string" ? reportValue : "",
    workflow: typeof workflowReport?.workflow === "string" ? workflowReport.workflow : "",
  };
}

export function displayArtifactPath(filePath: string, workspace: string): string {
  const prefix = workspace.endsWith("/") ? workspace : `${workspace}/`;
  return filePath.startsWith(prefix) ? filePath.slice(prefix.length) : filePath;
}
