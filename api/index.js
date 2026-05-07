module.exports = (req, res) => {
  res.json({ ok: true, method: req.method, url: req.url, path: req.path });
};
