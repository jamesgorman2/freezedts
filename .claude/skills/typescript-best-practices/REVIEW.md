# Review: typescript-best-practices skill

Reviewer: Claude Opus 4.6 (1M context)
Date: 2026-04-06

---

## Overall Assessment

This is a high-quality skill with well-structured content, clear do/don't patterns, and accurate code examples. The skill covers the core TypeScript topics an AI agent needs when writing or reviewing TypeScript code. The writing is concise and opinionated, which is exactly what an agent needs -- it can follow these as direct instructions rather than weighing ambiguous tradeoffs.

**Strengths:**
- Consistent formatting across all files (Table of Contents, horizontal rules, code blocks with comments)
- Clear anti-pattern/recommended-pattern structure that agents can use as decision rules
- Code examples are correct and well-annotated with `// BAD` / `// GOOD` labels
- Cross-references between files are accurate and use relative links
- The SKILL.md frontmatter description is precise and covers the right trigger terms
- Each topic file is self-contained enough to be loaded independently

**Rating: 8/10** -- solid foundation, with specific improvements possible in a few areas.

---

## File-by-File Review

### SKILL.md

**Clarity: 9/10**
- The overview paragraph is an excellent single-sentence summary of the skill's philosophy.
- The Topics section uses a consistent "See [file] -- when ..." format that makes it easy for an agent to pick the right file.

**Issues:**
1. The `references.md` file is not listed in the Topics section. Add a line:
   `- See [references.md](references.md) -- when looking up source material, documentation links, or expert references for TypeScript configuration, patterns, error handling, modern features, or performance`
2. The Anti-Patterns section duplicates content from the topic files (e.g., "Using `any` instead of `unknown`" is covered in patterns.md, "Over-engineering types" is also in patterns.md). This is acceptable as a quick-reference summary, but consider adding a note like "See topic files for detailed guidance and code examples" to reduce ambiguity about which is authoritative.

### configuration.md

**Clarity: 9/10**
- Excellent two-config approach (bundler vs Node.js library) covers the main scenarios.
- Inline comments in the JSON explain each option.

**Issues:**
1. The Node.js library config is missing `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`, and `noPropertyAccessFromIndexSignature` that appear in the bundler config. If these are intentionally omitted, add a brief note explaining why (e.g., "Only the strictest checking options are shown; add the remaining flags from the bundler config as desired"). Otherwise, include them for consistency.
2. The `erasableSyntaxOnly` section appears here and is also referenced in modern-features.md. The duplication is handled well (modern-features.md links back here), but the configuration.md section could benefit from a forward reference: "See [modern-features.md](modern-features.md) for full TS 5.8 feature context."
3. The eslint config snippet uses `projectService: true` and notes it replaces the deprecated `project` option. Consider adding the minimum typescript-eslint version (v8+) more prominently -- it is mentioned in a comment but could be a bold note since v6/v7 users would get an error.

### error-handling.md

**Clarity: 9/10**
- The progression from "why exceptions lack type safety" to "Result pattern" to "when to use each" is well structured.
- The decision table is excellent for agent use -- clear scenario-to-approach mapping.

**Issues:**
1. The `isObject` function used in the `parseConfig` example (line 68) is not defined or imported. An agent following this literally would hit a runtime error. Either define it inline or use `typeof data === "object" && data !== null` directly.
2. The "Library Options" section mentions `neverthrow` and `effect` but does not give a clear recommendation for when to choose one over the other. Add a one-line decision rule, e.g., "Use `neverthrow` for targeted Result-pattern adoption in an otherwise conventional codebase. Consider `effect` only for greenfield projects that want a unified functional framework for errors, dependencies, and concurrency."
3. The Zod example uses `.parse()` which throws on failure -- this is at odds with the Result pattern philosophy. Consider adding a `.safeParse()` example that returns a Result-like `{ success, data, error }` object, since that aligns with the skill's own guidance.

### modern-features.md

**Clarity: 8/10**
- Good coverage of TS 5.0 through 5.8 features with version annotations.
- The decorator section includes the NestJS exception, which is a practical detail agents need.

