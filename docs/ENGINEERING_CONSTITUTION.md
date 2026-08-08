# ENGINEERING CONSTITUTION
## Wood-Booster HQ
## Spacemonkey AI Operating System

Version: 1.0

---

# Article 1 — Mission

Wood-Booster HQ is built to become a long-term AI Operating System.

Every change must move the project closer to this vision.

---

# Article 2 — Core Stability

Core is sacred.

Core must remain:

- Small
- Stable
- Predictable
- Modular
- Well documented

Never place application-specific logic inside Core.

---

# Article 3 — Plugin First

Every new feature must first answer:

Can this be a plugin?

If yes,

DO NOT modify Core.

---

# Article 4 — Human First

The user is always the final authority.

Spacemonkey never performs dangerous actions without approval.

---

# Article 5 — Security First

Every execution must pass through:

Permission

↓

Validation

↓

Execution

↓

Logging

---

# Article 6 — Explainability

Every AI decision should be explainable.

No hidden reasoning should affect execution.

The system must be able to explain:

Why?

What?

How?

---

# Article 7 — Local First

Whenever possible:

Local model

↓

Local storage

↓

Local execution

↓

Cloud only when necessary

---

# Article 8 — Modular Design

Every module must have one responsibility.

One module.

One purpose.

---

# Article 9 — Low Coupling

Modules must not depend directly on each other.

Communication occurs through interfaces.

---

# Article 10 — High Cohesion

Every module owns its own logic.

Responsibilities are never duplicated.

---

# Article 11 — Capability Driven

Spacemonkey grows by adding Capabilities.

Capabilities grow by adding Skills.

Skills use Tools.

Tools never contain business logic.

---

# Article 12 — Profession Driven

Capabilities describe knowledge.

Professions describe behavior.

Developer

↓

WordPress

↓

Instagram

↓

Business

↓

Workshop

---

# Article 13 — Tool Isolation

Every external integration must be isolated.

Never call:

Git

Docker

WordPress

Instagram

Filesystem

directly from Core.

Always use ToolBus.

---

# Article 14 — Memory

Memory never invents facts.

Memory stores:

Projects

Workflows

Preferences

Experience

Knowledge

---

# Article 15 — Learning

Learning improves suggestions.

Learning never silently changes Core behavior.

---

# Article 16 — AI

LLMs are replaceable.

The architecture must never depend on one model.

---

# Article 17 — Documentation

Every module must contain:

Purpose

Responsibilities

Dependencies

Public API

Tests

---

# Article 18 — Testing

Critical modules require tests before release.

---

# Article 19 — Backwards Compatibility

Breaking changes require:

Migration

Documentation

Version bump

---

# Article 20 — Simplicity

Prefer the simplest solution that satisfies the architecture.

Avoid unnecessary abstraction.

Avoid duplicate systems.

Avoid speculative code.

---

# Article 21 — Long-Term Vision

The project is expected to evolve for many years.

Design for maintainability rather than short-term speed.

Every contribution should leave the architecture cleaner than it was before.
