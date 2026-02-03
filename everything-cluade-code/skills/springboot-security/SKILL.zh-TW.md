---
name: springboot-security
description: Spring Java 服務中關於 authn/authz、驗證、CSRF、機密資訊、Headers、速率限制與相依性安全的 Spring Security 最佳實踐。
---

# Spring Boot Security Review

當新增認證、處理輸入、建立端點或處理機密資訊時使用。

## 認證 (Authentication)

- 偏好無狀態 JWT 或帶有撤銷列表的不透明 (opaque) tokens
- 對於 Sessions 使用 `httpOnly`, `Secure`, `SameSite=Strict` cookies
- 使用 `OncePerRequestFilter` 或資源伺服器驗證 tokens

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtService jwtService;

  public JwtAuthFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain chain) throws ServletException, IOException {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      Authentication auth = jwtService.authenticate(token);
      SecurityContextHolder.getContext().setAuthentication(auth);
    }
    chain.doFilter(request, response);
  }
}
```

## 授權 (Authorization)

- 啟用方法安全：`@EnableMethodSecurity`
- 使用 `@PreAuthorize("hasRole('ADMIN')")` 或 `@PreAuthorize("@authz.canEdit(#id)")`
- 預設拒絕；只暴露所需的 scopes

## 輸入驗證 (Input Validation)

- 在 Controllers 上使用帶有 `@Valid` 的 Bean Validation
- 在 DTOs 上應用約束：`@NotBlank`, `@Email`, `@Size`, 自訂驗證器
- 在渲染前清理任何 HTML (使用白名單)

## SQL 注入預防 (SQL Injection Prevention)

- 使用 Spring Data repositories 或參數化查詢
- 對於原生查詢，使用 `:param` 綁定；絕不串接字串

## CSRF 保護 (CSRF Protection)

- 對於瀏覽器 Session 應用程式，保持 CSRF 啟用；在 forms/headers 中包含 token
- 對於使用 Bearer tokens 的純 API，禁用 CSRF 並依賴無狀態認證

```java
http
  .csrf(csrf -> csrf.disable())
  .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
```

## 機密資訊管理 (Secrets Management)

- 原始碼中沒有機密資訊；從 env 或 vault 載入
- 保持 `application.yml` 沒有憑證；使用佔位符 (placeholders)
- 定期輪替 tokens 與 DB 憑證

## 安全性 Headers (Security Headers)

```java
http
  .headers(headers -> headers
    .contentSecurityPolicy(csp -> csp
      .policyDirectives("default-src 'self'"))
    .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
    .xssProtection(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)));
```

## 速率限制 (Rate Limiting)

- 在昂貴的端點上應用 Bucket4j 或閘道層級的限制
- 記錄突發流量並發出警報；返回 429 並帶有重試提示

## 相依性安全 (Dependency Security)

- 在 CI 中執行 OWASP Dependency Check / Snyk
- 保持 Spring Boot 與 Spring Security 在支援的版本
- 發現已知 CVE 時讓建置失敗

## 記錄與 PII (Logging and PII)

- 絕不記錄機密資訊、tokens、密碼或完整的 PAN 資料
- 遮蔽 (Redact) 敏感欄位；使用結構化 JSON logging

## 檔案上傳 (File Uploads)

- 驗證大小、內容類型與副檔名
- 儲存在 Web Root 之外；如果需要則進行掃描

## 發布前檢查清單 (Checklist Before Release)

- [ ] Auth tokens 正確驗證與過期
- [ ] 每個敏感路徑都有授權守衛 (Authorization guards)
- [ ] 所有輸入都經過驗證與清理
- [ ] 沒有字串串接的 SQL
- [ ] CSRF 針對應用程式類型正確設定
- [ ] 機密資訊外部化；沒有提交到版控
- [ ] 安全性 Headers 已設定
- [ ] APIs 上有速率限制
- [ ] 相依性已掃描且為最新
- [ ] Logs 中沒有敏感資料

**請記住**：預設拒絕、驗證輸入、最小權限，並且以「透過設定確保安全 (secure-by-configuration)」為優先。
