const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  error: (msg, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.error) console.error(`[${timestamp()}] [ERROR]`, msg, ...args);
  },
  warn: (msg, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.warn) console.warn(`[${timestamp()}] [WARN]`, msg, ...args);
  },
  info: (msg, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.info) console.log(`[${timestamp()}] [INFO]`, msg, ...args);
  },
  debug: (msg, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.debug) console.log(`[${timestamp()}] [DEBUG]`, msg, ...args);
  },
};

module.exports = logger;
