# Exercise 3.2 – Security Event Monitoring in SAP BTP Production Environment

Vulnerability: [A09:2021-Security Logging and Monitoring Failures](https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/)


## 1. Overview

In this exercise you will extend the local audit-logging setup from [Exercise 3.1 - Audit Logging for Sensitive Data Access](../ex3.1/README.md) production-grade SAP BTP Cloud Foundry environment.

### 🎯 Key Learning Objectives

  * Bind the managed SAP Audit Log Service to your Incident Management application.
  * Deploy the incident management application  on the SAP BTP Cloud Foundry runtime and configure the managed Audit Log Service.
  * Generate and validate audit events triggered by authenticated OData requests to sensitive data endpoints.
  * Use the SAP Audit Log Viewer to access, filter, and analyze audit trails with full context (user, timestamp, action, resource)

## 2. 📋 Prerequisites

* Completed [Exercise 3.1 - Audit Logging for Sensitive Data Access](../ex3.1/README.md).
* SAP Work Zone Standard Edition configured and accessible.
* The SAP Audit Log Viewer service has already been subscribed to in your Enterprise BTP subaccount with the standard plan.

## 3. 🪜 Step-by-Step Procedure

### 1. Bind the Managed SAP Audit Log Service

- Action: 
  - Open [mta.yaml](./mta.yaml) and scroll to the resources: section (no edit required).
  - Confirm the following resource exists under the resources section

```
- name: incident-management-auditlog
  type: org.cloudfoundry.managed-service
  parameters:
    service: auditlog
    service-plan: standard
```
- Result: 
  - No changes needed,  you’ll notice the new resource definition

### 2. Bind the service to the 'incident-management-srv' module
- Action: In the same file, look at the incident-management-srv module under modules:

```
requires:
      - name: incident-management-destination
      - name: incident-management-db
      - name: incident-management-auth
      - name: incident-management-auditlog
```


- Result: The line - 'name: incidents-auditlog' is already present in the 'requires:' array, meaning the service is automatically bound at deploy time.

- Your [mta.yaml](./mta.yaml) already contains the correct service and module definitions, so no further action is needed.

### 3. Build the MTA
- Action: Run the build command in the project root or from contect menu
```
  mbt build
```
Result: An MTAR archive is created under mta_archives/ (e.g., incident-management_1.0.0.mtar).

### 4. Deploy the MTA

- Action: 
  - Locate the .mtar file in the mta_archives directory.
  - Use the context menu 'Deploy MTA Archive' or Run the following command to deploy your application:
```
  cf deploy mta_archives/<mtar_name>.mtar 
```










  
