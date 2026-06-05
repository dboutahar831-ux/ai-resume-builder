const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const friendController = require('../controllers/friendController');

let _io = null;
router.setIo = (io) => { _io = io; friendController.setIo(io); };

router.get('/search', auth, friendController.searchUsers);
router.get('/mention', auth, friendController.searchMentionFriends);
router.get('/suggestions', auth, friendController.getSuggestions);
router.get('/', auth, friendController.getFriends);
router.get('/requests', auth, friendController.getFriendRequests);
router.get('/blocked', auth, friendController.getBlockedUsers);
router.get('/user/:userId', auth, friendController.getUserFriends);
router.get('/profile/:userId', auth, friendController.getProfile);
router.get('/is-blocked/:userId', auth, friendController.checkBlocked);
router.post('/request/:userId', auth, friendController.sendFriendRequest);
router.put('/accept/:userId', auth, friendController.acceptFriendRequest);
router.put('/reject/:userId', auth, friendController.rejectFriendRequest);
router.delete('/:userId', auth, friendController.unfriend);
router.post('/block/:userId', auth, friendController.blockUser);
router.post('/unblock/:userId', auth, friendController.unblockUser);

module.exports = router;
