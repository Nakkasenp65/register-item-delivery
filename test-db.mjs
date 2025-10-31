import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

console.log("🔍 Checking environment variables...");

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI environment variable is not set");
  console.log("");
  console.log("📝 Please set MONGODB_URI in your .env.local file:");
  console.log("   MONGODB_URI=mongodb://username:password@host:port/database");
  console.log("");
  console.log("💡 Example:");
  console.log("   MONGODB_URI=mongodb://localhost:27017/myapp");
  console.log("   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/myapp");
  console.log("");
  console.log("🚀 Then run this script again:");
  console.log("   node test-db.mjs");
  process.exit(1);
}

console.log("✅ MONGODB_URI found");
console.log("🔗 Connection string:", MONGODB_URI.replace(/:([^:@]{4})[^:@]*@/, ":$1****@")); // Hide password

async function testDatabaseConnection() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔄 Connecting to MongoDB...");

    // Connect to MongoDB
    await client.connect();

    console.log("✅ Successfully connected to MongoDB!");

    // Test database operations
    const db = client.db("Delivery");
    const dbName = db.databaseName;

    console.log(`📊 Connected to database: ${dbName}`);

    // Try to list collections
    const collections = await db.collections();
    console.log(`📁 Found ${collections.length} collections in database`);

    // List collection names
    if (collections.length > 0) {
      console.log("📋 Collections:");
      collections.forEach((collection, index) => {
        console.log(`   ${index + 1}. ${collection.collectionName}`);
      });
    }

    // Test a simple query on deliveries collection if it exists
    const deliveriesCollection = db.collection("deliveries");
    const count = await deliveriesCollection.countDocuments();
    console.log(`📦 Documents in 'deliveries' collection: ${count}`);

    console.log("🎉 Database connection test completed successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error.message);

    if (error.message.includes("authentication failed")) {
      console.log("💡 Tip: Check your MongoDB username and password");
    } else if (error.message.includes("getaddrinfo ENOTFOUND")) {
      console.log("💡 Tip: Check your MongoDB connection string/hostname");
    } else if (error.message.includes("connection timed out")) {
      console.log("💡 Tip: Check your network connection and MongoDB server status");
    }
  } finally {
    // Close the connection
    await client.close();
    console.log("🔌 Connection closed");
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
