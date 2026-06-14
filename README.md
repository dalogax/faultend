# Faultend

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A lightweight HTTP proxy for testing application resilience against unreliable backends.

Route your app's traffic through Faultend to inspect every request and response in real time, then inject failures — bad status codes, slow responses, custom bodies — with no code changes required.

## What it does

1. Point your app at Faultend instead of your real backend
2. Create rules to proxy traffic to your real services
3. Watch all traffic live in the UI
4. Click any request to convert it into a mock or modify its behavior
5. Simulate errors, latency, and edge cases to see how your app responds

## Features

- **Rules-based routing** — priority-ordered rules, each either proxying to a real backend or returning a mock response
- **Failure injection** — custom status codes, response bodies, fixed or random latency
- **JS response transforms** — run a JavaScript snippet against any response before it is sent; modify status, headers, or body
- **Real-time traffic inspection** — full request/response logging with filtering and search
- **Conditional matching** — match rules on headers, query params, body fields, or cookies
- **Request header manipulation** — add, set, or remove headers before proxying
- **Template variables** — dynamic values in mock bodies (`uuid()`, `timestamp()`, `random()`, etc.)
- **Server sharing** — invite collaborators via link; role-based access (owner, admin, collaborator)
- **Export/Import** — save and restore server configurations as JSON
- **OAuth login** — Google and GitHub, with email-based account linking

## Hosted version

A hosted version is available at [faultend.com](https://faultend.com) — no setup required.

## Self-hosting

### Requirements

- Docker
- A domain with wildcard DNS (`*.yourdomain.com`) pointing to your server
- Traefik v3 running as a reverse proxy on the same Docker network

### Quick start

1. Clone the repository:

   ```bash
   git clone https://github.com/dalogax/faultend.git
   cd faultend
   ```

2. Copy and configure the environment file:

   ```bash
   cp .env.example .env
   # Edit .env — at minimum set DATABASE_URL, SESSION_SECRET, ROOT_DOMAIN
   ```

3. Update `docker-compose.yml` — replace `faultend.com` with your domain in the Traefik labels.

4. Start the container:

   ```bash
   docker compose up -d
   ```

The app will be available at `app.yourdomain.com`. Each fault server gets its own subdomain (`<server-id>.yourdomain.com`).

See [docs/installation.md](docs/installation.md) for full networking and Traefik requirements, and [docs/deployment.md](docs/deployment.md) for production deployment guidance.

## Documentation

Full documentation is in the [docs/](docs/) directory:

- [Overview](docs/overview.md) — concept and architecture
- [Features](docs/features.md) — complete feature reference
- [Workflow](docs/workflow.md) — how to use Faultend in practice
- [API Reference](docs/api-reference.md) — REST API
- [Development](docs/development.md) — local setup and contributing
- [Installation](docs/installation.md) — self-hosting requirements

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up a local dev environment, run tests, and open a pull request.

## License

MIT — see [LICENSE](LICENSE).
