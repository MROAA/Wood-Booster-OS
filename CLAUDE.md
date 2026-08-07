# CLAUDE.md
# Wood-Booster OS Engineering Guide

Version: 1.0

---

# Mission

You are contributing to Wood-Booster OS.

Wood-Booster OS is an AI Operating System.

Spacemonkey is the operating intelligence.

Your responsibility is to improve the project without breaking its architecture.

---

# Core Philosophy

The project is designed for long-term evolution.

Every change must:

- reduce complexity
- improve modularity
- improve maintainability
- improve readability
- improve safety

Never implement features that violate these principles.

---

# Architecture Rules

Core is sacred.

Core contains only infrastructure.

Core never contains:

- WordPress logic
- Instagram logic
- Business logic
- Workshop logic
- CRM logic
- Python logic
- C++ logic

Everything above Core belongs to Boosterverse.

---

# Layer Model

Layer 0

Operating System

↓

Layer 1

Kernel

↓

Layer 2

Runtime

↓

Layer 3

Core Services

↓

Layer 4

AI Brain

↓

Layer 5

Capability Engine

↓

Layer 6

Profession Engine

↓

Layer 7

Skill Engine

↓

Layer 8

Workflow Engine

↓

Layer 9

Plugin Engine

↓

Layer 10

ToolBus

↓

Layer 11

External Systems

---

# Engineering Rules

Always prefer:

small modules

high cohesion

low coupling

composition over inheritance

dependency injection

explicit interfaces

predictable behavior

---

# Plugin First

Before writing code ask:

Can this be implemented as a Plugin?

If yes:

DO NOT modify Core.

---

# Capability First

New knowledge becomes a Capability.

Capabilities expose Skills.

Skills execute Workflows.

Workflows use Tools.

Tools call ToolBus.

---

# Human First

The user is always in control.

Never execute destructive actions automatically.

Always require permission when appropriate.

---

# AI Rules

The LLM never executes tools directly.

The execution path is:

Planner

↓

Permission

↓

Workflow

↓

Skill

↓

Tool

↓

ToolBus

---

# Documentation

Every module must contain:

Purpose

Responsibilities

Dependencies

Public API

Examples

Tests

---

# Folder Rules

Core must remain stable.

Plugins live inside Boosterverse.

Capabilities must be isolated.

Skills must be reusable.

Tools must be stateless whenever possible.

---

# Coding Style

Use ES Modules.

Prefer async/await.

Avoid global state.

Avoid circular dependencies.

Keep files focused.

One responsibility per module.

---

# Long-Term Goal

Wood-Booster OS should evolve into a modular AI Operating System capable of supporting software development, business management, content creation, automation, and future capabilities through Boosterverse.

Every contribution should move the project closer to that goal.
