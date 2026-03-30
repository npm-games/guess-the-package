import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { buildDependencyTree, PACKAGES } from "#lib/npm";

const SECRET = "dev-secret-change-in-prod";

async function hashAnswer(answer: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(SECRET + answer);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const server = {
  createRound: defineAction({
    handler: async () => {
      const pkgName = PACKAGES[Math.floor(Math.random() * PACKAGES.length)];
      const tree = await buildDependencyTree(pkgName, "latest");
      const hash = await hashAnswer(pkgName);

      return {
        package: pkgName,
        tree,
        hash,
      };
    },
  }),
  checkAnswer: defineAction({
    accept: "form",
    input: z.object({
      guess: z.string(),
      hash: z.string(),
    }),
    handler: async ({ guess, hash }) => {
      const expectedHash = await hashAnswer(guess);
      return {
        correct: expectedHash === hash,
        package: guess,
      };
    },
  }),
};
