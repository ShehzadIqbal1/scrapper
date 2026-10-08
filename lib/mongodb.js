import dns from 'dns';
import mongoose from 'mongoose';

// Fix querySrv ECONNREFUSED caused by Node.js DNS resolver on certain Windows/ISP networks
try {
  dns.setDefaultResultOrder?.('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in environments where setServers is unsupported
}

// Cache the connection across hot reloads / serverless invocations
const cached = global._mongooseCache || (global._mongooseCache = { conn: null, promise: null });

// Helper to convert cluster0 SRV URIs to direct multi-host URIs to bypass SRV DNS queries
function resolveDirectUri(uri) {
  if (uri.startsWith('mongodb+srv://') && uri.includes('cluster0.tspx623.mongodb.net')) {
    const credMatch = uri.match(/mongodb\+srv:\/\/([^@]+)@/);
    const auth = credMatch ? credMatch[1] : 'shehzadiqbal25057_db_user:TGYYqCan2kQYk7SJ';
    // Extract database name from URI if present, e.g. .mongodb.net/dbname?
    const dbMatch = uri.match(/cluster0\.tspx623\.mongodb\.net\/([^?]+)/);
    const specifiedDb = dbMatch && dbMatch[1] && dbMatch[1].trim() ? dbMatch[1].trim() : '';
    // Default to 'test' (MongoDB default when omitted, where scraped data is saved)
    const dbName = process.env.MONGODB_DB || specifiedDb || 'test';
    return `mongodb://${auth}@ac-q5iyvfc-shard-00-00.tspx623.mongodb.net:27017,ac-q5iyvfc-shard-00-01.tspx623.mongodb.net:27017,ac-q5iyvfc-shard-00-02.tspx623.mongodb.net:27017/${dbName}?ssl=true&replicaSet=atlas-omfsh9-shard-0&authSource=admin&retryWrites=true&w=majority`;
  }
  return uri;
}

export async function connectDB() {
  let uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. Create .env.local (see .env.example).');
  
  // Transform SRV to direct connection to permanently resolve querySrv ECONNREFUSED
  uri = resolveDirectUri(uri);

  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    try {
      dns.setDefaultResultOrder?.('ipv4first');
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch {}

    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
