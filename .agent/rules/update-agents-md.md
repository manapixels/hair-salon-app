---
trigger: always_on
---

1. Always use AGENTS.md (usually in root folder) to get context
2. Always update to AGENTS.md when you finish a task. Make the update, if any, as concise as possible. Trim any unnecessary details.
3. After creating an implementation plan, update docs/implementation-plans/ with a new file that is time-stamped with the plan.
4. If git commit message is blank, add one after completing a fix, feature etc., but do not commit.
5. When adding a new feature or making changes to existing features, consider how it affects existing user flows, then make changes if required to make sure these flows don't get broken. For example, when adding a payment system on the user's side, consider also that the admin dashboard might need to be updated with settings to control the payment processes. If needed, maintain a section for user flows in AGENTS.md with just enough details for you to gain context.
