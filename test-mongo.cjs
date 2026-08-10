require('dotenv').config();

const mongoose = require('mongoose');

async function testMongoConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing');
  }

  console.log('MongoDB configuration:', {
    scheme: uri.startsWith('mongodb+srv://')
      ? 'mongodb+srv'
      : uri.startsWith('mongodb://')
        ? 'mongodb'
        : 'unknown',
    usesSrv: uri.startsWith('mongodb+srv://'),
    hasExplicitTlsOption: /[?&](tls|ssl)=true(?:&|$)/i.test(uri),
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30_000,
      connectTimeoutMS: 15_000,
      socketTimeoutMS: 45_000,
      family: 4,
    });

    if (!mongoose.connection.db) {
      throw new Error('MongoDB connection opened without a database');
    }

    const result = await mongoose.connection.db
      .admin()
      .command({ ping: 1 });

    console.log('MongoDB connection successful:', result);
  } catch (error) {
    console.error('\nERROR NAME:');
    console.error(error?.name);

    console.error('\nERROR MESSAGE:');
    console.error(error?.message);

    console.error('\nFULL ERROR:');
    console.dir(error, {
      depth: 20,
      colors: true,
    });

    console.error('\nTOPOLOGY REASON:');
    console.dir(error?.reason, {
      depth: 20,
      colors: true,
    });

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
}

testMongoConnection().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});