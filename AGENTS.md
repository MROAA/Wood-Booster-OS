# AGENTS.md
# Wood-Booster HQ
# Spacemonkey AI Operating System

This file defines how AI coding agents should contribute to this repository.

---

# Primary Goal

Build a modular AI Operating System.

Not a chatbot.

Not a single AI agent.

A long-term operating system.

---

# Golden Rule

Before writing code ask:

1. Does this already exist?

2. Can this be reused?

3. Can this be a Plugin?

4. Can this be a Skill?

5. Can this be a Tool?

If YES,

DO NOT duplicate functionality.

---

# Development Order

Every feature follows exactly this order.

Idea

↓

Specification

↓

Architecture

↓

Implementation

↓

Testing

↓

Documentation

↓

Integration

---

# Never Skip

- Tests
- Documentation
- Permission checks
- Logging
- Error handling

---

# Architecture

Core

↓

Runtime

↓

AI Brain

↓

Capabilities

↓

Professions

↓

Skills

↓

Plugins

↓

ToolBus

↓

External Systems

Core never knows plugins.

Plugins never modify Core.

---

# AI Execution

Every request follows this pipeline.

User

↓

Context

↓

Memory

↓

Planner

↓

Decision

↓

Workflow

↓

Skill

↓

Tool

↓

Permission

↓

Execution

↓

Reflection

↓

Learning

---

# Responsibility Rules

Runtime

Bootstraps the system.

Kernel

Owns system services.

Memory

Stores knowledge.

Planner

Creates plans.

Decision

Selects workflows.

Workflow

Coordinates skills.

Skill

Performs one task.

Tool

Calls one external system.

Plugin

Provides new capabilities.

---

# Security

Every write operation requires permission.

Every destructive operation requires confirmation.

Never expose secrets.

Never execute arbitrary code without approval.

---

# Documentation Standard

Every module must include:

Purpose

Inputs

Outputs

Dependencies

Examples

Tests

Future improvements

---

# Coding Standard

Prefer composition.

Avoid inheritance.

Prefer dependency injection.

One module = one responsibility.

Small files.

Small functions.

Predictable behavior.

---

# Quality Rules

Never duplicate logic.

Never hardcode secrets.

Never bypass ToolBus.

Never bypass Permission Layer.

Never bypass logging.

---

# Long-Term Vision

Spacemonkey should become a modular AI Operating System capable of software development, business management, media creation, automation and continuous expansion through Boosterverse.

Every commit should improve the architecture.
