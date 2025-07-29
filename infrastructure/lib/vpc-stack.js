"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuarkfinVpcStack = void 0;
const cdk = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
class QuarkfinVpcStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Simple 2-tier VPC (Public + Private) - no over-engineering
        this.vpc = new ec2.Vpc(this, 'QuarkfinVpc', {
            vpcName: `${props.projectName}-${props.environment}-vpc`,
            cidr: '10.0.0.0/16',
            maxAzs: 2,
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
exports.QuarkfinVpcStack = QuarkfinVpcStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidnBjLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQywyQ0FBMkM7QUFRM0MsTUFBYSxnQkFBaUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUc3QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTRCO1FBQ3BFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDZEQUE2RDtRQUM3RCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQzFDLE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQyxXQUFXLElBQUksS0FBSyxDQUFDLFdBQVcsTUFBTTtZQUN4RCxJQUFJLEVBQUUsYUFBYTtZQUNuQixNQUFNLEVBQUUsQ0FBQztZQUVULDhCQUE4QjtZQUM5QixtQkFBbUIsRUFBRTtnQkFDbkI7b0JBQ0UsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTTtvQkFDakMsUUFBUSxFQUFFLEVBQUU7aUJBQ2I7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO29CQUM5QyxRQUFRLEVBQUUsRUFBRTtpQkFDYjthQUNGO1lBRUQseUNBQXlDO1lBQ3pDLFdBQVcsRUFBRSxDQUFDO1lBRWQsYUFBYTtZQUNiLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsZ0JBQWdCLEVBQUUsSUFBSTtTQUN2QixDQUFDLENBQUM7UUFFSCw4Q0FBOEM7UUFDOUMsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDbEMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUN2RCxXQUFXLEVBQUUsR0FBRyxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixFQUFFO1lBQ3RELFdBQVcsRUFBRSxHQUFHLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLDRCQUE0QjtTQUN6RSxDQUFDLENBQUM7UUFFSCwwQ0FBMEM7UUFDMUMsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUU7WUFDL0IsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSztZQUNyQixXQUFXLEVBQUUsUUFBUTtZQUNyQixVQUFVLEVBQUUsR0FBRyxLQUFLLENBQUMsV0FBVyxJQUFJLEtBQUssQ0FBQyxXQUFXLFNBQVM7U0FDL0QsQ0FBQyxDQUFDO1FBRUgsb0JBQW9CO1FBQ3BCLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDekMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVELFdBQVcsRUFBRSxtQkFBbUI7WUFDaEMsVUFBVSxFQUFFLEdBQUcsS0FBSyxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsV0FBVyxpQkFBaUI7U0FDdkUsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUMxQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDN0QsV0FBVyxFQUFFLG9CQUFvQjtZQUNqQyxVQUFVLEVBQUUsR0FBRyxLQUFLLENBQUMsV0FBVyxJQUFJLEtBQUssQ0FBQyxXQUFXLGtCQUFrQjtTQUN4RSxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE3REQsNENBNkRDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFF1YXJrZmluVnBjU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgcHJvamVjdE5hbWU6IHN0cmluZztcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFF1YXJrZmluVnBjU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgdnBjOiBlYzIuVnBjO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBRdWFya2ZpblZwY1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIFNpbXBsZSAyLXRpZXIgVlBDIChQdWJsaWMgKyBQcml2YXRlKSAtIG5vIG92ZXItZW5naW5lZXJpbmdcbiAgICB0aGlzLnZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdRdWFya2ZpblZwYycsIHtcbiAgICAgIHZwY05hbWU6IGAke3Byb3BzLnByb2plY3ROYW1lfS0ke3Byb3BzLmVudmlyb25tZW50fS12cGNgLFxuICAgICAgY2lkcjogJzEwLjAuMC4wLzE2JyxcbiAgICAgIG1heEF6czogMiwgLy8gS2VlcCBpdCBzaW1wbGUsIDIgQVpzIG9ubHlcbiAgICAgIFxuICAgICAgLy8gU2ltcGxlIHN1Ym5ldCBjb25maWd1cmF0aW9uXG4gICAgICBzdWJuZXRDb25maWd1cmF0aW9uOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnUHVibGljJyxcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMsXG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ1ByaXZhdGUnLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIFxuICAgICAgLy8gU2luZ2xlIE5BVCBHYXRld2F5IChjb3N0IG9wdGltaXphdGlvbilcbiAgICAgIG5hdEdhdGV3YXlzOiAxLFxuICAgICAgXG4gICAgICAvLyBFbmFibGUgRE5TXG4gICAgICBlbmFibGVEbnNIb3N0bmFtZXM6IHRydWUsXG4gICAgICBlbmFibGVEbnNTdXBwb3J0OiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gQmFzaWMgVlBDIEZsb3cgTG9ncyBmb3Igc2VjdXJpdHkgbW9uaXRvcmluZ1xuICAgIG5ldyBlYzIuRmxvd0xvZyh0aGlzLCAnVnBjRmxvd0xvZycsIHtcbiAgICAgIHJlc291cmNlVHlwZTogZWMyLkZsb3dMb2dSZXNvdXJjZVR5cGUuZnJvbVZwYyh0aGlzLnZwYyksXG4gICAgICBkZXN0aW5hdGlvbjogZWMyLkZsb3dMb2dEZXN0aW5hdGlvbi50b0Nsb3VkV2F0Y2hMb2dzKCksXG4gICAgICB0cmFmZmljVHlwZTogZWMyLkZsb3dMb2dUcmFmZmljVHlwZS5SRUpFQ1QsIC8vIE9ubHkgbG9nIHJlamVjdGVkIHRyYWZmaWNcbiAgICB9KTtcblxuICAgIC8vIE91dHB1dCBWUEMgSUQgZm9yIGNyb3NzLXN0YWNrIHJlZmVyZW5jZVxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdWcGNJZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnZwYy52cGNJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVlBDIElEJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3Byb3BzLnByb2plY3ROYW1lfS0ke3Byb3BzLmVudmlyb25tZW50fS12cGMtaWRgLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0IHN1Ym5ldCBJRHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUHVibGljU3VibmV0SWRzJywge1xuICAgICAgdmFsdWU6IHRoaXMudnBjLnB1YmxpY1N1Ym5ldHMubWFwKHMgPT4gcy5zdWJuZXRJZCkuam9pbignLCcpLFxuICAgICAgZGVzY3JpcHRpb246ICdQdWJsaWMgU3VibmV0IElEcycsXG4gICAgICBleHBvcnROYW1lOiBgJHtwcm9wcy5wcm9qZWN0TmFtZX0tJHtwcm9wcy5lbnZpcm9ubWVudH0tcHVibGljLXN1Ym5ldHNgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1ByaXZhdGVTdWJuZXRJZHMnLCB7XG4gICAgICB2YWx1ZTogdGhpcy52cGMucHJpdmF0ZVN1Ym5ldHMubWFwKHMgPT4gcy5zdWJuZXRJZCkuam9pbignLCcpLFxuICAgICAgZGVzY3JpcHRpb246ICdQcml2YXRlIFN1Ym5ldCBJRHMnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7cHJvcHMucHJvamVjdE5hbWV9LSR7cHJvcHMuZW52aXJvbm1lbnR9LXByaXZhdGUtc3VibmV0c2AsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==