**Issues:**
1. The TS 5.7 section mentions "Path rewriting for relative imports" but provides no code example. Add a brief example showing `--rewriteRelativeImportExtensions` or a tsconfig snippet.
2. The `using` declarations section has an `openFile` function that is not defined. Since `using` is relatively new, a fully self-contained example would be more helpful for agents that might try to use this pattern. Either define a minimal `openFile` stub or use the `DatabaseConnection` class for the async example too.
3. Missing TS 5.7 release notes link in references.md -- the references file has 5.5, 5.6, and 5.8 release notes but skips 5.7.

### patterns.md

**Clarity: 9/10**
- The BAD/GOOD pattern with code examples is highly agent-friendly.
- The "Recommended Patterns" section is comprehensive and covers the patterns agents most need.

**Issues:**
1. The "Function overloads vs conditional return types" example (Option B) uses `as ParseResult<T>` assertions in the body, which is the same `as` pattern flagged as an anti-pattern earlier in the file ("Using `as` instead of runtime validation"). Add a clarifying note that `as` inside a generic function body for return types is an accepted tradeoff when the conditional type cannot be narrowed by control flow, distinct from `as` at system boundaries.
2. The "Module augmentation" section shows `declare module "express"` and `declare global` patterns. While correct TypeScript, this is a pattern that mostly applies to specific frameworks (Express, Window). Consider noting that these patterns should be used sparingly and only when the runtime actually provides the merged properties (this is partially addressed by the last sentence, but could be stronger).
3. The testing patterns section references `vi.fn<typeof fetchUser>()` -- this syntax requires Vitest 1.x+. Add a version note since older Vitest versions use a different generic signature.

### performance.md

**Clarity: 8/10**
- Practical strategies with clear before/after examples.
- The tsgo section is appropriately cautious about production readiness.

**Issues:**
1. The "Project References for Monorepos" section states "Project references have reduced build times from 140s to 25s in large monorepos" without attribution. Either cite a source or soften to "can reduce build times by 5-10x in large monorepos" to avoid an agent presenting an unsourced claim as fact.
2. The "Avoid unions larger than ~100 members" guidance lacks a code example showing the alternative (Map or Record). Add a brief before/after.
3. Missing guidance on `--watch` mode performance. For development workflows, `tsc --watch` with `--incremental` is a common pattern worth mentioning.
4. The `tsBuildInfoFile` path is `./.tsbuildinfo` -- note that this is the default location and can typically be omitted unless you want to place the file elsewhere.

### references.md

**Clarity: 9/10**
- Well-organized by category.
- Links appear to be current and from reputable sources.

**Issues:**
1. Missing TS 5.7 release notes link (as noted above). Add: `[TypeScript 5.7 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-7.html)`
2. The "Patterns and Best Practices" section includes a link to a blog post dated "Mar 9, 2026" (`sachith.co.uk/modern-typescript-patterns-practical-guide-mar-9-2026/`). Verify this URL is reachable -- URLs with future dates in them may be placeholder or speculative content.
3. Consider adding the `neverthrow` GitHub repo link since it is recommended in error-handling.md.
4. Consider adding the `effect` website link -- it is mentioned in error-handling.md and already present (`https://effect.website/`), which is good.

### type-system.md

**Clarity: 9/10**
- Comprehensive coverage of the type system with practical examples.
- The "Interface vs Type" decision rules are clear and agent-actionable.
- The `never` section covering the distribution trap is excellent -- this is a common source of confusion.

**Issues:**
1. The Branded Types section uses a pattern with `declare const __brand: unique symbol`. While this is a well-known pattern, it could benefit from noting that some teams use alternative approaches (intersection with a string literal type, or libraries like `zod.brand()`). A brief mention of the Zod brand alternative would tie into the validation guidance in error-handling.md.
2. The "Utility Types" section lists types without examples. While the type names are self-explanatory to experienced developers, adding 2-3 brief usage examples for the less obvious ones (`Extract`, `Exclude`, `Parameters`) would improve agent usability.
3. The Mapped Types section ends abruptly without a "when to use" guideline. Add a sentence like: "Use mapped types for systematic transformations of existing types. Avoid them when a simple Pick/Omit/Partial would suffice."
4. The Conditional Types section mentions that `infer` in contravariant position produces an intersection while covariant produces a union. This is correct but could use a brief code example to illustrate, as it is a subtle and commonly misunderstood behavior.

