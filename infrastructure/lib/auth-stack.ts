import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface QuarkfinAuthStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
}

export class QuarkfinAuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolDomain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string, props: QuarkfinAuthStackProps) {
    super(scope, id, props);

    // Cognito User Pool - Simple but secure
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${props.projectName}-${props.environment}-users`,
      
      // Sign-in options
      signInAliases: {
        email: true,
        phone: true, // Phone verification for abuse prevention (your requirement)
      },
      
      // Auto-verification
      autoVerify: {
        email: true,
        phone: true,
      },
      
      // User attributes
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        phoneNumber: {
          required: true,
          mutable: true,
        },
        fullname: {
          required: true,
          mutable: true,
        },
      },
      
      // Custom attributes for your platform
      customAttributes: {
        company_name: new cognito.StringAttribute({ 
          minLen: 0, 
          maxLen: 255, 
          mutable: true 
        }),
        subscription_plan: new cognito.StringAttribute({ 
          minLen: 0, 
          maxLen: 50, 
          mutable: true 
        }),
        onboarding_completed: new cognito.BooleanAttribute({ 
          mutable: true 
        }),
      },
      
      // Password policy (secure but not overly complex)
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false, // Keep it user-friendly
      },
      
      // Account recovery
      accountRecovery: cognito.AccountRecovery.EMAIL_AND_PHONE_WITHOUT_MFA,
      
      // Security features
      advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,
      
      // Device tracking
      deviceTracking: {
        challengeRequiredOnNewDevice: true,
        deviceOnlyRememberedOnUserPrompt: true,
      },
      
      // Cleanup
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Don't accidentally delete users
    });

    // User Pool Client for your frontend
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `${props.projectName}-${props.environment}-client`,
      
      // OAuth configuration
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.PHONE,
        ],
        callbackUrls: [
          'https://app.quarkfin.ai/auth/callback',
          'http://localhost:3000/auth/callback', // For development
        ],
        logoutUrls: [
          'https://app.quarkfin.ai/login',
          'http://localhost:3000/login',
        ],
      },
      
      // Security settings
      generateSecret: false, // SPA doesn't need client secret
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
      
      // Token validity
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      
      // Supported identity providers
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // Skip Hosted UI Domain for now - can add later if needed
    // this.userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
    //   userPool: this.userPool,
    //   cognitoDomain: {
    //     domainPrefix: `${props.projectName}-${props.environment}-auth-${Date.now().toString().slice(-6)}`,
    //   },
    // });

    // Outputs for frontend integration
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${props.projectName}-${props.environment}-user-pool-id`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `${props.projectName}-${props.environment}-user-pool-client-id`,
    });

    // Skip domain output for now
    // new cdk.CfnOutput(this, 'UserPoolDomainName', {
    //   value: this.userPoolDomain.domainName,
    //   description: 'Cognito User Pool Domain',
    //   exportName: `${props.projectName}-${props.environment}-user-pool-domain`,
    // });

    new cdk.CfnOutput(this, 'CognitoConfig', {
      value: JSON.stringify({
        region: this.region,
        userPoolId: this.userPool.userPoolId,
        userPoolWebClientId: this.userPoolClient.userPoolClientId,
        // Simplified config without domain
        oauth: {
          scope: ['email', 'openid', 'profile', 'phone'],
          redirectSignIn: 'https://app.quarkfin.ai/auth/callback',
          redirectSignOut: 'https://app.quarkfin.ai/login',
          responseType: 'code',
        },
      }),
      description: 'Complete Cognito configuration for frontend',
    });
  }
}
