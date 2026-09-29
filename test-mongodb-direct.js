const mongoose = require('mongoose');

// Try direct connection without SRV record
const uri = 'mongodb+srv://npiregistry:npiregistry@cluster0.ljluw8g.mongodb.net/npiregistry?retryWrites=true&w=majority';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('Connection string:', uri.replace(/npiregistry:[^@]+@/, 'npiregistry:***@'));
    
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      bufferCommands: false,
      // Add these options to help with connection issues
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false
    });
    
    console.log('✅ Connected successfully!');
    console.log('Database name:', mongoose.connection.name);
    
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
