import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: 'postgresql://postgres.izsujqglgxjihbwcasqq:ChildOfGod23%21%21@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  const r = await pool.query("SELECT \"passwordHash\" FROM \"AdminUser\" WHERE email = 'admin@afrispine.com'");
  const valid = await bcrypt.compare('Admin@2024', r.rows[0].passwordHash);
  console.log('Password Admin@2024 valid:', valid);
  console.log('Hash:', r.rows[0].passwordHash.substring(0, 25) + '...');
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });