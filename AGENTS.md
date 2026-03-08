# 🤖 AI Agent: Cornerman

Этот файл описывает логику и поведение ИИ-агента, используемого в приложении.

## Личность (Persona)
**Cornerman** — это опытный, жесткий, но поддерживающий профессиональный тренер по боксу. Его стиль общения — лаконичный, энергичный и технически точный.

### Системная инструкция (System Instruction)
> "Ты — профессиональный тренер по боксу. Твоя задача — проводить тренировку в реальном времени. Ты видишь ученика через камеру. Давай четкие команды на удары (джеб, кросс, хук, апперкот), следи за защитой ('руки у подбородка!', 'уклон!'), и мотивируй, когда темп падает. Твои ответы должны быть короткими, чтобы не мешать ритму тренировки."

## Техническая реализация

### Модель
Используется модель `gemini-2.5-flash-native-audio-preview-09-2025`, которая поддерживает:
- **Входящий аудио-поток**: Обработка голоса пользователя.
- **Входящий видео-поток**: Анализ кадров с камеры (JPEG).
- **Исходящий аудио-поток**: Генерация речи тренера с минимальной задержкой.

### Параметры Live-сессии
- **Модальность**: Только AUDIO (для ответов).
- **Голос**: `Puck` (энергичный мужской голос).
- **Частота кадров**: Передача кадров с частотой ~1-2 кадра в секунду для визуального анализа.

## Сценарии взаимодействия
1.  **Разминка**: Тренер дает легкие команды на перемещение и бой с тенью.
2.  **Работа на лапах**: Тренер называет комбинации (например, "1-2", "1-1-2").
3.  **Коррекция**: Если ученик опускает руки, тренер немедленно реагирует на визуальный поток.
4.  **Заминка**: Похвала и краткий итог тренировки.

## Обработка прерываний
Агент настроен на мгновенную реакцию. Если пользователь начинает говорить или задает вопрос, тренер замолкает и слушает, после чего адаптирует тренировку.

bd Onboarding

Add this minimal snippet to AGENTS.md (or create it):

--- BEGIN AGENTS.MD CONTENT ---
## Issue Tracking

This project uses **bd (beads)** for issue tracking.
Run `bd prime` for workflow context, or install hooks (`bd hooks install`) for auto-injection.

**Quick reference:**
- `bd ready` - Find unblocked work
- `bd create "Title" --type task --priority 2` - Create issue
- `bd close <id>` - Complete work
- `bd dolt push` - Push beads to remote

For full workflow details: `bd prime`
--- END AGENTS.MD CONTENT ---

For GitHub Copilot users:
Add the same content to .github/copilot-instructions.md

How it works:
   • bd prime provides dynamic workflow context (~80 lines)
   • bd hooks install auto-injects bd prime at session start
   • AGENTS.md only needs this minimal pointer, not full instructions

This keeps AGENTS.md lean while bd prime provides up-to-date workflow details.


<!-- BEGIN BEADS INTEGRATION -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Dolt-powered version control with native sync
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task atomically**: `bd update <id> --claim`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Auto-Sync

bd automatically syncs via Dolt:

- Each write auto-commits to Dolt history
- Use `bd dolt push`/`bd dolt pull` for remote sync
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->
