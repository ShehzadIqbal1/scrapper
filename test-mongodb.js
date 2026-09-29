const mongoose = require('mongoose');

const uri = 'mongodb+srv://npiregistry:npiregistry@cluster0.ljluw8g.mongodb.net/npiregistry';

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false
    });
    
    console.log('✅ Connected successfully!');
    console.log('Database name:', mongoose.connection.name);
    console.log('Connection will create/use database:', 'npiregistry');
    
    // Test by creating a simple collection (this will create the DB if it doesn't exist)
    const testSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('TestConnection', testSchema);
    
    // Create a test document
    const testDoc = await TestModel.create({ name: 'Database test' });
    console.log('✅ Created test document in database');
    
    // Clean up
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Cleaned up test document');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
