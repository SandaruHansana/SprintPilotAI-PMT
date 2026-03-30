'use strict';

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || 3306),
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'sprintpilotai',
	waitForConnections: true,
	connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
	queueLimit: 0,
	timezone: 'Z'
});

async function initDatabase() {
	let conn;
	try {
		conn = await pool.getConnection();
		await conn.ping();
		console.log('MySQL database connected');
	} catch (err) {
		console.error('MySQL connection error:', err.message);
		throw err;
	} finally {
		if (conn) conn.release();
	}
}

async function query(sql, params = []) {
	const [rows] = await pool.execute(sql, params);
	return rows;
}

async function closePool() {
	try {
		await pool.end();
		console.log('MySQL pool closed');
	} catch (err) {
		console.error('Error closing MySQL pool:', err.message);
	}
}

module.exports = { pool, initDatabase, query, closePool };