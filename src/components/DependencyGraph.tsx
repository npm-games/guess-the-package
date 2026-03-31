import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import { type Component, createEffect, onCleanup, onMount } from "solid-js";
import type { DependencyNode } from "#lib/npm";

interface Props {
  tree: Tree;
}

export interface Tree {
  size?: number;
  dependencies?: DependencyNode[] | undefined;
}

function treeToElements(
  node: DependencyNode | undefined,
  parentId?: string,
): ElementDefinition[] {
  if (!node) return [];

  const elements: ElementDefinition[] = [];

  elements.push({
    data: {
      id: node.name,
      label: node.name,
      size: node.size,
    },
  });

  if (parentId) {
    elements.push({
      data: {
        source: parentId,
        target: node.name,
      },
    });
  }

  if (node.dependencies) {
    for (const dep of node.dependencies) {
      elements.push(...treeToElements(dep, node.name));
    }
  }

  return elements;
}

const DependencyGraph: Component<Props> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let cy: Core | undefined;

  onMount(() => {
    if (!containerRef) return;

    cy = cytoscape({
      container: containerRef,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#3b82f6",
            label: "data(label)",
            color: "#374151",
            "font-size": "10px",
            "text-valign": "center",
            "text-halign": "center",
            width: 80,
            height: 30,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#9ca3af",
            "target-arrow-color": "#9ca3af",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
      ],
      layout: { name: "breadthfirst" },
      userPanningEnabled: true,
      userZoomingEnabled: true,
      boxSelectionEnabled: false,
    });
  });

  createEffect(() => {
    const tree = props.tree;
    if (!cy || !tree?.dependencies) return;

    const elements = treeToElements({
      name: "root",
      version: "",
      dependencies: tree.dependencies,
    });
    cy.elements().remove();
    cy.add(elements);
    cy.layout({
      name: "breadthfirst",
      directed: true,
      padding: 10,
      animate: true,
    }).run();
  });

  onCleanup(() => {
    cy?.destroy();
  });

  return (
    <div
      ref={containerRef}
      class="border rounded p-4 bg-gray-50"
      style={{ width: "100%", height: "400px" }}
    />
  );
};

export default DependencyGraph;
