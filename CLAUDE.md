# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

This is a Claude Code workspace configuration directory — not a software project. It contains Claude Code settings, permissions, and best-practices skill plugins for use across projects.

## Structure

- `claude.sh` — Shell wrapper that invokes Claude CLI with `--dangerously-skip-permissions`
- `.claude/settings.json` — Enables the `superpowers@claude-plugins-official` plugin suite
- `.claude/settings.local.json` — Pre-approved permissions for `npm install`, `npx next`, `npx vitest`, and the `browse` skill
- `.claude/skills/` — 10 best-practices skill plugins covering the primary tech stack:
  - **GraphQL**: schema design, server implementation (Yoga), Pothos schema builder
  - **Data**: Prisma ORM
  - **Frontend**: React, React+GraphQL integration, Relay
  - **Language**: TypeScript

## Intended Tech Stack

The skills and permissions indicate this workspace is configured for projects using: TypeScript, React, Next.js, GraphQL (Yoga + Pothos), Relay, Prisma, and Vitest.
