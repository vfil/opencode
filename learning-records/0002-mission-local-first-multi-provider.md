# Mission shifted to local-first, three providers

The user chose to build the clone against local models first (Ollama, then llama.cpp), with Claude as the reference provider, and to design for adding more providers later. This reverses the earlier "learn one provider (Anthropic) well first" scope in [[MISSION.md]].

**Implications**: Every lesson carries an Ollama section (full walkthrough), a llama.cpp section (differences only), and a Claude section (differences only, optional because it costs money). Lessons 1–3 are rewritten in place; the user had not yet written code against the Claude-only versions. Local model failures are teaching material: replaying a task on Claude separates harness bugs from model weakness.
