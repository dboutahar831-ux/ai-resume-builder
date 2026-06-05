const pool = require('../db');

async function findById(table, id, columns = '*') {
  const result = await pool.query(`SELECT ${columns} FROM ${table} WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function findAll(table, conditions = {}, columns = '*', orderBy = '') {
  const keys = Object.keys(conditions);
  if (keys.length === 0) {
    const result = await pool.query(`SELECT ${columns} FROM ${table} ${orderBy}`);
    return result.rows;
  }
  const where = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
  const values = keys.map(k => conditions[k]);
  const result = await pool.query(`SELECT ${columns} FROM ${table} WHERE ${where} ${orderBy}`, values);
  return result.rows;
}

async function findOne(table, conditions, columns = '*') {
  const rows = await findAll(table, conditions, columns, 'LIMIT 1');
  return rows[0] || null;
}

async function insertOne(table, data, returning = '*') {
  const keys = Object.keys(data);
  const values = keys.map(k => data[k]);
  const placeholders = keys.map((_, i) => `$${i + 1}`);
  const result = await pool.query(
    `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${returning}`,
    values
  );
  return result.rows[0];
}

async function updateOne(table, id, data, returning = '*') {
  const keys = Object.keys(data);
  const sets = keys.map((k, i) => `${k} = $${i + 1}`);
  const values = [...keys.map(k => data[k]), id];
  const result = await pool.query(
    `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${keys.length + 1} RETURNING ${returning}`,
    values
  );
  return result.rows[0] || null;
}

async function deleteOne(table, id) {
  const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0] || null;
}

module.exports = { findById, findAll, findOne, insertOne, updateOne, deleteOne };
