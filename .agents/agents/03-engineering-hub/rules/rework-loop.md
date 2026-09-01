# 🔄 Bounded Builder Rework Protocol

1. When the QA Critic issues a `FAIL` verdict, the Lead Architect must:
   - Identify the responsible builder based on the affected file locks.
   - Dispatch a targeted fix instruction to that builder (or spawn a fixer builder for that file).
   - Re-run the QA Critic upon completion.
2. **Ceiling Rule**: Maximum **2 rework iterations**.
3. If defects persist after 2 iterations, halt execution and escalate directly to the human user with the defect transcript.
