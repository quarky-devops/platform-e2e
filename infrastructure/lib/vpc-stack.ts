import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface QuarkfinVpcStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
}

export class QuarkfinVpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: QuarkfinVpcStackProps) {
    super(scope, id, props);

    // Simple 2-tier VPC (Public + Private) - no over-engineering
    this.vpc = new ec2.Vpc(this, 'QuarkfinVpc', {
      vpcName: `${props.projectName}-${props.environment}-vpc`,
      cidr: '10.0.0.0/16',
      maxAzs: 2, // Keep it simple, 2 AZs only
      
      // Simple subnet configuration
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      
      // Single NAT Gateway (cost optimization)
      natGateways: 1,
      
      // Enable DNS
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Basic VPC Flow Logs for security monitoring
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: ec2.FlowLogTrafficType.REJECT, // Only log rejected traffic
    });

    // Output VPC ID for cross-stack reference
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${props.projectName}-${props.environment}-vpc-id`,
    });

    // Output subnet IDs
    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(s => s.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `${props.projectName}-${props.environment}-public-subnets`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(s => s.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `${props.projectName}-${props.environment}-private-subnets`,
    });
  }
}
