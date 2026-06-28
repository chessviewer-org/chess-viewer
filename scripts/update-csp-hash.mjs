/**
 * Previously computed SHA-256 hashes of inline <style> blocks and patched them
 * into public/_headers and nginx.conf. Now that style-src uses 'unsafe-inline'
 * (required for React's runtime style="" attributes, which hashes cannot cover),
 * this script is a no-op kept in the build pipeline as a placeholder.
 */
console.log('  CSP style-src: using unsafe-inline (no hash update needed)');
