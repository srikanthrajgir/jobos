import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * The deploy broke twice on the same class of problem: the Node version the
 * container actually runs was never checked against what the dependency tree
 * asks for.
 *
 * First `npm ci` failed on missing `@emnapi/*` entries — optional peer deps in
 * the WASM fallback chain, whose resolution is Node-version dependent, so a
 * lockfile regenerated on a different Node than the image dropped exactly the
 * packages the image needed. Then the fix for that pinned `engines.node` to
 * `20.x` while every `@supabase/*` package declares `>=22.0.0`, and Supabase
 * is a runtime dependency — so the pin meant to make installs reproducible
 * made them reproducibly wrong.
 *
 * The Dockerfile tag is the authority here, because it is what actually runs;
 * `engines.node` is documentation, and these tests are what keep it honest.
 *
 * The range check is written out below rather than imported from `semver`:
 * semver is only ever a transitive dependency here, and adding it directly
 * means an `npm install` that re-resolves the optional peers and prunes the
 * `@emnapi` entries again — reintroducing the first bug to test for the
 * second. `parseRange` covers exactly the forms this lockfile uses and throws
 * on anything else, so a new form fails the suite instead of passing silently.
 */

const ROOT = path.resolve(__dirname, "../..");

type LockEntry = { engines?: { node?: string } };
type Lock = { packages?: Record<string, LockEntry> };

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const lock: Lock = JSON.parse(fs.readFileSync(path.join(ROOT, "package-lock.json"), "utf8"));
const dockerfile = fs.readFileSync(path.join(ROOT, "Dockerfile"), "utf8");

type Triple = [number, number, number];

function parseVersion(text: string): Triple {
  const parts = text.trim().split(".");
  return [Number(parts[0] || 0), Number(parts[1] || 0), Number(parts[2] || 0)];
}

function compare(a: Triple, b: Triple): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/** One comparator: a lower bound, and an exclusive upper bound if the form has one. */
type Clause = { min: Triple; below?: Triple };

function parseClause(raw: string): Clause {
  const text = raw.trim();

  if (text === "*") return { min: [0, 0, 0] };

  // ">=20.9.0", and the spaced ">= 0.4" variant.
  const gte = /^>=\s*(\d+(?:\.\d+){0,2})$/.exec(text);
  if (gte) return { min: parseVersion(gte[1]) };

  // "^20.19.0" — up to, not including, the next major.
  const caret = /^\^(\d+(?:\.\d+){0,2})$/.exec(text);
  if (caret) {
    const min = parseVersion(caret[1]);
    return { min, below: [min[0] + 1, 0, 0] };
  }

  // "22.x" and bare "20" — pinned to that major.
  const major = /^(\d+)(?:\.x)?$/.exec(text);
  if (major) {
    const n = Number(major[1]);
    return { min: [n, 0, 0], below: [n + 1, 0, 0] };
  }

  throw new Error(`unhandled engines.node form: "${raw}"`);
}

function satisfies(version: Triple, range: string): boolean {
  return range.split("||").some((part) => {
    const clause = parseClause(part);
    if (compare(version, clause.min) < 0) return false;
    if (clause.below && compare(version, clause.below) >= 0) return false;
    return true;
  });
}

/** The Node version the image actually provides, from its pinned tag. */
function imageNodeVersion(): Triple {
  const from = /^FROM node:(\d+(?:\.\d+){0,2})-alpine/m.exec(dockerfile);
  if (!from) throw new Error("no pinned `FROM node:<version>-alpine` line in the Dockerfile");
  return parseVersion(from[1]);
}

/** Binaries for other platforms are in the lock but never installed on Alpine. */
function installedOnLinux(pkgPath: string): boolean {
  return !/win32|darwin|android|freebsd|openharmony/.test(pkgPath);
}

describe("the range check itself behaves", () => {
  it("reads the forms this lockfile actually uses", () => {
    expect(satisfies([22, 20, 0], ">=22.0.0")).toBe(true);
    expect(satisfies([20, 19, 0], ">=22.0.0")).toBe(false);
    expect(satisfies([22, 20, 0], "^20.19.0 || ^22.13.0 || >=23.5.0")).toBe(true);
    expect(satisfies([22, 12, 0], "^20.19.0 || ^22.13.0 || >=23.5.0")).toBe(false);
    expect(satisfies([22, 20, 0], "18 || 20 || >=22")).toBe(true);
    expect(satisfies([21, 0, 0], "18 || 20 || >=22")).toBe(false);
    expect(satisfies([22, 20, 0], "22.x")).toBe(true);
    expect(satisfies([23, 0, 0], "22.x")).toBe(false);
    expect(satisfies([0, 1, 0], "*")).toBe(true);
    expect(satisfies([22, 20, 0], ">= 0.4")).toBe(true);
  });

  it("refuses a form it does not understand rather than guessing", () => {
    expect(() => satisfies([22, 0, 0], "~20.1.0")).toThrow(/unhandled/);
  });
});

