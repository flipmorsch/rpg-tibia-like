## 1. Environment & Dependencies Setup

- [x] 1.1 Add `vitest` devDependency to root, `shared`, `server`, and `client` workspaces
- [x] 1.2 Configure `vitest.workspace.ts` at the root of the project to recognize the workspace directories
- [x] 1.3 Update `package.json` scripts across workspaces to define standard test scripts (e.g. root `test` script running workspace tests)

## 2. OpenSpec Testing Enforcement

- [x] 2.1 Update `openspec/config.yaml` to include custom guidelines for mandatory testing strategy in proposals and testing tasks in tasks checklists

## 3. Core Test Suite Implementation

- [x] 3.1 Implement unit tests for custom binary serialization in `shared/src/tests/bytebuffer.test.ts`
- [x] 3.2 Implement unit tests for MapGrid stairs vertical transitions in `server/src/tests/map.test.ts`
- [x] 3.3 Implement unit tests for CombatSystem damage and health transitions in `server/src/tests/combat.test.ts`
- [x] 3.4 Run the test suite and verify all baseline tests compile and pass successfully
