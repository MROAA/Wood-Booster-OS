# Wood-Booster OS Project Standard

Version: 1.0

---

## 1. One Source of Truth

Every architectural decision must be documented before implementation.

Documentation is the source of truth.

Implementation follows documentation.

---

## 2. Core Stability

Core exists only to provide platform services.

Core must never contain:

- Business logic
- WordPress logic
- Instagram logic
- Customer logic
- Workshop logic

---

## 3. Boosterverse

Everything outside Core belongs to Boosterverse.

Every new feature should become:

Plugin

↓

Capability

↓

Skills

↓

Workflows

↓

Tools

---

## 4. Architecture First

Before writing code:

Architecture

↓

Specification

↓

Implementation

↓

Tests

↓

Documentation

---

## 5. Vertical Slice Development

Never build infrastructure forever.

Always finish one complete feature.

Example:

User Request

↓

Planner

↓

Skill

↓

Tool

↓

Result

↓

Tests

↓

Documentation

Only then start the next feature.

---

## 6. AI Development Rules

AI assistants must:

- never duplicate code
- reuse existing modules
- preserve architecture
- avoid unnecessary abstractions
- keep modules focused

---

## 7. Documentation

Every feature must include:

- Purpose
- Design
- Interfaces
- Dependencies
- Tests
- Examples

---

## 8. Security

Every external action must pass through:

Permission

↓

Validation

↓

Execution

↓

Logging

---

## 9. Quality

Prefer:

- composition
- interfaces
- dependency injection

Avoid:

- duplicated logic
- hidden state
- circular dependencies

---

## 10. Long-Term Goal

Build a maintainable AI Operating System that can evolve for many years without requiring architectural rewrites.
