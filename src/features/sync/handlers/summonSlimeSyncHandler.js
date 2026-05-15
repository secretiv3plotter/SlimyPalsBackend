const Slime = require('../../slimes/slimeModel');
const db = require('../../../infrastructure/db');
const { syncError } = require('../syncErrors');
const { createDomainEvent } = require('../realtimeEventFactory');

async function syncSummonSlime({ payload, user }) {
  const slime = payload.slime;
  const slimeId = payload.slimeId || slime?.id;

  if (!slimeId || !slime?.rarity || !slime?.type || !slime?.color) {
    throw syncError('SUMMON_SLIME_PAYLOAD_INCOMPLETE');
  }

  const existingSlime = await Slime.findById(slimeId);
  if (existingSlime) {
    if (existingSlime.user_id !== user.id) {
      throw syncError('SLIME_OWNER_MISMATCH');
    }

    return [];
  }

  let createdSlime = null;
  let updatedUser = null;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
      [user.id]
    );
    const serverUser = userResult.rows[0];
    if (!serverUser || serverUser.daily_summons_left <= 0) {
      throw syncError('DAILY_SUMMON_LIMIT_REACHED');
    }

    const activeCountResult = await client.query(
      'SELECT COUNT(*) FROM slimes WHERE user_id = $1 AND deleted_at IS NULL',
      [user.id]
    );
    const activeCount = parseInt(activeCountResult.rows[0].count);
    if (activeCount >= serverUser.max_slime_capacity) {
      throw syncError('DOMAIN_CAPACITY_REACHED');
    }

    const updatedUserResult = await client.query(
      `UPDATE users
       SET daily_summons_left = GREATEST(daily_summons_left - 1, 0)
       WHERE id = $1
       RETURNING id, username, daily_summons_left, max_slime_capacity, created_at`,
      [user.id]
    );
    updatedUser = updatedUserResult.rows[0];
    const slimeResult = await client.query(
      `INSERT INTO slimes (id, user_id, rarity, type, color, level, last_fed_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, NOW()))
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
      [
        slimeId,
        user.id,
        slime.rarity,
        slime.type,
        slime.color,
        slime.level || 1,
        slime.last_fed_at || slime.lastFedAt || null,
        slime.created_at || slime.createdAt || payload.createdAt || null,
      ]
    );
    if (slimeResult.rows[0]) {
      createdSlime = slimeResult.rows[0];
    } else {
      const existingSlimeResult = await client.query(
        'SELECT * FROM slimes WHERE id = $1 AND deleted_at IS NULL',
        [slimeId]
      );
      createdSlime = existingSlimeResult.rows[0];
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return [
    createDomainEvent(user.id, 'domain.slime.created', {
      slime: createdSlime,
      user: updatedUser,
    }),
  ];
}

module.exports = {
  syncSummonSlime,
};
