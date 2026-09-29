const dns = require('dns').promises;

async function testDNS() {
  try {
    console.log('Testing DNS resolution for MongoDB Atlas...');
    
    // Test basic DNS resolution
    console.log('Resolving cluster0.ljluw8g.mongodb.net...');
    const addresses = await dns.resolve('cluster0.ljluw8g.mongodb.net');
    console.log('✅ Basic DNS resolved:', addresses);
    
    // Test SRV record lookup
    console.log('Looking up SRV records...');
    const srvRecords = await dns.resolveSrv('_mongodb._tcp.cluster0.ljluw8g.mongodb.net');
    console.log('✅ SRV records:', srvRecords);
    
  } catch (error) {
    console.error('❌ DNS resolution failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Possible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Try changing your DNS server to 8.8.8.8 or 1.1.1.1');
      console.log('3. Check if your network/firewall blocks DNS lookups');
      console.log('4. Try using the direct connection string from MongoDB Atlas');
    }
  }
}

testDNS();
