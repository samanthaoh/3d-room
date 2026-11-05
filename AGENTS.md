# Repository Guidelines

## Project Structure & Module Organization

This repository contains the initial documentation for **3d-room**, a planned web application for creating and editing 3D room layouts. `README.md` describes the project, contributors, and candidate technologies. There are currently no application source files, tests, assets, or dependency manifests.

The planned screens are a home page, upload page, interactive 3D editor, and saved-spaces library. React, Three.js, and React Three Fiber are under consideration; do not treat them as installed dependencies or finalized architecture. When scaffolding the application, document the chosen structure in `README.md`. Keep UI components, room-model logic, and static assets in clearly separated directories.

## Build, Test, and Development Commands

No build, development, lint, or test commands are configured yet. Do not assume `npm install`, `npm run dev`, or `npm test` will work.

When introducing tooling, add explicit scripts to the dependency manifest and document their prerequisites and usage in `README.md`. Commit the corresponding lockfile so contributors can reproduce the environment. For documentation changes, use `git diff --check` to check whitespace and `git diff` to review the patch.

## Coding Style & Naming Conventions

Keep Markdown concise, use descriptive headings, and format paths and commands with backticks. No code formatter, linter, indentation standard, or language-specific naming convention currently exists. Establish these alongside the first application code and apply them consistently. Prefer descriptive names reflecting room layout, uploads, editing, or saved spaces.

## Testing Guidelines

No testing framework or coverage threshold is configured. Add test tooling when implementing application behavior and document how to run it. Prioritize room dimensions, layout transformations, upload validation, and saving/loading spaces. Use descriptive test names that state the expected behavior; include manual verification steps for visual or interactive changes.

## Commit & Pull Request Guidelines

Existing commits use short descriptive messages, such as `Update readme.md with more information about project`; no formal commit convention is established. Use clear, action-oriented messages and keep each commit focused.

Pull requests should explain the change, its purpose, and verification performed. Link related issues when available. Include screenshots or recordings for screen and 3D editor changes, and identify any new dependencies or setup steps.
