const { loadFullStateFromDatabase, saveFullStateToDatabase } = require('./server/db/databaseStore');
const { Pool } = require('pg');

async function runEndToEndVerification() {
  console.log('=== 1. STARTUP INITIALIZATION ===');
  const state = await loadFullStateFromDatabase();
  const initialTxCount = state.transactionStore?.masterTransactions?.length ?? 0;
  console.log(`[Verification] Initial master transactions count loaded: ${initialTxCount}`);

  console.log('\n=== 2. DATA MUTATION & PERSISTENCE WRITE ===');
  const testTxId = 'e2e_verify_tx_' + Date.now();
  const testTransaction = {
    id: testTxId,
    merchantName: 'E2E Runtime Test Merchant',
    amount: 149.99,
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
  };

  state.transactionStore.masterTransactions.push(testTransaction);
  await saveFullStateToDatabase(state);
  console.log(`[Verification] Created test transaction ID: ${testTxId}`);

  console.log('\n=== 3. DIRECT NEON POSTGRESQL QUERY ===');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const res = await pool.query('SELECT data FROM app_state WHERE key = $1', ['full_state']);
  
  if (res.rows && res.rows.length > 0) {
    const pgData = res.rows[0].data;
    const foundInPg = pgData.transactionStore.masterTransactions.some(t => t.id === testTxId);
    console.log(`[Verification] Direct query to Neon 'app_state' table successful.`);
    console.log(`[Verification] Test transaction present directly inside Neon PostgreSQL JSONB: ${foundInPg}`);
  } else {
    console.error('[Verification] Failed: No data found in Neon app_state table!');
  }

  console.log('\n=== 4. SIMULATED RESTART & HYDRATION FROM NEON ===');
  const reloadedState = await loadFullStateFromDatabase();
  const foundAfterReload = reloadedState.transactionStore.masterTransactions.some(t => t.id === testTxId);
  console.log(`[Verification] State reloaded from database.`);
  console.log(`[Verification] Test transaction verified restored from Neon PostgreSQL: ${foundAfterReload}`);

  console.log('\n=== 5. CLEANUP ===');
  reloadedState.transactionStore.masterTransactions = reloadedState.transactionStore.masterTransactions.filter(t => t.id !== testTxId);
  await saveFullStateToDatabase(reloadedState);
  console.log(`[Verification] Test transaction cleaned up and state persisted.`);

  await pool.end();
  console.log('\n=== END-TO-END RUNTIME VERIFICATION COMPLETE ===');
}

runEndToEndVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
