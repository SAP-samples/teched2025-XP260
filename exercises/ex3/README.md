# Exercise 3 - Security Logging and Monitoring Failures

## 📖 Overview
Security Logging and Monitoring Failures is a critical web application security risk, according to the [OWASP Top 10 2021 list (A09)](https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/). It occurs when an application fails to properly log security events, monitor for suspicious activities, or detect unauthorized access attempts. Without adequate logging and monitoring, organizations cannot detect breaches, investigate incidents, or maintain compliance with regulatory requirements. This can manifest itself in several ways:

- Missing Audit Logging
- Inadequate Log Detail
- Delayed Detection and Alerting
- Insufficient Log Retention and Analysis

## ⚠️ Why This Matters

* **Business Impact:** Undetected attacks lead to data breaches, financial loss, and loss of customer trust.
* **Compliance Risk:** Failure to log and monitor violates regulations such as [PCI-DSS requirements](https://www.pcisecuritystandards.org/standards/) for protecting payment card information and the principle of least privilege.
* **Security Risk:** Attackers can operate unnoticed, and incidents cannot be properly investigated.

## 🔐 CAP Security Concept 
  
  CAP provides a comprehensive audit logging framework:

- **[Personal Data Protection](https://cap.cloud.sap/docs/guides/data-privacy/annotations#personaldata):** Automatic audit logging for GDPR compliance using `@PersonalData` annotations
- **[Automated Audit Events](https://cap.cloud.sap/docs/guides/data-privacy/audit-logging#custom-audit-logging):** Built-in logging for critical operations (`SensitiveDataRead`, `PersonalDataModified`, `SecurityEvent`)
- **[Enterprise Integration](https://cap.cloud.sap/docs/guides/data-privacy/audit-logging#accessing-audit-logs):** SAP Audit Log Viewer service with tamper-proof storage and regulatory compliance
- **[Custom Security Logging](https://cap.cloud.sap/docs/guides/data-privacy/audit-logging#setup):** Programmatic audit event generation via `@cap-js/audit-logging`

There are two excercises related to this topic.

Continue to [Exercise 3.1 - Audit Logging for Sensitive Data Access in Local Development](./ex3.1/README.md)

and then to [Exercise 3.2 - Security Event Monitoring in SAP BTP Production Environment](./ex3.2/README.md)
