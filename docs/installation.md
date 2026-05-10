# Installation 

This project runs as an application container behind **Traefik v3**. The repository already provides a `docker-compose.yml`; this document explains the required **architecture** and the **environment characteristics** your server/DNS must have for a successful deployment with your own domain.

## Architecture

You deploy two components:

1. **Traefik v3 (reverse proxy)**
   - Listens publicly on **80/443**
   - Terminates TLS (HTTPS)
   - Routes traffic to containers using **Docker labels**
   - Obtains and renews certificates automatically (ACME / Let’s Encrypt or another CA)

2. **Faultend (app container)**
   - Serves HTTP on an internal port (for example `3000`)
   - Receives traffic only through Traefik (no direct public port required)

## Required characteristics

### Public networking
- Your server must accept inbound traffic on **TCP 80 and 443** to the Traefik container.

### DNS
- Your chosen apex domain (example: `example.net`) must resolve to your server IP.
- You will need arbitrary subdomains (example: `anything.example.net`) and you must also have working wildcard DNS (`*.example.net`) pointing to the same server.

### TLS / certificates
- If you only need HTTPS on the apex domain, standard ACME issuance is sufficient.
- If you need HTTPS on wildcard subdomains (`*.example.net`), your Traefik certificate automation must support **wildcard issuance** (this typically requires a DNS-capable ACME challenge method, configured in Traefik for your DNS provider).
