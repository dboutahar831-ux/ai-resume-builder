const friendService = require('../services/friendService');

let _io = null;
function setIo(io) { _io = io; friendService.setIo(io); }

async function searchUsers(req, res, next) {
  try { res.json(await friendService.searchUsers(req.query.q, req.user.id)); }
  catch (err) { next(err); }
}

async function searchMentionFriends(req, res, next) {
  try { res.json(await friendService.searchMentionFriends(req.query.q, req.user.id)); }
  catch (err) { next(err); }
}

async function getSuggestions(req, res, next) {
  try { res.json(await friendService.getSuggestions(req.user.id)); }
  catch (err) { next(err); }
}

async function getFriends(req, res, next) {
  try { res.json(await friendService.getFriends(req.user.id)); }
  catch (err) { next(err); }
}

async function getUserFriends(req, res, next) {
  try { res.json(await friendService.getUserFriends(req.user.id, req.params.userId)); }
  catch (err) { next(err); }
}

async function getFriendRequests(req, res, next) {
  try { res.json(await friendService.getFriendRequests(req.user.id)); }
  catch (err) { next(err); }
}

async function getProfile(req, res, next) {
  try { res.json(await friendService.getProfile(req.params.userId, req.user.id)); }
  catch (err) { next(err); }
}

async function sendFriendRequest(req, res, next) {
  try { res.json(await friendService.sendFriendRequest(req.user.id, parseInt(req.params.userId), req.user)); }
  catch (err) { next(err); }
}

async function acceptFriendRequest(req, res, next) {
  try { res.json(await friendService.acceptFriendRequest(req.params.userId, req.user.id)); }
  catch (err) { next(err); }
}

async function rejectFriendRequest(req, res, next) {
  try { res.json(await friendService.rejectFriendRequest(req.params.userId, req.user.id)); }
  catch (err) { next(err); }
}

async function unfriend(req, res, next) {
  try { res.json(await friendService.unfriend(req.user.id, req.params.userId)); }
  catch (err) { next(err); }
}

async function blockUser(req, res, next) {
  try { res.json(await friendService.blockUser(req.user.id, parseInt(req.params.userId))); }
  catch (err) { next(err); }
}

async function unblockUser(req, res, next) {
  try { res.json(await friendService.unblockUser(req.user.id, req.params.userId)); }
  catch (err) { next(err); }
}

async function getBlockedUsers(req, res, next) {
  try { res.json(await friendService.getBlockedUsers(req.user.id)); }
  catch (err) { next(err); }
}

async function checkBlocked(req, res, next) {
  try { res.json(await friendService.checkBlocked(req.user.id, req.params.userId)); }
  catch (err) { next(err); }
}

module.exports = {
  setIo, searchUsers, searchMentionFriends, getSuggestions, getFriends, getUserFriends,
  getFriendRequests, getProfile, sendFriendRequest, acceptFriendRequest, rejectFriendRequest,
  unfriend, blockUser, unblockUser, getBlockedUsers, checkBlocked,
};
