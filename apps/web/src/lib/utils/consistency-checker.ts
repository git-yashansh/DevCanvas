import type { Project } from "@types-pkg/index";

export interface ConsistencyIssue {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  sourceArtifact: string;
  targetArtifact: string;
  impact: string;
  suggestedFix: string;
}

export interface CategoryValidation {
  category: string;
  score: number;
  status: "Excellent" | "Good" | "Needs Attention" | "Missing";
  issues: ConsistencyIssue[];
  recommendations: string[];
}

export interface ProjectValidationResult {
  overallScore: number;
  consistencyScore: number;
  categories: {
    architecture: CategoryValidation;
    database: CategoryValidation;
    api: CategoryValidation;
    security: CategoryValidation;
    deployment: CategoryValidation;
    documentation: CategoryValidation;
    repository: CategoryValidation;
  };
  issues: ConsistencyIssue[];
}

export function analyzeProjectConsistency(project: Project | null | undefined): ProjectValidationResult {
  const issues: ConsistencyIssue[] = [];

  if (!project) {
    return {
      overallScore: 0,
      consistencyScore: 0,
      categories: {
        architecture: { category: "Architecture", score: 0, status: "Missing", issues: [], recommendations: ["Generate Architecture Spec"] },
        database: { category: "Database", score: 0, status: "Missing", issues: [], recommendations: ["Generate Database Schema"] },
        api: { category: "API", score: 0, status: "Missing", issues: [], recommendations: ["Generate API Specification"] },
        security: { category: "Security", score: 0, status: "Missing", issues: [], recommendations: ["Run Security Audit"] },
        deployment: { category: "Deployment", score: 0, status: "Missing", issues: [], recommendations: ["Generate Deployment Plan"] },
        documentation: { category: "Documentation", score: 0, status: "Missing", issues: [], recommendations: ["Generate Documentation Suite"] },
        repository: { category: "Repository", score: 0, status: "Missing", issues: [], recommendations: ["Analyze GitHub Repository"] },
      },
      issues: [],
    };
  }

  const arch = project.architecture;
  const db = project.database_schema;
  const api = project.api_spec;
  const sec = project.security_report;
  const dep = project.deployment_plan;
  const docs = project.documentation;

  // 1. Cross-Check: Architecture ↔ Database
  if (arch && !db) {
    issues.push({
      id: "arch-db-missing",
      severity: "warning",
      title: "Database Schema Not Generated for Architecture",
      description: `Architecture defines ${arch.services?.length ?? 0} services, but database schema has not been modeled yet.`,
      sourceArtifact: "Architecture",
      targetArtifact: "Database",
      impact: "Data storage requirements for services are unvalidated.",
      suggestedFix: "Generate PostgreSQL database schema from architecture specification.",
    });
  } else if (arch && db) {
    const archServices: string[] = (arch.services || []).map((s: any) => s.name?.toLowerCase() || "");
    const dbTables: string[] = (db.tables || []).map((t: any) => t.name?.toLowerCase() || "");

    // Check if services have matching tables or data entities
    archServices.forEach((svc) => {
      const serviceNameClean = svc.replace(/service|app|api/g, "").trim();
      if (serviceNameClean && !dbTables.some((t) => t.includes(serviceNameClean))) {
        issues.push({
          id: `arch-db-mismatch-${svc}`,
          severity: "warning",
          title: `Service "${svc}" missing dedicated DB table/entity`,
          description: `Architecture includes "${svc}" service, but no corresponding table matching "${serviceNameClean}" was found in the Database schema.`,
          sourceArtifact: "Architecture",
          targetArtifact: "Database",
          impact: "Potential unhandled data persistence for service.",
          suggestedFix: `Add a table for "${serviceNameClean}" to database schema or link existing entities.`,
        });
      }
    });
  }

  // 2. Cross-Check: Database ↔ API
  if (db && !api) {
    issues.push({
      id: "db-api-missing",
      severity: "warning",
      title: "API Specification Missing for DB Schema",
      description: `Database contains ${db.tables?.length ?? 0} tables, but no API endpoints are exposed yet.`,
      sourceArtifact: "Database",
      targetArtifact: "API",
      impact: "Front-end and client apps cannot query database entities.",
      suggestedFix: "Generate REST OpenAPI endpoints for database entities.",
    });
  } else if (db && api) {
    const dbTables: string[] = (db.tables || []).map((t: any) => t.name?.toLowerCase() || "");
    const apiEndpoints: string[] = (api.endpoints || []).map((e: any) => e.path?.toLowerCase() || "");

    dbTables.forEach((table) => {
      const tableSingular = table.replace(/s$/, "");
      const isExposed = apiEndpoints.some((ep) => ep.includes(table) || ep.includes(tableSingular));
      if (!isExposed) {
        issues.push({
          id: `db-api-unexposed-${table}`,
          severity: "info",
          title: `Table "${table}" has no exposed CRUD endpoints`,
          description: `Database table "${table}" does not have matching REST endpoints defined in the API specification.`,
          sourceArtifact: "Database",
          targetArtifact: "API",
          impact: "Table data is isolated without API access.",
          suggestedFix: `Add GET/POST CRUD routes for /api/${table} in API specification.`,
        });
      }
    });
  }

  // 3. Cross-Check: API ↔ Security
  if (api && sec) {
    const endpoints: any[] = api.endpoints || [];
    const publicEndpoints = endpoints.filter((e) => !e.requiresAuth && !e.auth);
    if (publicEndpoints.length > 0) {
      issues.push({
        id: "api-sec-unauthenticated",
        severity: publicEndpoints.length > 3 ? "critical" : "warning",
        title: `${publicEndpoints.length} Unauthenticated API Endpoints`,
        description: `API specification contains ${publicEndpoints.length} endpoints without explicit JWT / RBAC authorization requirements.`,
        sourceArtifact: "API",
        targetArtifact: "Security",
        impact: "Exposes sensitive project endpoints to unauthenticated public access.",
        suggestedFix: "Apply Bearer JWT authentication middleware to non-public endpoints.",
      });
    }
  }

  // 4. Cross-Check: Architecture ↔ Deployment
  if (arch && dep) {
    const hasRedisInArch = JSON.stringify(arch).toLowerCase().includes("redis");
    const hasRedisInDep = JSON.stringify(dep).toLowerCase().includes("redis");
    if (hasRedisInArch && !hasRedisInDep) {
      issues.push({
        id: "arch-dep-redis",
        severity: "critical",
        title: "Redis Cache in Architecture but Missing in Deployment",
        description: "System architecture specifies Redis caching service, but deployment compose/k8s config does not provision a Redis container.",
        sourceArtifact: "Architecture",
        targetArtifact: "Deployment",
        impact: "Runtime container startup failure when application tries connecting to Redis.",
        suggestedFix: "Add redis:7-alpine service block to docker-compose.yml in Deployment planner.",
      });
    }
  }

  // Calculate dynamic category scores
  const getCategoryScore = (artifact: any, categoryIssues: ConsistencyIssue[]) => {
    if (!artifact) return { score: 0, status: "Missing" as const };
    const baseScore = 95;
    const penalty = categoryIssues.reduce((acc, issue) => {
      return acc + (issue.severity === "critical" ? 15 : issue.severity === "warning" ? 8 : 4);
    }, 0);
    const score = Math.max(40, baseScore - penalty);
    const status = score >= 85 ? ("Excellent" as const) : score >= 70 ? ("Good" as const) : ("Needs Attention" as const);
    return { score, status };
  };

  const archIssues = issues.filter((i) => i.sourceArtifact === "Architecture" || i.targetArtifact === "Architecture");
  const dbIssues = issues.filter((i) => i.sourceArtifact === "Database" || i.targetArtifact === "Database");
  const apiIssues = issues.filter((i) => i.sourceArtifact === "API" || i.targetArtifact === "API");
  const secIssues = issues.filter((i) => i.sourceArtifact === "Security" || i.targetArtifact === "Security");
  const depIssues = issues.filter((i) => i.sourceArtifact === "Deployment" || i.targetArtifact === "Deployment");
  const docIssues = issues.filter((i) => i.sourceArtifact === "Documentation" || i.targetArtifact === "Documentation");

  const archState = getCategoryScore(arch, archIssues);
  const dbState = getCategoryScore(db, dbIssues);
  const apiState = getCategoryScore(api, apiIssues);
  const secState = getCategoryScore(sec, secIssues);
  const depState = getCategoryScore(dep, depIssues);
  const docState = getCategoryScore(docs, docIssues);
  const repoState = { score: project.tags?.length ? 85 : 60, status: "Good" as const };

  const validScores = [
    archState.score,
    dbState.score,
    apiState.score,
    secState.score,
    depState.score,
    docState.score,
  ].filter((s) => s > 0);

  const overallScore = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
  const consistencyScore = Math.max(30, 100 - issues.length * 10);

  return {
    overallScore,
    consistencyScore,
    categories: {
      architecture: { category: "Architecture", score: archState.score, status: archState.status, issues: archIssues, recommendations: archIssues.map((i) => i.suggestedFix) },
      database: { category: "Database", score: dbState.score, status: dbState.status, issues: dbIssues, recommendations: dbIssues.map((i) => i.suggestedFix) },
      api: { category: "API", score: apiState.score, status: apiState.status, issues: apiIssues, recommendations: apiIssues.map((i) => i.suggestedFix) },
      security: { category: "Security", score: secState.score, status: secState.status, issues: secIssues, recommendations: secIssues.map((i) => i.suggestedFix) },
      deployment: { category: "Deployment", score: depState.score, status: depState.status, issues: depIssues, recommendations: depIssues.map((i) => i.suggestedFix) },
      documentation: { category: "Documentation", score: docState.score, status: docState.status, issues: docIssues, recommendations: docIssues.map((i) => i.suggestedFix) },
      repository: { category: "Repository", score: repoState.score, status: repoState.status, issues: [], recommendations: [] },
    },
    issues,
  };
}
