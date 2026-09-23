import { detectPlatform, fromUrl, normalizeJobUrl, parseHtml, suggestRef, humanize, isPrivateAddress, REF_PATTERN } from '../src/lib/job-parse.ts';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n        got:  ${JSON.stringify(got)}\n        want: ${JSON.stringify(want)}`}`);
};
const U = (s) => new URL(s);

// platform
eq('platform: linkedin (subdomain)', detectPlatform('br.linkedin.com'), 'linkedin');
eq('platform: gupy company subdomain', detectPlatform('grupoxpto.gupy.io'), 'gupy');
eq('platform: lookalike is NOT linkedin', detectPlatform('linkedin.com.evil.io'), 'outro');
eq('platform: lookalike suffix NOT gupy', detectPlatform('notgupy.io'), 'outro');
eq('platform: workday', detectPlatform('acme.wd5.myworkdayjobs.com'), 'workday');

// LinkedIn URLs (read from the link only, never fetched)
eq('linkedin: title + company from slug', fromUrl(U('https://www.linkedin.com/jobs/view/analista-de-dados-at-empresa-x-3912345678/')), { title: 'Analista de Dados', company: 'Empresa X' });
eq('linkedin: regional host + tracking params', fromUrl(U('https://br.linkedin.com/jobs/view/analista-de-dados-pleno-at-banco-do-brasil-3912345678?position=1&pageNum=0&refId=abc%3D%3D&trackingId=zz')), { title: 'Analista de Dados Pleno', company: 'Banco do Brasil' });
eq('linkedin: id-only URL yields nothing (user fills in)', fromUrl(U('https://www.linkedin.com/jobs/view/3912345678/')), {});
eq('linkedin: normalize slug URL to canonical id URL', normalizeJobUrl(U('https://br.linkedin.com/jobs/view/analista-de-dados-at-empresa-x-3912345678?refId=1&trk=abc')), 'https://www.linkedin.com/jobs/view/3912345678/');
eq('linkedin: normalize collections ?currentJobId', normalizeJobUrl(U('https://www.linkedin.com/jobs/collections/recommended/?currentJobId=3912345678&discover=x')), 'https://www.linkedin.com/jobs/view/3912345678/');

// Gupy & others
eq('gupy: company from subdomain', fromUrl(U('https://grupoxpto.gupy.io/jobs/1234567?jobBoardSource=gupy_public_page')), { company: 'Grupoxpto' });
eq('gupy: normalize strips query', normalizeJobUrl(U('https://grupoxpto.gupy.io/jobs/1234567?jobBoardSource=gupy_public_page&utm_source=x')), 'https://grupoxpto.gupy.io/jobs/1234567');
eq('gupy: portal (not a company) yields nothing', fromUrl(U('https://portal.gupy.io/job-search/term=dados')), {});
eq('greenhouse: company from path', fromUrl(U('https://boards.greenhouse.io/acme-corp/jobs/12345')), { company: 'Acme Corp' });
eq('workday: company from host', fromUrl(U('https://acme.wd5.myworkdayjobs.com/en-US/Careers/job/SP/x_R123')), { company: 'Acme' });
eq('generic: tracking params stripped, others kept', normalizeJobUrl(U('https://example.com/carreiras/123?utm_source=x&id=5&fbclid=z#top')), 'https://example.com/carreiras/123?id=5');

// HTML
eq('html: JSON-LD JobPosting (entities decoded)', parseHtml('<html><script type="application/ld+json">{"@context":"https://schema.org","@type":"JobPosting","title":"Engenheiro de Dados","hiringOrganization":{"@type":"Organization","name":"Ci&amp;T"}}</script></html>'), { title: 'Engenheiro de Dados', company: 'Ci&T' });
eq('html: JSON-LD inside @graph', parseHtml('<script type="application/ld+json">{"@graph":[{"@type":"WebSite"},{"@type":["Thing","JobPosting"],"title":"Analista BI","hiringOrganization":"Acme"}]}</script>'), { title: 'Analista BI', company: 'Acme' });
eq('html: og:title "Cargo | Empresa | Gupy"', parseHtml('<meta property="og:title" content="Analista de Dados | Empresa X | Gupy">'), { title: 'Analista de Dados', company: 'Empresa X', companyGuessed: true });
eq('html: og:title with reversed attribute order', parseHtml('<meta content="Cientista de Dados - Acme" property="og:title" />'), { title: 'Cientista de Dados', company: 'Acme', companyGuessed: true });
eq('html: <title> with site suffix only', parseHtml('<title>Desenvolvedor Python - Gupy</title>'), { title: 'Desenvolvedor Python', companyGuessed: false });
eq('html: malformed JSON-LD falls back to og:title', parseHtml('<script type="application/ld+json">{ not json</script><meta property="og:title" content="Analista | Beta">').title, 'Analista');
eq('html: garbage in, nothing out', parseHtml('<<<>>> \u0000 nothing here'), {});
const t0 = Date.now();
parseHtml('<script type="application/ld+json">' + '{"a":'.repeat(50000) + '</script>' + 'x'.repeat(2_000_000));
eq('html: hostile 2MB input is bounded and fast (<1s)', Date.now() - t0 < 1000, true);

// ref suggestion
eq('ref: company + short title, level dropped', suggestRef('Empresa X', 'Analista de Dados Sênior', new Set()), 'empresa-x-analista-de-dados');
eq('ref: collisions get -2, -3', [suggestRef('Empresa X', 'Analista', new Set(['empresa-x-analista'])), suggestRef('Empresa X', 'Analista', new Set(['empresa-x-analista', 'empresa-x-analista-2']))], ['empresa-x-analista-2', 'empresa-x-analista-3']);
eq('ref: accents and symbols', suggestRef('Ação & Cia Ltda', 'Engenheiro(a) de Dados', new Set()), 'acao-cia-ltda-engenheiro-a-de');
eq('ref: empty input falls back', suggestRef('', '', new Set()), 'vaga');
eq('ref: non-latin falls back', suggestRef('日本', '日本語', new Set()), 'vaga');
const long = suggestRef('Uma Empresa Com Um Nome Absurdamente Longo Ltda', 'Analista de Inteligência de Negócios e Dados', new Set());
eq('ref: always matches the server pattern and <= 40 chars', REF_PATTERN.test(long) && long.length <= 40, true);
const many = new Set();
let ok = true;
for (let i = 0; i < 30; i++) { const r = suggestRef('X', 'Y', many); if (many.has(r) || !REF_PATTERN.test(r)) ok = false; many.add(r); }
eq('ref: 30 identical applications all get unique valid refs', ok, true);

// humanize
eq('humanize: small words', humanize('banco-do-brasil'), 'Banco do Brasil');
eq('humanize: url-encoded', humanize('%C3%A1gua-e-luz'), 'Água e Luz');

// SSRF guard
for (const [ip, want] of [['127.0.0.1', true], ['10.1.2.3', true], ['172.16.0.1', true], ['172.31.255.255', true], ['172.32.0.1', false], ['192.168.1.1', true], ['169.254.169.254', true], ['0.0.0.0', true], ['100.64.0.1', true], ['::1', true], ['fd00::1', true], ['fe80::1', true], ['::ffff:127.0.0.1', true], ['::ffff:10.0.0.1', true], ['8.8.8.8', false], ['1.1.1.1', false], ['2606:4700:4700::1111', false], ['93.184.216.34', false]]) {
  eq(`ssrf: ${ip} ${want ? 'blocked' : 'allowed'}`, isPrivateAddress(ip), want);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
