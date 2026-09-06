# Security

NOVA is an early prototype. The open-source repository does not include an
authentication gateway or a hosted AI allowance. Its in-memory request throttle
is not a durable spending cap. Before exposing AI endpoints publicly, configure
authentication, persistent usage accounting and cost controls for your deployment.

Keep `OPENAI_API_KEY` only in ignored local environment files or protected server
secrets. Never put it in browser code, public-prefixed environment variables,
screenshots, issue reports or build artifacts. Treat conversations and microphone
recordings as private inputs.

If you discover a vulnerability, use the repository's private vulnerability
reporting option when available. Do not post working credentials, private data or
an exploit against a live instance in a public issue. If private reporting is not
available, open an issue asking for a confidential contact without sensitive details.

There is no formal security support commitment or response-time guarantee yet.
