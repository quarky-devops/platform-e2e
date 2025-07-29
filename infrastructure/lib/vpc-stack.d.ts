import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
export interface QuarkfinVpcStackProps extends cdk.StackProps {
    projectName: string;
    environment: string;
}
export declare class QuarkfinVpcStack extends cdk.Stack {
    readonly vpc: ec2.Vpc;
    constructor(scope: Construct, id: string, props: QuarkfinVpcStackProps);
}
