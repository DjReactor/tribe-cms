import PocketBase from 'pocketbase';

async function run() {
  const pb = new PocketBase('http://127.0.0.1:8091');
  
  try {
    await pb.collection('_superusers').authWithPassword('admin@local.dev', 'TreeServices2026!');
    console.log('Logged in as superuser!');
  } catch (error) {
    console.error('Superuser login failed:', error.message);
  }

  try {
    await pb.collection('users').authWithPassword('admin@local.dev', 'TreeServices2026!');
    console.log('Logged in as user!');
  } catch (error) {
    console.error('User login failed:', error.message);
  }
}

run();
