const urls = [
  ['/', ['home-registration-picker', '20261012-registration', 'https://f.wps.cn/g/XqX8hSU4/', 'https://f.wps.cn/g/9kanmwuG/', 'https://f.wps.cn/g/JPJ5677T/']],
  ['/index_renew', ['home-registration-picker', '20261012-registration']],
  ['/index_renew.css', ['.home-registration-picker', '.home-registration [hidden]']],
  ['/index_renew.js', ['data-registration-select', 'availableIds', 'item.removeAttribute(\'href\')']]
];
(async () => {
  const results = await Promise.all(urls.map(async ([pathname, markers]) => {
    const url = new URL(pathname, 'https://www.djjxzn.cn');
    url.searchParams.set('registration_check', String(Date.now()));
    const response = await fetch(url, {signal: AbortSignal.timeout(20000), cache: 'no-store'});
    const body = await response.text();
    return {pathname, status: response.status, finalUrl: response.url, matches: markers.map(marker => ({marker, found: body.includes(marker)}))};
  }));
  console.log(JSON.stringify(results));
  if(results.some(result => result.status !== 200 || result.matches.some(match => !match.found))) process.exitCode = 2;
})().catch(error => {console.error(error);process.exitCode=1;});
