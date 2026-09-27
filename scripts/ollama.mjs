import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import nextEnv from '@next/env';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
nextEnv.loadEnvConfig(root);
const local = path.join(root, '.local');
const binary = path.join(local, 'ollama', process.platform === 'win32' ? 'ollama.exe' : 'ollama');
const executable = fs.existsSync(binary) ? binary : 'ollama';
const endpoint = new URL(process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname) || !['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) throw new Error('Use a localhost Ollama endpoint.');
const base = endpoint.origin;
const model = process.env.OLLAMA_MODEL || 'qwen3:4b';
if (/cloud/i.test(model)) throw new Error('Choose a local Ollama model.');
async function main() {
  if (process.argv[2] === 'pull') {
    const child = spawn(executable, ['pull', model], { stdio: 'inherit', windowsHide: true, env: { ...process.env, OLLAMA_HOST: base } });
    child.on('error', () => { console.error('Install Ollama from https://ollama.com/download, then run npm run ai:start.'); process.exitCode = 1; });
    child.on('exit', code => { process.exitCode = code || 0; }); return;
  }
  try { const r = await fetch(base + '/api/tags', { signal: AbortSignal.timeout(2000) }); if (r.ok) { console.log('Ollama is already running locally.'); return; } } catch {}
  fs.mkdirSync(path.join(local, 'models'), { recursive: true });
  const out = fs.openSync(path.join(local,'ollama-out.log'),'a');
  const err = fs.openSync(path.join(local,'ollama-error.log'),'a');
  const child = spawn(executable, ['serve'], { cwd: root, detached: true, windowsHide: true, stdio: ['ignore',out,err], env: { ...process.env, OLLAMA_HOST: base, OLLAMA_MODELS: path.join(local,'models'), OLLAMA_NO_CLOUD: '1' } });
  child.on('error', () => { console.error('Could not start Ollama. Install it from https://ollama.com/download.'); process.exitCode = 1; });
  child.unref();
  for(let attempt=0;attempt<20;attempt++) {
    await new Promise(resolve=>setTimeout(resolve,500));
    try { const r=await fetch(base+'/api/tags',{signal:AbortSignal.timeout(1000)});if(r.ok){console.log('Ollama is ready at '+base+'. Run npm run ai:pull if the model is not downloaded.');return;} } catch {}
  }
  console.error('Ollama did not start. Check .local/ollama-error.log. It needs permission to create its .ollama folder in your user profile.');
  process.exitCode=1;
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
