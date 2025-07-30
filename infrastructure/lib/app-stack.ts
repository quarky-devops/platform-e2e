import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface QuarkfinAppStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  vpc: ec2.Vpc;
  database: rds.DatabaseInstance;
  userPool: cognito.UserPool;
  appSecurityGroup: ec2.SecurityGroup;
  albSecurityGroup: ec2.SecurityGroup;
}

export class QuarkfinAppStack extends cdk.Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly appInstance: ec2.Instance;

  constructor(scope: Construct, id: string, props: QuarkfinAppStackProps) {
    super(scope, id, props);

    // Use security groups from security stack
    const appSecurityGroup = props.appSecurityGroup;
    const albSecurityGroup = props.albSecurityGroup;

    // IAM role for EC2 instance
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Allow instance to read database secrets
    props.database.secret?.grantRead(instanceRole);

    // Add S3 permissions for deployment package access
    instanceRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
        's3:ListBucket'
      ],
      resources: [
        'arn:aws:s3:::quarkfin-deploy-*',
        'arn:aws:s3:::quarkfin-deploy-*/*'
      ]
    }));

    // Key pair for SSH access (create manually or use existing)
    // For now, we'll reference it by name - you can create it in AWS console
    const keyName = 'quarkfin-production-key';

    // User data script for application setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      // Update system
      'yum update -y',
      
      // Install Node.js 18
      'curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -',
      'yum install -y nodejs',
      
      // Install Go 1.21
      'wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz',
      'tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz',
      'echo "export PATH=$PATH:/usr/local/go/bin" >> /etc/profile',
      'echo "export PATH=$PATH:/usr/local/go/bin" >> /home/ec2-user/.bashrc',
      
      // Install nginx for reverse proxy
      'yum install -y nginx',
      
      // Install PM2 for process management
      'npm install -g pm2',
      
      // Install git for code deployment
      'yum install -y git',
      
      // Install AWS CLI v2
      'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"',
      'unzip awscliv2.zip',
      './aws/install',
      
      // Create application directories
      'mkdir -p /var/www/quarkfin',
      'mkdir -p /opt/quarkfin',
      'chown ec2-user:ec2-user /var/www/quarkfin /opt/quarkfin',
      
      // Configure nginx
      `cat > /etc/nginx/conf.d/quarkfin.conf << 'EOF'
server {
    listen 3000;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        return 200 'Frontend Healthy';
        add_header Content-Type text/plain;
    }
}

server {
    listen 8080;
    server_name _;
    
    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF`,
      
      // Start services
      'systemctl enable nginx',
      'systemctl start nginx',
      
      // Create deployment script
      `cat > /home/ec2-user/deploy.sh << 'EOF'
#!/bin/bash
# QuarkfinAI deployment script
echo "Starting deployment..."

# Get database credentials
DB_SECRET=$(aws secretsmanager get-secret-value --secret-id ${props.database.secret?.secretArn} --region ${this.region} --query SecretString --output text)
DB_HOST=$(echo $DB_SECRET | jq -r .host)
DB_PASSWORD=$(echo $DB_SECRET | jq -r .password)

# Set environment variables
export DATABASE_URL="postgresql://quarkfin_admin:$DB_PASSWORD@$DB_HOST:5432/quarkfin_production"
export COGNITO_USER_POOL_ID="${props.userPool.userPoolId}"
export NODE_ENV="production"

echo "Environment configured"
echo "Ready for application deployment"
EOF`,
      
      'chmod +x /home/ec2-user/deploy.sh',
      'chown ec2-user:ec2-user /home/ec2-user/deploy.sh',
      
      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',
      
      // Signal completion
      'echo "Application server setup complete" > /home/ec2-user/setup-complete.txt',
    );

    // EC2 Instance (single instance for startup)
    this.appInstance = new ec2.Instance(this, 'AppInstance', {
      instanceName: `${props.projectName}-${props.environment}-app`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: appSecurityGroup,
      role: instanceRole,
      keyName: keyName,
      userData,
      
      // Storage
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(30, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
      
      // Enhanced monitoring
      detailedMonitoring: true,
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      loadBalancerName: `${props.projectName}-${props.environment}-alb`,
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target groups
    const frontendTargetGroup = new elbv2.ApplicationTargetGroup(this, 'FrontendTargetGroup', {
      targetGroupName: `${props.projectName}-${props.environment}-frontend-tg`,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: props.vpc,
      healthCheck: {
        path: '/ping',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    const backendTargetGroup = new elbv2.ApplicationTargetGroup(this, 'BackendTargetGroup', {
      targetGroupName: `${props.projectName}-${props.environment}-backend-tg`,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: props.vpc,
      healthCheck: {
        path: '/ping',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // Add targets to target groups after instance is created
    // We'll add targets manually after deployment

    // HTTP Listeners (we'll add HTTPS later with certificate)
    this.loadBalancer.addListener('FrontendListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [frontendTargetGroup],
    });

    this.loadBalancer.addListener('BackendListener', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [backendTargetGroup],
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS name',
      exportName: `${props.projectName}-${props.environment}-alb-dns`,
    });

    new cdk.CfnOutput(this, 'AppInstanceId', {
      value: this.appInstance.instanceId,
      description: 'Application instance ID',
      exportName: `${props.projectName}-${props.environment}-app-instance-id`,
    });

    new cdk.CfnOutput(this, 'AppInstancePrivateIp', {
      value: this.appInstance.instancePrivateIp,
      description: 'Application instance private IP',
      exportName: `${props.projectName}-${props.environment}-app-private-ip`,
    });
  }
}
