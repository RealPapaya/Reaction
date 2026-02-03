---
name: springboot-tdd
description: 使用 JUnit 5, Mockito, MockMvc, Testcontainers, 與 JaCoCo 進行 Spring Boot 的測試驅動開發 (TDD)。在新增功能、修復 Bug 或重構時使用。
---

# Spring Boot TDD Workflow

Spring Boot 服務的 TDD 指引，目標 80% 以上覆蓋率 (單元 + 整合)。

## 何時使用 (When to Use)

- 新功能或端點
- Bug 修復或重構
- 新增資料存取邏輯或安全性規則

## 工作流程 (Workflow)

1) 先寫測試 (它應該要失敗)
2) 實作最小程式碼以通過測試
3) 在測試通過的情況下重構
4) 強制執行覆蓋率 (JaCoCo)

## 單元測試 (Unit Tests) (JUnit 5 + Mockito)

```java
@ExtendWith(MockitoExtension.class)
class MarketServiceTest {
  @Mock MarketRepository repo;
  @InjectMocks MarketService service;

  @Test
  void createsMarket() {
    CreateMarketRequest req = new CreateMarketRequest("name", "desc", Instant.now(), List.of("cat"));
    when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

    Market result = service.create(req);

    assertThat(result.name()).isEqualTo("name");
    verify(repo).save(any());
  }
}
```

模式：
- Arrange-Act-Assert
- 避免 partial mocks；偏好明確的 stubbing
- 使用 `@ParameterizedTest` 測試變體

## Web 層測試 (Web Layer Tests) (MockMvc)

```java
@WebMvcTest(MarketController.class)
class MarketControllerTest {
  @Autowired MockMvc mockMvc;
  @MockBean MarketService marketService;

  @Test
  void returnsMarkets() throws Exception {
    when(marketService.list(any())).thenReturn(Page.empty());

    mockMvc.perform(get("/api/markets"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray());
  }
}
```

## 整合測試 (Integration Tests) (SpringBootTest)

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MarketIntegrationTest {
  @Autowired MockMvc mockMvc;

  @Test
  void createsMarket() throws Exception {
    mockMvc.perform(post("/api/markets")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
          {"name":"Test","description":"Desc","endDate":"2030-01-01T00:00:00Z","categories":["general"]}
        """))
      .andExpect(status().isCreated());
  }
}
```

## 持久層測試 (Persistence Tests) (DataJpaTest)

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestContainersConfig.class)
class MarketRepositoryTest {
  @Autowired MarketRepository repo;

  @Test
  void savesAndFinds() {
    MarketEntity entity = new MarketEntity();
    entity.setName("Test");
    repo.save(entity);

    Optional<MarketEntity> found = repo.findByName("Test");
    assertThat(found).isPresent();
  }
}
```

## Testcontainers

- 使用可重複使用的容器 (Postgres/Redis) 來鏡像生產環境
- 透過 `@DynamicPropertySource` 注入 JDBC URLs 到 Spring context

## 覆蓋率 (Coverage) (JaCoCo)

Maven 片段：
```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.14</version>
  <executions>
    <execution>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>verify</phase>
      <goals><goal>report</goal></goals>
    </execution>
  </executions>
</plugin>
```

## 斷言 (Assertions)

- 偏好 AssertJ (`assertThat`) 以提高可讀性
- 對於 JSON 回應，使用 `jsonPath`
- 對於例外：`assertThatThrownBy(...)`

## 測試資料建構器 (Test Data Builders)

```java
class MarketBuilder {
  private String name = "Test";
  MarketBuilder withName(String name) { this.name = name; return this; }
  Market build() { return new Market(null, name, MarketStatus.ACTIVE); }
}
```

## CI 指令

- Maven: `mvn -T 4 test` 或 `mvn verify`
- Gradle: `./gradlew test jacocoTestReport`

**請記住**：保持測試快速、隔離且確定性。測試行為，而非實作細節。
