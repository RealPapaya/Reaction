---
name: java-coding-standards
description: Spring Boot 服務的 Java 編碼標準：命名、不可變性、Optional 使用、Streams、例外處理、泛型與專案佈局。
---

# Java Coding Standards

Spring Boot 服務中可讀、可維護的 Java (17+) 程式碼標準。

## 核心原則 (Core Principles)

- 清晰勝於聰明 (Prefer clarity over cleverness)
- 預設不可變；最小化共享的可變狀態 (Immutable by default; minimize shared mutable state)
- 發生錯誤時快速失敗，並提供有意義的例外 (Fail fast with meaningful exceptions)
- 一致的命名與套件結構 (Consistent naming and package structure)

## 命名 (Naming)

```java
// ✅ Classes/Records: PascalCase
public class MarketService {}
public record Money(BigDecimal amount, Currency currency) {}

// ✅ Methods/fields: camelCase
private final MarketRepository marketRepository;
public Market findBySlug(String slug) {}

// ✅ Constants: UPPER_SNAKE_CASE
private static final int MAX_PAGE_SIZE = 100;
```

## 不可變性 (Immutability)

```java
// ✅ Favor records and final fields
public record MarketDto(Long id, String name, MarketStatus status) {}

public class Market {
  private final Long id;
  private final String name;
  // getters only, no setters
}
```

## Optional 使用 (Optional Usage)

```java
// ✅ Return Optional from find* methods
Optional<Market> market = marketRepository.findBySlug(slug);

// ✅ Map/flatMap instead of get()
return market
    .map(MarketResponse::from)
    .orElseThrow(() -> new EntityNotFoundException("Market not found"));
```

## Streams 最佳實踐 (Streams Best Practices)

```java
// ✅ Use streams for transformations, keep pipelines short
List<String> names = markets.stream()
    .map(Market::name)
    .filter(Objects::nonNull)
    .toList();

// ❌ Avoid complex nested streams; prefer loops for clarity
```

## 例外處理 (Exceptions)

- 使用 unchecked exceptions 處理領域錯誤；用 context 包裝技術性例外
- 建立領域特定的例外 (例如 `MarketNotFoundException`)
- 避免廣泛的 `catch (Exception ex)`，除非是為了重新拋出或集中記錄

```java
throw new MarketNotFoundException(slug);
```

## 泛型與類型安全 (Generics and Type Safety)

- 避免 raw types；宣告泛型參數
- 對可重複使用的工具偏好 bounded generics

```java
public <T extends Identifiable> Map<Long, T> indexById(Collection<T> items) { ... }
```

## 專案結構 (Project Structure) (Maven/Gradle)

```
src/main/java/com/example/app/
  config/
  controller/
  service/
  repository/
  domain/
  dto/
  util/
src/main/resources/
  application.yml
src/test/java/... (mirrors main)
```

## 格式化與風格 (Formatting and Style)

- 一致地使用 2 或 4 個空格 (專案標準)
- 每個檔案一個 public top-level type
- 保持方法簡短且專注；提取 helper 方法
- 成員順序：常數、欄位、建構式、公開方法、受保護方法、私有方法

## 應避免的 Code Smells (Code Smells to Avoid)

- 過長的參數列表 → 使用 DTO/builders
-過深的巢狀結構 → 提早 return (early returns)
- Magic numbers → 命名常數
- 靜態可變狀態 → 偏好依賴注入 (dependency injection)
- 靜默的 catch blocks → 記錄並行動或重新拋出

## 記錄 (Logging)

```java
private static final Logger log = LoggerFactory.getLogger(MarketService.class);
log.info("fetch_market slug={}", slug);
log.error("failed_fetch_market slug={}", slug, ex);
```

## Null 處理 (Null Handling)

- 僅在無法避免時接受 `@Nullable`；否則使用 `@NonNull`
- 在輸入上使用 Bean Validation (`@NotNull`, `@NotBlank`)

## 測試期望 (Testing Expectations)

- JUnit 5 + AssertJ 用於流暢的斷言 (fluent assertions)
- Mockito 用於 mocking；儘可能避免 partial mocks
- 偏好確定性測試；沒有隱藏的 sleeps

**請記住**：保持程式碼具備意圖性、類型化且可觀察。除非證明有必要，否則以可維護性優先於微優化。
