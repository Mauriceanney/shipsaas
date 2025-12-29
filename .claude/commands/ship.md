# /ship - Autonomous Feature Development

Execute the full development lifecycle for a feature with multi-agent orchestration.

## Usage

```
/ship <feature-description>
```
---
### EXECUTION WORKFLOW LOOP (MANDATORY AND STRICT)

1. **Select Issue**
2. **Create Feature Branch**
3. **Review Acceptance Criteria**
4. **TDD**
   - Red → Green → Refactor
5. **Test & Validate**
   - Validate functionality against Acceptance Criteria
6. **Open PR**
   - Only after validation
7. **STOP & WAIT**
   - Manual user validation required
8. **PR Closure**
   - Review **Definition of Done**
   - Check all **Acceptance Criteria**
   - Check all **Definition of Done**
   - Merge & close Issue only after confirmation

---
### AGENT ENFORCEMENT

> **Important Rules**

- Every task must be implemented following Agentic Orchestration
- All tasks **must** be executed using the **corresponding agents** and skills
- Multiple agents may run in parallel **only if coordinated** (Parallel execution must remain coherent)
- Work must be **clean, optimized, secure, and robust**
- Any deviation is a workflow violation

---
### Phase 1: Planning (Product Manager + Architect)

1. **Product Manager Agent**
   - Analyze the feature request
   - Create user stories with acceptance criteria
   - Define scope and priorities
   - Output: User stories in GitHub issue format

2. **Architect Agent**
   - Review user stories
   - Design technical architecture
   - Identify affected files and components
   - Define API contracts and data models
   - Output: Technical design document

### Phase 2: Implementation (Frontend + Backend Developers)

3. **Backend Developer Agent**
   - Implement database schema changes (Prisma)
   - Create server actions
   - Write API routes if needed
   - Follow TDD: tests first, then implementation

4. **Frontend Developer Agent**
   - Create/update React components
   - Implement UI with shadcn/ui
   - Add form validation
   - Follow TDD: tests first, then implementation

5. **UI/UX Designer Agent**
   - Review component styling
   - Ensure accessibility
   - Verify responsive design
   - Suggest UX improvements

### Phase 3: Quality (Security + QA)

6. **Security Agent**
   - Review code for vulnerabilities
   - Check auth/authz implementation
   - Verify input validation
   - Audit database queries

7. **QA Engineer Agent**
   - Run all unit tests
   - Run E2E tests
   - Verify acceptance criteria
   - Report test coverage

### Phase 4: Delivery (DevOps)

8. **DevOps Agent**
   - Verify build passes
   - Check CI pipeline
   - Create PR with full description
   - Link to issue

## Output

- GitHub Issue with user stories
- Feature branch with implementation
- All tests passing
- PR ready for review

## Example

```
/ship Add user profile photo upload
```
