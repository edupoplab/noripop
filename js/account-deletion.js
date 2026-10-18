/* No privileged key: uses the signed-in user's existing Storage permissions.
 * Requires matching server preflight/finalization RPCs before deployment. */
const accountDeletion = (() => {
  const version = 'files-v2', limit = 100;
  class Pending extends Error { constructor(stage) { super('deletion_pending'); this.stage = stage; } }
  async function run(client) {
    let stage = 'preflight';
    try {
      const {data: auth, error: authError} = await client.auth.getUser();
      const uid = auth?.user?.id;
      if (authError || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid || '')) throw new Pending(stage);
      const ready = await client.rpc('prepare_account_deletion');
      if (ready.error || ready.data?.version !== version || ready.data?.user_id !== uid || ready.data?.bucket !== 'thumbs') throw new Pending(stage);
      const bucket = client.storage.from('thumbs');
      async function collect() {
        const paths = [], folders = [uid], visited = new Set();
        while (folders.length) {
          const folder = folders.shift();
          if (visited.has(folder) || visited.size >= 1000) throw new Pending(stage);
          visited.add(folder);
          // Collect every page before removing anything: deleting while using offset skips files.
          for (let offset = 0; ; offset += limit) {
            const {data, error} = await bucket.list(folder, {limit, offset, sortBy:{column:'name',order:'asc'}});
            if (error || !Array.isArray(data) || data.length > limit) throw new Pending(stage);
            for (const item of data) {
              if (!item || typeof item.name !== 'string' || !item.name || /[/\\\x00-\x1f]/.test(item.name) || ['.','..'].includes(item.name)) throw new Pending(stage);
              const name = folder + '/' + item.name;
              if (!name.startsWith(uid + '/') || paths.length >= 100000) throw new Pending(stage);
              if (item.id === null && item.metadata === null) folders.push(name);
              else if (typeof item.id === 'string' && item.id) paths.push(name);
              else throw new Pending(stage); // Unknown API shape must never become a deletion path.
            }
            if (data.length < limit) break;
            if (offset >= 100000) throw new Pending(stage);
          }
        }
        return [...new Set(paths)];
      }
      stage = 'files';
      const paths = await collect();
      for (let offset = 0; offset < paths.length; offset += limit) {
        const {error} = await bucket.remove(paths.slice(offset, offset + limit));
        if (error) throw new Pending(stage);
      }
      stage = 'verify';
      if ((await collect()).length) throw new Pending(stage);
      stage = 'account';
      const result = await client.rpc('delete_account');
      if (result.error) throw new Pending(stage);
      return {completed:true};
    } catch (error) {
      // Do not leak provider errors, filenames, account IDs, or pretend rollback of files.
      throw error instanceof Pending ? error : new Pending(stage);
    }
  }
  return {run};
})();
if (typeof module !== 'undefined') module.exports = accountDeletion;
