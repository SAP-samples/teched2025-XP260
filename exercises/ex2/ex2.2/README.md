# Exercise 2.2 – Security Event Monitoring in SAP BTP Production Environment

Vulnerability: [A09:2021-Security Logging and Monitoring Failures](https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/)
)

## 1. Overview

In this exercise you will extend the local audit-logging setup from [Exercise 2.1 - Audit Logging for Sensitive Data Access](../ex2.1/README.md) into a production-grade SAP BTP environment. :

### 🎯 Key Learning Objectives

  * Bind the managed SAP Audit Log Service to your Incident Management application.
  * Deploy the incident management application  on the SAP BTP Cloud Foundry runtime and configure the managed Audit Log Service.
  * Generate and validate audit events triggered by authenticated OData requests to sensitive data endpoints.
  * Use the SAP Audit Log Viewer to access, filter, and analyze audit trails with full context (user, timestamp, action, resource)

## 2. Prerequisites

* Completion of [Exercise 2.1 - Audit Logging for Sensitive Data Access](../ex2.1/README.md) (local audit‐logging)
* SAP BTP subaccount + Cloud Foundry space
* XSUAA instance (with support/admin scopes)
* mbt & Cloud Foundry CLI installed
* Postman or Insomnia for HTTP/OAuth testing
* SAP Work Zone launchpad configured in your BTP subaccount
* Subscribe to the SAP Audit Log Viewer service




  
