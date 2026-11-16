import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const run = promisify(execFile);
const root = new URL('../', import.meta.url);
const skillPath = 'skills/extension-operations/SKILL.md';

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'extension-skill-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const path of ['src', 'scripts', 'templates', 'extension.config.json', 'xangi-extension.json']) {
    await cp(new URL(path, root), join(dir, path), { recursive: true });
  }
  return dir;
}

function requests(skill) {
  return skill.split('\n').filter((line) => line.startsWith('"$XANGI_CLI" tool extension_request '));
}

test('shipped skill matches configure output for the default config', async (t) => {
  const dir = await fixture(t);
  await run(process.execPath, ['scripts/configure.mjs'], { cwd: dir });
  assert.equal(await readFile(new URL(skillPath, root), 'utf8'), await readFile(join(dir, skillPath), 'utf8'));
});

test('valid IDs with repeated separators produce discoverable skill names', async (t) => {
  const dir = await fixture(t);
  for (const [id, expected] of [
    ['a..--b', 'xs-a-b'],
    ['a'.repeat(57), 'xs-' + 'a'.repeat(57)],
    ['xangi-counter', 'xs-counter'],
    ['xangi..--notes', 'xs-notes'],
  ]) {
    await run(process.execPath, ['scripts/configure.mjs', '--id', id], { cwd: dir });
    const skill = await readFile(join(dir, skillPath), 'utf8');
    const name = skill.split('\n')[1].slice('name: '.length);
    assert.equal(name, expected);
    assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(name.length <= 64);
    assert.ok(requests(skill).every((line) => line.includes(`--id ${id} --capability ${id}.manage `)));
  }
});

test('configure keeps operation commands aligned with renamed IDs and all feature combinations', async (t) => {
  const dir = await fixture(t);
  for (let bits = 0; bits < 8; bits++) {
    const features = ['ui', 'device', 'ai'].filter((_, index) => bits & (1 << index));
    const id = bits % 2 ? 'reading.notes' : 'counter-two';
    await run(process.execPath, ['scripts/configure.mjs', '--id', id, '--name', 'A: "name"\nwith newline', '--features', features.join(',') || 'none'], { cwd: dir });
    const manifest = JSON.parse(await readFile(join(dir, 'xangi-extension.json'), 'utf8'));
    const skill = await readFile(join(dir, skillPath), 'utf8');
    const [name, description] = skill.split('\n').slice(1, 3);
    assert.equal(name, `name: xs-${id.replaceAll('.', '-')}`);
    assert.match(JSON.parse(description.slice('description: '.length)), new RegExp(id.replaceAll('.', '\\.')));
    assert.ok(!skill.includes('{{'));
    assert.ok(!skill.includes(id === 'counter-two' ? 'reading.notes' : 'counter-two'));
    const commands = requests(skill);
    assert.equal(commands.length, features.includes('ai') ? 3 : 2);
    for (const command of commands) {
      assert.ok(command.includes(`--id ${manifest.id} --capability ${manifest.capabilities[0].id} `));
    }
    assert.ok(commands.some((line) => line.endsWith('--path /api/status')));
    assert.ok(commands.some((line) => line.endsWith("--path /api/counter --method POST --body-json '{}'")));
    assert.equal(skill.includes('## 画面を開く'), Boolean(manifest.ui));
    assert.equal(skill.includes(`/api/devices/${id}/message`), Boolean(manifest.deviceIngress));
    assert.equal(skill.includes('--path /api/ai'), features.includes('ai'));
  }
  const paths = ['extension.config.json', 'xangi-extension.json', skillPath];
  const before = await Promise.all(paths.map((path) => readFile(join(dir, path), 'utf8')));
  for (const args of [['--id', '../escape'], ['--features', 'ui,unknown']]) {
    await assert.rejects(run(process.execPath, ['scripts/configure.mjs', ...args], { cwd: dir }));
    assert.deepEqual(await Promise.all(paths.map((path) => readFile(join(dir, path), 'utf8'))), before);
  }
});
