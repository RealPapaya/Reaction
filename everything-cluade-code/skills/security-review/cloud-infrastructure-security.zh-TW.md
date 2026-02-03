| name | description |
|------|-------------|
| cloud-infrastructure-security | 當部署到雲端平台、設定基礎架構、管理 IAM 政策、設定記錄/監控、或實作 CI/CD 流程時使用此技能。提供符合最佳實踐的雲端安全性檢查清單。 |

# Cloud & Infrastructure Security Skill

此技能確保雲端基礎架構、CI/CD 流程與部署設定遵循安全性最佳實踐並符合產業標準。

## 何時啟用 (When to Activate)

- 部署應用程式到雲端平台 (AWS, Vercel, Railway, Cloudflare) 時
- 設定 IAM 角色 (Roles) 與權限 (Permissions) 時
- 設定 CI/CD 流程時
- 實作基礎架構即程式碼 (Infrastructure as Code - Terraform, CloudFormation) 時
- 設定記錄 (Logging) 與監控 (Monitoring) 時
- 在雲端環境管理機密資訊 (Secrets) 時
- 設定 CDN 與邊緣安全性 (Edge Security) 時
- 實作災難復原 (Disaster Recovery) 與備份策略時

## 雲端安全性檢查清單 (Cloud Security Checklist)

### 1. IAM 與存取控制 (IAM & Access Control)

#### 最小權限原則 (Principle of Least Privilege)

```yaml
# ✅ CORRECT: Minimal permissions
iam_role:
  permissions:
    - s3:GetObject  # Only read access
    - s3:ListBucket
  resources:
    - arn:aws:s3:::my-bucket/*  # Specific bucket only

# ❌ WRONG: Overly broad permissions
iam_role:
  permissions:
    - s3:*  # All S3 actions
  resources:
    - "*"  # All resources
```

#### 多因素驗證 (Multi-Factor Authentication, MFA)

```bash
# ALWAYS enable MFA for root/admin accounts
aws iam enable-mfa-device \
  --user-name admin \
  --serial-number arn:aws:iam::123456789:mfa/admin \
  --authentication-code1 123456 \
  --authentication-code2 789012
```

#### 驗證步驟 (Verification Steps)

- [ ] 生產環境中不使用 Root 帳號
- [ ] 所有特權帳號啟用 MFA
- [ ] 服務帳號 (Service accounts) 使用角色 (Roles)，而非長期憑證
- [ ] IAM 政策遵循最小權限
- [ ] 定期執行存取審查
- [ ] 輪替或移除未使用的憑證

### 2. 機密資訊管理 (Secrets Management)

#### 雲端機密管理器 (Cloud Secrets Managers)

```typescript
// ✅ CORRECT: Use cloud secrets manager
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager({ region: 'us-east-1' });
const secret = await client.getSecretValue({ SecretId: 'prod/api-key' });
const apiKey = JSON.parse(secret.SecretString).key;

// ❌ WRONG: Hardcoded or in environment variables only
const apiKey = process.env.API_KEY; // Not rotated, not audited
```

#### 機密資訊輪替 (Secrets Rotation)

```bash
# Set up automatic rotation for database credentials
aws secretsmanager rotate-secret \
  --secret-id prod/db-password \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:rotate \
  --rotation-rules AutomaticallyAfterDays=30
```

#### 驗證步驟 (Verification Steps)

- [ ] 所有機密資訊儲存在雲端機密管理器 (AWS Secrets Manager, Vercel Secrets)
- [ ] 資料庫憑證啟用自動輪替
- [ ] API keys 至少每季輪替一次
- [ ] 程式碼、logs 或錯誤訊息中沒有機密資訊
- [ ] 機密資訊存取啟用稽核記錄

### 3. 網路安全性 (Network Security)

#### VPC 與防火牆設定 (VPC and Firewall Configuration)

```terraform
# ✅ CORRECT: Restricted security group
resource "aws_security_group" "app" {
  name = "app-sg"
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]  # Internal VPC only
  }
  
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Only HTTPS outbound
  }
}

# ❌ WRONG: Open to the internet
resource "aws_security_group" "bad" {
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # All ports, all IPs!
  }
}
```

#### 驗證步驟 (Verification Steps)

- [ ] 資料庫不公開存取
- [ ] SSH/RDP ports 限制為僅 VPN/bastion 可存取
- [ ] 安全群組 (Security groups) 遵循最小權限
- [ ] 設定網路 ACLs
- [ ] 啟用 VPC flow logs

### 4. 記錄與監控 (Logging & Monitoring)

#### CloudWatch/Logging 設定

```typescript
// ✅ CORRECT: Comprehensive logging
import { CloudWatchLogsClient, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';

const logSecurityEvent = async (event: SecurityEvent) => {
  await cloudwatch.putLogEvents({
    logGroupName: '/aws/security/events',
    logStreamName: 'authentication',
    logEvents: [{
      timestamp: Date.now(),
      message: JSON.stringify({
        type: event.type,
        userId: event.userId,
        ip: event.ip,
        result: event.result,
        // Never log sensitive data
      })
    }]
  });
};
```

#### 驗證步驟 (Verification Steps)

- [ ] 所有服務啟用 CloudWatch/logging
- [ ] 記錄失敗的認證嘗試
- [ ] 稽核管理員 (Admin) 動作
- [ ] 設定日誌保留期 (合規性要求通常為 90+ 天)
- [ ] 為可疑活動設定警報
- [ ] Logs 集中化且防篡改

