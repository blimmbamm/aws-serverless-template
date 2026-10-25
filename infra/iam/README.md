# GitHub Actions deploy IAM policy

Start policy for role `github-actions-serverless-template` (replaces `AdministratorAccess`).

## Idea

CDK bootstrap already has powerful roles (`cfn-exec-role`, file publishing, …).  
This policy only lets GitHub Actions **assume those roles**, talk to CloudFormation for `ServerlessTemplateStack`, and touch the CDK assets bucket — not admin the whole account.

Resource creation (Lambda, Cognito, …) still runs as `cdk-hnb659fds-cfn-exec-role-…` (often still broad by CDK default). You tighten the *CI entrypoint*; full least-privilege on `cfn-exec` is a separate step.

## Apply (Console)

1. IAM → Policies → **Create policy** → JSON → paste [`github-actions-deploy-policy.json`](./github-actions-deploy-policy.json)
2. Name e.g. `github-actions-serverless-template-deploy`
3. IAM → Roles → `github-actions-serverless-template`
4. Attach the new policy
5. Detach **AdministratorAccess**
6. Re-run the **Deploy** workflow

## If deploy fails with AccessDenied

1. Read the Actions log / CloudTrail `AccessDenied`
2. Add the missing action (or temporarily re-attach Admin to unblock)
3. Iterate

Common extras people need:

- Broader `cloudformation:*` on `Resource: *` while debugging
- `iam:GetRole` on the CDK roles (rarely)

## Trust policy (unchanged)

Keep the OIDC trust as-is, e.g.:

```text
repo:blimmbamm*/aws-serverless-template*:ref:refs/heads/main
```
