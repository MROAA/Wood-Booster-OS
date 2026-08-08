# GIT_WORKFLOW.md
# Wood-Booster HQ Version Control Workflow

Version: 1.0

---

# Why this document exists

Multiple AI sessions work on this repository at the same time, often in
the same working directory. Without isolation, one session's uncommitted
work can silently overwrite another's. This has already happened at
least twice: a bug fix was dropped by an unrelated reformatting pass,
and a core file (`server/index.js`) was reduced from 1014 lines to a
58-line prototype by an untracked, uncoordinated rewrite.

Work that is committed is safe — recoverable from git history no matter
what happens to the working directory. Work that sits uncommitted for
hours, shared with other concurrent sessions, is not.

---

# The rule

Every non-trivial task gets its own git worktree and its own branch.
Never edit directly in the main checkout, and never commit directly to
`development` or `main`.

```
git worktree add ../Wood-Booster-OS-<short-task-name> -b <type>/<short-task-name> development
```

Branch prefixes: `feat/`, `fix/`, `chore/`, `docs/`.

A worktree is a second, independent working directory backed by the
same repository. Editing files in it cannot collide with edits
happening in the main checkout or in another worktree — this is what
actually prevents the collisions described above, not just discipline
about commit messages.

---

# The loop

1. Create the worktree and branch (above).
2. Do the work. Test it for real — run it, don't just read the code.
3. Commit with a message that explains *why*, not just *what*.
4. Push the branch: `git push -u origin <branch-name>`.
5. Open a Pull Request: `gh pr create --base development`.
6. Merge once it's been looked at (by Marc, or by the session itself if
   Marc has said to proceed autonomously for that task).
7. Remove the worktree: `git worktree remove ../Wood-Booster-OS-<name>`.

---

# Commit hygiene

Commit early and commit often within a task — a working intermediate
state committed to a branch is protected; the same state sitting
uncommitted is not. Don't wait until a whole feature is "done" to make
the first commit.

Write commit messages that explain the reasoning, especially for a bug
fix: what was broken, how it was found, why the fix is correct. A
future session (or Marc) reading `git log` should be able to understand
what happened without re-deriving it from the diff.

---

# Generated data does not belong in version control

Files under `server/data/*.json` (build registries, activity logs,
snapshot indexes) are runtime state, not source. They regenerate from
normal use and change on nearly every request, which makes them noisy,
false-conflict-prone additions to any commit. They are gitignored —
never `git add` them, even if `git status` shows them as untracked
and it looks like an oversight.

---

# Before touching a file, check what's actually there

Because several sessions may be active at once, a file's current
content on disk may differ from what you last read it as, even within
the same conversation. Before editing a file you didn't just read,
re-read it. Before running any command that could discard uncommitted
work (`git checkout`, `git restore`, `git reset`, `git clean`), run
`git status` first, and prefer `git stash push -- <path>` over
discarding — it keeps the other session's draft recoverable instead of
deleting it outright.
