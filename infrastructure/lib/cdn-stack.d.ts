import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
export interface QuarkfinCdnStackProps extends cdk.StackProps {
    projectName: string;
    environment: string;
    loadBalancer: elbv2.ApplicationLoadBalancer;
}
export declare class QuarkfinCdnStack extends cdk.Stack {
    readonly distribution: cloudfront.Distribution;
    constructor(scope: Construct, id: string, props: QuarkfinCdnStackProps);
}
