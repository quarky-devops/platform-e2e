#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { QuarkfinVpcStack } from '../lib/vpc-stack';
import { QuarkfinSecurityStack } from '../lib/security-stack';
import { QuarkfinDatabaseStack } from '../lib/database-stack';
import { QuarkfinAppStack } from '../lib/app-stack';
import { QuarkfinAuthStack } from '../lib/auth-stack';
import { QuarkfinCdnStack } from '../lib/cdn-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const projectName = 'quarkfin';
const environment = 'production';

// Core infrastructure stacks
const vpcStack = new QuarkfinVpcStack(app, 'QuarkfinVpcStack', {
  env,
  projectName,
  environment,
});

const securityStack = new QuarkfinSecurityStack(app, 'QuarkfinSecurityStack', {
  env,
  projectName,
  environment,
  vpc: vpcStack.vpc,
});

const authStack = new QuarkfinAuthStack(app, 'QuarkfinAuthStack', {
  env,
  projectName,
  environment,
});

const databaseStack = new QuarkfinDatabaseStack(app, 'QuarkfinDatabaseStack', {
  env,
  projectName,
  environment,
  vpc: vpcStack.vpc,
  databaseSecurityGroup: securityStack.databaseSecurityGroup,
});

const appStack = new QuarkfinAppStack(app, 'QuarkfinAppStack', {
  env,
  projectName,
  environment,
  vpc: vpcStack.vpc,
  database: databaseStack.database,
  userPool: authStack.userPool,
  appSecurityGroup: securityStack.appSecurityGroup,
  albSecurityGroup: securityStack.albSecurityGroup,
});

const cdnStack = new QuarkfinCdnStack(app, 'QuarkfinCdnStack', {
  env,
  projectName,
  environment,
  loadBalancer: appStack.loadBalancer,
});

// Add tags to all resources
cdk.Tags.of(app).add('Project', 'QuarkfinAI');
cdk.Tags.of(app).add('Environment', 'production');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
