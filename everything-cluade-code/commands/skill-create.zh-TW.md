---
name: skill-create
description: 分析本地 git 歷史以提取程式碼模式並產生 SKILL.md 檔案。Skill Creator GitHub App 的本地版本。
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /skill-create - Local Skill Generation

分析您儲存庫的 git 歷史以提取程式碼模式，並產生 SKILL.md 檔案來教導 Claude 您團隊的慣例。

## 用法 (Usage)

```bash
/skill-create                    # 分析目前的 repo
/skill-create --commits 100      # 分析最近 100 個 commits
/skill-create --output ./skills  # 自訂輸出目錄
/skill-create --instincts        # 同時產生用於 continuous-learning-v2 的 instincts
```

## 功能 (What It Does)

1. **解析 Git 歷史** - 分析 commits、檔案變更與模式
2. **偵測模式** - 識別重複的工作流程與慣例
3. **產生 SKILL.md** - 建立有效的 Claude Code skill 檔案
4. **選擇性建立 Instincts** - 用於 continuous-learning-v2 系統

## 分析步驟 (Analysis Steps)

### 步驟 1: 收集 Git 資料

```bash
# Get recent commits with file changes
git log --oneline -n ${COMMITS:-200} --name-only --pretty=format:"%H|%s|%ad" --date=short

# Get commit frequency by file
git log --oneline -n 200 --name-only | grep -v "^$" | grep -v "^[a-f0-9]" | sort | uniq -c | sort -rn | head -20

# Get commit message patterns
git log --oneline -n 200 | cut -d' ' -f2- | head -50
```

### 步驟 2: 偵測模式

尋找這些模式類型：

| Pattern | Detection Method |
|---------|-----------------|
| **Commit conventions** | Regex on commit messages (feat:, fix:, chore:) |
| **File co-changes** | Files that always change together |
| **Workflow sequences** | Repeated file change patterns |
| **Architecture** | Folder structure and naming conventions |
| **Testing patterns** | Test file locations, naming, coverage |

### 步驟 3: 產生 SKILL.md

輸出格式：

```markdown
---
name: {repo-name}-patterns
description: Coding patterns extracted from {repo-name}
version: 1.0.0
source: local-git-analysis
analyzed_commits: {count}
---

# {Repo Name} Patterns

## Commit Conventions
{detected commit message patterns}

## Code Architecture
{detected folder structure and organization}

## Workflows
{detected repeating file change patterns}

## Testing Patterns
{detected test conventions}
```

### 步驟 4: 產生 Instincts (如果使用 --instincts)

用於 continuous-learning-v2 整合：

```yaml
---
id: {repo}-commit-convention
trigger: "when writing a commit message"
confidence: 0.8
domain: git
source: local-repo-analysis
---

# Use Conventional Commits

## Action
Prefix commits with: feat:, fix:, chore:, docs:, test:, refactor:

## Evidence
- Analyzed {n} commits
- {percentage}% follow conventional commit format
```

## 輸出範例 (Example Output)

在 TypeScript 專案上執行 `/skill-create` 可能會產生：

```markdown
---
name: my-app-patterns
description: Coding patterns from my-app repository
version: 1.0.0
source: local-git-analysis
analyzed_commits: 150
---

# My App Patterns

## Commit Conventions

This project uses **conventional commits**:
- `feat:` - New features
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks
- `docs:` - Documentation updates

## Code Architecture

\`\`\`
src/
├── components/     # React components (PascalCase.tsx)
├── hooks/          # Custom hooks (use*.ts)
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
└── services/       # API and external services
\`\`\`

## Workflows

### Adding a New Component
1. Create `src/components/ComponentName.tsx`
2. Add tests in `src/components/__tests__/ComponentName.test.tsx`
3. Export from `src/components/index.ts`

### Database Migration
1. Modify `src/db/schema.ts`
2. Run `pnpm db:generate`
3. Run `pnpm db:migrate`

## Testing Patterns

- Test files: `__tests__/` directories or `.test.ts` suffix
- Coverage target: 80%+
- Framework: Vitest
```

## GitHub App 整合

對於進階功能 (10k+ commits、團隊共享、自動 PR)，使用 [Skill Creator GitHub App](https://github.com/apps/skill-creator)：

- 安裝：[github.com/apps/skill-creator](https://github.com/apps/skill-creator)
- 在任何 issue 上留言 `/skill-creator analyze`
- 接收帶有產生 skills 的 PR

## 相關指令 (Related Commands)

- `/instinct-import` - 匯入產生的 instincts
- `/instinct-status` - 檢視學習到的 instincts
- `/evolve` - 將 instincts 叢集化為 skills/agents

---

*Part of [Everything Claude Code](https://github.com/affaan-m/everything-claude-code)*
