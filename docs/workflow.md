# Use Case Workflow

This document describes the typical workflow for using Faultend to test application resilience.

---

## Step-by-Step Workflow

1. **Launch** Faultend and open the UI
2. **Configure** your mobile/web app to use Faultend's base URL (e.g., `faultend.myapp.com`)
3. **Create initial proxy rules** to route traffic to your backends:
   - Rule 1 (priority 100): `.*` → Proxy to `https://api.myapp.com`
   - Rule 2 (priority 90): `/auth/.*` → Proxy to `https://auth.myapp.com`
4. **Interact** with your app normally – Faultend routes based on rules
5. **Inspect** traffic – Each request/response appears live in the UI
6. **Convert** a logged request into a mock or proxy rule with one click
7. **Edit** the auto-filled form:
   - Method (GET, POST, etc.)
   - Path regex pattern
   - **Action: Mock or Proxy**
   - If Mock: Response status code, JSON response body, optional artificial latency
   - If Proxy: Target backend URL
   - Priority (higher = evaluated first)
8. **Save** the rule – future matching requests will follow this rule
9. **Export** your configuration as JSON to replicate across environments
10. **Observe** how your app behaves under controlled failure scenarios

---

## Related Docs

- [Overview](./overview.md) – Project concept and deployment model
- [Features](./features.md) – What Faultend can do
- [API Reference](./api-reference.md) – Data models and endpoints you will interact with
