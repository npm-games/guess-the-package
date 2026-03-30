import { type Component, For } from "solid-js";
import type { DependencyNode } from "#lib/npm";

interface Props {
  tree: DependencyNode;
}

interface TreeNode {
  name: string;
  version: string;
  size?: number;
  children: TreeNode[];
}

function flattenTree(node: DependencyNode): TreeNode {
  const result: TreeNode = {
    name: node.name,
    version: node.version,
    children: [],
  };
  if (node.size !== undefined) result.size = node.size;
  if (node.dependencies) {
    result.children = Object.entries(node.dependencies).map(([name]) => ({
      name,
      version: "",
      children: [],
    }));
  }
  return result;
}

const DependencyGraph: Component<Props> = (props) => {
  const nodes = () => flattenTree(props.tree);

  return (
    <div class="border rounded p-4 bg-gray-50 overflow-auto max-h-96">
      <svg
        width="100%"
        height="400"
        class="font-mono text-xs"
        role="img"
        aria-label="Dependency graph"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
        </defs>
        <g transform="translate(20, 30)">
          <rect
            x="0"
            y="0"
            width="120"
            height="40"
            rx="4"
            fill="#3b82f6"
            stroke="#1d4ed8"
            stroke-width="1"
          />
          <text
            x="60"
            y="25"
            text-anchor="middle"
            fill="white"
            font-weight="bold"
          >
            {nodes().name}
          </text>
          <For each={nodes().children}>
            {(child, i) => (
              <g transform={`translate(0, ${60 + i() * 50})`}>
                <line
                  x1="60"
                  y1="0"
                  x2="60"
                  y2="20"
                  stroke="#666"
                  marker-end="url(#arrowhead)"
                />
                <rect
                  x="0"
                  y="20"
                  width="120"
                  height="30"
                  rx="4"
                  fill="#e5e7eb"
                  stroke="#9ca3af"
                  stroke-width="1"
                />
                <text x="60" y="40" text-anchor="middle" fill="#374151">
                  {child.name}
                </text>
              </g>
            )}
          </For>
        </g>
      </svg>
    </div>
  );
};

export default DependencyGraph;
