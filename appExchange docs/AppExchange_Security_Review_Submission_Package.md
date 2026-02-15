# AppGrid AppExchange Security Review Submission Package

Document version: 2.0  
Prepared date: February 14, 2026

## 1. Executive Summary

AppGrid is a Salesforce-managed package that hosts a React UI within an LWC container and executes business/data operations through Apex.

Security posture summary:
- Apex access is controlled with `with sharing` and broad use of `WITH USER_MODE` / `AccessLevel.USER_MODE`.
- Slack tokens are stored in encrypted Salesforce fields (`EncryptedText`) and managed through OAuth flows.
- Iframe bridge traffic is validated by source window and allowlisted origins in the LWC host.
- Cloudflare is used for hosting static frontend assets; Salesforce business logic and data access stay in Salesforce.

## 2. Architecture Summary

Architecture includes Salesforce UI/runtime, Cloudflare-hosted frontend assets, and Slack API integration.

See full diagram:
- `appExchange docs/AppExchange_Architecture_Diagram.md`

## 3. Control Areas (Concise)

### 3.1 Platform Access Controls
- Core classes operate with `with sharing`.
- Query/DML operations use user-mode enforcement patterns.
- Message channels and component boundaries are explicitly controlled.

### 3.2 Script/Style Resource Rule Response (Salesforce Guidance)
- Salesforce guidance requires packaged script/style assets to be loaded from Salesforce static resources (`loadScript` for LWC, or module import), not from dynamic external links.
- Submission posture: AppGrid security-review build should load React JS/CSS from packaged static resources in Salesforce.
- Cloudflare role is documented as CDN-only for static asset distribution outside managed-package runtime.
- If any external script loading remains, it must be explicitly justified as an exception with immutable versioning, strict origin controls, and no customer data transfer to Cloudflare.

### 3.3 Cloudflare External Hosting Controls
- External origin access is allowlisted and limited to approved domains.
- CSP trusted sites and remote site settings are configured.
- No Salesforce customer records are persisted in Cloudflare.
- Cloudflare is treated as static asset delivery only, not as an application backend.
- React runs in isolated iframe context; `postMessage` bridge traffic is origin/source validated before processing.
- One immutable frontend build is distributed across orgs; deployment/change control and rollback evidence should be attached if exception path is used.

### 3.4 Slack Integration Controls
- Purpose: provide record-context collaboration by showing related Slack channel and DM messages inside AppGrid; not a replacement for Salesforce Slack applications.
- Slack integration uses OAuth-based token model with encrypted token storage.
- Missing/revoked/expired token paths are handled with explicit failure responses.
- Slack integration has enable/disable configuration controls.
- Slack integration is optional and System Administrator controlled; user access is permission-gated (AppGrid Slack permission).

## 4. Data Handling Summary

- Primary data processing occurs within Salesforce (LWC/Apex/SObject model).
- Cloudflare serves frontend assets; it is not used to store Salesforce business records.
- Slack integration transmits operational message payloads for enabled features only.
- Sensitive credentials/tokens are encrypted at rest in Salesforce.

## 5. Scan and Review Status

Static analysis summary:
- No Sev1 findings
- No Sev2 findings
- Remaining findings are documented and justified (`ProtectSensitiveData` rule context)

Primary evidence:
- `AgGrid2025GA/CodeAnalyzerReport.html`
- `AgGrid2025GA/react/documentation/CODE_ANALYZER_SECURITY_JUSTIFICATION.md`

## 6. Reviewer Focus Areas (Open Items to Close Before Submission)

1. Least-privilege tightening for Slack-related permissions and token exposure boundaries.
2. Resource loading policy alignment: confirm submission build uses Salesforce static resources for JS/CSS, or prepare formal exception rationale.
3. Cloudflare-specific documentation completeness (integrity, deployment/change control, privacy statement).
4. Slack scope minimization rationale and field-level payload disclosure.
5. Secure-default language alignment (explicit admin enablement model and disable controls).

## 7. Questionnaire Mapping

Salesforce security questionnaire draft mapped from this package:
- `appExchange docs/Salesforce_Security_Questionnaire_Draft.md`

## 8. Submission Attachments

Recommended submission set:
- This concise package
- Architecture diagram (`appExchange docs/AppExchange_Architecture_Diagram.md`)
- Questionnaire draft (`appExchange docs/Salesforce_Security_Questionnaire_Draft.md`)
- Analyzer report and justifications
- Cloudflare addendum (hosting/integrity/change control/privacy)
- Slack addendum (auth/scopes/payload/secure defaults)

## 9. Scope

This package is intentionally concise for reviewer readability.  
Implementation-level evidence is retained in source repositories and mapped in the questionnaire draft.
