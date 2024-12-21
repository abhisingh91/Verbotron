// backend/server.js
const express = require('express');
const connectToDatabase = require('./db');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

// Ensure the index is created when the app starts
async function createIndex() {
  const db = await connectToDatabase();
  const collection = db.collection('sentences');
  await collection.createIndex({ difficulty: 1 });
  console.log('Index created on the "difficulty" field');
}

createIndex();

// Fetch sentences from the database based on difficulty
app.get('/api/sentences/:difficulty', async (req, res) => {
  const { difficulty } = req.params;
  const db = await connectToDatabase();
  const collection = db.collection('sentences');
  
  try {
    // Fetch sentences of the specific difficulty
    const sentences = await collection
      .find({ difficulty })
      .toArray();
      
    res.status(200).json(sentences);
  } catch (error) {
    console.error("Error fetching sentences:", error);
    res.status(500).json({ error: "Error fetching sentences" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
