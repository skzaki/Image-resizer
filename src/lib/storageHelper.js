/* Lightweight helper to list and fetch signed URLs for user's private files
   Uses aws-amplify Storage. Returns an array of { key, url } entries.
   This helper is defensive: if Storage isn't available or an error
   happens it returns an empty array to avoid breaking the app. */
import { list, getUrl } from 'aws-amplify/storage';

export async function fetchUserPrivateFiles({ path = '', limit = 12 } = {}) {
  try {
    // Prepare candidate paths to try. If the caller passed a path, try that
    // first. Also try the common 'resized/' prefix used by the app when saving files.
    const candidates = [];
    if (path) candidates.push(path);
    if (path && !path.endsWith('/')) candidates.push(`${path}/`);
    candidates.push('resized/');
    candidates.push('resized');
    candidates.push('');

    let itemsArray = [];

    // Try multiple list signatures and candidate prefixes until we find items.
    for (const p of candidates) {
      if (itemsArray.length) break;
      try {
        // Try named-parameter form first
        let listResult;
        try {
          listResult = await list({ path: p, options: { level: 'private' } });
        } catch (e) {
          // Fallback to positional form
          listResult = await list(p, { level: 'private' });
        }

        if (!listResult) continue;

        // Normalize returned list to an array of items.
        if (Array.isArray(listResult)) itemsArray = listResult;
        else if (listResult?.results && Array.isArray(listResult.results)) itemsArray = listResult.results;
        else if (listResult?.items && Array.isArray(listResult.items)) itemsArray = listResult.items;
        else if (listResult?.objects && Array.isArray(listResult.objects)) itemsArray = listResult.objects;
        else if (listResult?.Resources && Array.isArray(listResult.Resources)) itemsArray = listResult.Resources;

        if (itemsArray && itemsArray.length) {
          // Found items for this prefix
          console.debug('fetchUserPrivateFiles: found', itemsArray.length, 'items for prefix', p);
          break;
        }
      } catch (e) {
        // Ignore and try next candidate prefix
        console.debug('fetchUserPrivateFiles: list failed for prefix', p, e?.message || e);
        continue;
      }
    }

    if (!itemsArray.length) return [];

    // Take the last `limit` items (list may be alphabetical; adjust as available)
    const items = itemsArray.slice(-limit).reverse();

    // For each item, extract a usable key and get a signed URL via getUrl.
    const signed = await Promise.all(items.map(async (it, idx) => {
      try {
        // Items can be strings or objects with different key names depending on
        // the Amplify version/shape or how uploads were saved. Normalize common fields.
        const keyCandidate = (typeof it === 'string')
          ? it
          : (it?.key ?? it?.Key ?? it?.path ?? it?.name ?? it?.keyName ?? it?.KeyName ?? it?.Filename ?? it?.filename);

        if (!keyCandidate) {
          console.warn('fetchUserPrivateFiles: skipping item without key at index', idx, it);
          return null;
        }

        // Determine if the key already contains an Amplify storage level prefix
        // such as 'public/', 'private/<identityId>/' or 'protected/<identityId>/'.
        let level = 'private';
        let normalizedKey = keyCandidate;

        if (/^public\//.test(keyCandidate)) {
          level = 'public';
          normalizedKey = keyCandidate.replace(/^public\//, '');
        } else if (/^protected\//.test(keyCandidate)) {
          level = 'protected';
          // remove the 'protected/' prefix (may include username/id following it)
          normalizedKey = keyCandidate.replace(/^protected\//, '');
        } else if (/^private\//.test(keyCandidate)) {
          level = 'private';
          // private often includes the identity id next; strip only the leading 'private/' and identity id if present
          normalizedKey = keyCandidate.replace(/^private\/[A-Za-z0-9-_.]+\//, '');
          // fallback: if no identity id, just remove 'private/'
          if (normalizedKey === keyCandidate) normalizedKey = keyCandidate.replace(/^private\//, '');
        }

        // Call getUrl with the derived level and the normalized key to avoid Amplify
        // adding a second level prefix (which caused public/public/... NoSuchKey errors).
        let url;
        try {
          url = await getUrl({ key: normalizedKey, options: { level, expiresIn: 3600 } });
        } catch (e) {
          // Fallback positional signature
          try {
            url = await getUrl(normalizedKey, { level, expiresIn: 3600 });
          } catch (e2) {
            throw e2;
          }
        }

        return { key: keyCandidate, url: typeof url === 'string' ? url : url?.url || '' };
      } catch (e) {
        console.warn('Error getting signed URL for item at index', idx, e?.message || e);
        return null;
      }
    }));

    return signed.filter(Boolean);
  } catch (err) {
    console.warn('fetchUserPrivateFiles: Storage.list failed or not configured', err?.message || err);
    return [];
  }
}
