# DevOps AWS Deployment

## Architecture

```text
GitHub → GitHub Actions → ECR → ECS Fargate → ALB → Users
                                      │
                                      └── S3
```

The ECS service runs two tasks behind an Application Load Balancer. The ALB sends traffic only to healthy tasks.

## AWS Services

- **ECR** — stores the production Docker image
- **ECS Fargate** — runs two application tasks
- **Application Load Balancer** — public entry point and health checks
- **S3** — stores uploaded images
- **IAM** — controls ECS, S3, and GitHub Actions permissions
- **CloudWatch Logs** — stores container logs

## Local Docker

Development:

```powershell
docker compose up --build
```

Production-like local run:

```powershell
docker compose -f docker-compose.yml up --build
```

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
