# Profile Agent – Bharath Krishna's AI-Forward Portfolio

Profile Agent is a production-ready, AI-native profile site that lets recruiters and collaborators explore Bharath Krishna's background through an embedded CopilotKit experience backed by a Google ADK FastAPI agent. It blends a rich, story-driven Next.js frontend with a stateful agent backend so every credential, career milestone, and follow-up question is interactive.

> **Project Home:** `/home/bharath/workspace/profile_agent`  
> **Live Demo:** <https://profile.krishb.in>

## Highlights

- **Recruiter-ready assistant _(WIP)_:** Context-aware chat that can summarize any job stint, answer deep technical questions, and log follow-ups. (Source: MEMORY.md#L1-L40)
- **Human-in-the-loop controls _(WIP)_:** Critical recruiter outreach flows pause for Bharath's approval via modal review actions (confirm, reject, request info).
- **Current, accurate profile context:** The backend injects Bharath's complete professional history, education, tech stack, and recruiter notes directly into the agent prompt so answers stay precise.
- **Observability baked in:** Langfuse + Opik tracing, structured health checks, and LiteLLM/Gemini failovers keep the stack resilient.

## Architecture at a Glance

| Layer        | Technologies                                                                                  | Responsibilities                                                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | Next.js 14, React Server Components, CopilotKit React + UI, Chakra UI, Tailwind               | Renders the interactive resume, surfaces CopilotKit sidebar, exposes frontend tools (summary updates, theming, section highlighting, Ask AI buttons, recruiter modals) |
| **Backend**  | FastAPI (ADK Agent), LiteLLM/Gemini 2.5 Pro, Google ADK Planner, Langfuse, Opik, custom tools | Serves the BharathAssistant agent, enforces prompt context, records conversation notes, manages health & error handling                                                |

## Frontend Experience (CopilotKit + Next.js)

The UI is more than a static resume—its a command surface wired directly into the assistant.

### Embedded CopilotKit Sidebar

- Preloaded with smart suggestions (Experience, Kubernetes, Leadership, etc.) to jumpstart recruiter Q&A.
- Session stats pill pulls from `useCoAgent` state (total tokens, context/responses, throughput) so visitors see real-time usage.

### Ask AI Everywhere

- Each job entry and skill pill includes an **Ask AI** button. Clicking it sends a contextual prompt ("What did Bharath do at Rakuten USA?") straight to the assistant via `handleAsk`.

### Frontend Tools Exposed to the Agent

CopilotKit `useFrontendTool` registrations give the backend controlled knobs:

- `updateProfessionalSummary(newSummary)` – dynamically rewrites the hero summary block.
- `setThemeColor(themeColor)` – adjusts the brand accent color on the fly.
- `highlightSection(section)` / `showExperienceDetails(experienceId)` – scrolls + flashes the relevant section to guide the reader.
- `filterSkills(category)` – focuses the skills grid.
- `add_conversation_note` – rendered via `useRenderToolCall` with success + failure states so notes visibly land.

### Human-in-the-Loop Recruiter Workflow

- **Modal review UI** pauses automated responses when the backend flags `awaiting_human_review`.
- Bharath selects **Confirm & Save**, **Reject**, or **Request More Info**, which writes decisions back via CopilotKit actions (Source: MEMORY.md#L19-L40).

### Operational UX Add-ons

- 30-second health checks against `/:8001/health` inform the sidebar badge.
- Responsive PDF-friendly layout preserves the interactive resume styling when exported.

## Backend & Agent Tooling (FastAPI + Google ADK)

The `agent/` service wraps a Google ADK agent named **BharathAssistant** with deep state awareness.

### Core Capabilities

- **System Prompt Injection:** Before every LLM call, the backend injects Bharaths full professional dossier (contact info, 15+ years of work history, education, tech stack, featured projects) and serialized recruiter notes into the system instruction.
- **Stateful Tooling:**
  - `add_conversation_note(note, source)` persists timestamped Markdown files under `agent/notes/` and mirrors them into the agent state so future answers reference past recruiter calls.
  - Frontend tools listed above are whitelisted, so the agent can refresh the UI in-band.
- **Planner + Callbacks:** ADK callbacks (`before_agent`, `before_model_modifier`, `after_model_modifier`) manage conversation state, throttle tool recursion, and collect per-turn metrics (tokens, TPS, response IDs).
- **Resilience & Observability:** Langfuse + Opik instrumentation provides traceability; custom exception handlers translate LiteLLM/Gemini outages into recruiter-friendly messages; `/health` checks both agent + upstream model connectivity.
- **Model Routing:** Reads `USE_LITELLM` / `MODEL_NAME` to swap between Gemini native and LiteLLM targets seamlessly.

## Use Cases & Scenarios

| Scenario                                              | How its handled                                                                                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Recruiter asks "Tell me about Bharath's HPC work"     | CopilotKit sidebar suggestion prompts the agent, which cites the injected Rakuten USA accomplishments                              |
| Follow-up tasks from a recruiter call                 | Agent triggers `add_conversation_note`, rendering a visible confirmation card and storing the note for future prompts              |
| Request to tweak the hero summary for a specific role | Agent calls `updateProfessionalSummary` via frontend tool, refreshing the summary live                                             |
| Recruiter outreach requiring approval                 | Agent sets status to `awaiting_human_review`; frontend modal asks Bharath to confirm/reject/request info before the agent proceeds |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- Google Makersuite API Key (`GOOGLE_API_KEY`)
- Package manager: `pnpm` (recommended) / `npm` / `yarn` / `bun`

### Installation (npm-first)

```bash
npm install            # frontend deps
npm run install:agent  # sets up agent/.venv
```

If you prefer `pnpm`, `yarn`, or `bun`, run their equivalents—but npm is the project's default. Activate the agent virtualenv manually when you need local tooling:

```bash
source agent/.venv/bin/activate
```

### Running the Stack

```bash
npm run dev   # Next.js UI (3000) + FastAPI agent (8001)
```

Health checks hit `http://localhost:8001/health`; override `ADK_PORT` / `PYTHON_PORT` only if you need a different port.

### Available Scripts

| Script                         | Description                               |
| ------------------------------ | ----------------------------------------- |
| `dev` / `dev:ui` / `dev:agent` | Run combined stack or individual services |
| `build` / `start`              | Compile & serve the Next.js frontend      |
| `lint`                         | ESLint across the repo                    |
| `install:agent`                | Reinstall Python deps under `agent/.venv` |

### Environment Notes

- **Langfuse:** Set `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`. For older self-hosted versions, pin `langfuse==3.10.5` (per the error noted in the legacy README).
- **Opik:** Launch your Opik instance (e.g., `~/workspace/opik && ./opik.sh`) before testing if you want traces.
- **Frontend URL ↔ Agent Port:** Ensure `src/app/api/copilotkit/route.ts` and the CopilotKit client both target the same `ADK_PORT` (currently `8001`).

## Repository Layout

```
profile_agent/
├── agent/                 # FastAPI ADK service (BharathAssistant)
├── src/app/               # Next.js 14 RSC frontend (CopilotKit wiring lives in page.tsx)
├── conversation_notes/    # Human-in-the-loop recruiter notes (synced via CopilotKit), Tooling outputs saved by the agent
├── public/profile.jpg     # Current resume photo used in sidebar
├── scripts/               # Helper scripts (verification, deployments, etc.)
└── README.md              # (You are here)
```

## Deployment to Kubernetes

### Prerequisites

- Docker daemon running
- kubectl configured and connected to cluster
- Docker registry credentials (e.g., Docker Hub)

### Deploy to Local Kubernetes

The deployment pipeline automatically:

1. Builds Docker image with commit hash tags
2. Pushes to registry (Docker Hub or custom)
3. Updates kustomization with commit hash for automatic image versioning
4. Deploys to Kubernetes with `imagePullPolicy: Always`

```bash
# Set your registry and deploy
export REGISTRY=docker.io/krishbharath
export GOOGLE_API_KEY="your-key-here"

# Build, push to registry, and deploy
bash scripts/build-docker.sh
bash scripts/deploy-k8s.sh local
```

**Image versioning:** Each commit generates a unique tag (short commit hash), ensuring:

- Clean image history tracking via git commit
- Fresh image pulls on deployment restart (`imagePullPolicy: Always`)
- Automatic rollback capability by deploying previous commits

**Access:** After deployment, the application is available at the configured ingress URL (default: `https://profile.krishb.in`)

### Verify Deployment

```bash
# Check pod status
kubectl get pods -l app=profile-agent -n profile-agent

# View logs
kubectl logs -l app=profile-agent -f -n profile-agent

# Port forward for local testing
kubectl port-forward svc/profile-agent-service 3000:80 8001:8001 -n profile-agent
```

See `CLAUDE.md` for detailed architecture, development commands, and troubleshooting.

## Contributing & Next Steps

1. File issues/ideas in this repo or ping the assistant directly through CopilotKit to capture improvements via `add_conversation_note`.
2. When adding new tools (frontend or backend), expose them explicitly so the agent stays sandboxed.
3. Keep Langfuse + Opik creds updated—observability is only useful if signals reach their targets.
4. For deployment changes, update both `scripts/build-docker.sh` and `k8s/` manifests to keep pipeline consistent.

---

Questions? Open a recruiter chat on <https://profile.krishb.in> and ask the assistant—its literally built for that.

Added elevenlabs voice agent.
Commit casually
