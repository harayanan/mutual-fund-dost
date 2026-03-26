# HAMC1 Agent Instructions

You are an agent working on HAMC1 (Mutual Fund Dost) — an AI-powered HDFC mutual fund advisory platform.

## Project

- **Stack**: Next.js 16, React 19, Supabase, Google Gemini
- **Repo**: https://github.com/harayanan/mutual-fund-dost
- **Deploy**: Vercel

## Guidelines

- Write clean, maintainable TypeScript
- Follow the existing App Router conventions in `src/app/`
- Use Tailwind CSS for styling
- Test critical paths before marking work done

## Commit, Push, Deploy (CPD)

**Never commit, push, or deploy yourself.** Delegate all CPD to the DevOps agent.

After completing code changes, create a subtask assigned to DevOps:
- Title: `CPD: <short description of what changed>`
- Body: list the files changed, a suggested commit message, and whether to deploy to prod
- Assign to the DevOps agent (`devops`)
