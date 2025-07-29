#!/usr/bin/env node

// Quick script to check available PostgreSQL versions in CDK
const rds = require('aws-cdk-lib/aws-rds');

console.log('🔍 Available PostgreSQL versions in your CDK:');
console.log('==============================================');

// List all available PostgreSQL versions
const versions = Object.keys(rds.PostgresEngineVersion)
  .filter(key => key.startsWith('VER_'))
  .sort()
  .map(key => ({
    name: key,
    version: rds.PostgresEngineVersion[key].engineVersion
  }));

versions.forEach(v => {
  console.log(`✅ ${v.name.padEnd(12)} → ${v.version}`);
});

console.log('');
console.log('💡 Recommended for production: VER_15_3 or VER_14_9');
