/*
  Pressel v2 runner: preview -> publish -> verify with robust logging.
  Usage:
    node scripts/pressel-run.js \
      --site https://atlz.online \
      --user pressel-bot \
      --pass "pCM0 1Y8U WfR2 aQM2 DrmE XdDz" \
      --json uploads/pressel-models/V1/modelo-teste.json \
      --slug amostras-teste
*/

const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  return process.env[name.toUpperCase()] || def;
}

async function main() {
  const site = arg('site', 'https://atlz.online');
  const user = arg('user', 'pressel-bot');
  const pass = arg('pass');
  const jsonPath = arg('json', 'uploads/pressel-models/V1/modelo-teste.json');
  const slug = arg('slug', 'amostras-teste');

  if (!pass) {
    console.error('Missing --pass (application password).');
    process.exit(1);
  }

  const base = site.replace(/\/$/, '') + '/wp-json/pressel-automation/v2';
  const body = fs.readFileSync(jsonPath, 'utf8');
  const auth = 'Basic ' + Buffer.from(`${user}:${pass}`, 'ascii').toString('base64');

  const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
  const headers = { 'Authorization': auth, 'Content-Type': 'application/json', 'User-Agent': 'PresselRunner/1.0' };

  const outDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  async function call(method, url, data) {
    const res = await fetch(url, { method, headers, body: data });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { status: res.status, ok: res.ok, json };
  }

  console.log('\n== PREVIEW ==');
  const preview = await call('POST', `${base}/preview`, body);
  fs.writeFileSync(path.join(outDir, 'pressel-preview.json'), JSON.stringify(preview, null, 2));
  console.log(preview);

  console.log('\n== PUBLISH ==');
  const publish = await call('POST', `${base}/publish`, body);
  fs.writeFileSync(path.join(outDir, 'pressel-publish.json'), JSON.stringify(publish, null, 2));
  console.log(publish);

  console.log('\n== VERIFY ==');
  const verify = await call('GET', `${base}/verify?slug=${encodeURIComponent(slug)}`);
  fs.writeFileSync(path.join(outDir, 'pressel-verify.json'), JSON.stringify(verify, null, 2));
  console.log(verify);

  console.log('\n== SUMMARY ==');
  console.log({
    preview_ok: preview.ok,
    detected_model: preview.json?.detected_model,
    template_preview: preview.json?.template,
    publish_ok: publish.ok,
    post_id: publish.json?.post_id,
    slug: publish.json?.slug,
    template_publish: publish.json?.template,
    verify_status: verify.status,
    template_verify: verify.json?.template,
    acf_keys_count: Array.isArray(verify.json?.acf_keys) ? verify.json.acf_keys.length : undefined,
    public_url: site.replace(/\/$/, '') + '/' + slug + '/'
  });
}

main().catch(err => {
  console.error('Runner failed:', err);
  process.exit(1);
});



