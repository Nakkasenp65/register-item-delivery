import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

if (!dbName) {
  throw new Error("Please define the MONGODB_DB environment variable inside .env.local");
}

declare global {
  // allow global cache across module reloads in dev
  var _mongoClientCache: { client: MongoClient | null } | undefined;
}

const cache = global._mongoClientCache ?? { client: null };

if (!cache.client) {
  cache.client = new MongoClient(uri);
  global._mongoClientCache = cache;
}

export async function getDb() {
  const client = cache.client!;
  // Ensure connected (calling connect is idempotent in the driver)
  await client.connect();
  return client.db(dbName);
}

export default getDb;
