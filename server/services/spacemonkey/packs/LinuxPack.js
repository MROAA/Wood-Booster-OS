/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Linux Capability Pack
 */

const LinuxPack = {

    id: "linux-pack",

    name: "Linux Pack",

    version: "1.0.0",

    description:
        "Linux operating system capability pack.",

    category: "development",

    capabilities: [

        "linux",
        "filesystem",
        "terminal",
        "process-management",
        "package-management",
        "networking",
        "system-monitoring",
        "services",
        "permissions",
        "shell"

    ],

    skills: [

        "navigate-filesystem",
        "manage-files",
        "manage-directories",
        "execute-command",
        "inspect-processes",
        "manage-services",
        "manage-packages",
        "check-disk-space",
        "monitor-memory",
        "inspect-network",
        "view-logs",
        "create-backup"

    ],

    tools: [

        "terminal",
        "filesystem",
        "systemctl",
        "journalctl",
        "git",
        "docker",
        "ssh"

    ],

    workflows: [

        "system-maintenance",
        "backup-project",
        "environment-setup",
        "diagnostics",
        "cleanup",
        "deployment"

    ],

    professions: [

        "linux-administrator",
        "developer",
        "devops-engineer"

    ],

    permissions: [

        "filesystem.read",
        "filesystem.write",
        "terminal.execute",
        "system.read"

    ],

    maturity: {

        level: 1,

        maxLevel: 4

    }

}

export default LinuxPack
