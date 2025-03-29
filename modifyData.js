const fs = require('fs');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db('english_game');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the script on failure
  }
}

// Function to upload data from a JSON file
async function uploadData() {
  const db = await connectToDatabase();
  const collection = db.collection('sentences');

  // Fetching the JSON file (adjust the path as needed)
  const filePath = path.join(__dirname, 'frontend/my-app/public/data', 'sentences.json'); // Change this if you place the file somewhere else
  const rawData = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(rawData);

  try {
    // Insert the data into the MongoDB collection
    const result = await collection.insertMany(data);
    console.log(`${result.insertedCount} documents inserted.`);
  } catch (error) {
    console.error('Error uploading data:', error);
  } finally {
    client.close();
  }
}

// Function to delete all data from the 'sentences' collection
async function deleteData() {
  const db = await connectToDatabase();
  const collection = db.collection('sentences');

  try {
    const result = await collection.deleteMany({});
    console.log(`${result.deletedCount} documents deleted.`);
  } catch (error) {
    console.error('Error deleting data:', error);
  } finally {
    client.close();
  }
}

// Main logic for handling command line arguments
const args = process.argv.slice(2); // Capture the command-line arguments
const action = args[0];

if (action === '--upload') {
  uploadData();
} else if (action === '--delete') {
  deleteData();
} else {
  console.log('Invalid argument. Use --upload to upload data or --delete to delete all data.');
}
