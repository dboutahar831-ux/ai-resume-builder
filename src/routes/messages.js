const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const messageController = require('../controllers/messageController');

router.get('/conversations', auth, messageController.getConversations);
router.get('/unread/count', auth, messageController.getUnreadCount);
router.get('/img/:msgId', auth, messageController.getMessageImage);
router.get('/voice/:msgId', auth, messageController.getMessageVoice);
router.get('/typing/:userId', auth, messageController.getTypingStatus);
router.post('/typing/:userId', auth, messageController.setTypingStatus);
router.get('/:userId', auth, messageController.getMessages);
router.post('/:userId', auth, messageController.sendMessage);
router.delete('/conversation/:userId', auth, messageController.deleteConversation);
router.delete('/:msgId', auth, messageController.deleteMessage);
router.put('/:msgId', auth, messageController.editMessage);
router.post('/:msgId/hide', auth, messageController.hideMessage);
router.post('/:msgId/hide-received', auth, messageController.hideReceivedMessage);
router.post('/:msgId/react', auth, messageController.reactToMessage);
router.get('/:msgId/reactions', auth, messageController.getMessageReactions);

module.exports = router;
