# Claude Code bridge for AI Chat

This small host service lets the Overleaf web container reuse an existing Claude Code login on the Linux host.

## Architecture

```text
Browser
  -> Overleaf /project/:id/ai-chat
  -> http://host.docker.internal:17891/v1/chat
  -> claude -p ...
  -> existing Claude Code account/session on the host
```

The bridge should run as the same Unix user that authenticated Claude Code. Claude credentials stay on the host and are never copied into the Overleaf container.

The initial AI Chat integration is intentionally read-only. It invokes Claude Code with `--permission-mode plan`, `--tools ""`, and `--disallowedTools "mcp__*"`. The current LaTeX document and selection are supplied by the editor as context.

## 1. Verify Claude Code on the host

```bash
claude auth status
```

If needed:

```bash
claude auth login
```

Also verify non-interactive mode:

```bash
claude -p "Reply with OK" --output-format json
```

## 2. Generate a shared bridge token

```bash
export CLAUDE_BRIDGE_TOKEN="$(openssl rand -hex 32)"
echo "$CLAUDE_BRIDGE_TOKEN"
```

Save this value in a root-readable or service-user-readable environment file. The same value must be visible to Docker Compose as `CLAUDE_BRIDGE_TOKEN`.

## 3. Start the bridge on the host

From the repository root:

```bash
CLAUDE_BRIDGE_HOST=0.0.0.0 \
CLAUDE_BRIDGE_PORT=17891 \
CLAUDE_BRIDGE_TOKEN="$CLAUDE_BRIDGE_TOKEN" \
node services/claude-code-bridge/server.mjs
```

Check it locally:

```bash
curl http://127.0.0.1:17891/health
```

Expected response:

```json
{"ok":true}
```

When binding to `0.0.0.0`, use a firewall to keep port `17891` private. The Docker container reaches it through `host.docker.internal`.

## 4. Start/rebuild Overleaf

The repository `docker-compose.yml` contains:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"

environment:
  OVERLEAF_AI_CLAUDE_BRIDGE_URL: ${OVERLEAF_AI_CLAUDE_BRIDGE_URL:-http://host.docker.internal:17891}
  OVERLEAF_AI_CLAUDE_BRIDGE_TOKEN: ${CLAUDE_BRIDGE_TOKEN:-}
```

Export the token before starting the stack:

```bash
export CLAUDE_BRIDGE_TOKEN="your-generated-token"
docker compose up -d --build
```

Use the repository's normal custom-image build/deployment workflow so the modified `services/web` source is included in the running image.

## 5. Use AI Chat

Open any project. A `Claude Code` tab with a robot icon appears in the editor rail.

Each request automatically includes:

- project name;
- current document name;
- selected LaTeX text, when present, capped at 12,000 characters;
- current document contents, capped at 60,000 characters;
- the current Claude Code session ID for follow-up turns.

The trash button starts a new Claude conversation.

## systemd

An example unit is included as `claude-code-bridge.service.example`. Copy it to `/etc/systemd/system/claude-code-bridge.service`, replace `YOUR_LINUX_USER` and the repository path, then create an environment file containing the token.

Example `/etc/ai-overleaf-claude-bridge.env`:

```bash
CLAUDE_BRIDGE_HOST=0.0.0.0
CLAUDE_BRIDGE_PORT=17891
CLAUDE_BRIDGE_TOKEN=replace-with-a-random-token
# If `claude` is outside systemd's PATH, set the absolute executable path:
# CLAUDE_BIN=/home/YOUR_LINUX_USER/.local/bin/claude
```

Then:

```bash
sudo chmod 600 /etc/ai-overleaf-claude-bridge.env
sudo systemctl daemon-reload
sudo systemctl enable --now claude-code-bridge
sudo systemctl status claude-code-bridge
```

## Optional variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `CLAUDE_BIN` | `claude` | Claude Code executable path |
| `CLAUDE_WORKDIR` | bridge process cwd | Working directory used by Claude Code |
| `CLAUDE_BRIDGE_HOST` | `127.0.0.1` | Listen address |
| `CLAUDE_BRIDGE_PORT` | `17891` | Listen port |
| `CLAUDE_BRIDGE_TOKEN` | empty | Bearer token shared with Overleaf |
| `CLAUDE_BRIDGE_TIMEOUT_MS` | `180000` | Claude process timeout |
| `OVERLEAF_AI_CLAUDE_BRIDGE_URL` | `http://host.docker.internal:17891` in Compose | Bridge URL used by Overleaf |
| `OVERLEAF_AI_CLAUDE_BRIDGE_TOKEN` | value of `CLAUDE_BRIDGE_TOKEN` in Compose | Bearer token sent by Overleaf |
