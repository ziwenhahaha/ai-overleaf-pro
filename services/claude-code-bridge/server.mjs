#!/usr/bin/env node

import http from 'node:http'
import { spawn } from 'node:child_process'

const HOST = process.env.CLAUDE_BRIDGE_HOST || '127.0.0.1'
const PORT = Number(process.env.CLAUDE_BRIDGE_PORT || 17891)
const TOKEN = process.env.CLAUDE_BRIDGE_TOKEN || ''
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude'
const TIMEOUT_MS = Number(process.env.CLAUDE_BRIDGE_TIMEOUT_MS || 180_000)
const MAX_REQUEST_BYTES = 256 * 1024
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024

const isLoopbackHost =
  HOST === '127.0.0.1' || HOST === '::1' || HOST === 'localhost'

if (!TOKEN && !isLoopbackHost) {
  console.error(
    'CLAUDE_BRIDGE_TOKEN is required when the bridge binds beyond localhost.'
  )
  process.exit(1)
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function isAuthorized(req) {
  if (!TOKEN) {
    return true
  }
  return req.headers.authorization === `Bearer ${TOKEN}`
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    let bytes = 0

    req.setEncoding('utf8')
    req.on('data', chunk => {
      bytes += Buffer.byteLength(chunk)
      if (bytes > MAX_REQUEST_BYTES) {
        reject(
          Object.assign(new Error('Request body is too large'), {
            statusCode: 413,
          })
        )
        req.destroy()
        return
      }
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(
          Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })
        )
      }
    })
    req.on('error', reject)
  })
}

function extractReply(data) {
  if (typeof data?.result === 'string') {
    return data.result
  }
  if (typeof data?.message === 'string') {
    return data.message
  }
  if (typeof data?.content === 'string') {
    return data.content
  }
  if (Array.isArray(data?.content)) {
    return data.content
      .filter(
        item => item && item.type === 'text' && typeof item.text === 'string'
      )
      .map(item => item.text)
      .join('\n')
  }
  return ''
}

function runClaude({ prompt, systemPrompt, sessionId, resume }) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p',
      '--bare',
      '--output-format',
      'json',
      '--permission-mode',
      'plan',
      '--tools',
      '',
      '--disallowedTools',
      'mcp__*',
      '--no-chrome',
      '--disable-slash-commands',
    ]

    if (systemPrompt) {
      args.push('--system-prompt', systemPrompt)
    }
    if (resume && sessionId) {
      args.push('--resume', sessionId)
    }

    args.push(prompt)

    const child = spawn(CLAUDE_BIN, args, {
      cwd: process.env.CLAUDE_WORKDIR || process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let outputBytes = 0
    let settled = false

    const finish = callback => value => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timer)
      callback(value)
    }

    const resolveOnce = finish(resolve)
    const rejectOnce = finish(reject)

    const timer = setTimeout(
      () => {
        child.kill('SIGTERM')
        setTimeout(() => child.kill('SIGKILL'), 2_000).unref()
        rejectOnce(new Error('Claude Code timed out'))
      },
      Number.isFinite(TIMEOUT_MS) ? TIMEOUT_MS : 180_000
    )

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')

    child.stdout.on('data', chunk => {
      outputBytes += Buffer.byteLength(chunk)
      if (outputBytes > MAX_OUTPUT_BYTES) {
        child.kill('SIGTERM')
        rejectOnce(new Error('Claude Code output is too large'))
        return
      }
      stdout += chunk
    })

    child.stderr.on('data', chunk => {
      outputBytes += Buffer.byteLength(chunk)
      if (outputBytes > MAX_OUTPUT_BYTES) {
        child.kill('SIGTERM')
        rejectOnce(new Error('Claude Code output is too large'))
        return
      }
      stderr += chunk
    })

    child.on('error', error => {
      rejectOnce(
        new Error(
          error.code === 'ENOENT'
            ? `Claude Code executable not found: ${CLAUDE_BIN}`
            : `Failed to start Claude Code: ${error.message}`
        )
      )
    })

    child.on('close', code => {
      if (settled) {
        return
      }
      if (code !== 0) {
        rejectOnce(
          new Error(
            stderr.trim() ||
              `Claude Code exited with status ${code ?? 'unknown'}`
          )
        )
        return
      }

      try {
        const data = JSON.parse(stdout)
        const reply = extractReply(data)
        if (!reply) {
          rejectOnce(new Error('Claude Code returned an empty result'))
          return
        }
        resolveOnce({
          reply,
          sessionId: data.session_id || data.sessionId || sessionId || null,
        })
      } catch {
        rejectOnce(new Error('Claude Code returned invalid JSON'))
      }
    })
  })
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true })
    return
  }

  if (req.method !== 'POST' || req.url !== '/v1/chat') {
    sendJson(res, 404, { error: 'Not found' })
    return
  }

  if (!isAuthorized(req)) {
    sendJson(res, 401, { error: 'Unauthorized' })
    return
  }

  try {
    const { prompt, systemPrompt, sessionId, resume = false } =
      await readJsonBody(req)
    if (typeof prompt !== 'string' || !prompt.trim()) {
      sendJson(res, 400, { error: 'Prompt is required' })
      return
    }

    const result = await runClaude({
      prompt: prompt.trim(),
      systemPrompt: typeof systemPrompt === 'string' ? systemPrompt : '',
      sessionId: typeof sessionId === 'string' ? sessionId : undefined,
      resume: Boolean(resume),
    })
    sendJson(res, 200, result)
  } catch (error) {
    console.error('[claude-code-bridge]', error)
    sendJson(res, error.statusCode || 502, {
      error: error.message || 'Claude Code request failed',
    })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Claude Code bridge listening on http://${HOST}:${PORT}`)
})
