import { MongoMemoryServer } from 'mongodb-memory-server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
import ffprobe from '@ffprobe-installer/ffprobe';
import { symlink } from 'node:fs/promises';
const root = path.resolve('.e2e');
await mkdir(path.join(root, 'bin'), { recursive: true });
for (const [name, binary] of [['ffmpeg', ffmpeg], ['ffprobe', ffprobe.path]]) {
  try { await symlink(binary, path.join(root, 'bin', name)); } catch (error) { if (error.code !== 'EEXIST') throw error; }
}
const mongo = await MongoMemoryServer.create({ binary: { downloadDir: path.join(root, 'mongodb') }, instance: { dbName: 'beatnow_e2e' } });
await writeFile(path.join(root, 'mongo.json'), JSON.stringify({ uri: mongo.getUri(), db: 'beatnow_e2e' }));
console.log('Isolated MongoDB and FFmpeg ready. Connection details stored in .e2e/mongo.json.');
async function stop() { await mongo.stop(); process.exit(0); }
process.on('SIGTERM', stop); process.on('SIGINT', stop);
