// Publishes dist/ to the gh-pages branch as its own throwaway, isolated git repo, then
// force-pushes it. Deliberately NOT using the `gh-pages` npm package here — in this repo it
// picked up unrelated tracked root-level files (other nested projects/dotfolders sitting
// alongside dist/) into the published branch instead of only dist's contents. Building the
// branch inside dist/ itself, as its own fresh repo, can't leak anything outside dist/.
import { execFileSync } from "node:child_process";
import { writeFileSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const dist = path.join(root, "dist");
const remote = execFileSync("git", ["remote", "get-url", "origin"], { cwd: root }).toString().trim();

if (!existsSync(dist)) {
  console.error("dist/ not found — run `npm run build` first (this script is meant to run via `npm run deploy`, which does that for you).");
  process.exit(1);
}

const git = (args) => execFileSync("git", args, { cwd: dist, stdio: "inherit" });

writeFileSync(path.join(dist, ".nojekyll"), "");
if (existsSync(path.join(dist, ".git"))) rmSync(path.join(dist, ".git"), { recursive: true, force: true });

git(["init", "-q"]);
git(["checkout", "-q", "-b", "gh-pages"]);
git(["add", "-A"]);
git(["-c", "user.name=deploy-bot", "-c", "user.email=deploy-bot@local", "commit", "-q", "-m", "Deploy"]);
git(["push", "-f", remote, "gh-pages:gh-pages"]);

rmSync(path.join(dist, ".git"), { recursive: true, force: true });
console.log("Deployed to GitHub Pages.");
