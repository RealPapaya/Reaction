---
name: jpa-patterns
description: Spring Boot 中的 JPA/Hibernate 模式，涵蓋實體設計、關聯、查詢優化、交易、稽核、索引、分頁與連接池。
---

# JPA/Hibernate Patterns

用於 Spring Boot 中的資料建模、Repositories 與效能調校。

## 實體設計 (Entity Design)

```java
@Entity
@Table(name = "markets", indexes = {
  @Index(name = "idx_markets_slug", columnList = "slug", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
public class MarketEntity {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 200)
  private String name;

  @Column(nullable = false, unique = true, length = 120)
  private String slug;

  @Enumerated(EnumType.STRING)
  private MarketStatus status = MarketStatus.ACTIVE;

  @CreatedDate private Instant createdAt;
  @LastModifiedDate private Instant updatedAt;
}
```

啟用稽核 (Enable auditing)：
```java
@Configuration
@EnableJpaAuditing
class JpaConfig {}
```

## 關聯與 N+1 預防 (Relationships and N+1 Prevention)

```java
@OneToMany(mappedBy = "market", cascade = CascadeType.ALL, orphanRemoval = true)
private List<PositionEntity> positions = new ArrayList<>();
```

- 預設使用 Lazy Loading；查詢時需要則使用 `JOIN FETCH`
- 避免在集合上使用 `EAGER`；讀取路徑使用 DTO projections

```java
@Query("select m from MarketEntity m left join fetch m.positions where m.id = :id")
Optional<MarketEntity> findWithPositions(@Param("id") Long id);
```

## Repository 模式 (Repository Patterns)

```java
public interface MarketRepository extends JpaRepository<MarketEntity, Long> {
  Optional<MarketEntity> findBySlug(String slug);

  @Query("select m from MarketEntity m where m.status = :status")
  Page<MarketEntity> findByStatus(@Param("status") MarketStatus status, Pageable pageable);
}
```

- 使用 projections 進行輕量級查詢：
```java
public interface MarketSummary {
  Long getId();
  String getName();
  MarketStatus getStatus();
}
Page<MarketSummary> findAllBy(Pageable pageable);
```

## 交易 (Transactions)

- 用 `@Transactional` 註解服務方法
- 對讀取路徑使用 `@Transactional(readOnly = true)` 進行優化
- 仔細選擇傳播行為 (propagation)；避免長時間運行的交易

```java
@Transactional
public Market updateStatus(Long id, MarketStatus status) {
  MarketEntity entity = repo.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Market"));
  entity.setStatus(status);
  return Market.from(entity);
}
```

## 分頁 (Pagination)

```java
PageRequest page = PageRequest.of(pageNumber, pageSize, Sort.by("createdAt").descending());
Page<MarketEntity> markets = repo.findByStatus(MarketStatus.ACTIVE, page);
```

對於類似游標的分頁，在 JPQL 中包含 `id > :lastId` 並配合排序。

## 索引與效能 (Indexing and Performance)

- 為常見過濾器 (`status`, `slug`, foreign keys) 新增索引
- 使用符合查詢模式的複合索引 (`status, created_at`)
- 避免 `select *`；只投影需要的欄位
- 使用 `saveAll` 與 `hibernate.jdbc.batch_size` 進行批次寫入

## 連接池 (HikariCP)

推薦屬性：
```
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.validation-timeout=5000
```

對於 PostgreSQL LOB 處理，新增：
```
spring.jpa.properties.hibernate.jdbc.lob.non_contextual_creation=true
```

## 快取 (Caching)

- 第一級快取是每個 EntityManager 獨立的；避免跨交易保留實體
- 對於讀取頻繁的實體，謹慎考慮第二級快取；驗證驅逐策略 (eviction strategy)

## 遷移 (Migrations)

- 使用 Flyway 或 Liquibase；絕不要在生產環境依賴 Hibernate auto DDL
- 保持遷移是冪等的 (idempotent) 且可疊加的 (additive)；避免在沒有計畫的情況下刪除欄位

## 測試資料存取 (Testing Data Access)

- 偏好使用 `@DataJpaTest` 配合 Testcontainers 以鏡像生產環境
- 使用日誌斷言 SQL 效率：設定 `logging.level.org.hibernate.SQL=DEBUG` 以及 `logging.level.org.hibernate.orm.jdbc.bind=TRACE` 以查看參數值

**請記住**：保持實體精簡、查詢具備意圖性，且交易簡短。透過 fetch 策略與 projections 防止 N+1，並為您的讀/寫路徑建立索引。
