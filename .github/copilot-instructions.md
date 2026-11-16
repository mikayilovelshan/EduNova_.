# Copilot Instructions

## Project Guidelines
- For UniLMS backend changes, prioritize security with resource ownership checks, preserve existing refresh-token expiration and avoid token rotation unless impact is explained and explicitly approved, inspect migrations/schema/model snapshot before any migration, avoid incomplete Identity/domain profiles, preserve routes/contracts, and work incrementally with a build after each phase.