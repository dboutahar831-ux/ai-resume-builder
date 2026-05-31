const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const PRIVATE_IP = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|::1|fc00:|fd)/i;

// POST /api/link-preview — fetch Open Graph metadata from a URL
router.post('/', auth, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required.' });
  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL.' }); }
  if (!['http:', 'https:'].includes(parsed.protocol))
    return res.status(400).json({ error: 'Only http/https URLs are allowed.' });
  if (PRIVATE_IP.test(parsed.hostname))
    return res.status(400).json({ error: 'Private/internal URLs are not allowed.' });
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NexlyBot/1.0)' } });
    clearTimeout(timeout);
    const html = await response.text();

    const getMeta = (name) => {
      const patterns = [
        new RegExp(`<meta\\s+[^>]*property=["']og:${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
        new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
        new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:${name}["']`, 'i'),
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m) return m[1];
      }
      return null;
    };

    const title = getMeta('title') || html.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
    const description = getMeta('description') || '';
    const image = getMeta('image') || '';
    const favicon = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i)?.[1] || '';

    // Resolve relative URLs
    const base = new URL(url);
    const resolve = (u) => u ? (u.startsWith('http') ? u : new URL(u, base).href) : null;

    res.json({
      title: title.slice(0, 200),
      description: description.slice(0, 400),
      image: resolve(image),
      favicon: resolve(favicon),
      url,
    });
  } catch {
    res.status(422).json({ error: 'Could not fetch preview.' });
  }
});

module.exports = router;
