"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuarkfinAuthStack = void 0;
const cdk = require("aws-cdk-lib");
const cognito = require("aws-cdk-lib/aws-cognito");
class QuarkfinAuthStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            generateSecret: false,
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
exports.QuarkfinAuthStack = QuarkfinAuthStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF1dGgtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLG1EQUFtRDtBQVFuRCxNQUFhLGlCQUFrQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBSzlDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBNkI7UUFDckUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsd0NBQXdDO1FBQ3hDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDckQsWUFBWSxFQUFFLEdBQUcsS0FBSyxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsV0FBVyxRQUFRO1lBRS9ELGtCQUFrQjtZQUNsQixhQUFhLEVBQUU7Z0JBQ2IsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsS0FBSyxFQUFFLElBQUksRUFBRSw2REFBNkQ7YUFDM0U7WUFFRCxvQkFBb0I7WUFDcEIsVUFBVSxFQUFFO2dCQUNWLEtBQUssRUFBRSxJQUFJO2dCQUNYLEtBQUssRUFBRSxJQUFJO2FBQ1o7WUFFRCxrQkFBa0I7WUFDbEIsa0JBQWtCLEVBQUU7Z0JBQ2xCLEtBQUssRUFBRTtvQkFDTCxRQUFRLEVBQUUsSUFBSTtvQkFDZCxPQUFPLEVBQUUsSUFBSTtpQkFDZDtnQkFDRCxXQUFXLEVBQUU7b0JBQ1gsUUFBUSxFQUFFLElBQUk7b0JBQ2QsT0FBTyxFQUFFLElBQUk7aUJBQ2Q7Z0JBQ0QsUUFBUSxFQUFFO29CQUNSLFFBQVEsRUFBRSxJQUFJO29CQUNkLE9BQU8sRUFBRSxJQUFJO2lCQUNkO2FBQ0Y7WUFFRCxzQ0FBc0M7WUFDdEMsZ0JBQWdCLEVBQUU7Z0JBQ2hCLFlBQVksRUFBRSxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUM7b0JBQ3hDLE1BQU0sRUFBRSxDQUFDO29CQUNULE1BQU0s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QUssQ0FBQyxXQUFXLGVBQWU7U0FDckUsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUMxQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0I7WUFDM0MsV0FBVyxFQUFFLDZCQUE2QjtZQUMxQyxVQUFVLEVBQUUsR0FBRyxLQUFLLENBQUMsV0FBVyxJQUFJLEtBQUssQ0FBQyxXQUFXLHNCQUFzQjtTQUM1RSxDQUFDLENBQUM7UUFFSCw2QkFBNkI7UUFDN0Isa0RBQWtEO1FBQ2xELDJDQUEyQztRQUMzQyw2Q0FBNkM7UUFDN0MsOEVBQThFO1FBQzlFLE1BQU07UUFFTixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN2QyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDcEIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO2dCQUNuQixVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVO2dCQUNwQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQjtnQkFDekQsbUNBQW1DO2dCQUNuQyxLQUFLLEVBQUU7b0JBQ0wsS0FBSyxFQUFFLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDO29CQUM5QyxjQUFjLEVBQUUsdUNBQXVDO29CQUN2RCxlQUFlLEVBQUUsK0JBQStCO29CQUNoRCxZQUFZLEVBQUUsTUFBTTtpQkFDckI7YUFDRixDQUFDO1lBQ0YsV0FBVyxFQUFFLDZDQUE2QztTQUMzRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF4S0QsOENBd0tDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUXVhcmtmaW5BdXRoU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgcHJvamVjdE5hbWU6IHN0cmluZztcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFF1YXJrZmluQXV0aFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJQb29sOiBjb2duaXRvLlVzZXJQb29sO1xuICBwdWJsaWMgcmVhZG9ubHkgdXNlclBvb2xDbGllbnQ6IGNvZ25pdG8uVXNlclBvb2xDbGllbnQ7XG4gIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbERvbWFpbjogY29nbml0by5Vc2VyUG9vbERvbWFpbjtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogUXVhcmtmaW5BdXRoU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gQ29nbml0byBVc2VyIFBvb2wgLSBTaW1wbGUgYnV0IHNlY3VyZVxuICAgIHRoaXMudXNlclBvb2wgPSBuZXcgY29nbml0by5Vc2VyUG9vbCh0aGlzLCAnVXNlclBvb2wnLCB7XG4gICAgICB1c2VyUG9vbE5hbWU6IGAke3Byb3BzLnByb2plY3ROYW1lfS0ke3Byb3BzLmVudmlyb25tZW50fS11c2Vyc2AsXG4gICAgICBcbiAgICAgIC8vIFNpZ24taW4gb3B0aW9uc1xuICAgICAgc2lnbkluQWxpYXNlczoge1xuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgICAgcGhvbmU6IHRydWUsIC8vIFBob25lIHZlcmlmaWNhdGlvbiBmb3IgYWJ1c2UgcHJldmVudGlvbiAoeW91ciByZXF1aXJlbWVudClcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIEF1dG8tdmVyaWZpY2F0aW9uXG4gICAgICBhdXRvVmVyaWZ5OiB7XG4gICAgICAgIGVtYWlsOiB0cnVlLFxuICAgICAgICBwaG9uZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIFVzZXIgYXR0cmlidXRlc1xuICAgICAgc3RhbmRhcmRBdHRyaWJ1dGVzOiB7XG4gICAgICAgIGVtYWlsOiB7XG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgcGhvbmVOdW1iZXI6IHtcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBmdWxsbmFtZToge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG11dGFibGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBDdXN0b20gYXR0cmlidXRlcyBmb3IgeW91ciBwbGF0Zm9ybVxuICAgICAgY3VzdG9tQXR0cmlidXRlczoge1xuICAgICAgICBjb21wYW55X25hbWU6IG5ldyBjb2duaXRvLlN0cmluZ0F0dHJpYnV0ZSh7IFxuICAgICAgICAgIG1pbkxlbjogMCwgXG4gICAgICAgICAgbWF4TGVuOiAyNTUsIFxuICAgICAgICAgIG11dGFibGU6IHRydWUgXG4gICAgICAgIH0pLFxuICAgICAgICBzdWJzY3JpcHRpb25fcGxhbjogbmV3IGNvZ25pdG8uU3RyaW5nQXR0cmlidXRlKHsgXG4gICAgICAgICAgbWluTGVuOiAwLCBcbiAgICAgICAgICBtYXhMZW46IDUwLCBcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlIFxuICAgICAgICB9KSxcbiAgICAgICAgb25ib2FyZGluZ19jb21wbGV0ZWQ6IG5ldyBjb2duaXRvLkJvb2xlYW5BdHRyaWJ1dGUoeyBcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlIFxuICAgICAgICB9KSxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIFBhc3N3b3JkIHBvbGljeSAoc2VjdXJlIGJ1dCBub3Qgb3Zlcmx5IGNvbXBsZXgpXG4gICAgICBwYXNzd29yZFBvbGljeToge1xuICAgICAgICBtaW5MZW5ndGg6IDgsXG4gICAgICAgIHJlcXVpcmVMb3dlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVVcHBlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVEaWdpdHM6IHRydWUsXG4gICAgICAgIHJlcXVpcmVTeW1ib2xzOiBmYWxzZSwgLy8gS2VlcCBpdCB1c2VyLWZyaWVuZGx5XG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBBY2NvdW50IHJlY292ZXJ5XG4gICAgICBhY2NvdW50UmVjb3Zlcnk6IGNvZ25pdG8uQWNjb3VudFJlY292ZXJ5LkVNQUlMX0FORF9QSE9ORV9XSVRIT1VUX01GQSxcbiAgICAgIFxuICAgICAgLy8gU2VjdXJpdHkgZmVhdHVyZXNcbiAgICAgIGFkdmFuY2VkU2VjdXJpdHlNb2RlOiBjb2duaXRvLkFkdmFuY2VkU2VjdXJpdHlNb2RlLkVORk9SQ0VELFxuICAgICAgXG4gICAgICAvLyBEZXZpY2UgdHJhY2tpbmdcbiAgICAgIGRldmljZVRyYWNraW5nOiB7XG4gICAgICAgIGNoYWxsZW5nZVJlcXVpcmVkT25OZXdEZXZpY2U6IHRydWUsXG4gICAgICAgIGRldmljZU9ubHlSZW1lbWJlcmVkT25Vc2VyUHJvbXB0OiB0cnVlLFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8gQ2xlYW51cFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLCAvLyBEb24ndCBhY2NpZGVudGFsbHkgZGVsZXRlIHVzZXJzXG4gICAgfSk7XG5cbiAgICAvLyBVc2VyIFBvb2wgQ2xpZW50IGZvciB5b3VyIGZyb250ZW5kXG4gICAgdGhpcy51c2VyUG9vbENsaWVudCA9IG5ldyBjb2duaXRvLlVzZXJQb29sQ2xpZW50KHRoaXMsICdVc2VyUG9vbENsaWVudCcsIHtcbiAgICAgIHVzZXJQb29sOiB0aGlzLnVzZXJQb29sLFxuICAgICAgdXNlclBvb2xDbGllbnROYW1lOiBgJHtwcm9wcy5wcm9qZWN0TmFtZX0tJHtwcm9wcy5lbnZpcm9ubWVudH0tY2xpZW50YCxcbiAgICAgIFxuICAgICAgLy8gT0F1dGggY29uZmlndXJhdGlvblxuICAgICAgb0F1dGg6IHtcbiAgICAgICAgZmxvd3M6IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uQ29kZUdyYW50OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBzY29wZXM6IFtcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuRU1BSUwsXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLk9QRU5JRCxcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuUFJPRklMRSxcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuUEhPTkUsXG4gICAgICAgIF0sXG4gICAgICAgIGNhbGxiYWNrVXJsczogW1xuICAgICAgICAgICdodHRwczovL2FwcC5xdWFya2Zpbi5haS9hdXRoL2NhbGxiYWNrJyxcbiAgICAgICAgICAnaHR0cDovL2xvY2FsaG9zdDozMDAwL2F1dGgvY2FsbGJhY2snLCAvLyBGb3IgZGV2ZWxvcG1lbnRcbiAgICAgICAgXSxcbiAgICAgICAgbG9nb3V0VXJsczogW1xuICAgICAgICAgICdodHRwczovL2FwcC5xdWFya2Zpbi5haS9sb2dpbicsXG4gICAgICAgICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9sb2dpbicsXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBTZWN1cml0eSBzZXR0aW5nc1xuICAgICAgZ2VuZXJhdGVTZWNyZXQ6IGZhbHNlLCAvLyBTUEEgZG9lc24ndCBuZWVkIGNsaWVudCBzZWNyZXRcbiAgICAgIHByZXZlbnRVc2VyRXhpc3RlbmNlRXJyb3JzOiB0cnVlLFxuICAgICAgZW5hYmxlVG9rZW5SZXZvY2F0aW9uOiB0cnVlLFxuICAgICAgXG4gICAgICAvLyBUb2tlbiB2YWxpZGl0eVxuICAgICAgYWNjZXNzVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLFxuICAgICAgaWRUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uaG91cnMoMSksXG4gICAgICByZWZyZXNoVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxuICAgICAgXG4gICAgICAvLyBTdXBwb3J0ZWQgaWRlbnRpdHkgcHJvdmlkZXJzXG4gICAgICBzdXBwb3J0ZWRJZGVudGl0eVByb3ZpZGVyczogW1xuICAgICAgICBjb2duaXRvLlVzZXJQb29sQ2xpZW50SWRlbnRpdHlQcm92aWRlci5DT0dOSVRPLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFNraXAgSG9zdGVkIFVJIERvbWFpbiBmb3Igbm93IC0gY2FuIGFkZCBsYXRlciBpZiBuZWVkZWRcbiAgICAvLyB0aGlzLnVzZXJQb29sRG9tYWluID0gbmV3IGNvZ25pdG8uVXNlclBvb2xEb21haW4odGhpcywgJ1VzZXJQb29sRG9tYWluJywge1xuICAgIC8vICAgdXNlclBvb2w6IHRoaXMudXNlclBvb2wsXG4gICAgLy8gICBjb2duaXRvRG9tYWluOiB7XG4gICAgLy8gICAgIGRvbWFpblByZWZpeDogYCR7cHJvcHMucHJvamVjdE5hbWV9LSR7cHJvcHMuZW52aXJvbm1lbnR9LWF1dGgtJHtEYXRlLm5vdygpLnRvU3RyaW5nKCkuc2xpY2UoLTYpfWAsXG4gICAgLy8gICB9LFxuICAgIC8vIH0pO1xuXG4gICAgLy8gT3V0cHV0cyBmb3IgZnJvbnRlbmQgaW50ZWdyYXRpb25cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xJZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIElEJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3Byb3BzLnByb2plY3ROYW1lfS0ke3Byb3BzLmVudmlyb25tZW50fS11c2VyLXBvb2wtaWRgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sQ2xpZW50SWQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy51c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBDbGllbnQgSUQnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7cHJvcHMucHJvamVjdE5hbWV9LSR7cHJvcHMuZW52aXJvbm1lbnR9LXVzZXItcG9vbC1jbGllbnQtaWRgLFxuICAgIH0pO1xuXG4gICAgLy8gU2tpcCBkb21haW4gb3V0cHV0IGZvciBub3dcbiAgICAvLyBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xEb21haW5OYW1lJywge1xuICAgIC8vICAgdmFsdWU6IHRoaXMudXNlclBvb2xEb21haW4uZG9tYWluTmFtZSxcbiAgICAvLyAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgRG9tYWluJyxcbiAgICAvLyAgIGV4cG9ydE5hbWU6IGAke3Byb3BzLnByb2plY3ROYW1lfS0ke3Byb3BzLmVudmlyb25tZW50fS11c2VyLXBvb2wtZG9tYWluYCxcbiAgICAvLyB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDb2duaXRvQ29uZmlnJywge1xuICAgICAgdmFsdWU6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgcmVnaW9uOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgdXNlclBvb2xJZDogdGhpcy51c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgICB1c2VyUG9vbFdlYkNsaWVudElkOiB0aGlzLnVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICAgIC8vIFNpbXBsaWZpZWQgY29uZmlnIHdpdGhvdXQgZG9tYWluXG4gICAgICAgIG9hdXRoOiB7XG4gICAgICAgICAgc2NvcGU6IFsnZW1haWwnLCAnb3BlbmlkJywgJ3Byb2ZpbGUnLCAncGhvbmUnXSxcbiAgICAgICAgICByZWRpcmVjdFNpZ25JbjogJ2h0dHBzOi8vYXBwLnF1YXJrZmluLmFpL2F1dGgvY2FsbGJhY2snLFxuICAgICAgICAgIHJlZGlyZWN0U2lnbk91dDogJ2h0dHBzOi8vYXBwLnF1YXJrZmluLmFpL2xvZ2luJyxcbiAgICAgICAgICByZXNwb25zZVR5cGU6ICdjb2RlJyxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgZGVzY3JpcHRpb246ICdDb21wbGV0ZSBDb2duaXRvIGNvbmZpZ3VyYXRpb24gZm9yIGZyb250ZW5kJyxcbiAgICB9KTtcbiAgfVxufVxuIl19