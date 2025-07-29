import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
export interface QuarkfinSecurityStackProps extends cdk.StackProps {
    projectName: string;
    environment: string;
    vpc: ec2.Vpc;
}
export declare class QuarkfinSecurityStack extends cdk.Stack {
    readonly appSecurityGroup: ec2.SecurityGroup;
    readonly databaseSecurityGroup: ec2.SecurityGroup;
    readonly albSecurityGroup: ec2.SecurityGroup;
    constructor(scope: Construct, id: string, props: QuarkfinSecurityStackProps);
}
