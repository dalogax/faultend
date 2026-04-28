const pool = require('../db/pool');

async function createUser({ googleId, email, name, avatarUrl }) {
  const result = await pool.query(
    'INSERT INTO users (google_id, email, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
    [googleId, email, name, avatarUrl]
  );
  return result.rows[0];
}

async function findUserByGoogleId(googleId) {
  const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createServer({ serverId, name, description, ownerId }) {
  const result = await pool.query(
    'INSERT INTO servers (server_id, name, description, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [serverId, name, description, ownerId]
  );
  return result.rows[0];
}

async function getServer(serverId) {
  const result = await pool.query('SELECT * FROM servers WHERE server_id = $1', [serverId]);
  return result.rows[0] || null;
}

async function getServerById(id) {
  const result = await pool.query('SELECT * FROM servers WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function getAllServers(userId) {
  const result = await pool.query(
    `SELECT s.*, 
      CASE WHEN s.owner_id = $1 THEN true ELSE false END as is_owner,
      (SELECT COUNT(*) FROM server_collaborators WHERE server_id = s.id) as collaborators_count,
      (SELECT COUNT(*) FROM rules WHERE server_id = s.id) as rules_count,
      (SELECT COUNT(*) FROM traffic WHERE server_id = s.id) as traffic_count
     FROM servers s
     WHERE s.owner_id = $1
        OR s.id IN (SELECT server_id FROM server_collaborators WHERE user_id = $1)
     ORDER BY s.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function deleteServer(serverId) {
  await pool.query('DELETE FROM servers WHERE server_id = $1', [serverId]);
}

async function serverExists(serverId) {
  const result = await pool.query('SELECT 1 FROM servers WHERE server_id = $1', [serverId]);
  return result.rowCount > 0;
}

async function addCollaborator(serverId, userId) {
  const server = await getServer(serverId);
  if (!server) throw new Error(`Server '${serverId}' not found`);
  
  await pool.query(
    'INSERT INTO server_collaborators (server_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [server.id, userId]
  );
}

async function removeCollaborator(serverId, userId) {
  const server = await getServer(serverId);
  if (!server) throw new Error(`Server '${serverId}' not found`);
  
  await pool.query(
    'DELETE FROM server_collaborators WHERE server_id = $1 AND user_id = $2',
    [server.id, userId]
  );
}

async function getCollaborators(serverId) {
  const server = await getServer(serverId);
  if (!server) return [];
  
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, u.avatar_url, sc.created_at as joined_at
     FROM users u
     JOIN server_collaborators sc ON u.id = sc.user_id
     WHERE sc.server_id = $1`,
    [server.id]
  );
  return result.rows;
}

async function isCollaborator(serverId, userId) {
  const server = await getServer(serverId);
  if (!server) return false;
  
  const result = await pool.query(
    'SELECT 1 FROM server_collaborators WHERE server_id = $1 AND user_id = $2',
    [server.id, userId]
  );
  return result.rowCount > 0;
}

async function setInviteToken(serverId, token) {
  const server = await getServer(serverId);
  if (!server) throw new Error(`Server '${serverId}' not found`);
  
  await pool.query(
    'UPDATE servers SET invite_token = $1 WHERE id = $2',
    [token, server.id]
  );
}

async function getInviteToken(serverId) {
  const server = await getServer(serverId);
  if (!server) return null;
  
  const result = await pool.query(
    'SELECT invite_token FROM servers WHERE id = $1',
    [server.id]
  );
  return result.rows[0]?.invite_token || null;
}

async function clearInviteToken(serverId) {
  const server = await getServer(serverId);
  if (!server) throw new Error(`Server '${serverId}' not found`);
  
  await pool.query(
    'UPDATE servers SET invite_token = NULL WHERE id = $1',
    [server.id]
  );
}

async function findServerByInviteToken(token) {
  const result = await pool.query(
    `SELECT s.*, u.name as owner_name, u.email as owner_email
     FROM servers s
     JOIN users u ON s.owner_id = u.id
     WHERE s.invite_token = $1`,
    [token]
  );
  return result.rows[0] || null;
}

async function canAccessServer(serverId, userId) {
  const server = await getServer(serverId);
  if (!server) return false;
  if (server.owner_id === userId) return true;
  return isCollaborator(serverId, userId);
}

async function isOwner(serverId, userId) {
  const server = await getServer(serverId);
  if (!server) return false;
  return server.owner_id === userId;
}

module.exports = {
  createUser,
  findUserByGoogleId,
  findUserById,
  createServer,
  getServer,
  getServerById,
  getAllServers,
  deleteServer,
  serverExists,
  addCollaborator,
  removeCollaborator,
  getCollaborators,
  isCollaborator,
  setInviteToken,
  getInviteToken,
  clearInviteToken,
  findServerByInviteToken,
  canAccessServer,
  isOwner
};
