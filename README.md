# RemiTrainer

A dependency-free prototype of a household workout generator.

The app models one household with multiple profiles, shared workout sessions,
individual user workout instances, equipment constraints, feedback logging,
banned exercises, and instruction assets. It uses localStorage as the temporary
catalog so generated workouts and exercise feedback are remembered between page
loads.

Open `index.html` directly or serve the folder locally. The generator is local
and rule-based for now, but the UI and saved records are shaped around a future
strict-JSON AI response:

- parent shared workout plan
- user-specific adapted workout instances
- movement-pattern alignment
- equipment-aware substitutions
- injury and banned-exercise avoidance
- compact context summaries instead of raw full history
