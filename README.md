# DevOps AWS Deployment

## Architecture

```text
GitHub
   │
   ▼
GitHub Actions
   │
   ├── OIDC authentication
   ├── Build Docker image
   └── Push image to ECR
                    │
                    ▼
              ECS Service
                    │
                    ▼
              ECS Fargate
               ├── Task 1
               └── Task 2
                    │
                    ▼
                   S3

User ───────────► ALB ───────────► ECS Tasks
```

The ECS service runs two tasks behind an Application Load Balancer. The ALB sends traffic only to healthy tasks.

## AWS Services

- **ECR** — stores the production Docker image
- **ECS Fargate** — runs two application tasks
- **Application Load Balancer** — public entry point and health checks
- **S3** — stores uploaded images
- **IAM** — controls ECS, S3, and GitHub Actions permissions

## CI/CD

Pushes to `master` start GitHub Actions:

```text
Build production image → Push image to ECR → Update ECS service
```

GitHub authenticates with AWS using OIDC. No long-lived AWS keys are stored in GitHub or the Docker image. Images are tagged with the Git commit SHA.

## IAM

- The **ECS execution role** pulls images from ECR and writes logs.
- The **ECS task role** allows the application to upload objects to S3.
- The **GitHub Actions role** can push to ECR and deploy the ECS service.

Each role has a separate purpose and limited permissions.

## Zero-Downtime Deployment

ECS uses a rolling deployment with:

- Minimum healthy tasks: `100%`
- Maximum tasks during deployment: `200%`
- ALB health checks
- Deployment rollback enabled

New tasks become healthy before old tasks are removed.

## Validation

- Two ECS tasks are running.
- Both ALB targets are healthy.
- The application is available through the ALB DNS name.
- Image uploads succeed through the ECS task role.
- During deployment, repeated requests continue returning HTTP `200`.

## Problems Encountered and Solutions

- **ECS service-linked role error:** ECS could not create the cluster until the `AWSServiceRoleForECS` service-linked role existed.
- **GitHub OIDC authentication failure:** The GitHub Actions role trust policy did not match GitHub's exact repository and branch identity. The trust policy was updated to match the OIDC `sub` claim for `master`.
- **ECR permission failure:** GitHub Actions was missing required ECR permissions, including `ecr:BatchGetImage`. The permissions were added to the GitHub Actions role.
- **ECS deployment permission failure:** GitHub Actions was missing `iam:PassRole` for the ECS execution and task roles. The permission was added with the roles restricted to the required ARNs.
- **ECS task startup failure:** After the NAT Gateway was removed, tasks could not reach ECR. A new NAT Gateway and a private-subnet route to it restored outbound connectivity.
