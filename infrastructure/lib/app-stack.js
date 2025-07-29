"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuarkfinAppStack = void 0;
const cdk = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const elbv2 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
const iam = require("aws-cdk-lib/aws-iam");
class QuarkfinAppStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        // Key pair for SSH access (create manually or use existing)
        // For now, we'll reference it by name - you can create it in AWS console
        const keyName = 'quarkfin-production-key';
        // User data script for application setup
        const userData = ec2.UserData.forLinux();
        userData.addCommands(
        // Update system
        'yum update -y', 
        // Install Node.js 18
        'curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -', 'yum install -y nodejs', 
        // Install Go 1.21
        'wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz', 'tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz', 'echo "export PATH=$PATH:/usr/local/go/bin" >> /etc/profile', 'echo "export PATH=$PATH:/usr/local/go/bin" >> /home/ec2-user/.bashrc', 
        // Install nginx for reverse proxy
        'yum install -y nginx', 
        // Install PM2 for process management
        'npm install -g pm2', 
        // Install git for code deployment
        'yum install -y git', 
        // Install AWS CLI v2
        'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"', 'unzip awscliv2.zip', './aws/install', 
        // Create application directories
        'mkdir -p /var/www/quarkfin', 'mkdir -p /opt/quarkfin', 'chown ec2-user:ec2-user /var/www/quarkfin /opt/quarkfin', 
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
        'systemctl enable nginx', 'systemctl start nginx', 
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
EOF`, 'chmod +x /home/ec2-user/deploy.sh', 'chown ec2-user:ec2-user /home/ec2-user/deploy.sh', 
        // Install CloudWatch agent
        'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm', 'rpm -U ./amazon-cloudwatch-agent.rpm', 
        // Signal completion
        'echo "Application server setup complete" > /home/ec2-user/setup-complete.txt');
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
                path: '/health',
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
                path: '/health',
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
exports.QuarkfinAppStack = QuarkfinAppStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQywyQ0FBMkM7QUFDM0MsZ0VBQWdFO0FBR2hFLDJDQUEyQztBQWMzQyxNQUFhLGdCQUFpQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBSTdDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBNEI7UUFDcEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsMENBQTBDO1FBQzFDLE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDO1FBQ2hELE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDO1FBRWhELDRCQUE0QjtRQUM1QixNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN0RCxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUM7WUFDeEQsZUFBZSxFQUFFO2dCQUNmLEdBQUcsQ0FBQyxhQUFhLENBQUMsd0JBQXdCLENBQUMsNkJBQTZCLENBQUM7Z0JBQ3pFLEdBQUcsQ0FBQyxhQUFhLENBQUMsd0JBQXdCLENBQUMsOEJBQThCLENBQUM7YUFDM0U7U0FDRixDQUFDLENBQUM7UUFFSCwwQ0FBMEM7UUFDMUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRS9DLDREQUE0RDtRQUM1RCx5RUFBeUU7UUFDekUsTUFBTSxPQUFPLEdBQUcseUJBQXlCLENBQUM7UUFFMUMseUNBQXlDO1FBQ3pDLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDekMsUUFBUSxDQUFDLFdBQVc7UUFDbEIsZ0JBQWdCO1FBQ2hCLGVB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KiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgZWxidjIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjInO1xuaW1wb3J0ICogYXMgcmRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yZHMnO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29nbml0byc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBjZXJ0aWZpY2F0ZW1hbmFnZXIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNlcnRpZmljYXRlbWFuYWdlcic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBRdWFya2ZpbkFwcFN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIHByb2plY3ROYW1lOiBzdHJpbmc7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIHZwYzogZWMyLlZwYztcbiAgZGF0YWJhc2U6IHJkcy5EYXRhYmFzZUluc3RhbmNlO1xuICB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcbiAgYXBwU2VjdXJpdHlHcm91cDogZWMyLlNlY3VyaXR5R3JvdXA7XG4gIGFsYlNlY3VyaXR5R3JvdXA6IGVjMi5TZWN1cml0eUdyb3VwO1xufVxuXG5leHBvcnQgY2xhc3MgUXVhcmtmaW5BcHBTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBsb2FkQmFsYW5jZXI6IGVsYnYyLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyO1xuICBwdWJsaWMgcmVhZG9ubHkgYXBwSW5zdGFuY2U6IGVjMi5JbnN0YW5jZTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogUXVhcmtmaW5BcHBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBVc2Ugc2VjdXJpdHkgZ3JvdXBzIGZyb20gc2VjdXJpdHkgc3RhY2tcbiAgICBjb25zdCBhcHBTZWN1cml0eUdyb3VwID0gcHJvcHMuYXBwU2VjdXJpdHlHcm91cDtcbiAgICBjb25zdCBhbGJTZWN1cml0eUdyb3VwID0gcHJvcHMuYWxiU2VjdXJpdHlHcm91cDtcblxuICAgIC8vIElBTSByb2xlIGZvciBFQzIgaW5zdGFuY2VcbiAgICBjb25zdCBpbnN0YW5jZVJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0luc3RhbmNlUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdlYzIuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQ2xvdWRXYXRjaEFnZW50U2VydmVyUG9saWN5JyksXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uU1NNTWFuYWdlZEluc3RhbmNlQ29yZScpLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEFsbG93IGluc3RhbmNlIHRvIHJlYWQgZGF0YWJhc2Ugc2VjcmV0c1xuICAgIHByb3BzLmRhdGFiYXNlLnNlY3JldD8uZ3JhbnRSZWFkKGluc3RhbmNlUm9sZSk7XG5cbiAgICAvLyBLZXkgcGFpciBmb3IgU1NIIGFjY2VzcyAoY3JlYXRlIG1hbnVhbGx5IG9yIHVzZSBleGlzdGluZylcbiAgICAvLyBGb3Igbm93LCB3ZSdsbCByZWZlcmVuY2UgaXQgYnkgbmFtZSAtIHlvdSBjYW4gY3JlYXRlIGl0IGluIEFXUyBjb25zb2xlXG4gICAgY29uc3Qga2V5TmFtZSA9ICdxdWFya2Zpbi1wcm9kdWN0aW9uLWtleSc7XG5cbiAgICAvLyBVc2VyIGRhdGEgc2NyaXB0IGZvciBhcHBsaWNhdGlvbiBzZXR1cFxuICAgIGNvbnN0IHVzZXJEYXRhID0gZWMyLlVzZXJEYXRhLmZvckxpbnV4KCk7XG4gICAgdXNlckRhdGEuYWRkQ29tbWFuZHMoXG4gICAgICAvLyBVcGRhdGUgc3lzdGVtXG4gICAgICAneXVtIHVwZGF0ZSAteScsXG4gICAgICBcbiAgICAgIC8vIEluc3RhbGwgTm9kZS5qcyAxOFxuICAgICAgJ2N1cmwgLWZzU0wgaHR0cHM6Ly9ycG0ubm9kZXNvdXJjZS5jb20vc2V0dXBfMTgueCB8IGJhc2ggLScsXG4gICAgICAneXVtIGluc3RhbGwgLXkgbm9kZWpzJyxcbiAgICAgIFxuICAgICAgLy8gSW5zdGFsbCBHbyAxLjIxXG4gICAgICAnd2dldCBodHRwczovL2dvLmRldi9kbC9nbzEuMjEuMC5saW51eC1hbWQ2NC50YXIuZ3onLFxuICAgICAgJ3RhciAtQyAvdXNyL2xvY2FsIC14emYgZ28xLjIxLjAubGludXgtYW1kNjQudGFyLmd6JyxcbiAgICAgICdlY2hvIFwiZXhwb3J0IFBBVEg9JFBBVEg6L3Vzci9sb2NhbC9nby9iaW5cIiA+PiAvZXRjL3Byb2ZpbGUnLFxuICAgICAgJ2VjaG8gXCJleHBvcnQgUEFUSD0kUEFUSDovdXNyL2xvY2FsL2dvL2JpblwiID4+IC9ob21lL2VjMi11c2VyLy5iYXNocmMnLFxuICAgICAgXG4gICAgICAvLyBJbnN0YWxsIG5naW54IGZvciByZXZlcnNlIHByb3h5XG4gICAgICAneXVtIGluc3RhbGwgLXkgbmdpbngnLFxuICAgICAgXG4gICAgICAvLyBJbnN0YWxsIFBNMiBmb3IgcHJvY2VzcyBtYW5hZ2VtZW50XG4gICAgICAnbnBtIGluc3RhbGwgLWcgcG0yJyxcbiAgICAgIFxuICAgICAgLy8gSW5zdGFsbCBnaXQgZm9yIGNvZGUgZGVwbG95bWVudFxuICAgICAgJ3l1bSBpbnN0YWxsIC15IGdpdCcsXG4gICAgICBcbiAgICAgIC8vIEluc3RhbGwgQVdTIENMSSB2MlxuICAgICAgJ2N1cmwgXCJodHRwczovL2F3c2NsaS5hbWF6b25hd3MuY29tL2F3c2NsaS1leGUtbGludXgteDg2XzY0LnppcFwiIC1vIFwiYXdzY2xpdjIuemlwXCInLFxuICAgICAgJ3VuemlwIGF3c2NsaXYyLnppcCcsXG4gICAgICAnLi9hd3MvaW5zdGFsbCcsXG4gICAgICBcbiAgICAgIC8vIENyZWF0ZSBhcHBsaWNhdGlvbiBkaXJlY3Rvcmllc1xuICAgICAgJ21rZGlyIC1wIC92YXIvd3d3L3F1YXJrZmluJyxcbiAgICAgICdta2RpciAtcCAvb3B0L3F1YXJrZmluJyxcbiAgICAgICdjaG93biBlYzItdXNlcjplYzItdXNlciAvdmFyL3d3dy9xdWFya2ZpbiAvb3B0L3F1YXJrZmluJyxcbiAgICAgIFxuICAgICAgLy8gQ29uZmlndXJlIG5naW54XG4gICAgICBgY2F0ID4gL2V0Yy9uZ2lueC9jb25mLmQvcXVhcmtmaW4uY29uZiA8PCAnRU9GJ1xuc2VydmVyIHtcbiAgICBsaXN0ZW4gMzAwMDtcbiAgICBzZXJ2ZXJfbmFtZSBfO1xuICAgIFxuICAgICMgU2VjdXJpdHkgaGVhZGVyc1xuICAgIGFkZF9oZWFkZXIgWC1GcmFtZS1PcHRpb25zIERFTlk7XG4gICAgYWRkX2hlYWRlciBYLUNvbnRlbnQtVHlwZS1PcHRpb25zIG5vc25pZmY7XG4gICAgYWRkX2hlYWRlciBYLVhTUy1Qcm90ZWN0aW9uIFwiMTsgbW9kZT1ibG9ja1wiO1xuICAgIFxuICAgIGxvY2F0aW9uIC8ge1xuICAgICAgICBwcm94eV9wYXNzIGh0dHA6Ly9sb2NhbGhvc3Q6MzAwMTtcbiAgICAgICAgcHJveHlfaHR0cF92ZXJzaW9uIDEuMTtcbiAgICAgICAgcHJveHlfc2V0X2hlYWRlciBVcGdyYWRlICRodHRwX3VwZ3JhZGU7XG4gICAgICAgIHByb3h5X3NldF9oZWFkZXIgQ29ubmVjdGlvbiAndXBncmFkZSc7XG4gICAgICAgIHByb3h5X3NldF9oZWFkZXIgSG9zdCAkaG9zdDtcbiAgICAgICAgcHJveHlfc2V0X2hlYWRlciBYLVJlYWwtSVAgJHJlbW90ZV9hZGRyO1xuICAgICAgICBwcm94eV9zZXRfaGVhZGVyIFgtRm9yd2FyZGVkLUZvciAkcHJveHlfYWRkX3hfZm9yd2FyZGVkX2ZvcjtcbiAgICAgICAgcHJveHlfc2V0X2hlYWRlciBYLUZvcndhcmRlZC1Qcm90byAkc2NoZW1lO1xuICAgICAgICBwcm94eV9jYWNoZV9ieXBhc3MgJGh0dHBfdXBncmFkZTtcbiAgICB9XG4gICAgXG4gICAgbG9jYXRpb24gL2hlYWx0aCB7XG4gICAgICAgIHJldHVybiAyMDAgJ0Zyb250ZW5kIEhlYWx0aHknO1xuICAgICAgICBhZGRfaGVhZGVyIENvbnRlbnQtVHlwZSB0ZXh0L3BsYWluO1xuICAgIH1cbn1cblxuc2VydmVyIHtcbiAgICBsaXN0ZW4gODA4MDtcbiAgICBzZXJ2ZXJfbmFtZSBfO1xuICAgIFxuICAgIGxvY2F0aW9uIC8ge1xuICAgICAgICBwcm94eV9wYXNzIGh0dHA6Ly9sb2NhbGhvc3Q6ODA4MTtcbiAgICAgICAgcHJveHlfaHR0cF92ZXJzaW9uIDEuMTtcbiAgICAgICAgcHJveHlfc2V0X2hlYWRlciBIb3N0ICRob3N0O1xuICAgICAgICBwcm94eV9zZXRfaGVhZGVyIFgtUmVhbC1JUCAkcmVtb3RlX2FkZHI7XG4gICAgICAgIHByb3h5X3NldF9oZWFkZXIgWC1Gb3J3YXJkZWQtRm9yICRwcm94eV9hZGRfeF9mb3J3YXJkZWRfZm9yO1xuICAgICAgICBwcm94eV9zZXRfaGVhZGVyIFgtRm9yd2FyZGVkLVByb3RvICRzY2hlbWU7XG4gICAgfVxufVxuRU9GYCxcbiAgICAgIFxuICAgICAgLy8gU3RhcnQgc2VydmljZXNcbiAgICAgICdzeXN0ZW1jdGwgZW5hYmxlIG5naW54JyxcbiAgICAgICdzeXN0ZW1jdGwgc3RhcnQgbmdpbngnLFxuICAgICAgXG4gICAgICAvLyBDcmVhdGUgZGVwbG95bWVudCBzY3JpcHRcbiAgICAgIGBjYXQgPiAvaG9tZS9lYzItdXNlci9kZXBsb3kuc2ggPDwgJ0VPRidcbiMhL2Jpbi9iYXNoXG4jIFF1YXJrZmluQUkgZGVwbG95bWVudCBzY3JpcHRcbmVjaG8gXCJTdGFydGluZyBkZXBsb3ltZW50Li4uXCJcblxuIyBHZXQgZGF0YWJhc2UgY3JlZGVudGlhbHNcbkRCX1NFQ1JFVD0kKGF3cyBzZWNyZXRzbWFuYWdlciBnZXQtc2VjcmV0LXZhbHVlIC0tc2VjcmV0LWlkICR7cHJvcHMuZGF0YWJhc2Uuc2VjcmV0Py5zZWNyZXRBcm59IC0tcmVnaW9uICR7dGhpcy5yZWdpb259IC0tcXVlcnkgU2VjcmV0U3RyaW5nIC0tb3V0cHV0IHRleHQpXG5EQl9IT1NUPSQoZWNobyAkREJfU0VDUkVUIHwganEgLXIgLmhvc3QpXG5EQl9QQVNTV09SRD0kKGVjaG8gJERCX1NFQ1JFVCB8IGpxIC1yIC5wYXNzd29yZClcblxuIyBTZXQgZW52aXJvbm1lbnQgdmFyaWFibGVzXG5leHBvcnQgREFUQUJBU0VfVVJMPVwicG9zdGdyZXNxbDovL3F1YXJrZmluX2FkbWluOiREQl9QQVNTV09SREAkREJfSE9TVDo1NDMyL3F1YXJrZmluX3Byb2R1Y3Rpb25cIlxuZXhwb3J0IENPR05JVE9fVVNFUl9QT09MX0lEPVwiJHtwcm9wcy51c2VyUG9vbC51c2VyUG9vbElkfVwiXG5leHBvcnQgTk9ERV9FTlY9XCJwcm9kdWN0aW9uXCJcblxuZWNobyBcIkVudmlyb25tZW50IGNvbmZpZ3VyZWRcIlxuZWNobyBcIlJlYWR5IGZvciBhcHBsaWNhdGlvbiBkZXBsb3ltZW50XCJcbkVPRmAsXG4gICAgICBcbiAgICAgICdjaG1vZCAreCAvaG9tZS9lYzItdXNlci9kZXBsb3kuc2gnLFxuICAgICAgJ2Nob3duIGVjMi11c2VyOmVjMi11c2VyIC9ob21lL2VjMi11c2VyL2RlcGxveS5zaCcsXG4gICAgICBcbiAgICAgIC8vIEluc3RhbGwgQ2xvdWRXYXRjaCBhZ2VudFxuICAgICAgJ3dnZXQgaHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2FtYXpvbmNsb3Vkd2F0Y2gtYWdlbnQvYW1hem9uX2xpbnV4L2FtZDY0L2xhdGVzdC9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC5ycG0nLFxuICAgICAgJ3JwbSAtVSAuL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50LnJwbScsXG4gICAgICBcbiAgICAgIC8vIFNpZ25hbCBjb21wbGV0aW9uXG4gICAgICAnZWNobyBcIkFwcGxpY2F0aW9uIHNlcnZlciBzZXR1cCBjb21wbGV0ZVwiID4gL2hvbWUvZWMyLXVzZXIvc2V0dXAtY29tcGxldGUudHh0JyxcbiAgICApO1xuXG4gICAgLy8gRUMyIEluc3RhbmNlIChzaW5nbGUgaW5zdGFuY2UgZm9yIHN0YXJ0dXApXG4gICAgdGhpcy5hcHBJbnN0YW5jZSA9IG5ldyBlYzIuSW5zdGFuY2UodGhpcywgJ0FwcEluc3RhbmNlJywge1xuICAgICAgaW5zdGFuY2VOYW1lOiBgJHtwcm9wcy5wcm9qZWN0TmFtZX0tJHtwcm9wcy5lbnZpcm9ubWVudH0tYXBwYCxcbiAgICAgIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihlYzIuSW5zdGFuY2VDbGFzcy5UMywgZWMyLkluc3RhbmNlU2l6ZS5NRURJVU0pLFxuICAgICAgbWFjaGluZUltYWdlOiBlYzIuTWFjaGluZUltYWdlLmxhdGVzdEFtYXpvbkxpbnV4MigpLFxuICAgICAgdnBjOiBwcm9wcy52cGMsXG4gICAgICB2cGNTdWJuZXRzOiB7XG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICB9LFxuICAgICAgc2VjdXJpdHlHcm91cDogYXBwU2VjdXJpdHlHcm91cCxcbiAgICAgIHJvbGU6IGluc3RhbmNlUm9sZSxcbiAgICAgIGtleU5hbWU6IGtleU5hbWUsXG4gICAgICB1c2VyRGF0YSxcbiAgICAgIFxuICAgICAgLy8gU3RvcmFnZVxuICAgICAgYmxvY2tEZXZpY2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBkZXZpY2VOYW1lOiAnL2Rldi94dmRhJyxcbiAgICAgICAgICB2b2x1bWU6IGVjMi5CbG9ja0RldmljZVZvbHVtZS5lYnMoMzAsIHtcbiAgICAgICAgICAgIGVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgICAgICAgIHZvbHVtZVR5cGU6IGVjMi5FYnNEZXZpY2VWb2x1bWVUeXBlLkdQMyxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBcbiAgICAgIC8vIEVuaGFuY2VkIG1vbml0b3JpbmdcbiAgICAgIGRldGFpbGVkTW9uaXRvcmluZzogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIEFwcGxpY2F0aW9uIExvYWQgQmFsYW5jZXJcbiAgICB0aGlzLmxvYWRCYWxhbmNlciA9IG5ldyBlbGJ2Mi5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlcih0aGlzLCAnTG9hZEJhbGFuY2VyJywge1xuICAgICAgbG9hZEJhbGFuY2VyTmFtZTogYCR7cHJvcHMucHJvamVjdE5hbWV9LSR7cHJvcHMuZW52aXJvbm1lbnR9LWFsYmAsXG4gICAgICB2cGM6IHByb3BzLnZwYyxcbiAgICAgIGludGVybmV0RmFjaW5nOiB0cnVlLFxuICAgICAgc2VjdXJpdHlHcm91cDogYWxiU2VjdXJpdHlHcm91cCxcbiAgICAgIHZwY1N1Ym5ldHM6IHtcbiAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFRhcmdldCBncm91cHNcbiAgICBjb25zdCBmcm9udGVuZFRhcmdldEdyb3VwID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uVGFyZ2V0R3JvdXAodGhpcywgJ0Zyb250ZW5kVGFyZ2V0R3JvdXAnLCB7XG4gICAgICB0YXJnZXRHcm91cE5hbWU6IGAke3Byb3BzLnByb2plY3ROYW1lfS0ke3Byb3BzLmVudmlyb25tZW50fS1mcm9udGVuZC10Z2AsXG4gICAgICBwb3J0OiAzMDAwLFxuICAgICAgcHJvdG9jb2w6IGVsYnYyLkFwcGxpY2F0aW9uUHJvdG9jb2wuSFRUUCxcbiAgICAgIHZwYzogcHJvcHMudnBjLFxuICAgICAgaGVhbHRoQ2hlY2s6IHtcbiAgICAgICAgcGF0aDogJy9oZWFsdGgnLFxuICAgICAgICBoZWFsdGh5SHR0cENvZGVzOiAnMjAwJyxcbiAgICAgICAgaW50ZXJ2YWw6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNSksXG4gICAgICAgIGhlYWx0aHlUaHJlc2hvbGRDb3VudDogMixcbiAgICAgICAgdW5oZWFsdGh5VGhyZXNob2xkQ291bnQ6IDMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgYmFja2VuZFRhcmdldEdyb3VwID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uVGFyZ2V0R3JvdXAodGhpcywgJ0JhY2tlbmRUYXJnZXRHcm91cCcsIHtcbiAgICAgIHRhcmdldEdyb3VwTmFtZTogYCR7cHJvcHMucHJvamVjdE5hbWV9LSR7cHJvcHMuZW52aXJvbm1lbnR9LWJhY2tlbmQtdGdgLFxuICAgICAgcG9ydDogODA4MCxcbiAgICAgIHByb3RvY29sOiBlbGJ2Mi5BcHBsaWNhdGlvblByb3RvY29sLkhUVFAsXG4gICAgICB2cGM6IHByb3BzLnZwYyxcbiAgICAgIGhlYWx0aENoZWNrOiB7XG4gICAgICAgIHBhdGg6ICcvaGVhbHRoJyxcbiAgICAgICAgaGVhbHRoeUh0dHBDb2RlczogJzIwMCcsXG4gICAgICAgIGludGVydmFsOiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDUpLFxuICAgICAgICBoZWFsdGh5VGhyZXNob2xkQ291bnQ6IDIsXG4gICAgICAgIHVuaGVhbHRoeVRocmVzaG9sZENvdW50OiAzLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCB0YXJnZXRzIHRvIHRhcmdldCBncm91cHMgYWZ0ZXIgaW5zdGFuY2UgaXMgY3JlYXRlZFxuICAgIC8vIFdlJ2xsIGFkZCB0YXJnZXRzIG1hbnVhbGx5IGFmdGVyIGRlcGxveW1lbnRcblxuICAgIC8vIEhUVFAgTGlzdGVuZXJzICh3ZSdsbCBhZGQgSFRUUFMgbGF0ZXIgd2l0aCBjZXJ0aWZpY2F0ZSlcbiAgICB0aGlzLmxvYWRCYWxhbmNlci5hZGRMaXN0ZW5lcignRnJvbnRlbmRMaXN0ZW5lcicsIHtcbiAgICAgIHBvcnQ6IDgwLFxuICAgICAgcHJvdG9jb2w6IGVsYnYyLkFwcGxpY2F0aW9uUHJvdG9jb2wuSFRUUCxcbiAgICAgIGRlZmF1bHRUYXJnZXRHcm91cHM6IFtmcm9udGVuZFRhcmdldEdyb3VwXSxcbiAgICB9KTtcblxuICAgIHRoaXMubG9hZEJhbGFuY2VyLmFkZExpc3RlbmVyKCdCYWNrZW5kTGlzdGVuZXInLCB7XG4gICAgICBwb3J0OiA4MDgwLFxuICAgICAgcHJvdG9jb2w6IGVsYnYyLkFwcGxpY2F0aW9uUHJvdG9jb2wuSFRUUCxcbiAgICAgIGRlZmF1bHRUYXJnZXRHcm91cHM6IFtiYWNrZW5kVGFyZ2V0R3JvdXBdLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdMb2FkQmFsYW5jZXJETlMnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5sb2FkQmFsYW5jZXIubG9hZEJhbGFuY2VyRG5zTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTG9hZCBCYWxhbmNlciBETlMgbmFtZScsXG4gICAgICBleHBvcnROYW1lOiBgJHtwcm9wcy5wcm9qZWN0TmFtZX0tJHtwcm9wcy5lbnZpcm9ubWVudH0tYWxiLWRuc2AsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBwSW5zdGFuY2VJZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFwcEluc3RhbmNlLmluc3RhbmNlSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FwcGxpY2F0aW9uIGluc3RhbmNlIElEJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3Byb3BzLnByb2plY3ROYW1lfS0ke3Byb3BzLmVudmlyb25tZW50fS1hcHAtaW5zdGFuY2UtaWRgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwcEluc3RhbmNlUHJpdmF0ZUlwJywge1xuICAgICAgdmFsdWU6IHRoaXMuYXBwSW5zdGFuY2UuaW5zdGFuY2VQcml2YXRlSXAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FwcGxpY2F0aW9uIGluc3RhbmNlIHByaXZhdGUgSVAnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7cHJvcHMucHJvamVjdE5hbWV9LSR7cHJvcHMuZW52aXJvbm1lbnR9LWFwcC1wcml2YXRlLWlwYCxcbiAgICB9KTtcbiAgfVxufVxuIl19