import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
export interface QuarkfinAuthStackProps extends cdk.StackProps {
    projectName: string;
    environment: string;
}
export declare class QuarkfinAuthStack extends cdk.Stack {
    readonly userPool: cognito.UserPool;
    readonly userPoolClient: cognito.UserPoolClient;
    readonly userPoolDomain: cognito.UserPoolDomain;
    constructor(scope: Construct, id: string, props: QuarkfinAuthStackProps);
}
