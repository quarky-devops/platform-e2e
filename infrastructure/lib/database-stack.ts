import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface QuarkfinDatabaseStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  vpc: ec2.Vpc;
  databaseSecurityGroup: ec2.SecurityGroup;
}

export class QuarkfinDatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly databaseSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: QuarkfinDatabaseStackProps) {
    super(scope, id, props);

    // Create database subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for QuarkfinAI database',
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      subnetGroupName: `${props.projectName}-${props.environment}-db-subnet-group`,
    });

    // Database credentials (AWS-managed secret)
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `${props.projectName}/${props.environment}/database`,
      description: 'Database credentials for QuarkfinAI',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'quarkfin_admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 16,
      },
    });

    // Use security group from security stack
    const dbSecurityGroup = props.databaseSecurityGroup;

    // RDS PostgreSQL instance (managed, simple, secure)
    this.database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `${props.projectName}-${props.environment}-db`,
      // Use default PostgreSQL engine (most compatible)
      engine: rds.DatabaseInstanceEngine.POSTGRES,
      
      // Right-sized for startup
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      
      // Storage
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      storageEncrypted: true, // Encrypted by default
      
      // Database configuration
      databaseName: 'quarkfin_production',
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      
      // Network
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
      subnetGroup: dbSubnetGroup,
      
      // Security
      multiAz: false, // Single AZ for cost optimization
      publiclyAccessible: false, // NEVER expose to internet
      
      // Backups
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: false, // Allow deletion for dev
      
      // Monitoring
      enablePerformanceInsights: false, // Keep costs down
      monitoringInterval: cdk.Duration.seconds(0), // No enhanced monitoring
      
      // Maintenance
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,
    });

    // Create a Lambda function to initialize the database schema
    // (We'll add this later for automatic schema setup)

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'Database endpoint',
      exportName: `${props.projectName}-${props.environment}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecret.secretArn,
      description: 'Database secret ARN',
      exportName: `${props.projectName}-${props.environment}-db-secret-arn`,
    });

    // Security group output removed (managed by SecurityStack)
  }
}
