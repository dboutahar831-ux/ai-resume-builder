-- Run this in the Supabase SQL Editor (or your PostgreSQL instance)
-- Complete schema for Nexly / AI Resume Builder

-- ═══════════════════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(255)  NOT NULL,
  email               VARCHAR(255)  NOT NULL UNIQUE,
  password_hash       TEXT          NOT NULL,
  age                 INTEGER,
  phone               VARCHAR(50),
  location            VARCHAR(255),
  linkedin            VARCHAR(255),
  avatar              TEXT,
  bio                 TEXT,
  cover_image         TEXT,
  skills              JSONB         NOT NULL DEFAULT '[]'::jsonb,
  availability_status VARCHAR(20)   NOT NULL DEFAULT 'all',
  verified            BOOLEAN       NOT NULL DEFAULT FALSE,
  show_online_status  BOOLEAN       NOT NULL DEFAULT TRUE,
  show_read_receipts  BOOLEAN       NOT NULL DEFAULT TRUE,
  last_seen_at        TIMESTAMPTZ,
  is_admin            BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- RESUMES
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS resumes (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_slug   VARCHAR(255)  UNIQUE,
  personal_info JSONB         NOT NULL,
  experience    JSONB         NOT NULL DEFAULT '[]',
  education     JSONB         NOT NULL DEFAULT '[]',
  skills        JSONB         NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- COVER LETTERS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cover_letters (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255)  NOT NULL DEFAULT 'Untitled Cover Letter',
  job_title   VARCHAR(255)  NOT NULL DEFAULT '',
  company     VARCHAR(255)  NOT NULL DEFAULT '',
  recipient   VARCHAR(255)  NOT NULL DEFAULT '',
  tone        VARCHAR(50)   NOT NULL DEFAULT 'professional',
  content     TEXT          NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- POSTS (social feed)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS posts (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content           TEXT,
  image_url         TEXT,
  video_url         TEXT,
  original_post_id  INTEGER       REFERENCES posts(id) ON DELETE SET NULL,
  repost_text       TEXT,
  scheduled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_reactions (
  id         SERIAL PRIMARY KEY,
  post_id    INTEGER       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(20)   NOT NULL,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ═══════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  post_id    INTEGER       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT,
  image_url  TEXT,
  parent_id  INTEGER       REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comment_reactions (
  id         SERIAL PRIMARY KEY,
  comment_id INTEGER       NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(20)   NOT NULL,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- ═══════════════════════════════════════════════════════
-- JOBS (job tracker)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS jobs (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company         VARCHAR(255)  NOT NULL,
  role            VARCHAR(255)  NOT NULL,
  status          VARCHAR(50)   NOT NULL DEFAULT 'pending',
  location        VARCHAR(255),
  url             TEXT,
  notes           TEXT,
  interview_date  DATE,
  applied_at      DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- FRIENDSHIPS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS friendships (
  id             SERIAL PRIMARY KEY,
  requester_id   INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id   INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status         VARCHAR(20)   NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- ═══════════════════════════════════════════════════════
-- MESSAGES
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  sender_id   INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT,
  image_url   TEXT,
  voice_url   TEXT,
  read        BOOLEAN       NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS typing_status (
  user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id  INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  typed_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, to_user_id)
);

-- ═══════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50)   NOT NULL,
  post_id     INTEGER,
  comment_id  INTEGER,
  read        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- STORIES
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stories (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url   TEXT          NOT NULL,
  media_type  VARCHAR(20)   NOT NULL DEFAULT 'image',
  caption     TEXT,
  music_url   TEXT,
  music_name  VARCHAR(255),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ   NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE TABLE IF NOT EXISTS story_views (
  id         SERIAL PRIMARY KEY,
  story_id   INTEGER       NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id  INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- ═══════════════════════════════════════════════════════
-- HIGHLIGHTS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS highlights (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255)  NOT NULL,
  cover_url   TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS highlight_items (
  id          SERIAL PRIMARY KEY,
  highlight_id INTEGER      NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  media_url   TEXT          NOT NULL,
  media_type  VARCHAR(20)   NOT NULL DEFAULT 'image',
  caption     TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- USER NOTES (short notes about other users, max 60 chars)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_notes (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    VARCHAR(60)   NOT NULL,
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ═══════════════════════════════════════════════════════
-- BLOCKS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS blocks (
  id          SERIAL PRIMARY KEY,
  blocker_id  INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

-- ═══════════════════════════════════════════════════════
-- GROUP CHATS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS group_chats (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  description TEXT,
  avatar      TEXT,
  created_by  INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id         SERIAL PRIMARY KEY,
  group_id   INTEGER       NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(20)   NOT NULL DEFAULT 'member',
  joined_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Add group_id to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES group_chats(id) ON DELETE CASCADE;

-- Add sticker, reply_to_id, deleted to messages (for stickers, reply, and soft-delete features)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sticker VARCHAR(10);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_messages_group    ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);

-- ═══════════════════════════════════════════════════════
-- VERIFICATION CODES (email verification)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS verification_codes (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255)  NOT NULL,
  code        VARCHAR(10)   NOT NULL,
  expires_at  TIMESTAMPTZ   NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- INDEXES for performance
-- ═══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_resumes_user_id     ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_public_slug ON resumes(public_slug);
CREATE INDEX IF NOT EXISTS idx_posts_user_id       ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at    ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at  ON posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_id    ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender     ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver   ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read  ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_stories_expires     ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_friendships_user1   ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user2   ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status  ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id        ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_saved          ON jobs(user_id, saved);

-- ═══════════════════════════════════════════════════════
-- SAVED JOBS (bookmarks)
-- ═══════════════════════════════════════════════════════
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS saved BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for hashtag search
CREATE INDEX IF NOT EXISTS idx_posts_content_gin   ON posts USING gin(to_tsvector('english', content));

-- ═══════════════════════════════════════════════════════
-- HASHTAGS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS hashtags (
  id         SERIAL PRIMARY KEY,
  tag        VARCHAR(100)  NOT NULL UNIQUE,
  post_count INTEGER       NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, hashtag_id)
);

CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_count ON hashtags(post_count DESC);

CREATE INDEX IF NOT EXISTS idx_cover_letters_user  ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_email  ON verification_codes(email);

-- ═══════════════════════════════════════════════════════
-- MESSAGE REACTIONS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS message_reactions (
  id         SERIAL PRIMARY KEY,
  message_id INTEGER       NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji      VARCHAR(50)   NOT NULL,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_msg_reactions_message ON message_reactions(message_id);

-- ═══════════════════════════════════════════════════════
-- PASSWORD RESET TOKENS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255)  NOT NULL,
  token      VARCHAR(255)  NOT NULL,
  used       BOOLEAN       NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ   NOT NULL,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
