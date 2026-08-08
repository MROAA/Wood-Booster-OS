/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Git Capability Pack
 */

const GitPack = {

    id: "git-pack",

    name: "Git Pack",

    version: "1.0.0",

    description:
        "Complete Git version control capability.",

    capabilities: [

        "git",

        "git-local",

        "git-remote",

        "github",

        "git-workflow",

        "version-control"

    ],

    skills: [

        "git-status",

        "git-add",

        "git-commit",

        "git-branch",

        "git-switch",

        "git-merge",

        "git-rebase",

        "git-pull",

        "git-push",

        "git-tag",

        "git-log",

        "resolve-conflicts"

    ],

    tools: [

        "git",

        "terminal",

        "filesystem"

    ],

    workflows: [

        "feature-development",

        "bug-fix",

        "release",

        "hotfix",

        "backup",

        "code-review"

    ],

    professions: [

        "developer",

        "maintainer",

        "release-manager"

    ],

    permissions: [

        "filesystem.read",

        "filesystem.write",

        "terminal.execute",

        "git.commit",

        "git.push",

        "git.pull"

    ],

    maturity: {

        level: 1,

        maxLevel: 4

    }

}

export default GitPack
