import PocketBase from 'pocketbase';

async function run() {
  const pb = new PocketBase('http://127.0.0.1:8091');
  
  try {
    await pb.collection('_superusers').authWithPassword('admin@local.dev', 'TreeServices2026!');
    const col = await pb.collections.getOne('settings');
    console.log('Update rule:', col.updateRule);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
