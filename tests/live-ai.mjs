// Explicitly invoked integration check: two short model requests and one short audio transcription.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
if (process.env.NOVA_LIVE_TESTS !== '1')
  throw new Error('Live tests require explicit NOVA_LIVE_TESTS=1.');
const dir = await mkdtemp(join(tmpdir(), 'nova-live-'));
try {
  for (const name of [
    'design',
    'design-contract',
    'design-actions',
    'simulation',
    'citizens',
    'conversation',
    'ai-contract',
  ]) {
    const src = await readFile(
      new URL('../app/' + name + '.ts', import.meta.url),
      'utf8',
    );
    const js = ts
      .transpileModule(src, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ES2022,
        },
      })
      .outputText.replace(
        /from ['"]\.\/(simulation|citizens|conversation|ai-contract|design|design-contract|design-actions)['"]/g,
        "from './$1.mjs'",
      );
    await writeFile(join(dir, name + '.mjs'), js);
  }
  const { initialState } = await import(
    pathToFileURL(join(dir, 'simulation.mjs'))
  );
  const { contextFor, validAIReply } = await import(
    pathToFileURL(join(dir, 'ai-contract.mjs'))
  );
  const base = 'http://localhost:3000';
  const checks = [
    {
      speaker: 'aura',
      message:
        'Make the city a little greener with two gardens near the homes. Explain your choice in two sentences.',
    },
    {
      speaker: 0,
      message:
        'Mira, if AI can already compose every possible song, what makes your own music worth creating? Decide one concrete next step for your project.',
    },
  ];
  for (const check of process.env.NOVA_TEST_AUDIO_ONLY === '1' ? [] : checks) {
    const response = await fetch(base + '/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify(
        contextFor(initialState(), check.message, check.speaker, []),
      ),
      signal: AbortSignal.timeout(35000),
    });
    const data = await response.json();
    assert.ok(
      response.ok,
      'AI route failed with HTTP ' +
        response.status +
        ' (' +
        (data.code || 'request failed') +
        ')',
    );
    assert.ok(validAIReply(data));
    if (check.speaker === 'aura')
      assert.equal(
        data.builds.reduce((n, b) => n + b.count, 0),
        2,
      );
    else assert.equal(data.builds.length, 0);
    console.log(
      JSON.stringify({
        test:
          check.speaker === 'aura'
            ? 'AURA grounded construction'
            : 'Mira free conversation',
        passed: true,
        reply: data.reply,
        hasPlan: data.plan !== null,
      }),
    );
  }
  const audio = await readFile('/tmp/nova-voice-test.wav');
  const form = new FormData();
  form.set('audio', new Blob([audio], { type: 'audio/wav' }), 'voice.wav');
  const response = await fetch(base + '/api/transcribe', {
    method: 'POST',
    headers: { Origin: base },
    body: form,
    signal: AbortSignal.timeout(35000),
  });
  const result = await response.json();
  assert.ok(
    response.ok,
    'Transcription route failed: ' + JSON.stringify(result),
  );
  assert.match(result.text, /create|heard|Mira/i);
  console.log(
    JSON.stringify({
      test: 'Voice transcription',
      passed: true,
      transcript: result.text,
    }),
  );
} finally {
  await rm(dir, { recursive: true, force: true });
}
