const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (err) { next(err); }
}

async function getProfile(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json(profile);
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const result = await authService.updateProfile(req.user.id, req.body);
    res.json(result);
  } catch (err) { next(err); }
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    const result = await authService.changePassword(req.user.id, current_password, new_password);
    res.json(result);
  } catch (err) { next(err); }
}

async function searchUsers(req, res, next) {
  try {
    const users = await authService.searchUsers(req.query.q, req.user.id);
    res.json(users);
  } catch (err) { next(err); }
}

async function heartbeat(req, res, next) {
  try {
    const result = await authService.heartbeat(req.user.id);
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    const result = await authService.deleteAccount(req.user.id, password);
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { register, login, getProfile, updateProfile, changePassword, searchUsers, heartbeat, deleteAccount };