---

## Cross-Cutting Issues

### Terminology Consistency
- The skill consistently uses "discriminated union" (never "tagged union" or "algebraic data type"), which is good.
- "System boundary" is used consistently for the point where untyped data enters the application.
- Minor: "compile time" vs "compile-time" -- both hyphenated and unhyphenated forms appear. Pick one and standardize.

### Agent Usability
- The skill is highly agent-usable. An agent can load SKILL.md, identify the relevant topic file from the "when ..." triggers, and follow the instructions.
- One improvement: add a "Quick Decision" or "Decision Tree" section to SKILL.md for the most common agent decisions:
  - "interface or type?" -> interface for object shapes, type for everything else
  - "enum or union?" -> union type or `as const` object for new code
  - "any or unknown?" -> unknown, always
  - "as assertion or validation?" -> validation at system boundaries

### Missing Topics
1. **Module systems (ESM vs CJS):** The configuration section mentions `verbatimModuleSyntax` and `module: "NodeNext"`, but there is no dedicated guidance on writing ESM-compatible TypeScript (file extensions, `package.json` `"type": "module"`, dual-package hazard). This is increasingly important as the ecosystem moves to ESM-only.
2. **Monorepo TypeScript patterns beyond project references:** No guidance on workspace-level TypeScript (shared tsconfig bases, package.json exports for internal packages, `references` vs `paths`).
3. **TypeScript with JSDoc:** No mention of using TypeScript for type-checking JavaScript files via JSDoc annotations (`// @ts-check`, `@type`, `@param`). This is a niche but increasingly relevant topic.

### Code Example Quality
- All code examples compile correctly (with the noted `isObject` exception).
- Examples use modern TypeScript idioms consistently.
- The BAD/GOOD labeling is clear and consistent.
- Suggestion: some examples could benefit from `// ^?` type annotation comments (the "twoslash" convention) to show what TypeScript infers. This is already used in a few places (type-system.md, modern-features.md) but could be applied more consistently.

---

## Summary of Recommendations

### High Priority
1. Add `references.md` to the SKILL.md Topics list
2. Fix the undefined `isObject` in error-handling.md
3. Add TS 5.7 release notes link to references.md
4. Add a `.safeParse()` example alongside `.parse()` in error-handling.md

### Medium Priority
5. Add a clarifying note about `as` in generic function bodies (patterns.md)
6. Align the Node.js library tsconfig with the bundler config's strictness flags or explain the omission
7. Add a code example for TS 5.7 path rewriting
8. Add a neverthrow vs effect decision rule in error-handling.md
9. Define or replace the `openFile` function in the `using` async example

### Low Priority
10. Standardize "compile time" vs "compile-time" hyphenation
11. Add brief usage examples for Extract/Exclude/Parameters in type-system.md
12. Add Zod brand alternative mention to branded types section
13. Add a closing guideline sentence to the Mapped Types section
14. Consider adding ESM-vs-CJS guidance as a future topic
15. Add the unsourced build time claim attribution in performance.md

---

## Cross-Skill Placement Analysis

### Topics That Belong Here (Confirmed)

The following topics are correctly placed in this skill and should remain:

1. **Type system fundamentals** (discriminated unions, branded types, template literals, narrowing, utility types, conditional types, mapped types) -- pure TypeScript, no framework dependency.
2. **Configuration** (tsconfig.json, path aliases, typescript-eslint) -- pure TypeScript tooling.
3. **The Result pattern and error handling philosophy** -- framework-agnostic TypeScript pattern.
4. **Patterns and anti-patterns** (unknown vs any, readonly, assertion functions, overloads) -- pure TypeScript guidance.
5. **Performance** (type complexity, project references, incremental compilation, tsgo) -- TypeScript compiler concerns.
6. **Modern features** (decorators, using, import attributes, const type parameters) -- language-level features.

### Topics With Cross-Skill Overlap

#### 1. ServiceError and the GraphQL boundary (error-handling.md, lines 201-211)

