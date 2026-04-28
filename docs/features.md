# Features

This document lists the current capabilities of Faultend, split by user-facing functionality and backend behavior.

---

## Core Functionality

- **Subdomain Architecture:** Isolated fault servers per subdomain
- **Real-time Traffic Inspection:** Request/response logging with filtering
- **Rules-Based Routing:** Priority-ordered rules for mock or proxy actions
- **Multi-Backend Support:** Different rules can proxy to different services
- **Template Variables:** Dynamic data generation in mock responses
- **Conditional Matching:** Match on headers, query params, body fields
- **Request Manipulation:** Modify headers before proxying
- **Export/Import:** Save and load server configurations as JSON
- **Server Management:** Create, delete, and configure fault servers
- **Server URL Display:** Copyable proxy URL in top bar
- **Custom Dialogs:** Native-looking confirmation dialogs (no browser popups)
- **Minimal Notifications:** Error-only toasts (no success spam)

## Backend Features

- Rules-based routing with priority-ordered evaluation
- Dual-action rules: Mock responses OR proxy to specified backends
- Multi-backend support (different rules can proxy to different services)
- Full request/response body capture for all HTTP methods
- Body parsing for JSON content types (10MB limit)
- Binary data detection and metadata storage
- Complete transaction logging with timing
- Comprehensive traffic filtering
- Traffic statistics and analytics
- Error transaction logging with stack traces
- In-memory storage with FIFO eviction (1000 transaction limit)
- Template variables in mock responses
- Enhanced latency control (fixed/range)
- Request condition matching (headers, query, body, cookies)
- Request header manipulation for proxy rules
- Export/import rule configurations as JSON
- Subdomain-based routing and isolation

---

## Related Docs

- [Overview](./overview.md) – High-level project concept
- [Workflow](./workflow.md) – How to use these features in practice
- [API Reference](./api-reference.md) – How to interact with features programmatically
