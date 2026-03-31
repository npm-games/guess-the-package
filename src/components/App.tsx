import { actions } from "astro:actions";
import { createSignal, Show } from "solid-js";
import DependencyGraph, { type Tree } from "./DependencyGraph";

type GameState = "loading" | "playing" | "correct" | "incorrect";

function App() {
  const [gameState, setGameState] = createSignal<GameState>("loading");
  const [tree, setTree] = createSignal<Tree | null>(null);
  const [hash, setHash] = createSignal("");
  const [result, setResult] = createSignal<{
    correct: boolean;
    package: string;
  } | null>(null);
  const [guess, setGuess] = createSignal("");

  const startRound = async () => {
    setGameState("loading");
    setResult(null);
    setGuess("");
    const { data, error } = await actions.createRound();
    console.log(data);
    if (error || !data) {
      console.error(error);
      setGameState("loading");
      return;
    }
    setTree(data.tree);
    setHash(data.hash);
    setGameState("playing");
  };

  const handleGuess = async (e: Event) => {
    e.preventDefault();
    const guessValue = guess().trim();
    if (!guessValue) return;

    const formData = new FormData();
    formData.append("guess", guessValue);
    formData.append("hash", hash());

    const { data, error } = await actions.checkAnswer(formData);
    if (error || !data) {
      console.error(error);
      return;
    }
    setResult(data);
    setGameState(data.correct ? "correct" : "incorrect");
  };

  const treeData = tree();

  return (
    <main class="container mx-auto p-4 max-w-2xl">
      <h1 class="text-2xl font-bold mb-4 text-center">Guess the Package</h1>
      <p class="text-gray-600 mb-4 text-center">
        Can you identify the npm package from its dependency tree?
      </p>

      {treeData && <DependencyGraph tree={treeData} />}

      <Show when={gameState() === "playing" && treeData}>
        <form class="mt-6" onSubmit={handleGuess}>
          <div class="flex gap-2">
            <input
              type="text"
              class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter package name..."
              value={guess()}
              onInput={(e) => setGuess(e.currentTarget.value)}
            />
            <button
              type="submit"
              class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Guess
            </button>
          </div>
        </form>
      </Show>

      <Show when={gameState() === "correct" || gameState() === "incorrect"}>
        <div class="mt-6 text-center">
          <Show when={gameState() === "correct"}>
            <p class="text-green-600 font-bold text-xl mb-2">Correct!</p>
          </Show>
          <Show when={gameState() === "incorrect"}>
            <p class="text-red-600 font-bold text-xl mb-2">Incorrect!</p>
            <p class="text-gray-600">
              The package was:{" "}
              <span class="font-mono font-bold">{result()?.package}</span>
            </p>
          </Show>
          <button
            type="button"
            class="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            onClick={startRound}
          >
            Next Round
          </button>
        </div>
      </Show>

      <Show when={gameState() === "loading" && !treeData}>
        <div class="mt-6 text-center">
          <button
            type="button"
            class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            onClick={startRound}
          >
            Start Game
          </button>
        </div>
      </Show>
    </main>
  );
}

export default App;
