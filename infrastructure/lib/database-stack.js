"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuarkfinDatabaseStack = void 0;
const cdk = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const rds = require("aws-cdk-lib/aws-rds");
const secretsmanager = require("aws-cdk-lib/aws-secretsmanager");
class QuarkfinDatabaseStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create database subnet group
        const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
            description: 'Subnet group for QuarkfinAI database',
            vpc: props.vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            subnetGroupName: `${props.projectName}-${props.environment}-db-subnet-group`,
        });
        // Database credentials (AWS-managed secret)
        this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
            secretName: `${props.projectName}/${props.environment}/database`,
            description: 'Database credentials for QuarkfinAI',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: 'quarkfin_admin' }),
                generateStringKey: 'password',
                excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
                passwordLength: 16,
            },
        });
        // Use security group from security stack
        const dbSecurityGroup = props.databaseSecurityGroup;
        // RDS PostgreSQL instance (managed, simple, secure)
        this.database = new rds.DatabaseInstance(this, 'Database', {
            instanceIdentifier: `${props.projectName}-${props.environment}-db`,
            // Use default PostgreSQL engine (most compatible)
            engine: rds.DatabaseInstanceEngine.POSTGRES,
            // Right-sized for startup
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            // Storage
            allocatedStorage: 20,
            storageType: rds.StorageType.GP2,
            storageEncrypted: true,
            // Database configuration
            databaseName: 'quarkfin_production',
            credentials: rds.Credentials.fromSecret(this.databaseSecret),
            // Network
            vpc: props.vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups: [dbSecurityGroup],
            subnetGroup: dbSubnetGroup,
            // Security
            multiAz: false,
            publiclyAccessible: false,
            // Backups
            backupRetention: cdk.Duration.days(7),
            deleteAutomatedBackups: false,
            deletionProtection: false,
            // Monitoring
            enablePerformanceInsights: false,
            monitoringInterval: cdk.Duration.seconds(0),
            // Maintenance
            autoMinorVersionUpgrade: true,
            allowMajorVersionUpgrade: false,
        });
        // Create a Lambda function to initialize the database schema
        // (We'll add this later for automatic schema setup)
        // Outputs
        new cdk.CfnOutput(this, 'DatabaseEndpoint', {
            value: this.database.instanceEndpoint.hostname,
            description: 'Database endpoint',
            exportName: `${props.projectName}-${props.environment}-db-endpoint`,
        });
        new cdk.CfnOutput(this, 'DatabaseSecretArn', {
            value: this.databaseSecret.secretArn,
            description: 'Database secret ARN',
            exportName: `${props.projectName}-${props.environment}-db-secret-arn`,
        });
        // Security group output removed (managed by SecurityStack)
    }
}
exports.QuarkfinDatabaseStack = QuarkfinDatabaseStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkYXRhYmFzZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyxpRUFBaUU7QUFVakUsTUFBYSxxQkFBc0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUlsRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWlDO1FBQ3pFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLCtCQUErQjtRQUMvQixNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQ3JFLFdBQVcsRUFBRSxzQ0FBc0M7WUFDbkQsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHO1lBQ2QsVUFBVSxFQUFFO2dCQUNWLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLG1CQUFtQjthQUMvQztZQUNELGVBQWUsRUFBRSxHQUFHLEtBQUssQ0FBQyxXQUFXLElBQUksS0FBSyxDQUFDLFdBQVcsa0JBQWtCO1NBQzdFLENBQUMsQ0FBQztRQUVILDRDQUE0QztRQUM1QyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDdEUsVUFBVSxFQUFFLEdBQUcsS0FBSyxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsV0FBVyxXQUFXO1lBQ2hFLFdBQVcsRUFBRSxxQ0FBcUM7WUFDbEQsb0JBQW9CLEVBQUU7Z0JBQ3BCLG9CQUFvQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDcEUsaUJBQWlCLEVBQUUsVUFBVTtnQkFDN0IsaUJBQWlCLEVBQUUsK0JBQStCO2dCQUNsRCxjQUFjLEVBQUUsRUFBRTthQUNuQjtTQUNGLENBQUMsQ0FBQztRQUVILHlDQUF5QztRQUN6QyxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUM7UUFFcEQsb0RBQW9EO1FBQ3BELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUN6RCxrQkFBa0IsRUFBRSxHQUFHLEtBQUssQ0FBQyxXQUFXLElBQUksS0FBSyxDQUFDLFdBQVcsS0FBSztZQUNsRSxrREFBa0Q7WUFDbEQsTUFBTSxFQUFFLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRO1lBRTNDLDBCQUEwQjtZQUMxQixZQUFZLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFFL0UsVUFBVTtZQUNWLGdCQUFnQixFQUFFLEVBQUU7WUFDcEIsV0FBVyxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRztZQUNoQyxnQkFBZ0IsRUFBRSxJQUFJO1lBRXRCLHlCQUF5QjtZQUN6QixZQUFZLEVBQUUscUJBQXFCO1lBQ25DLFdBQVcsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDO1lBRTVELFVBQVU7WUFDVixHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUc7WUFDZCxVQUFVLEVBQUU7Z0JBQ1YsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO2FBQy9DO1lBQ0QsY0FBYyxFQUFFLENBQUMsZUFBZSxDQUFDO1lBQ2pDLFdBQVcsRUFBRSxhQUFhO1lBRTFCLFdBQVc7WUFDWCxPQUFPLEVBQUUsS0FBSztZQUNkLGtCQUFrQixFQUFFLEtBQUs7WUFFekIsVUFBVTtZQUNWLGVBQWUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckMsc0JBQXNCLEVBQUUsS0FBSztZQUM3QixrQkFBa0IsRUFBRSxLQUFLO1lBRXpCLGFBQWE7WUFDYix5QkFBeUIsRUFBRSxLQUFLO1lBQ2hDLGtCQUFrQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUUzQyxjQUFjO1lBQ2QsdUJBQXVCLEVBQUUsSUFBSTtZQUM3Qix3QkFBd0IsRUFBRSxLQUFLO1NBQ2hDLENBQUMsQ0FBQztRQUVILDZEQUE2RDtRQUM3RCxvREFBb0Q7UUFFcEQsVUFBVTtRQUNWLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDMUMsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsUUFBUTtZQUM5QyxXQUFXLEVBQUUsbUJBQW1CO1lBQ2hDLFVBQVUsRUFBRSxHQUFHLEtBQUssQ0FBQyxXQUFXLElBQUksS0FBSyxDQUFDLFdBQVcsY0FBYztTQUNwRSxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzNDLEtBQUssRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVM7WUFDcEMsV0FBVyxFQUFFLHFCQUFxQjtZQUNsQyxVQUFVLEVBQUUsR0FBRyxLQUFLLENBQUMsV0FBVyxJQUFJLEtBQUssQ0FBQyxXQUFXLGdCQUFnQjtTQUN0RSxDQUFDLENBQUM7UUFFSCwyREFBMkQ7SUFDN0QsQ0FBQztDQUNGO0FBOUZELHNEQThGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyByZHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJkcyc7XG5pbXBvcnQgKiBhcyBzZWNyZXRzbWFuYWdlciBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc2VjcmV0c21hbmFnZXInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUXVhcmtmaW5EYXRhYmFzZVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIHByb2plY3ROYW1lOiBzdHJpbmc7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIHZwYzogZWMyLlZwYztcbiAgZGF0YWJhc2VTZWN1cml0eUdyb3VwOiBlYzIuU2VjdXJpdHlHcm91cDtcbn1cblxuZXhwb3J0IGNsYXNzIFF1YXJrZmluRGF0YWJhc2VTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBkYXRhYmFzZTogcmRzLkRhdGFiYXNlSW5zdGFuY2U7XG4gIHB1YmxpYyByZWFkb25seSBkYXRhYmFzZVNlY3JldDogc2VjcmV0c21hbmFnZXIuU2VjcmV0O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBRdWFya2ZpbkRhdGFiYXNlU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gQ3JlYXRlIGRhdGFiYXNlIHN1Ym5ldCBncm91cFxuICAgIGNvbnN0IGRiU3VibmV0R3JvdXAgPSBuZXcgcmRzLlN1Ym5ldEdyb3VwKHRoaXMsICdEYXRhYmFzZVN1Ym5ldEdyb3VwJywge1xuICAgICAgZGVzY3JpcHRpb246ICdTdWJuZXQgZ3JvdXAgZm9yIFF1YXJrZmluQUkgZGF0YWJhc2UnLFxuICAgICAgdnBjOiBwcm9wcy52cGMsXG4gICAgICB2cGNTdWJuZXRzOiB7XG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICB9LFxuICAgICAgc3VibmV0R3JvdXBOYW1lOiBgJHtwcm9wcy5wcm9qZWN0TmFtZX0tJHtwcm9wcy5lbnZpcm9ubWVudH0tZGItc3VibmV0LWdyb3VwYCxcbiAgICB9KTtcblxuICAgIC8vIERhdGFiYXNlIGNyZWRlbnRpYWxzIChBV1MtbWFuYWdlZCBzZWNyZXQpXG4gICAgdGhpcy5kYXRhYmFzZVNlY3JldCA9IG5ldyBzZWNyZXRzbWFuYWdlci5TZWNyZXQodGhpcywgJ0RhdGFiYXNlU2VjcmV0Jywge1xuICAgICAgc2VjcmV0TmFtZTogYCR7cHJvcHMucHJvamVjdE5hbWV9LyR7cHJvcHMuZW52aXJvbm1lbnR9L2RhdGFiYXNlYCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGF0YWJhc2UgY3JlZGVudGlhbHMgZm9yIFF1YXJrZmluQUknLFxuICAgICAgZ2VuZXJhdGVTZWNyZXRTdHJpbmc6IHtcbiAgICAgICAgc2VjcmV0U3RyaW5nVGVtcGxhdGU6IEpTT04uc3RyaW5naWZ5KHsgdXNlcm5hbWU6ICdxdWFya2Zpbl9hZG1pbicgfSksXG4gICAgICAgIGdlbmVyYXRlU3RyaW5nS2V5OiAncGFzc3dvcmQnLFxuICAgICAgICBleGNsdWRlQ2hhcmFjdGVyczogJyAlK35gIyQmKigpfFtde306Ozw+PyFcXCcvQFwiXFxcXCcsXG4gICAgICAgIHBhc3N3b3JkTGVuZ3RoOiAxNixcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBVc2Ugc2VjdXJpdHkgZ3JvdXAgZnJvbSBzZWN1cml0eSBzdGFja1xuICAgIGNvbnN0IGRiU2VjdXJpdHlHcm91cCA9IHByb3BzLmRhdGFiYXNlU2VjdXJpdHlHcm91cDtcblxuICAgIC8vIFJEUyBQb3N0Z3JlU1FMIGluc3RhbmNlIChtYW5hZ2VkLCBzaW1wbGUsIHNlY3VyZSlcbiAgICB0aGlzLmRhdGFiYXNlID0gbmV3IHJkcy5EYXRhYmFzZUluc3RhbmNlKHRoaXMsICdEYXRhYmFzZScsIHtcbiAgICAgIGluc3RhbmNlSWRlbnRpZmllcjogYCR7cHJvcHMucHJvamVjdE5hbWV9LSR7cHJvcHMuZW52aXJvbm1lbnR9LWRiYCxcbiAgICAgIC8vIFVzZSBkZWZhdWx0IFBvc3RncmVTUUwgZW5naW5lIChtb3N0IGNvbXBhdGlibGUpXG4gICAgICBlbmdpbmU6IHJkcy5EYXRhYmFzZUluc3RhbmNlRW5naW5lLlBPU1RHUkVTLFxuICAgICAgXG4gICAgICAvLyBSaWdodC1zaXplZCBmb3Igc3RhcnR1cFxuICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKGVjMi5JbnN0YW5jZUNsYXNzLlQzLCBlYzIuSW5zdGFuY2VTaXplLk1JQ1JPKSxcbiAgICAgIFxuICAgICAgLy8gU3RvcmFnZVxuICAgICAgYWxsb2NhdGVkU3RvcmFnZTogMjAsXG4gICAgICBzdG9yYWdlVHlwZTogcmRzLlN0b3JhZ2VUeXBlLkdQMixcbiAgICAgIHN0b3JhZ2VFbmNyeXB0ZWQ6IHRydWUsIC8vIEVuY3J5cHRlZCBieSBkZWZhdWx0XG4gICAgICBcbiAgICAgIC8vIERhdGFiYXNlIGNvbmZpZ3VyYXRpb25cbiAgICAgIGRhdGFiYXNlTmFtZTogJ3F1YXJrZmluX3Byb2R1Y3Rpb24nLFxuICAgICAgY3JlZGVudGlhbHM6IHJkcy5DcmVkZW50aWFscy5mcm9tU2VjcmV0KHRoaXMuZGF0YWJhc2VTZWNyZXQpLFxuICAgICAgXG4gICAgICAvLyBOZXR3b3JrXG4gICAgICB2cGM6IHByb3BzLnZwYyxcbiAgICAgIHZwY1N1Ym5ldHM6IHtcbiAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9XSVRIX0VHUkVTUyxcbiAgICAgIH0sXG4gICAgICBzZWN1cml0eUdyb3VwczogW2RiU2VjdXJpdHlHcm91cF0sXG4gICAgICBzdWJuZXRHcm91cDogZGJTdWJuZXRHcm91cCxcbiAgICAgIFxuICAgICAgLy8gU2VjdXJpdHlcbiAgICAgIG11bHRpQXo6IGZhbHNlLCAvLyBTaW5nbGUgQVogZm9yIGNvc3Qgb3B0aW1pemF0aW9uXG4gICAgICBwdWJsaWNseUFjY2Vzc2libGU6IGZhbHNlLCAvLyBORVZFUiBleHBvc2UgdG8gaW50ZXJuZXRcbiAgICAgIFxuICAgICAgLy8gQmFja3Vwc1xuICAgICAgYmFja3VwUmV0ZW50aW9uOiBjZGsuRHVyYXRpb24uZGF5cyg3KSxcbiAgICAgIGRlbGV0ZUF1dG9tYXRlZEJhY2t1cHM6IGZhbHNlLFxuICAgICAgZGVsZXRpb25Qcm90ZWN0aW9uOiBmYWxzZSwgLy8gQWxsb3cgZGVsZXRpb24gZm9yIGRldlxuICAgICAgXG4gICAgICAvLyBNb25pdG9yaW5nXG4gICAgICBlbmFibGVQZXJmb3JtYW5jZUluc2lnaHRzOiBmYWxzZSwgLy8gS2VlcCBjb3N0cyBkb3duXG4gICAgICBtb25pdG9yaW5nSW50ZXJ2YWw6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDApLCAvLyBObyBlbmhhbmNlZCBtb25pdG9yaW5nXG4gICAgICBcbiAgICAgIC8vIE1haW50ZW5hbmNlXG4gICAgICBhdXRvTWlub3JWZXJzaW9uVXBncmFkZTogdHJ1ZSxcbiAgICAgIGFsbG93TWFqb3JWZXJzaW9uVXBncmFkZTogZmFsc2UsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYSBMYW1iZGEgZnVuY3Rpb24gdG8gaW5pdGlhbGl6ZSB0aGUgZGF0YWJhc2Ugc2NoZW1hXG4gICAgLy8gKFdlJ2xsIGFkZCB0aGlzIGxhdGVyIGZvciBhdXRvbWF0aWMgc2NoZW1hIHNldHVwKVxuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEYXRhYmFzZUVuZHBvaW50Jywge1xuICAgICAgdmFsdWU6IHRoaXMuZGF0YWJhc2UuaW5zdGFuY2VFbmRwb2ludC5ob3N0bmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGF0YWJhc2UgZW5kcG9pbnQnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7cHJvcHMucHJvamVjdE5hbWV9LSR7cHJvcHMuZW52aXJvbm1lbnR9LWRiLWVuZHBvaW50YCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEYXRhYmFzZVNlY3JldEFybicsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmRhdGFiYXNlU2VjcmV0LnNlY3JldEFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGF0YWJhc2Ugc2VjcmV0IEFSTicsXG4gICAgICBleHBvcnROYW1lOiBgJHtwcm9wcy5wcm9qZWN0TmFtZX0tJHtwcm9wcy5lbnZpcm9ubWVudH0tZGItc2VjcmV0LWFybmAsXG4gICAgfSk7XG5cbiAgICAvLyBTZWN1cml0eSBncm91cCBvdXRwdXQgcmVtb3ZlZCAobWFuYWdlZCBieSBTZWN1cml0eVN0YWNrKVxuICB9XG59XG4iXX0=