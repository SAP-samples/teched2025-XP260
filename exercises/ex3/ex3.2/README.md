# Exercise 3.2 – Security Event Monitoring in SAP BTP Production Environment

Vulnerability: [A09:2021-Security Logging and Monitoring Failures](https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/)


## Table of Contents
- [📖 1. Overview](./README.md#--1-overview)
- [🚨 2. Vulnerable Code](./README.md#-2-vulnerable-code)
- [💥 3. Exploitation](./README.md#-3-exploitation)
- [🛡️ 4. Remediation](./README.md#%EF%B8%8F-4-remediation)
- [✅ 5. Verification](./README.md#-5-verification)
- [📌 6. Summary](./README.md#-6-summary)

## 1. Overview

In this exercise you will extend the local audit-logging setup from [Exercise 3.1 - Audit Logging for Sensitive Data Access in Local Developemt](../ex3.1/README.md) production-grade SAP BTP Cloud Foundry environment.

### 🎯 Key Learning Objectives

  * Bind the managed SAP Audit Log Service to your Incident Management application.
  * Deploy the incident management application  on the SAP BTP Cloud Foundry runtime and configure the managed Audit Log Service.
  * Generate and validate audit events triggered by authenticated OData requests to sensitive data endpoints.
  * Use the SAP Audit Log Viewer to access, filter, and analyze audit trails with full context (user, timestamp, action, resource)

## 📋 Prerequisites

* Completed [Exercise 3.1 - Audit Logging for Sensitive Data Access](../ex3.1/README.md).
* SAP Work Zone Standard Edition configured and accessible.
* The SAP Audit Log Viewer service has already been subscribed to in your Enterprise BTP subaccount with the standard plan.

## 🚨 2. Vulnerable Code:
Your existing [data-privacy.cds](../ex3.1/srv/data-privacy.cds) file only covers the Customers and Addresses entities. However, it is missing annotations for the Incidents entity and its conversation element. This gap can lead to significant privacy and compliance risks.


```

using { sap.capire.incidents as my } from './services';

// Annotating the my.Customers entity with @PersonalData to enable data privacy
annotate my.Customers with @PersonalData : {
  EntitySemantics : 'DataSubject',
  DataSubjectRole : 'Customer'
} {
... Other fields
}

// Annotating the my.Addresses entity with @PersonalData to enable data privacy
annotate my.Addresses with @PersonalData : {
  EntitySemantics : 'DataSubjectDetails'
} {
... Other fields
}


/* ❌ VULNERABLE SECTION: Missing data privacy annotations for Incidents entity */
// These are critical for ensuring proper handling of personal data in incidents,
// such as marking potentially personal fields, and
// protecting sensitive conversation messages.

```

**Why This is Vulnerable:**

❌ **No data classification:** Key incident fields (e.g., title, urgency, assignedTo, and conversation messages) are missing sensitivity classifications which are required for triggering audit logs and managing data retention policies.

❌ **Compliance Gap:** The absence of required privacy annotations for incident records creates a compliance gap with regulations like GDPR and other industry standards, potentially leading to legal penalties and security breaches.

## 💥 3. Exploitation
In this section, you will demonstrate the exploitation of the vulnerability through the following steps:

 - Integrate the audit logging feature into your CAP (Cloud Application Programming) application.
 
 - Build and Deploy the application in its Current Vulnerable State to SAP BTP Cloud Foundry environment.
 
 - Verify the deployment to confirm the application is operational and ready for demonstrating the exploitation of the vulnerability in subsequent steps.
 
 - Simulate a Support User Accessing and Updating Sensitive Incident Data.
 
 - Use the SAP Audit Log Viewer to Verify Insufficient Logging.


#### 🪜 Step 1. Integrate Audit Logging Feature to CAP Application

- **Action:** Execute the following command in your terminal
    ```
      cds add audit-logging --plan standard
    ```
- **Result:** The mta.yaml file is updated to include the audit log resource under **resources:** section and the corresponding binding in the **incident-management-srv** module under **requires:** section.
  
  - Open [mta.yaml](./mta.yaml) and scroll to the line 207 - **resources:** section (no edit required).
  - Confirm the following resource exists under the **resources:** section

    ```
    - name: incident-management-auditlog
      type: org.cloudfoundry.managed-service
      parameters:
        service: auditlog
        service-plan: standard
    ```
  - Then, locate the incident-management-srv module and verify that the **requires:** section includes the binding in line 33 :  
    
    ```
    requires:
      - name: incident-management-auditlog    
    ```

#### 🪜 Step 2. Build and deploy the CAP appplication

⚠️ Note: Ensure you're logged in to your Cloud Foundry space via the cf CLI or UI before deploying. Run the following command if needed: 

 ```
  cf login -a https://api.cf.eu10-004.hana.ondemand.com  --origin akihlqzx8-platform      
 ```
- **Action: Build the MTA**
  - Open a terminal and navigate to the project root directory.
  - Run the following command to build the MTA, Alternatively, if using an IDE like SAP Business Application Studio: Right-click on the [mta.yaml](./mta.yaml) file in the file explorer. Select the option **Build MTA Project**.

 ```
   mbt build
 ```

- **Result:** An **MTAR archive** (for example, incident-management_1.0.0.mtar) is created in the mta_archives/ directory.
  
- **Action: Deploy the MTA**
  - Locate the generated .mtar file in the mta_archives/ directory.
  - Run the following command in your terminal to deploy it:

```
 cf deploy mta_archives/<mtar_name>.mtar
```
- **Result: The deployment succeeds**, and the vulnerable application is now running in your SAP BTP Cloud Foundry environment.

#### 🪜 Step 3. Verify the Deployment (Optional)

- **Action: Confirm the Application’s Deployment Status**
   - Log in to your SAP BTP Cockpit and navigate to your subaccount, then open Spaces > Your Space> Applications

- **Result:** Ensure that your application is listed as **Started.** see screenshot:

  <p align="center">
    <img src="images/incident-management-application.png" alt="" width="900"/>
    <br>
    <b></b>
  </p>

- **Action: Verify the Audit Log Service Binding**
   - Open the Application **incident-management-srv** > **Service Bindings** section.
   - Confirm that the following service binding is present:
     * Service Binding Name: incident-management-auditlog
     * Service: auditlog
     * Plan: standard

- **Result: The audit log service binding is confirmed as active and correctly configured, along with other required services.** see screenshot:

  <p align="center">
    <img src="images/audit-log-application-binding.png" alt="" width="900"/>
    <br>
    <b></b>
  </p>

#### 🪜 Step 4. Simulate a Support User Accessing and Updating Sensitive Incident Data

- Action:
 - Log in to the incident management application UI using a support account (e.g., alice.support@company.com).
 - Navigate to the list of incidents and select a record.
 - Modify one or more fields within the record and save your updates.

* Result:
 - The incident record is successfully updated, and the UI reflects the changes.
 - An audit logging mechanism is triggered by this update event, creating a corresponding log entry.


































- **Modify a record using  the Application UI:**
  - Action: 
  - Open the application's UI URL (found in the SAP BTP Cockpit under the application's details or routes).



* Log in to the application using your credentials (ensure you have the necessary roles; test with different user roles if applicable to simulate permissions).


* Navigate to the incidents section and select an existing incident record.

* Make modifications to the record, such as updating fields like status, description, or other editable attributes.

* Save the changes and note any system responses (e.g., success messages or errors).


Result:

* The modification should succeed if permitted by your user role and application rules, updating the incident record in the UI. However, due to the missing @PersonalData annotations on the Incidents entity, related audit logging may be incomplete (e.g., no entries for personal data changes). If the modification is forbidden (e.g., attempting to edit restricted fields), the system should prevent it with an error. (See screenshot below for an example of a successful modification.)


  
  - Action:
  - Log in to the application UI and modify an incident record.


* Result:
Verify that the audit logs show incomplete logging due to the missing @PersonalData annotations on the Incidents entity.
(Screenshot: Audit log entries from the UI or a relevant log view)

Verify the Audit Log Service Binding:

* Action:
Within your space, locate the audit log service binding (e.g., space-application-incidetn-management-srv-service).
* Result:
Check that the binding details (service name, service plan, instance GUID, etc.) are correctly configured.
(Screenshot: Details of the audit log service binding)



Test the Application UI and Audit Logging:

* Action:
Log in to the application UI and modify an incident record.
* Result:
Verify that the audit logs show incomplete logging due to the missing @PersonalData annotations on the Incidents entity.
(Screenshot: Audit log entries from the UI or a relevant log view)

- Action : 
  - Confirm the application's deployment status in the SAP BTP Cockpit to ensure it's running as expected.
  -Goto 

