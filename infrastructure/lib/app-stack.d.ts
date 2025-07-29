import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cognito from 'aws-cdk-lib/aws-cognito';
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
export declare class QuarkfinAppStack extends cdk.Stack {
    readonly loadBalancer: elbv2.ApplicationLoadBalancer;
    readonly appInstance: ec2.Instance;
    constructor(scope: Construct, id: string, props: QuarkfinAppStackProps);
}
