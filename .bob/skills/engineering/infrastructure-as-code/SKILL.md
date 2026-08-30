---
name: infrastructure-as-code
description: Infrastructure-as-code design and implementation skill for cloud provisioning using Terraform, Pulumi, CDK, or Bicep.
---

# Infrastructure as Code (IaC) Skill

## Objective
Provision all cloud infrastructure through version-controlled code. No manual console changes. All environments reproducible from code.

## Steps
1. **Assess** — identify cloud provider(s), existing infra, state backend, team IaC experience.
2. **Structure** — organise modules by concern: networking, compute, data, security, monitoring.
3. **Implement** — write IaC using project-chosen tool; follow module conventions.
4. **Variables** — parameterise per-environment values; never hardcode account IDs, regions, or secrets.
5. **State** — configure remote state with locking (S3+DynamoDB, Azure Storage, Terraform Cloud, GCS).
6. **Plan** — always `plan` before `apply`; review for unexpected destroy/replace operations.
7. **Security** — least-privilege IAM; no `*` permissions; encrypt all storage at rest; private subnets for compute.
8. **Validate** — `terraform validate`, `tfsec`/`checkov` static analysis, cost estimate before apply.
9. **Apply** — apply to dev first; promote to staging; production requires manual approval.

## Module structure (Terraform example)
```
infra/
  modules/
    networking/    # VPC, subnets, security groups, DNS
    compute/       # ECS/EKS/App Service, auto-scaling
    data/          # RDS, Redis, S3, backups
    security/      # IAM, KMS, WAF, Secrets Manager
    observability/ # CloudWatch, dashboards, alerts
  environments/
    dev/
    staging/
    production/
```

## Security baseline (always apply)
- All storage encrypted at rest (KMS-managed keys)
- No public S3 buckets; block public access at account level
- Security groups: deny all by default, allow only required ports/CIDRs
- IAM: roles not users for compute; no inline policies; use managed policies
- Logging: CloudTrail/Azure Monitor/Audit Logs enabled on all accounts
- Secrets: AWS Secrets Manager / Azure Key Vault / GCP Secret Manager — never in Terraform state

## Vertical-specific requirements
- **Regulated Financial Services**: dedicated VPC with private subnets only; WAF on all public endpoints; VPC flow logs; HSM for key management; separate CDE (Cardholder Data Environment) for PCI scope
- **Digital Commerce**: CDN (CloudFront/Azure Front Door) in front of all storefront; auto-scaling groups for compute; ElastiCache for session/cart; multi-AZ RDS
- **Travel and Service Operations and Service Operations**: multi-region active-active for availability engine; read replicas in each region; Route53 latency routing

Never apply infrastructure changes without a reviewed plan. Never fabricate apply results.
