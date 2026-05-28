const pool = require('../db/pool');
const serverCache = require('./serverCache');

async function createUser({ email, name, avatarUrl }) {
  const result = await pool.query(
    'INSERT INTO users (email, name, avatar_url) VALUES ($1, $2, $3) RETURNING *',
    [email, name, avatarUrl]
  );
  return result.rows[0];
}

async function findUserById(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function findUserByProvider(provider, providerId) {
  const result = await pool.query(
    `SELECT u.* FROM users u
     JOIN user_oauth_providers uop ON u.id = uop.user_id
     WHERE uop.provider = $1 AND uop.provider_id = $2`,
    [provider, providerId]
  );
  return result.rows[0] || null;
}

async function linkProvider(userId, provider, providerId) {
  await pool.query(
    `INSERT INTO user_oauth_providers (user_id, provider, provider_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (provider, provider_id) DO NOTHING`,
    [userId, provider, providerId]
  );
}

async function findUserByGoogleId(googleId) {
  const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
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
  const result = await pool.query(
    `SELECT s.*,
      (SELECT COUNT(*) FROM traffic t
         WHERE t.server_id = s.id
           AND t.timestamp > NOW() - INTERVAL '60 seconds') AS live_count,
      (SELECT COUNT(*) FROM traffic t
         WHERE t.server_id = s.id
           AND t.timestamp > NOW() - INTERVAL '5 minutes') AS recent_total,
      (SELECT COUNT(*) FROM traffic t
         WHERE t.server_id = s.id
           AND t.timestamp > NOW() - INTERVAL '5 minutes'
           AND (t.response->>'statusCode')::int >= 500) AS recent_errors
     FROM servers s
     WHERE s.server_id = $1`,
    [serverId]
  );
  return result.rows[0] || null;
}

async function getServerByPublicId(serverId) {
  const cached = serverCache.get(serverId);
  if (cached) return cached;

  const result = await pool.query(
    'SELECT id, server_id, name, recording_enabled, default_latency_ms, preserve_headers FROM servers WHERE server_id = $1',
    [serverId]
  );
  const server = result.rows[0] || null;
  if (server) serverCache.set(serverId, server);
  return server;
}

async function getStatsSummary(userId) {
  const accessibleServers = await pool.query(
    `SELECT s.id FROM servers s
      WHERE s.owner_id = $1
         OR s.id IN (SELECT server_id FROM server_collaborators WHERE user_id = $1)`,
    [userId]
  );
  const serverIds = accessibleServers.rows.map(r => r.id);
  if (serverIds.length === 0) {
    return { servers: 0, requests24h: 0, rules: 0, shared: 0 };
  }
  const aggResult = await pool.query(
    `SELECT
        COALESCE((SELECT COUNT(*) FROM traffic WHERE server_id = ANY($1::bigint[]) AND timestamp > NOW() - INTERVAL '24 hours'), 0) AS requests24h,
        COALESCE((SELECT COUNT(*) FROM rules WHERE server_id = ANY($1::bigint[]) AND enabled = true), 0) AS rules,
        COALESCE((SELECT COUNT(DISTINCT server_id) FROM server_collaborators WHERE server_id = ANY($1::bigint[])), 0) AS shared,
        COALESCE((SELECT COUNT(DISTINCT user_id) FROM server_collaborators WHERE server_id = ANY($1::bigint[])), 0) AS collaborators`,
    [serverIds]
  );
  const row = aggResult.rows[0];
  return {
    servers: serverIds.length,
    requests24h: parseInt(row.requests24h) || 0,
    rules: parseInt(row.rules) || 0,
    shared: parseInt(row.shared) || 0,
    collaborators: parseInt(row.collaborators) || 0
  };
}

async function updateServerBehaviour(serverId, { recordingEnabled, defaultLatencyMs, preserveHeaders }) {
  const server = await getServer(serverId);
  if (!server) return null;
  await pool.query(
    `UPDATE servers
        SET recording_enabled = COALESCE($1, recording_enabled),
            default_latency_ms = COALESCE($2, default_latency_ms),
            preserve_headers   = COALESCE($3, preserve_headers),
            updated_at = NOW()
      WHERE id = $4`,
    [
      recordingEnabled === undefined ? null : recordingEnabled,
      defaultLatencyMs === undefined ? null : defaultLatencyMs,
      preserveHeaders   === undefined ? null : preserveHeaders,
      server.id
    ]
  );
  return getServer(serverId);
}

async function getServerById(id) {
  const result = await pool.query('SELECT * FROM servers WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function getAllServers(userId) {
  const result = await pool.query(
    `SELECT s.*,
      (SELECT COUNT(*) FROM traffic t
         WHERE t.server_id = s.id
           AND t.timestamp > NOW() - INTERVAL '60 seconds') AS live_count,
      (SELECT COUNT(*) FROM traffic t
         WHERE t.server_id = s.id
           AND t.timestamp > NOW() - INTERVAL '5 minutes') AS recent_total,
      (SELECT COUNT(*) FROM traffic t
         WHERE t.server_id = s.id
           AND t.timestamp > NOW() - INTERVAL '5 minutes'
           AND (t.response->>'statusCode')::int >= 500) AS recent_errors,
      CASE WHEN s.owner_id = $1 THEN true ELSE false END as is_owner,
      COALESCE(
        (SELECT sc.role = 'admin' FROM server_collaborators sc WHERE sc.server_id = s.id AND sc.user_id = $1),
        false
      ) as is_admin,
      (SELECT COUNT(*) FROM server_collaborators WHERE server_id = s.id) as collaborators_count,
      (SELECT COUNT(*) FROM rules WHERE server_id = s.id) as rules_count,
      (SELECT COUNT(*) FROM traffic WHERE server_id = s.id) as traffic_count,
      (SELECT MAX(timestamp) FROM traffic WHERE server_id = s.id) as last_traffic_at,
      GREATEST(
        s.updated_at,
        COALESCE((SELECT MAX(updated_at) FROM rules WHERE server_id = s.id), s.updated_at)
      ) as config_updated_at
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

async function addCollaborator(serverId, userId, role = 'collaborator') {
  const server = await getServer(serverId);
  if (!server) throw new Error(`Server '${serverId}' not found`);

  await pool.query(
    'INSERT INTO server_collaborators (server_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (server_id, user_id) DO UPDATE SET role = $3',
    [server.id, userId, role]
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
    `SELECT u.id, u.email, u.name, u.avatar_url, 'owner' as role, s.created_at as joined_at
     FROM users u
     JOIN servers s ON u.id = s.owner_id
     WHERE s.id = $1
     UNION ALL
     SELECT u.id, u.email, u.name, u.avatar_url, sc.role, sc.created_at as joined_at
     FROM users u
     JOIN server_collaborators sc ON u.id = sc.user_id
     WHERE sc.server_id = $1
     ORDER BY joined_at`,
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

async function isAdmin(serverId, userId) {
  const server = await getServer(serverId);
  if (!server) return false;
  const result = await pool.query(
    "SELECT 1 FROM server_collaborators WHERE server_id = $1 AND user_id = $2 AND role = 'admin'",
    [server.id, userId]
  );
  return result.rowCount > 0;
}

async function canAdminServer(serverId, userId) {
  if (await isOwner(serverId, userId)) return true;
  return isAdmin(serverId, userId);
}

async function makeAdmin(serverId, userId) {
  const server = await getServer(serverId);
  if (!server) throw new Error(`Server '${serverId}' not found`);
  const result = await pool.query(
    "UPDATE server_collaborators SET role = 'admin' WHERE server_id = $1 AND user_id = $2",
    [server.id, userId]
  );
  if (result.rowCount === 0) throw new Error('Collaborator not found');
}

async function removeAdmin(serverId, userId) {
  const server = await getServer(serverId);
  if (!server) throw new Error(`Server '${serverId}' not found`);
  const result = await pool.query(
    "UPDATE server_collaborators SET role = 'collaborator' WHERE server_id = $1 AND user_id = $2",
    [server.id, userId]
  );
  if (result.rowCount === 0) throw new Error('Collaborator not found');
}

async function transferOwnership(serverId, newOwnerUserId) {
  const server = await getServer(serverId);
  if (!server) throw new Error(`Server '${serverId}' not found`);

  const newOwner = await findUserById(newOwnerUserId);
  if (!newOwner) throw new Error('User not found');

  const isCollab = await isCollaborator(serverId, newOwnerUserId);
  if (!isCollab) throw new Error('User must be a collaborator to receive ownership');

  await pool.query('BEGIN');
  try {
    await pool.query('UPDATE servers SET owner_id = $1 WHERE id = $2', [newOwnerUserId, server.id]);
    await pool.query(
      'DELETE FROM server_collaborators WHERE server_id = $1 AND user_id = $2',
      [server.id, newOwnerUserId]
    );
    await pool.query(
      "INSERT INTO server_collaborators (server_id, user_id, role) VALUES ($1, $2, 'admin') ON CONFLICT (server_id, user_id) DO UPDATE SET role = 'admin'",
      [server.id, server.owner_id]
    );
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
}

async function deleteUser(userId) {
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

const FREE_TIER_LIMITS = {
  servers: 5,
  rules: 100,
  requests_day: 1_000,
  requests_week: 100_000,
  requests_month: 1_000_000,
};

async function getUserQuota(userId) {
  // Get IDs of servers owned by this user
  const ownedResult = await pool.query(
    'SELECT id FROM servers WHERE owner_id = $1',
    [userId]
  );
  const ownedServerIds = ownedResult.rows.map(r => r.id);

  let rules = 0;
  let requests_day = 0;
  let requests_week = 0;
  let requests_month = 0;

  if (ownedServerIds.length > 0) {
    const agg = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM rules WHERE server_id = ANY($1::bigint[])) AS rules,
        (SELECT COUNT(*) FROM traffic WHERE server_id = ANY($1::bigint[]) AND timestamp > NOW() - INTERVAL '1 day') AS requests_day,
        (SELECT COUNT(*) FROM traffic WHERE server_id = ANY($1::bigint[]) AND timestamp > NOW() - INTERVAL '7 days') AS requests_week,
        (SELECT COUNT(*) FROM traffic WHERE server_id = ANY($1::bigint[]) AND timestamp > NOW() - INTERVAL '30 days') AS requests_month`,
      [ownedServerIds]
    );
    const row = agg.rows[0];
    rules = parseInt(row.rules) || 0;
    requests_day = parseInt(row.requests_day) || 0;
    requests_week = parseInt(row.requests_week) || 0;
    requests_month = parseInt(row.requests_month) || 0;
  }

  return {
    usage: {
      servers: ownedServerIds.length,
      rules,
      requests_day,
      requests_week,
      requests_month,
    },
    limits: FREE_TIER_LIMITS,
  };
}

module.exports = {
  createUser,
  findUserByGoogleId,
  findUserById,
  findUserByEmail,
  findUserByProvider,
  linkProvider,
  createServer,
  getServer,
  getServerByPublicId,
  getServerById,
  updateServerBehaviour,
  getStatsSummary,
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
  isOwner,
  isAdmin,
  canAdminServer,
  makeAdmin,
  removeAdmin,
  transferOwnership,
  deleteUser,
  getUserQuota,
};
