---
name: Security Report
about: 回報安全漏洞或安全相關問題
title: '[SECURITY] '
labels: ['security', 'needs-immediate-attention']
assignees: ''
---

## ⚠️ 重要提醒 / Important Notice
**請勿在公開 issue 中揭露安全漏洞細節**
如果這是嚴重的安全漏洞，請改為發送郵件至 security@yourcompany.com

## 安全問題類型 / Security Issue Type
- [ ] 認證/授權問題
- [ ] 資料外洩風險
- [ ] 注入攻擊 (SQL, XSS, etc.)
- [ ] 敏感資料暴露
- [ ] 不安全的直接物件參考
- [ ] 安全配置錯誤
- [ ] 跨站請求偽造 (CSRF)
- [ ] 不安全的反序列化
- [ ] 已知漏洞的元件
- [ ] 日誌和監控不足
- [ ] 其他

## 影響程度 / Severity Level
- [ ] 🔴 Critical - 立即需要修復
- [ ] 🟠 High - 一週內需要修復
- [ ] 🟡 Medium - 一個月內需要修復
- [ ] 🟢 Low - 下次更新時修復

## 影響範圍 / Impact Scope
- [ ] 整個系統
- [ ] 特定模組/功能
- [ ] 僅限管理員功能
- [ ] 僅限一般使用者功能

## 問題描述 / Problem Description
簡要描述安全問題（避免詳細的技術細節）

## 受影響的組件 / Affected Components
- [ ] 前端 (Next.js)
- [ ] 後端 API (NestJS)
- [ ] 資料庫
- [ ] 認證系統
- [ ] 檔案上傳系統
- [ ] 第三方整合
- [ ] 其他: ___________

## 環境資訊 / Environment
- 部署環境: [例如 development, staging, production]
- 瀏覽器: [如果相關]
- 版本: [系統版本]

## 建議解決方案 / Suggested Solution
如果您有建議的修復方式，請簡要描述

## 臨時緩解措施 / Temporary Mitigation
是否有任何臨時的安全措施可以立即實施？

## 檢測方法 / Detection Method
您是如何發現此安全問題的？
- [ ] 自動化安全掃描
- [ ] 手動測試
- [ ] 代碼審查
- [ ] 外部報告
- [ ] 監控系統警報
- [ ] 其他: ___________

## 其他資訊 / Additional Information
任何其他相關資訊（請避免敏感細節）

---
**處理清單 (內部使用)**
- [ ] 安全團隊已通知
- [ ] 影響評估完成
- [ ] 修復方案確定
- [ ] 測試計劃制定
- [ ] 修復實施
- [ ] 驗證測試
- [ ] 安全公告發布 (如需要)