**Current placement:** A brief "GraphQL Service Boundary Note" section at the end of error-handling.md.
**Assessment:** Correctly placed as a cross-reference. The section is appropriately short -- it explains that the Result pattern does not apply at GraphQL boundaries and directs the reader to graphql-server-best-practices. No change needed.

#### 2. Enum keyword guidance vs GraphQL enums (patterns.md, type-system.md)

**Current placement:** Both patterns.md and type-system.md include notes distinguishing TypeScript's `enum` keyword from GraphQL schema enums, with cross-references to graphql-best-practices.
**Assessment:** Correctly placed. The TypeScript `enum` keyword guidance belongs here. The disambiguation notes are necessary because an agent might confuse the two concepts. No change needed, but the note appears in two places (patterns.md line 223-224, type-system.md lines 88-94). Consider consolidating to just one location (patterns.md, since that is where the detailed enum alternatives live) and having type-system.md reference patterns.md for enum guidance instead of including its own note.

#### 3. Zod/Valibot validation at system boundaries (error-handling.md, lines 178-198)

**Current placement:** A "Runtime Validation at System Boundaries" section in error-handling.md.
**Assessment:** This is appropriately placed here as a general TypeScript pattern. However, Zod validation also appears in:
- **prisma-best-practices** (Zod for service boundary validation, Prisma type-safety)
- **pothos-best-practices** (Zod plugin for input validation)
- **graphql-server-best-practices** (validation at service boundaries)

**Recommendation:** Keep the general "validate at system boundaries" guidance here. The framework-specific Zod integrations (Pothos Zod plugin, Prisma service inputs) correctly live in their respective skills. The current split is clean -- no change needed.

#### 4. Testing patterns (patterns.md, "Testing patterns" section)

**Current placement:** A brief testing patterns section in patterns.md covering typed factory functions, `vi.fn` typing, and `satisfies` for test data.
**Assessment:** This section covers TypeScript-specific testing patterns (how to type test objects), not testing strategy. It belongs here. The broader testing strategy guidance (what to test, test structure, mocking) correctly lives in the framework-specific skills (react-best-practices/testing.md, pothos-best-practices/testing.md, etc.). No change needed.

#### 5. Async patterns (patterns.md, "Async patterns" section)

**Current placement:** Covers `Promise.all`, `Promise.allSettled`, `Awaited<T>`, and floating promise warnings.
**Assessment:** These are pure TypeScript/JavaScript patterns and belong here. The GraphQL-specific async patterns (subscription handling, data fetching) correctly live in their respective skills. No change needed.

#### 6. Decorators (modern-features.md)

**Current placement:** Covers Stage 3 decorators with a NestJS exception note.
**Assessment:** This is correctly placed as a TypeScript language feature. No other skill covers decorators. However, the NestJS exception is framework-specific. If a NestJS skill were ever added, the exception note should be moved there. For now, it is fine here as a practical caveat.

#### 7. `satisfies` operator (type-system.md)

**Current placement:** Detailed coverage with when-to-use guidelines.
**Assessment:** Correctly placed as a TypeScript language feature. The `satisfies` pattern is referenced from prisma-best-practices (for Prisma types) and pothos-best-practices (for enum definitions), but those references point back to this skill appropriately. No change needed.

### Topics Missing From Other Skills That Could Be Added Here

1. **Generic component typing patterns for React** -- react-best-practices cross-references this skill for "typing props, hooks, event handlers, discriminated union props, or generic components." However, this skill has no React-specific TypeScript guidance. Consider whether a small section on typing React patterns (generic components, discriminated union props, event handler typing) should live here or in react-best-practices. **Recommendation:** Keep it in react-best-practices as inline TypeScript examples within their component-design.md. The cross-reference is sufficient.

2. **Prisma generated type usage** -- prisma-best-practices has a dedicated type-safety.md. The `satisfies` pattern mentioned there is well-served by the cross-reference to this skill. No duplication needed.

### Final Placement Verdict

The typescript-best-practices skill has clean boundaries. All topics are correctly placed. The only actionable recommendation is the minor consolidation of the GraphQL enum disambiguation note (currently in both patterns.md and type-system.md -- consider having type-system.md defer to patterns.md for the detailed enum discussion rather than including its own note).
