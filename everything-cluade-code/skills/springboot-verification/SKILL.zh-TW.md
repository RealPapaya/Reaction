---
name: springboot-verification
description: Spring Boot 專案的驗證循環：建置、靜態分析、覆蓋率測試、安全性掃描，以及在發布或 PR 前的 Diff 審查。
---

# Spring Boot Verification Loop

在 PR 之前、重大變更之後以及部署之前執行。

## 階段 1: 建置 (Build)

```bash
mvn -T 4 clean verify -DskipTests
# or
./gradlew clean assemble -x test
```

如果建置失敗，停止並修復。

## 階段 2: 靜態分析 (Static Analysis)

Maven (常見外掛):
```bash
mvn -T 4 spotbugs:check pmd:check checkstyle:check
```

Gradle (如果已設定):
```bash
./gradlew checkstyleMain pmdMain spotbugsMain
```

## 階段 3: 測試 + 覆蓋率 (Tests + Coverage)

```bash
mvn -T 4 test
mvn jacoco:report   # verify 80%+ coverage
# or
./gradlew test jacocoTestReport
```

報告：
- 總測試數，通過/失敗
- 覆蓋率 % (行/分支)

## 階段 4: 安全性掃描 (Security Scan)

```bash
# Dependency CVEs
mvn org.owasp:dependency-check-maven:check
# or
./gradlew dependencyCheckAnalyze

# Secrets (git)
git secrets --scan  # if configured
```

## 階段 5: Lint/Format (可選閘門)

```bash
mvn spotless:apply   # if using Spotless plugin
./gradlew spotlessApply
```

## 階段 6: Diff 審查 (Diff Review)

```bash
git diff --stat
git diff
```

檢查清單：
- 沒有遺留除錯日誌 (`System.out`, `log.debug` without guards)
- 有意義的錯誤與 HTTP 狀態
- 在需要的地方有交易與驗證
- 設定變更已記錄

## 輸出範本 (Output Template)

```
VERIFICATION REPORT
===================
Build:     [PASS/FAIL]
Static:    [PASS/FAIL] (spotbugs/pmd/checkstyle)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (CVE findings: N)
Diff:      [X files changed]

Overall:   [READY / NOT READY]

Issues to Fix:
1. ...
2. ...
```

## 持續模式 (Continuous Mode)

- 在重大變更時或長工作階段中每 30–60 分鐘重新執行階段
- 保持短循環：`mvn -T 4 test` + spotbugs 以獲得快速回饋

**請記住**：快速回饋勝過遲來的驚喜。保持嚴格的閘門——將警告視為生產系統中的缺陷。
