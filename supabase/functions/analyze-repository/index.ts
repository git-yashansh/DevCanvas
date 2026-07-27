import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { callGemini, corsHeaders, AIServiceError, robustJsonParse } from "../_shared/ai-service.ts";

const SYSTEM_PROMPT = `You are DevCanvas Repository Analyzer, an expert software architect and code intelligence engine.

Given metadata about a GitHub repository (README content, file tree, language breakdown, topics, description), produce a comprehensive codebase analysis as JSON.

The JSON MUST follow this exact schema:

{
  "summary": string (2-3 sentence executive summary of the codebase),
  "score": number (0-100 overall codebase quality score),
  "complexity": "Low" | "Medium" | "High" | "Critical",
  "maintainability": number (0-100),
  "architecture": number (0-100),
  "documentation": number (0-100),
  "testCoverage": number (0-100, estimate based on test files presence),
  "technicalDebt": number (estimated dev-days of tech debt),
  "primaryLanguage": string,
  "framework": string (main framework detected, e.g. "React", "Express", "Django", "None"),
  "totalFiles": number (estimate),
  "totalLoc": number (estimate),
  "layers": [
    { "name": string, "files": string[], "purpose": string }
  ],
  "codeSmells": [
    {
      "file": string,
      "smell": string,
      "severity": "Low" | "Medium" | "High" | "Critical",
      "impact": string,
      "recommendation": string
    }
  ],
  "dependencies": [
    { "name": string, "version": string, "type": "production" | "dev", "risk": "low" | "medium" | "high" }
  ],
  "highlights": [
    { "title": string, "description": string, "type": "positive" | "warning" | "info" }
  ],
  "folderStats": [
    { "folder": string, "fileCount": number, "purpose": string, "complexity": "Low" | "Medium" | "High" }
  ],
  "circularDeps": [
    { "title": string, "details": string, "type": string }
  ],
  "recommendations": {
    "immediate": string[],
    "shortTerm": string[],
    "longTerm": string[]
  },
  "files": [
    {
      "id": string (snake_case unique identifier),
      "name": string (filename),
      "path": string (relative path),
      "type": "file" | "folder",
      "purpose": string,
      "responsibilities": string[],
      "imports": string[],
      "exports": string[],
      "functions": string[],
      "classes": string[],
      "hooks": string[],
      "components": string[],
      "complexity": "Low" | "Medium" | "High" | "Critical",
      "loc": number,
      "dependencies": string[] (other file IDs this depends on),
      "dependents": string[] (other file IDs that depend on this),
      "aiSummary": string,
      "improvements": string[],
      "layer": "Component" | "Hook" | "Service" | "API" | "Database Layer" | "Root"
    }
  ]
}

Generate 6-10 representative files from the repository based on the file tree. Focus on the most architecturally important files.
For the "files" array, infer realistic details from the file names, directory structure, and detected frameworks.
Return ONLY valid JSON. No markdown fences, no explanations outside JSON.`;

async function fetchGitHubRepoData(repoUrl: string): Promise<Record<string, any>> {
  // Parse owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (!match) throw new Error("Invalid GitHub URL. Please provide a URL like https://github.com/owner/repo");

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");

  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "DevCanvas-Analyzer/1.0",
  };

  const githubToken = Deno.env.get("GITHUB_TOKEN");
  if (githubToken) {
    headers["Authorization"] = `token ${githubToken}`;
  }

  const results: Record<string, any> = { owner, repo };

  // Fetch repo metadata
  try {
    const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (metaRes.ok) {
      const meta = await metaRes.json();
      results.description = meta.description || "";
      results.language = meta.language || "Unknown";
      results.topics = meta.topics || [];
      results.stars = meta.stargazers_count || 0;
      results.forks = meta.forks_count || 0;
      results.defaultBranch = meta.default_branch || "main";
      results.size = meta.size || 0;
    }
  } catch (_) {
    results.description = "";
    results.language = "Unknown";
  }

  // Fetch language breakdown
  try {
    const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
    if (langRes.ok) {
      results.languages = await langRes.json();
    }
  } catch (_) {
    results.languages = {};
  }

  // Fetch file tree (top level)
  try {
    const branch = results.defaultBranch || "main";
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers }
    );
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      // Get all file paths (limit to first 200 to avoid huge payloads)
      const allPaths = (treeData.tree || [])
        .filter((item: any) => item.type === "blob")
        .slice(0, 200)
        .map((item: any) => item.path);
      results.filePaths = allPaths;
      results.truncated = treeData.truncated || false;
    }
  } catch (_) {
    results.filePaths = [];
  }

  // Fetch README content
  try {
    const readmeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      { headers: { ...headers, "Accept": "application/vnd.github.raw" } }
    );
    if (readmeRes.ok) {
      const text = await readmeRes.text();
      // Truncate to first 3000 chars to keep prompts manageable
      results.readme = text.slice(0, 3000);
    }
  } catch (_) {
    results.readme = "";
  }

  // Fetch package.json if present (Node/JS projects)
  try {
    const pkgRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
      { headers: { ...headers, "Accept": "application/vnd.github.raw" } }
    );
    if (pkgRes.ok) {
      const pkgText = await pkgRes.text();
      try {
        results.packageJson = JSON.parse(pkgText);
      } catch (_) {
        results.packageJson = null;
      }
    }
  } catch (_) {
    results.packageJson = null;
  }

  return results;
}

function buildPrompt(repoData: Record<string, any>): string {
  const { owner, repo, description, language, languages, topics, stars, forks, filePaths, readme, packageJson, truncated } = repoData;

  const langBreakdown = languages
    ? Object.entries(languages)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 6)
        .map(([lang, bytes]) => `${lang}: ${bytes} bytes`)
        .join(", ")
    : "Unknown";

  const fileTree = (filePaths || []).join("\n");
  const deps = packageJson?.dependencies ? JSON.stringify(packageJson.dependencies, null, 2).slice(0, 1000) : "Not available";
  const devDeps = packageJson?.devDependencies ? JSON.stringify(packageJson.devDependencies, null, 2).slice(0, 500) : "Not available";
  const scripts = packageJson?.scripts ? JSON.stringify(packageJson.scripts).slice(0, 300) : "Not available";

  return `Analyze the following GitHub repository: ${owner}/${repo}

## Repository Metadata
- Description: ${description || "No description"}
- Primary Language: ${language}
- Language Breakdown: ${langBreakdown}
- Topics/Tags: ${(topics || []).join(", ") || "None"}
- Stars: ${stars} | Forks: ${forks}
- Package Name: ${packageJson?.name || "N/A"}
- Framework Hint: ${packageJson?.name || ""} ${(topics || []).join(" ")}

## Dependencies (package.json)
${deps}

## Dev Dependencies
${devDeps}

## Scripts
${scripts}

## File Tree (${truncated ? "truncated" : "full"})
${fileTree.slice(0, 4000)}

## README Content
${(readme || "").slice(0, 2000)}

Based on this information, produce a comprehensive JSON analysis following the schema provided. Infer architectural patterns, code quality metrics, and potential issues from the file structure, dependencies, and README.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header.", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized.", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const repoUrl: string = body.repoUrl?.trim() || "";

    if (!repoUrl) {
      return new Response(
        JSON.stringify({ error: "A GitHub repository URL is required.", code: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch real repo data from GitHub API
    let repoData: Record<string, any>;
    try {
      repoData = await fetchGitHubRepoData(repoUrl);
    } catch (fetchErr) {
      return new Response(
        JSON.stringify({ error: fetchErr instanceof Error ? fetchErr.message : "Failed to fetch repository data.", code: "FETCH_ERROR" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userPrompt = buildPrompt(repoData);

    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood. I will return only valid JSON matching the schema." }] },
      { role: "user", parts: [{ text: userPrompt }] },
    ];

    const geminiRes = await callGemini({
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    });

    const analysis = robustJsonParse(geminiRes.reply);

    // Attach raw github metadata for the frontend
    analysis.githubMeta = {
      owner: repoData.owner,
      repo: repoData.repo,
      language: repoData.language,
      languages: repoData.languages,
      stars: repoData.stars,
      forks: repoData.forks,
      topics: repoData.topics,
    };

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const status = err instanceof AIServiceError ? err.status : 500;
    const code = err instanceof AIServiceError ? err.code : "INTERNAL_ERROR";
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error.",
        code,
      }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
