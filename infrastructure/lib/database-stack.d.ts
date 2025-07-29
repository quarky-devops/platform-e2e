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
export declare class QuarkfinDatabaseStack extends cdk.Stack {
    readonly database: rds.DatabaseInstance;
    readonly databaseSecret: secretsmanager.Secret;
    constructor(scope: Construct, id: string, props: QuarkfinDatabaseStackProps);
}
