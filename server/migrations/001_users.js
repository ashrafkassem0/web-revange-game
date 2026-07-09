exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username', 30).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('created_at', 30).notNullable().defaultTo(knex.fn.now());
    table.string('updated_at', 30).notNullable().defaultTo(knex.fn.now());
    table.string('last_login_at', 30).nullable();
    table.integer('leaderboard_opt_out').notNullable().defaultTo(0);
    table.integer('failed_login_attempts').notNullable().defaultTo(0);
    table.string('locked_until', 30).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
