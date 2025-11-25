# Fault-end

**Fault-end** is a lightweight proxy tool designed to help developers and testers validate the resilience of mobile and web applications against unreliable backend behavior.  
By routing REST + JSON traffic through Fault-end, you can inspect real requests and responses in real time and, with a single click, transform them into mocked or modified responses.

## 🚀 Motivation

Applications rarely run under perfect network and backend conditions. Timeouts, inconsistent payloads, slow endpoints, and error spikes all happen in production, yet they are difficult to reproduce reliably during development.

Fault-end focuses on making this type of testing effortless.  
Instead of scripting mocks, modifying environments, or spinning up complex stacks, you simply point your application to Fault-end and start interacting with your UI. Fault-end forwards traffic to the real backend, logs everything, and lets you override any request instantly.

The goal is to make **resilience testing accessible, fast, and practical**.

## 🎯 Use Case Scenario

A typical workflow with Fault-end looks like this:

1. Launch Fault-end and open the UI.
2. Configure your mobile/web app to use Fault-end’s base URL instead of the real backend.
3. Interact with your app normally. Fault-end proxies all REST + JSON calls to the real backend.
4. Each request/response appears live in the UI.
5. Click a logged request to **convert it into a mock**.
6. Edit the auto-filled form:
   - Method  
   - Path regex  
   - Response status  
   - JSON response body  
   - Optional artificial latency  
7. Save the rule. Future matching requests will return your mock instantly.
8. Observe how your app behaves under controlled failure scenarios.

No scripts. No DSLs. No environment gymnastics.

## 🛠 Technical Overview

Fault-end is composed of two main parts:

### Backend  
A small reverse proxy optimized strictly for REST + JSON:
- Forwards requests to the real backend unless a matching rule exists  
- Applies mock rules on the fly (status, body, latency)  
- Stores traffic logs and rule definitions  
- Exposes a simple API for the frontend  

The backend is intentionally minimal and focused to support a clean UX.

### Frontend  
A new UI built for clarity and speed:
- Real-time traffic viewer  
- One-click creation of mock rules  
- Simple rule editor  
- Rule list with enable/disable controls  

The user experience is the priority, keeping the workflow intuitive and frictionless.

## 📐 High-Level Architecture

```mermaid
flowchart LR
    A[Mobile / Web App] -->|HTTP JSON| B[Fault-end Proxy]
    B -->|Check mock rules| C{Rule Match?}
    C -->|Yes| D[Mocked Response<br/>Status + JSON + Latency]
    C -->|No| E[Forward to Real Backend]
    E --> F[Backend Response]
    F --> B
    B -->|Return Response| A
    B -->|Log Traffic| G[Traffic & Rules Store]
    H[Frontend UI] -->|View Logs / Manage Rules| G
