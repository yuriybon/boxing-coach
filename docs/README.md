# Cornerman AI - Architecture Documentation

This folder contains the software architecture documentation for **Cornerman AI**, a real-time multimodal boxing coach.

We use the [C4 Model](https://c4model.com/) to describe the architecture at different levels of abstraction. The diagrams are rendered using [Mermaid C4 syntax](https://mermaid.js.org/syntax/c4.html) which is natively supported by GitHub.

## Documentation Structure

1. **[Level 1: System Context](./architecture/01-system-context.md)**
   Shows the system in its environment, highlighting the user and external systems.
2. **[Level 2: Container](./architecture/02-container.md)**
   Zooms into the system to show the high-level technical building blocks (containers) and how they interact.
3. **[Level 3: Component](./architecture/03-component.md)**
   Zooms into individual containers to show the components inside them.

## Overview

Cornerman AI uses the device's camera and microphone to analyze boxing form, stance, and punch technique. It communicates with the **Gemini Live API** via a Node.js backend acting as a secure proxy to provide real-time, low-latency voice feedback and combo callouts to the user.