### 5. CI/CD 流程安全性 (CI/CD Pipeline Security)

#### 安全的 Pipeline 設定

```yaml
# ✅ CORRECT: Secure GitHub Actions workflow
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read  # Minimal permissions
      
    steps:
      - uses: actions/checkout@v4
      
      # Scan for secrets
      - name: Secret scanning
        uses: trufflesecurity/trufflehog@main
        
      # Dependency audit
      - name: Audit dependencies
        run: npm audit --audit-level=high
        
      # Use OIDC, not long-lived tokens
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubActionsRole
          aws-region: us-east-1
```

#### 供應鏈安全 (Supply Chain Security)

```json
// package.json - Use lock files and integrity checks
{
  "scripts": {
    "install": "npm ci",  // Use ci for reproducible builds
    "audit": "npm audit --audit-level=moderate",
    "check": "npm outdated"
  }
}
```

#### 驗證步驟 (Verification Steps)

- [ ] 使用 OIDC 而非長期憑證
- [ ] Pipeline 中進行機密資訊掃描
- [ ] 相依性弱點掃描
- [ ] 容器映像掃描 (如適用)
- [ ] 強制執行分支保護規則
- [ ] 合併前需要程式碼審查
- [ ] 強制執行簽署的提交 (Signed commits)

### 6. Cloudflare & CDN 安全性

#### Cloudflare 安全設定

```typescript
// ✅ CORRECT: Cloudflare Workers with security headers
export default {
  async fetch(request: Request): Promise<Response> {
    const response = await fetch(request);
    
    // Add security headers
    const headers = new Headers(response.headers);
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'geolocation=(), microphone=()');
    
    return new Response(response.body, {
      status: response.status,
      headers
    });
  }
};
```

#### WAF 規則 (WAF Rules)

```bash
# Enable Cloudflare WAF managed rules
# - OWASP Core Ruleset
# - Cloudflare Managed Ruleset
# - Rate limiting rules
# - Bot protection
```

#### 驗證步驟 (Verification Steps)

- [ ] 啟用 WAF 並套用 OWASP 規則
- [ ] 設定速率限制
- [ ] 機器人保護 (Bot protection) 啟用
- [ ] DDoS 保護啟用
- [ ] 設定安全性 Headers
- [ ] 啟用 SSL/TLS 嚴格模式 (Strict mode)

### 7. 備份與災難復原 (Backup & Disaster Recovery)

#### 自動化備份

```terraform
# ✅ CORRECT: Automated RDS backups
resource "aws_db_instance" "main" {
  allocated_storage     = 20
  engine               = "postgres"
  
  backup_retention_period = 30  # 30 days retention
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  deletion_protection = true  # Prevent accidental deletion
}
```

#### 驗證步驟 (Verification Steps)

- [ ] 設定自動化每日備份
- [ ] 備份保留期符合合規性要求
- [ ] 啟用時間點復原 (Point-in-time recovery)
- [ ] 每季執行備份測試
- [ ] 記錄災難復原計畫
- [ ] 定義並測試 RPO 與 RTO

## 部署前雲端安全性檢查清單 (Pre-Deployment Cloud Security Checklist)

在任何生產環境雲端部署之前：

- [ ] **IAM**：不使用 Root 帳號、啟用 MFA、最小權限政策
- [ ] **機密資訊**：所有機密資訊在雲端機密管理器中並啟用輪替
- [ ] **網路**：限制安全群組、沒有公開資料庫
- [ ] **記錄**：啟用 CloudWatch/logging 並設定保留期
- [ ] **監控**：為異常設定警報
- [ ] **CI/CD**：OIDC 認證、機密資訊掃描、相依性稽核
- [ ] **CDN/WAF**：啟用 Cloudflare WAF 並套用 OWASP 規則
- [ ] **加密**：靜態與傳輸中資料皆加密
- [ ] **備份**：自動化備份並測試復原
- [ ] **合規性**：符合 GDPR/HIPAA 要求 (如適用)
- [ ] **文件**：基礎架構已記錄、操作手冊 (Runbooks) 已建立
- [ ] **事件回應**：安全性事件回應計畫已就位

## 常見的雲端安全性錯誤設定 (Common Cloud Security Misconfigurations)

### S3 Bucket 暴露

```bash
# ❌ WRONG: Public bucket
aws s3api put-bucket-acl --bucket my-bucket --acl public-read

# ✅ CORRECT: Private bucket with specific access
aws s3api put-bucket-acl --bucket my-bucket --acl private
aws s3api put-bucket-policy --bucket my-bucket --policy file://policy.json
```

### RDS 公開存取

```terraform
# ❌ WRONG
resource "aws_db_instance" "bad" {
  publicly_accessible = true  # NEVER do this!
}

# ✅ CORRECT
resource "aws_db_instance" "good" {
  publicly_accessible = false
  vpc_security_group_ids = [aws_security_group.db.id]
}
```

## 資源 (Resources)

- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services)
- [Cloudflare Security Documentation](https://developers.cloudflare.com/security/)
- [OWASP Cloud Security](https://owasp.org/www-project-cloud-security/)
- [Terraform Security Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/)

**請記住**：雲端錯誤設定是資料外洩的主要原因。單一暴露的 S3 bucket 或過度寬鬆的 IAM 政策都可能危害您的整個基礎架構。務必遵循最小權限原則與縱深防禦 (defense in depth)。
