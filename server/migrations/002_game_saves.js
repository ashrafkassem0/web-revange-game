exports.up = function (knex) {
  return knex.schema.createTable('game_saves', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('slot').notNullable().defaultTo(1);
    table.integer('hero_level').notNullable().defaultTo(1);
    table.integer('hero_xp').notNullable().defaultTo(0);
    table.string('current_map', 50).notNullable().defaultTo('forest');
    table.integer('total_kills').notNullable().defaultTo(0);
    table.float('total_distance').notNullable().defaultTo(0);
    table.integer('completed_game').notNullable().defaultTo(0);
    table.text('hero_stats').notNullable().defaultTo('{}');
    table.text('inventory').notNullable().defaultTo('{}');
    table.text('progress').notNullable().defaultTo('{}');
    table.text('world_state').nullable();
    table.text('meta').notNullable().defaultTo('{}');
    table.string('created_at', 30).notNullable().defaultTo(knex.fn.now());
    table.string('updated_at', 30).notNullable().defaultTo(knex.fn.now());
    table.unique(['user_id', 'slot']);
  }).then(() => {
    return knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_game_saves_user ON game_saves(user_id)');
  }).then(() => {
    return knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_game_saves_lb ON game_saves(hero_level DESC, total_kills DESC)');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('game_saves');
};
