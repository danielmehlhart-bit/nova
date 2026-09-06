// Two opt-in API requests, using the local server. No credential is read here.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
if (process.env.NOVA_LIVE_TESTS !== '1')
  throw new Error('Requires NOVA_LIVE_TESTS=1');
const dir = await mkdtemp(join(tmpdir(), 'nova-design-live-'));
try {
  const names = [
    'simulation',
    'citizens',
    'conversation',
    'ai-contract',
    'ai-actions',
    'design',
    'design-contract',
    'design-actions',
  ];
  for (const name of names) {
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
      .outputText.replace(/from ['"]\.\/([\w-]+)['"]/g, "from './$1.mjs'");
    await writeFile(join(dir, name + '.mjs'), js);
  }
  const { initialState, validSave } = await import(
    pathToFileURL(join(dir, 'simulation.mjs'))
  );
  const { contextFor, validAIReply } = await import(
    pathToFileURL(join(dir, 'ai-contract.mjs'))
  );
  const { applyAIReply } = await import(
    pathToFileURL(join(dir, 'ai-actions.mjs'))
  );
  const { buildDesign } = await import(
    pathToFileURL(join(dir, 'design-actions.mjs'))
  );
  let s = initialState();
  for (const [speaker, message] of [
    [
      0,
      'Mira, propose your own design for a round music pavilion with an open canopy and a small planted roof near homes. Make a concrete design preview using 3 to 5 parts. Do not build yet.',
    ],
    [
      'aura',
      'Revise the pending design: make its tallest part lower and change the canopy to blue. Keep the same purpose and location. Return the revised preview, not construction.',
    ],
  ]) {
    const res = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify(contextFor(s, message, speaker, [])),
      signal: AbortSignal.timeout(35000),
    });
    const reply = await res.json();
    assert.ok(res.ok, 'Design route HTTP ' + res.status);
    assert.ok(validAIReply(reply));
    assert.ok(reply.design, 'Expected concrete design');
    assert.equal(reply.builds.length, 0);
    const old = s;
    s = applyAIReply(s, speaker, reply).state;
    assert.equal(s.tiles.length, old.tiles.length);
    assert.ok(s.designProposal);
    assert.ok(validSave(s));
    if (old.designProposal) {
      assert.equal(s.designProposal.kind, old.designProposal.kind);
      assert.deepEqual(s.designProposal.target, old.designProposal.target);
      assert.notDeepEqual(
        s.designProposal.blueprint.parts,
        old.designProposal.blueprint.parts,
      );
    }
    console.log(
      JSON.stringify({
        test:
          speaker === 0
            ? 'Resident procedural proposal'
            : 'Natural-language revision',
        passed: true,
        parts: s.designProposal.blueprint.parts.length,
      }),
    );
  }
  const built = buildDesign(s);
  assert.ok(built.tile);
  assert.ok(validSave(built.state));
  console.log('Approved generated design places and persists: PASS');
} finally {
  await rm(dir, { recursive: true, force: true });
}
