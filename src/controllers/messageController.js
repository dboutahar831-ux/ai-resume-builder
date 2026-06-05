const messageService = require('../services/messageService');

async function getConversations(req, res, next) {
  try { res.json(await messageService.getConversations(req.user.id)); } catch (err) { next(err); }
}

async function getUnreadCount(req, res, next) {
  try { res.json(await messageService.getUnreadCount(req.user.id)); } catch (err) { next(err); }
}

async function getMessageImage(req, res, next) {
  try {
    const msg = await messageService.getMessageImage(req.params.msgId, req.user.id);
    if (!msg.image_url) return res.status(404).end();
    if (msg.image_url.startsWith('data:')) {
      const [header, data] = msg.image_url.split(',');
      const mime = (header.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'private, max-age=86400');
      return res.send(Buffer.from(data, 'base64'));
    }
    res.redirect(msg.image_url);
  } catch (err) { next(err); }
}

async function getMessageVoice(req, res, next) {
  try {
    const msg = await messageService.getMessageVoice(req.params.msgId, req.user.id);
    if (!msg.voice_url) return res.status(404).end();
    if (msg.voice_url.startsWith('data:')) {
      const [header, data] = msg.voice_url.split(',');
      const mime = (header.match(/data:([^;]+)/) || [])[1] || 'audio/webm';
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'private, max-age=86400');
      return res.send(Buffer.from(data, 'base64'));
    }
    res.redirect(msg.voice_url);
  } catch (err) { next(err); }
}

async function getTypingStatus(req, res, next) {
  try { res.json(await messageService.getTypingStatus(req.params.userId, req.user.id)); } catch (err) { next(err); }
}

async function setTypingStatus(req, res, next) {
  try { res.json(await messageService.setTypingStatus(req.user.id, req.params.userId)); } catch (err) { next(err); }
}

async function getMessages(req, res, next) {
  try {
    const rows = await messageService.getMessages(req.user.id, req.params.userId, Number(req.query.offset) || 0);
    res.json(rows);

    // Background read receipt update
    setImmediate(async () => {
      try {
        const me = await require('../db').query(
          'SELECT COALESCE(show_read_receipts, TRUE) AS show_read_receipts FROM users WHERE id=$1', [req.user.id]
        );
        if (me.rows[0]?.show_read_receipts !== false) {
          await require('../db').query(
            'UPDATE messages SET read=TRUE, read_at=COALESCE(read_at, NOW()) WHERE sender_id=$2 AND receiver_id=$1 AND read=FALSE',
            [req.user.id, req.params.userId]
          );
        } else {
          await require('../db').query(
            'UPDATE messages SET read=TRUE WHERE sender_id=$2 AND receiver_id=$1 AND read=FALSE',
            [req.user.id, req.params.userId]
          );
        }
      } catch {}
    });
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try { res.json(await messageService.sendMessage(req.user.id, req.params.userId, req.body)); } catch (err) { next(err); }
}

async function deleteConversation(req, res, next) {
  try { res.json(await messageService.deleteConversation(req.user.id, req.params.userId)); } catch (err) { next(err); }
}

async function deleteMessage(req, res, next) {
  try { res.json(await messageService.deleteMessage(req.user.id, req.params.msgId)); } catch (err) { next(err); }
}

async function editMessage(req, res, next) {
  try { res.json(await messageService.editMessage(req.user.id, req.params.msgId, req.body.content)); } catch (err) { next(err); }
}

async function hideMessage(req, res, next) {
  try { res.json(await messageService.hideMessage(req.user.id, req.params.msgId)); } catch (err) { next(err); }
}

async function hideReceivedMessage(req, res, next) {
  try { res.json(await messageService.hideReceivedMessage(req.user.id, req.params.msgId)); } catch (err) { next(err); }
}

async function reactToMessage(req, res, next) {
  try { res.json(await messageService.reactToMessage(req.user.id, req.params.msgId, req.body.emoji)); } catch (err) { next(err); }
}

async function getMessageReactions(req, res, next) {
  try { res.json(await messageService.getMessageReactions(req.params.msgId)); } catch (err) { next(err); }
}

module.exports = {
  getConversations, getUnreadCount, getMessageImage, getMessageVoice,
  getTypingStatus, setTypingStatus, getMessages, sendMessage, deleteConversation,
  deleteMessage, editMessage, hideMessage, hideReceivedMessage, reactToMessage, getMessageReactions,
};
