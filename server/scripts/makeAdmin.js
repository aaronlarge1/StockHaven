// Run after registering your account: node scripts/makeAdmin.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../db');

const EMAIL = 'aaronjalarge@gmail.com';

async function makeAdmin() {
  try {
    const result = await db.query(
      "UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, name, email, role",
      [EMAIL]
    );
    if (result.rows.length === 0) {
      console.log(`❌ No user found with email: ${EMAIL}`);
      console.log('   Register an account on the site first, then re-run this script.');
    } else {
      console.log(`✅ ${result.rows[0].name} (${EMAIL}) is now an admin.`);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

makeAdmin();
