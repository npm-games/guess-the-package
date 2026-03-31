export const PACKAGES = [
  "node-fetch",
  "express",
  "next",
  "axios",
  "tinyglobby",
] as const;

export type PackageName = (typeof PACKAGES)[number];

export interface DependencyNode {
  name: string;
  version: string;
  size?: number;
  dependencies?: DependencyNode[];
}

interface NpmxResponse {
  package: string;
  version: string;
  selfSize: number;
  totalSize: number;
  dependencyCount: number;
  dependencies: {
    name: string;
    version: string;
    size: number;
  }[];
}

interface NpmMetaResponse {
  name: string;
  specifier: string;
  version: string;
  publishedAt: string;
  lastSynced: number;
}

async function fetchLatestVersion(name: string): Promise<string> {
  const url = `https://npm.antfu.dev/${name}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch metadata for ${name}`);
  const data: NpmMetaResponse = await res.json();
  return data.version;
}

async function fetchNpmx(name: string, version: string): Promise<NpmxResponse> {
  const url = `https://npmx.dev/api/registry/install-size/${name}/v/${version}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${name}`);
  return res.json();
}

export async function buildDependencyTree(
  name: string,
  version?: string,
  fetched?: Map<string, DependencyNode>,
): Promise<DependencyNode> {
  if (!fetched) {
    fetched = new Map();
  }

  const resolvedVersion = version ?? (await fetchLatestVersion(name));
  const cacheKey = `${name}@${resolvedVersion}`;

  const cached = fetched.get(cacheKey);
  if (cached) {
    return cached;
  }

  console.log(`Building dependency tree for ${name}@${resolvedVersion}`);
  const data = await fetchNpmx(name, resolvedVersion);

  const node: DependencyNode = {
    name: data.package,
    version: data.version,
    size: data.selfSize,
  };

  fetched.set(cacheKey, node);

  if (data.dependencies.length > 0) {
    node.dependencies = [];

    for (const dep of data.dependencies) {
      try {
        const depNode = await buildDependencyTree(
          dep.name,
          dep.version,
          fetched,
        );
        node.dependencies.push(depNode);
      } catch {
        // skip failed deps
      }
    }
  }

  return node;
}
