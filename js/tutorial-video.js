// Accept only recognized YouTube URLs, not arbitrary text containing v=.
function tutorialVideoId(value) {
  try {
    const u = new URL(String(value).trim());
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    let id;
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
    else if (['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)) {
      id = u.pathname === '/watch' ? u.searchParams.get('v') : /^\/(?:embed|shorts)\/([^/]+)$/.exec(u.pathname)?.[1];
    }
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
if (typeof module !== 'undefined') module.exports = { tutorialVideoId };
