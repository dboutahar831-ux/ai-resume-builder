const { ValidationError } = require('../utils/errors');

function validate(schema) {
  return (req, _res, next) => {
    const errors = [];
    for (const [field, rules] of Object.entries(schema)) {
      const val = req.body[field];
      if (rules.required && (val === undefined || val === null || (typeof val === 'string' && !val.trim()))) {
        errors.push(`${field} is required.`);
        continue;
      }
      if (val !== undefined && val !== null) {
        if (rules.type === 'string' && typeof val !== 'string') errors.push(`${field} must be a string.`);
        if (rules.type === 'number' && (isNaN(Number(val)))) errors.push(`${field} must be a number.`);
        if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) errors.push(`${field} must be a valid email.`);
        if (rules.minLength && typeof val === 'string' && val.trim().length < rules.minLength) errors.push(`${field} must be at least ${rules.minLength} characters.`);
        if (rules.maxLength && typeof val === 'string' && val.length > rules.maxLength) errors.push(`${field} must be at most ${rules.maxLength} characters.`);
        if (rules.enum && !rules.enum.includes(val)) errors.push(`${field} must be one of: ${rules.enum.join(', ')}.`);
      }
    }
    if (errors.length > 0) throw new ValidationError(errors.join(' '));
    next();
  };
}

function sanitize(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/[<>]/g, '').trim();
  }
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = sanitize(v);
    return out;
  }
  return obj;
}

function sanitizeBody(req, _res, next) {
  if (req.body) req.body = sanitize(req.body);
  next();
}

module.exports = { validate, sanitizeBody };