describe("the container's Node version satisfies the dependency tree", () => {
  const runtime = imageNodeVersion();
  const runtimeText = runtime.join(".");

  it("REGRESSION: every dependency accepts the Node version the image ships", () => {
    // This is the check that was missing when engines.node said 20.x: the six
    // @supabase/* packages all declare >=22.0.0, and Supabase is a runtime
    // dependency, not a dev one.
    const unsatisfied: string[] = [];

    for (const [pkgPath, info] of Object.entries(lock.packages || {})) {
      if (pkgPath === "") continue; // the root package's own declaration
      if (!installedOnLinux(pkgPath)) continue;
      const required = info?.engines?.node;
      if (!required) continue;
      if (!satisfies(runtime, required)) {
        unsatisfied.push(`${pkgPath.replace(/^node_modules\//, "")} needs ${required}`);
      }
    }

    expect(
      unsatisfied,
      `the image ships Node ${runtimeText}, which is rejected by:\n  ${unsatisfied.join("\n  ")}`
    ).toEqual([]);
  });

  it("REGRESSION: package.json's declared range admits what the image ships", () => {
    // engines.node does not choose the image — the FROM line does. When the two
    // disagree, engines is documentation that nothing enforces.
    const declared: string = pkg.engines?.node;
    expect(declared, "engines.node is what documents the supported runtime").toBeTruthy();
    expect(
      satisfies(runtime, declared),
      `Dockerfile ships Node ${runtimeText} but package.json declares "${declared}"`
    ).toBe(true);
  });

  it("the Docker tag is pinned to a minor, not floating on a major", () => {
    // `node:22-alpine` silently moves under you; a lockfile that resolved
    // against one patch can stop matching after a base-image refresh.
    expect(dockerfile, "pin the base image to at least major.minor").toMatch(
      /^FROM node:\d+\.\d+[.\d]*-alpine/m
    );
  });
});

describe("the lockfile still carries what a Linux container installs", () => {
  const paths = Object.keys(lock.packages || {});

  it("REGRESSION: the @emnapi WASM runtime entries are present", () => {
    // Regenerating the lock on a Node version the image does not use silently
    // prunes these, and `npm ci` then fails in the image with "Missing:
    // @emnapi/core from lock file". Update the lock inside the container, or
    // hand-edit it, rather than running a bare `npm install` on a dev machine.
    //
    // Counting any "@emnapi/" path was not enough, and let the same deploy
    // break through a second time: the nested copies under
    // @tailwindcss/oxide-wasm32-wasi are `inBundle` and survive the prune, so
    // the count stayed above zero while the three TOP-LEVEL entries — the exact
    // ones npm ci reports as Missing/Invalid — had gone. Name them instead.
    for (const needed of ["@emnapi/core", "@emnapi/runtime", "@emnapi/wasi-threads"]) {
      expect(
        paths.includes(`node_modules/${needed}`),
        `node_modules/${needed} has been pruned from the lockfile — \`npm ci\` will fail on Linux with "Missing: ${needed} from lock file". Restore it rather than running a bare \`npm install\`.`
      ).toBe(true);
    }
  });

  it("carries musl builds, since the image is Alpine", () => {
    expect(dockerfile).toMatch(/FROM node:[\d.]+-alpine/);
    const musl = paths.filter((p) => p.includes("musl"));
    expect(musl.length, "no *-musl binaries in the lockfile, but the image is Alpine").toBeGreaterThan(0);
  });

  it("carries the linux-x64 native binaries the build needs", () => {
    for (const needed of ["@next/swc-linux-x64-musl", "@tailwindcss/oxide-linux-x64-musl"]) {
      expect(
        paths.some((p) => p.endsWith(needed)),
        `${needed} is missing from the lockfile — the build would fall back or fail`
      ).toBe(true);
    }
  });
});
