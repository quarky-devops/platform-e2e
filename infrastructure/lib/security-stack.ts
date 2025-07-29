import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface QuarkfinSecurityStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  vpc: ec2.Vpc;
}

export class QuarkfinSecurityStack extends cdk.Stack {
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: QuarkfinSecurityStackProps) {
    super(scope, id, props);

    // Security group for load balancer
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for QuarkfinAI load balancer',
      securityGroupName: `${props.projectName}-${props.environment}-alb-sg`,
    });

    // ALB security group rules - public internet access
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP traffic'
    );
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS traffic'
    );

    // Security group for application server
    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for QuarkfinAI application server',
      securityGroupName: `${props.projectName}-${props.environment}-app-sg`,
    });

    // App security group rules - only from ALB
    this.appSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      'Frontend from ALB'
    );
    this.appSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8080),
      'Backend API from ALB'
    );
    
    // SSH access (restrict to your IP in production)
    this.appSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), // Change to your IP: ec2.Peer.ipv4('YOUR_IP/32')
      ec2.Port.tcp(22),
      'SSH access'
    );

    // Security group for database
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for QuarkfinAI database',
      securityGroupName: `${props.projectName}-${props.environment}-db-sg`,
    });

    // Database security group rules - only from app servers
    this.databaseSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(5432),
      'PostgreSQL access from app servers'
    );

    // Outputs
    new cdk.CfnOutput(this, 'AppSecurityGroupId', {
      value: this.appSecurityGroup.securityGroupId,
      description: 'Application security group ID',
      exportName: `${props.projectName}-${props.environment}-app-sg-id`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: this.databaseSecurityGroup.securityGroupId,
      description: 'Database security group ID',
      exportName: `${props.projectName}-${props.environment}-db-sg-id`,
    });

    new cdk.CfnOutput(this, 'AlbSecurityGroupId', {
      value: this.albSecurityGroup.securityGroupId,
      description: 'Load balancer security group ID',
      exportName: `${props.projectName}-${props.environment}-alb-sg-id`,
    });
  }
}
