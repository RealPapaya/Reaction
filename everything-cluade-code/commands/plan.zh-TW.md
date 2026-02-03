---
description: 重述需求、評估風險，並建立逐步實作計畫。在接觸任何程式碼前，等待使用者確認。
---

# Plan Command

此指令調用 **planner** agent 以在撰寫任何程式碼前建立全面的實作計畫。

## 這是什麼指令 (What This Command Does)

1. **重述需求 (Restate Requirements)** - 釐清需要建構什麼
2. **識別風險 (Identify Risks)** - 浮現潛在問題與阻礙
3. **建立步驟計畫 (Create Step Plan)** - 將實作分解為階段
4. **等待確認 (Wait for Confirmation)** - 必須在繼續前收到使用者核准

## 何時使用 (When to Use)

當需要以下情況時使用 `/plan`：
- 開始新功能
- 進行重大架構變更
- 處理複雜重構
- 多個檔案/組件會受影響
- 需求不清楚或模稜兩可

## 如何運作 (How It Works)

Planner agent 將會：

1. **分析請求** 並以清晰的術語重述需求
2. **分解為階段** 包含具體、可執行的步驟
3. **識別依賴關係** 組件之間的
4. **評估風險** 與潛在阻礙
5. **預估複雜度** (高/中/低)
6. **呈現計畫** 並等待您的明確確認

## 使用範例 (Example Usage)

```
User: /plan I need to add real-time notifications when markets resolve

Agent (planner):
# Implementation Plan: Real-Time Market Resolution Notifications

## Requirements Restatement
- Send notifications to users when markets they're watching resolve
- Support multiple notification channels (in-app, email, webhook)
- Ensure notifications are delivered reliably
- Include market outcome and user's position result

## Implementation Phases

### Phase 1: Database Schema
- Add notifications table with columns: id, user_id, market_id, type, status, created_at
- Add user_notification_preferences table for channel preferences
- Create indexes on user_id and market_id for performance

### Phase 2: Notification Service
- Create notification service in lib/notifications.ts
- Implement notification queue using BullMQ/Redis
- Add retry logic for failed deliveries
- Create notification templates

### Phase 3: Integration Points
- Hook into market resolution logic (when status changes to "resolved")
- Query all users with positions in market
- Enqueue notifications for each user

### Phase 4: Frontend Components
- Create NotificationBell component in header
- Add NotificationList modal
- Implement real-time updates via Supabase subscriptions
- Add notification preferences page

## Dependencies
- Redis (for queue)
- Email service (SendGrid/Resend)
- Supabase real-time subscriptions

## Risks
- HIGH: Email deliverability (SPF/DKIM required)
- MEDIUM: Performance with 1000+ users per market
- MEDIUM: Notification spam if markets resolve frequently
- LOW: Real-time subscription overhead

## Estimated Complexity: MEDIUM
- Backend: 4-6 hours
- Frontend: 3-4 hours
- Testing: 2-3 hours
- Total: 9-13 hours

**WAITING FOR CONFIRMATION**: Proceed with this plan? (yes/no/modify)
```

## 重要事項 (Important Notes)

**嚴重 (CRITICAL)**: Planner agent **不會**寫任何程式碼，直到您明確以 "yes" 或 "proceed" 或類似的肯定回應確認計畫。

如果您想要變更，回應：
- "modify: [your changes]"
- "different approach: [alternative]"
- "skip phase 2 and do phase 3 first"

## 與其他指令的整合

計畫之後：
- 使用 `/tdd` 進行測試驅動開發實作
- 如果發生建置錯誤使用 `/build-and-fix`
- 使用 `/code-review` 審查完成的實作

## 相關 Agents

此指令調用位於以下位置的 `planner` agent：
`~/.claude/agents/planner.md`
