const postService = require('../services/postService');

const getFeed = async (req, res, next) => {
  try {
    const posts = await postService.getFeed(req.user.id, Number(req.query.offset) || 0);
    res.json(posts);
  } catch (err) { next(err); }
};

const getExplore = async (req, res, next) => {
  try {
    const posts = await postService.getExplore(req.user.id, Number(req.query.offset) || 0);
    res.json(posts);
  } catch (err) { next(err); }
};

const getScheduledPosts = async (req, res, next) => {
  try {
    const posts = await postService.getScheduledPosts(req.user.id);
    res.json(posts);
  } catch (err) { next(err); }
};

const getTrendingHashtags = async (req, res, next) => {
  try {
    const tags = await postService.getTrendingHashtags();
    res.json(tags);
  } catch (err) { next(err); }
};

const getUserPosts = async (req, res, next) => {
  try {
    const posts = await postService.getUserPosts(req.user.id, req.params.userId);
    res.json(posts);
  } catch (err) { next(err); }
};

const incrementViewCount = async (req, res, next) => {
  try {
    await postService.incrementViewCount(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

const createPost = async (req, res, next) => {
  try {
    const post = await postService.createPost(req.user.id, req.body);
    res.json(post);
  } catch (err) { next(err); }
};

const repostPost = async (req, res, next) => {
  try {
    const post = await postService.repostPost(req.user.id, req.params.postId, req.body.repost_text);
    res.json(post);
  } catch (err) { next(err); }
};

const editPost = async (req, res, next) => {
  try {
    const post = await postService.editPost(req.user.id, req.params.id, req.body.content);
    res.json(post);
  } catch (err) { next(err); }
};

const deletePost = async (req, res, next) => {
  try {
    await postService.deletePost(req.user.id, req.params.id);
    res.json({ message: 'Deleted.' });
  } catch (err) { next(err); }
};

const reactToPost = async (req, res, next) => {
  try {
    const result = await postService.reactToPost(req.user.id, req.params.postId, req.body.type);
    res.json(result);
  } catch (err) { next(err); }
};

const getComments = async (req, res, next) => {
  try {
    const comments = await postService.getComments(req.params.postId, req.user.id);
    res.json(comments);
  } catch (err) { next(err); }
};

const createComment = async (req, res, next) => {
  try {
    const comment = await postService.createComment(req.params.postId, req.user.id, req.body);
    res.json(comment);
  } catch (err) { next(err); }
};

const deleteComment = async (req, res, next) => {
  try {
    await postService.deleteComment(req.params.commentId, req.user.id);
    res.json({ message: 'Deleted.' });
  } catch (err) { next(err); }
};

const reactToComment = async (req, res, next) => {
  try {
    const result = await postService.reactToComment(req.params.commentId, req.user.id, req.body.type);
    res.json(result);
  } catch (err) { next(err); }
};

const getBookmarks = async (req, res, next) => {
  try {
    const posts = await postService.getBookmarks(req.user.id);
    res.json(posts);
  } catch (err) { next(err); }
};

const getPost = async (req, res, next) => {
  try {
    const post = await postService.getPost(req.params.id, req.user.id);
    res.json(post);
  } catch (err) { next(err); }
};

const bookmarkPost = async (req, res, next) => {
  try {
    await postService.bookmarkPost(req.params.id, req.user.id);
    res.json({ bookmarked: true });
  } catch (err) { next(err); }
};

const unbookmarkPost = async (req, res, next) => {
  try {
    await postService.unbookmarkPost(req.params.id, req.user.id);
    res.json({ bookmarked: false });
  } catch (err) { next(err); }
};

module.exports = {
  getFeed, getExplore, getScheduledPosts, getTrendingHashtags,
  getUserPosts, incrementViewCount, createPost, repostPost,
  editPost, deletePost, reactToPost, getComments, createComment,
  deleteComment, reactToComment, getBookmarks, getPost,
  bookmarkPost, unbookmarkPost,
};
