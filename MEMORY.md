# Profile Agent (Bharath's Representative)

## Project Overview
- **Goal:** A conversational, interactive professional profile representing Bharath Krishna.
- **Architecture:** Next.js 16 (Frontend) + Python FastAPI/Google ADK (Backend).
- **Source of Truth:** `~/workspace/profile_agent/Bharath_CV_2025.pdf`.
- **Key Model:** Gemini 2.5 Flash.

## Core Components
- **Frontend:** `src/app/page.tsx` (Dashboard layout, Sidebar, ATS-compliant).
- **Backend:** `agent/main.py` (FastAPI, tracks `conversation_context`).
- **Integration:** `src/app/api/copilotkit/route.ts` (Bridges frontend/backend).

## Technical Details
- **Commands:** `pnpm dev` starts both; `pnpm install:agent` for Python venv.
- **Agent Name:** `BharathAssistant`.
- **Primary Objective:** Showcase 15+ years of experience via a UI that the agent can control (theme, scrolling, highlighting).
