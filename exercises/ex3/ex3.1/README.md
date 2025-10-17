# Exercise 3.1 - Audit Logging for Sensitive Data Access
Vulnerability: [A09:2021-Security Logging and Monitoring Failures](https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/)

## Table of Contents
- [📖  1. Overview](./README.md#--1-overview)
- [🚨 2. Vulnerable Code](./README.md#-2-vulnerable-code)
- [💥 3. Exploitation](./README.md#-3-exploitation)
- [🛡️ 4. Remediation](./README.md#%EF%B8%8F-4-remediation)
- [✅ 5. Verification](./README.md#-5-verification)
- [📌 6. Summary](./README.md#-6-summary)

## 📖  1. Overview:

This exercise highlights how the absence of audit logging for sensitive data access creates blind spots in enterprise applications. In the Incident Management system, customer records include highly sensitive fields such as credit card numbers. As a result, users can access or exfiltrate regulated data without detection.

### 📐Business Rules

* Support Users:
  - ✅ Can view customer data.
  - ✅ Can view, create, update, and delete incidents (with restrictions on closed/high-urgency incidents).
  - ❌ Cannot access customers sensitive data (e.g., credit card numbers).
  - ⚠️ All access attempts must be logged (e.g., who accessed/modified which incident, when.

* Administrators:
  - ✅ Full access to customer and incidents data.
  - ⚠️ All operations, including access to sensitive fields, are logged for audit compliance.

### 🎯 Key Learning Objectives

* Ensure users only access customer data they are authorized to view.
* Implement object-level authorization, data masking, and audit logging
* Maintain comprehensive records of access.

## 🚨 2. Vulnerable Code:
We’ll build upon [Exercise 2 - SQl Injection](../../ex2/README.md#%EF%B8%8F-4-remediation) by integrating audit logging—a critical missing piece in the original implementation—to track security-sensitive actions.

**File**: `db/schema.cds`
```
entity Customers : managed { 
  key ID        : String;
  firstName     : String;
  lastName      : String;
  name          : String = firstName ||' '|| lastName;
  email         : EMailAddress;
  phone         : PhoneNumber;
  incidents     : Association to many Incidents on incidents.customer = $self;
  creditCardNo  : String(16) @assert.format: '^[1-9]\d{15}$';  // ❌ No access control or data masking
  addresses     : Composition of many Addresses on addresses.customer = $self;
}

```

**File**: `srv/services.cds`
```
using { sap.capire.incidents as my } from '../db/schema';

service ProcessorService {
  @restrict: [
    { grant: ['READ', 'CREATE'], to: 'support' },  // Support can view and create
    { grant: ['UPDATE', 'DELETE'], 
      to: 'support',
      where: 'assignedTo is null or assignedTo = $user'  // Horizontal control for support
    },
    { grant: '*', to: 'admin' }  // Admin full access
  ]
  entity Incidents as projection on my.Incidents;
  
  @readonly
  entity Customers as projection on my.Customers;  // ❌ Exposes all customers data to support users.
}

annotate ProcessorService with @(requires: ['support', 'admin']); 

service AdminService {
  entity Customers as projection on my.Customers;
  entity Incidents as projection on my.Incidents;
}
annotate AdminService with @(requires: 'admin');

```

**File**: `srv/services.js`
```javascript
const cds = require('@sap/cds')

class ProcessorService extends cds.ApplicationService {
  init() {

    // ✅ Vertical privilege escalation fixed from Exercise 1.2
    this.before(['UPDATE', 'DELETE'], 'Incidents', this.onModify)
    
    return super.init()
  }

  async onModify(req) {
    // Fetch current incident state (status + urgency)
    const result = await SELECT.one.from(req.subject)
      .columns('status_code', 'urgency_code')
      .where({ ID: req.data.ID });

    if (!result) return req.reject(404, `Incident ${req.data.ID} not found`); 
    // Check if incident is already closed
    if (result.status_code === 'C') {
      if (!req.user.isAdmin()) {
        const action = req.event === 'UPDATE' ? 'modify' : 'delete';
        return req.reject(403, `Cannot ${action} a closed incident`);
      }
      return;
    }
    
    // Check if user is attempting to close the incident
    if (req.data.status_code === 'C') {
      if (result.urgency_code === 'H' && !req.user.isAdmin()) {
        return req.reject(403, 'Only administrators can close high-urgency incidents'); 
      }
    }
   
// ❌ VULNERABILITY: Missing Audit Logging for sensitive data.
// ❌ CRITICAL: No tracking of user access to customer records (who, what, when)
// → Prevents security monitoring, incident investigation, and forensic analysis
   
  }
}

module.exports = { ProcessorService }

```

**Why This is Vulnerable:**

- ❌ **No object-level validation:** A support user can manipulate customers IDs in the API to access other customer's data, including credit card numbers.
- ❌ **No data classification:** Credit card numbers are not annotated as sensitive, so audit logging isn't triggered.
- ❌ **No data masking:** Credit card numbers are displayed in plain text to all users.
- ❌ **No Audit Trail:**  No logging of access attempts to customers & incidents data, making security monitoring impossible.
- ❌ **No audit logging:** No record of who accessed which customers, when, or what they did.
- ❌ **Compliance Gap:** Lacks detailed audit records required by regulations like GDPR, SOX, and industry standards.

## 💥 3. Exploitation:
In this lab, a **Security Logging and Monitoring Failures** vulnerability is exploited via API calls in a local development environment **(SAP Business Application Studio with cds watch)**. Unlike production, key security measures such as real authentication flows, OAuth2 tokens, and data isolation are inactive, allowing ethical hackers to safely simulate attacks, validate vulnerabilities without risking live systems, and rapidly iterate fixes before deploying to production.

### Step 1: Start Local Development Server

Action : Run the following command in your terminal (within SAP Business Application Studio or your local environment):
```
 cds watch 

```
Results :

```
[cds] - connect using bindings from: { registry: '~/.cds-services.json' }
[cds] - connect to db > sqlite { url: ':memory:' }
  > init from db/data/sap.capire.incidents-Urgency.texts.csv 
  > init from db/data/sap.capire.incidents-Urgency.csv 
  > init from db/data/sap.capire.incidents-Status.texts.csv 
  > init from db/data/sap.capire.incidents-Status.csv 
  > init from db/data/sap.capire.incidents-Incidents.csv 
  > init from db/data/sap.capire.incidents-Incidents.conversation.csv 
  > init from db/data/sap.capire.incidents-Customers.csv 
  > init from db/data/sap.capire.incidents-Addresses.csv 
/> successfully deployed to in-memory database. 

[cds] - using auth strategy {
  kind: 'mocked',
  impl: 'node_modules/@sap/cds/lib/srv/middlewares/auth/basic-auth'
} 

[cds] - serving ProcessorService { impl: 'srv/services.js', path: '/odata/v4/processor' }
[cds] - serving AdminService { impl: 'srv/services.js', path: '/odata/v4/admin' }

[cds] - server listening on { url: 'http://localhost:4004' }
[cds] - server launched in: 673.811ms
```

### Step 2: List All Customers
- Action: 
  - Click on the link 'http://localhost:4004' in the terminal window to connect to your locally running CAP server.
  - Click on Customers under the Service Endpoints: /odata/v4/processor/$metadata section.
  - Use the following credentials if required : Username = 'alice',  Password: [leave empty — no password required]
- Result:
  - Note: You might want to enable the checkbox "Pretty-print" for better readability.
```
{
  "@odata.context": "$metadata#Customers",
  "value": [
    {
      "createdAt": "2025-08-27T09:06:00.013Z",
      "createdBy": "anonymous",
      "modifiedAt": "2025-08-27T09:06:00.013Z",
      "modifiedBy": "anonymous",
      "ID": "1004100",
      "firstName": "Sunny",
      "lastName": "Sunshine",
      "name": "Sunny Sunshine",
      "email": "sunny.sunshine@demo.com",
      "phone": "+49-555-789",
      "creditCardNo": "3400000000000094"
    },
... Other customers' records.
  ]
}
```
- ❌ No audit record is produced in local log files or the console output of the CAP runtime for any audit entries.
- ❌ Sensitive data (e.g., credit card numbers) is not masked or protected in output.

## 🛡️ 4. Remediation:
To address the identified vulnerabilities and data privacy risks, this section implements SAP CAP's built-in security controls through:
  1. **Personal Data Annotation** - Explicitly tags sensitive fields for GDPR compliance.
  2. **Automated Audit Logging** - Tracks all access to protected data with @cap-js/audit-logging.
  3. **Fine-Grained Access Control** - Limits customer data visibility by user role.

### Step 1: Add Audit Logging Dependency

- Action : Add the @cap-js/audit-logging plugin to your project

```
npm install @cap-js/audit-logging
```  
- Result:
  - ✅ **Updates package.json** – The @cap-js/audit-logging dependency is automatically added to your project’s [package.json](./package.json) file.
  - ✅ **Enables Automatic Audit Logging** – for every entity or field annotated with @PersonalData; all access and modifications are captured in real time..
  - ✅ **Tracks CRUD Operations** – Create, Read, Update, Delete on annotated data are fully traced.
  - ✅ **Generates GDPR-Compliant Audit Trails** – Logs are formatted to meet regulatory requirements, simplifying compliance reporting.

### Step 2: Annotate Personal Data

- Action : 
  - Copy the contents of [data-privacy.cds](./srv/data-privacy.cds) into a new project’s /srv/data-privacy.cds file.
  - Open 'data-privacy.cds' from your project and make sure the annotations for Customers, Addresses, Incidents, and Incidents:conversation are present—exactly as shown here. 

```
using { sap.capire.incidents as my } from './services';

// Annotating the my.Customers entity with @PersonalData to enable data privacy
annotate my.Customers with @PersonalData : {
  EntitySemantics : 'DataSubject',
  DataSubjectRole : 'Customer'
} {
  ID            @PersonalData.FieldSemantics : 'DataSubjectID';     // Identifier for the data subject, can also be used to generate audit logs
  firstName     @PersonalData.IsPotentiallyPersonal;                // Personal data that can potentially identify a person (firstName,lastname,email,phone)
  lastName      @PersonalData.IsPotentiallyPersonal;
  email         @PersonalData.IsPotentiallyPersonal;
  phone         @PersonalData.IsPotentiallyPersonal;
  creditCardNo  @PersonalData.IsPotentiallySensitive;               // Sensitive personal data requiring special treatment and access restrictions
}

// Annotating the my.Addresses entity with @PersonalData to enable data privacy
annotate my.Addresses with @PersonalData : {
  EntitySemantics : 'DataSubjectDetails'
} {
  customer      @PersonalData.FieldSemantics : 'DataSubjectID';
  city          @PersonalData.IsPotentiallyPersonal;
  postCode      @PersonalData.IsPotentiallyPersonal;
  streetAddress @PersonalData.IsPotentiallyPersonal;
}
```
- Result:
  - ✅ Sensitive fields like creditCardNo are marked as @PersonalData: #Sensitive for compliance.
  - ✅ Audit logs automatically include these fields in tracking, ensuring data privacy and regulatory adherence.

### Step 3: Create server.js with Custom 403 Handler

As part of audit logs, there can be cases where you want to genereate custom audit logs. For example if you want to log 403 - Forbidden events when an user is not having roles but is still trying to access certain data. This can be achieved by adding custom handlers in a CAP application.

- Action :
  - Copy the contents of [server.js](./server.js) into new project’s root-level server.js file.
  - Open 'server.js' from your project and make sure that the 403-audit logic (non-batch + batch sub-requests) are present exactly as shown here :

  ```
  const cds = require('@sap/cds')

  let audit
  
  cds.on('served', async () => {
    audit = await cds.connect.to('audit-log')
  })
  
  const audit_log_403 = (resource, ip) => {
    // we need to start our own tx because the default tx may be burnt
    audit.tx(async () => {
      await audit.log('SecurityEvent', {
        data: {
          user: cds.context.user?.id || 'unknown',
          action: `Attempt to access restricted resource "${resource}" with insufficient authority`
        },
        ip
      })
    })
  }
  
  // log for non-batch requests
  cds.on('bootstrap', app => {
    app.use((req, res, next) => {
      req.on('close', () => {
        if (res.statusCode == 403) {
          const { originalUrl, ip } = req
          audit_log_403(originalUrl, ip)
        }
      })
      next()
    })
  })
  
  // log for batch subrequests
  cds.on('serving', srv => {
    if (srv instanceof cds.ApplicationService) {
      srv.on('error', (err, req) => {
        if (err.code == 403) {
          const { originalUrl, ip } = req.http.req
          if (originalUrl.endsWith('/$batch')) audit_log_403(originalUrl.replace('/$batch', req.req.url), ip)
        }
      })
    }
  })
  
  module.exports = cds.server
  ```
- Result:
  - The audit_log_403 function is configured to capture **SecurityEvent** logs for all 403 Forbidden responses.
  - Three event handlers are implemented to enable comprehensive audit logging for security incidents like 403 Forbidden responses:
    - cds.on('served'): Establishes connections to services like 'audit-log' after initialization, preparing resources for global event processing.
    - cds.on('bootstrap'): Monitors HTTP response status codes for non-batch requests and triggers audit logging when a 403 error occurs.
    - cds.on('serving'): Captures 403 errors within OData batch operations and logs them appropriately for service-specific events.
   

## ✅ 5. Verification:

This section evaluates the implementation of audit logging and data protection in the CAP application.

- Key aspects include:
  - Ensuring sensitive fields (e.g., creditCardNo) are properly annotated for logging.
  - Confirming role-based access controls are enforced.
  - Verifying that audit logs record all API interactions, such as SensitiveDataRead, PersonalDataModified, and SecurityEvent.

- Testing is performed both locally in SAP Business Application Studio and in SAP BTP production environments to validate that logs are correctly generated, masked, and compliant with enterprise security standards.

### Local Environment Setup

####  Step 1:  Generate HTTP Test Files

- Action:
  - To create HTTP request templates for testing your services, run the following commands in your terminal from the project root:
  ```
    cds add http --filter ProcessorService
    cds add http --filter AdminService
  ```

- Results:
  - ✅ The AdminService.http and Processor.http  files are generated under the test folder with sample GET, POST, and PATCH requests for testing.
  - ✅ These files include pre-configured authentication headers and request bodies for different user roles.
  - ✅ Ready to use with SAP Business Application Studio's REST Client extension.


#### Step 2: Set Up Local Server
- Action:

   - Start the CDS server in watch mode from SAP Business Application Studio command line:
    ```
    cds watch
    ```

 - Results:
    - ✅ The server is running, and the Rest Extension is ready for testing.
    - ✅ Audit logs are enabled and accessible via the terminal.   

 
#### Step 3: Test Read Access to Customers with Support User
- Action:
  - Open test/http/ProcessorService.http file.
  - Ensure that the username is 'alice'. The password should be left empty.
  - Scroll to  Line 118 and click on 'Send Request' to run the 'GET {{server}}/odata/v4/processor/Customers' request.

- Results:
  - ✅ Here is a sample audit log event **SensitiveDataRead** for 1 customer entity. In your log, the timestamp matches the current timestamp.
    ```
    [odata] - GET /odata/v4/processor/Customers 
    [cds] - connect to audit-log > audit-log-to-console 
    [audit-log] - SensitiveDataRead: {  // SensitiveDataRead event generated
      data_subject: {
        id: { ID: '1004155' },
        role: 'Customer',
        type: 'ProcessorService.Customers'
      },
      object: { type: 'ProcessorService.Customers', id: { ID: '1004155' } },
      attributes: [ { name: 'creditCardNo' } ],
      uuid: '0bf74230-e246-445c-915b-3220d0643302',
      tenant: undefined,
      user: 'alice',
      time: 2025-08-29T08:17:51.865Z
    }
    ... other customer's entities
    ```
    
  - ✅ Each customer entity generates a separate audit log entry.
  - ✅ When creditCardNo is accessed, a **SensitiveDataRead** log is automatically generated.
  - ✅ These events are richer than standard audit logs and include:
        - Who accessed the data
        - When it was accessed
        - Context of the access

#### Step 4: Test Write Access to Customer Data with Admin User
- Action:
  - Open test/http/AdminService.http file.
  - Change the username to 'incident.support@tester.sap.com' (admin role), password : 'initial'.
  - Scroll to Line 25 and replace the value of the "creditCardNo" field with "1234567890123456".
  - Scroll to Line 13 and and click on 'Send Request' to run 'POST {{server}}/odata/v4/admin/Customers' request.
 
  Results:
  - ✅ Here is a sample audit log **PersonalDataModified** for one customer entity. In your log, the timestamp matches the current timestamp.
```
[odata] - POST /odata/v4/admin/Customers 
[audit-log] - PersonalDataModified: {
  data_subject: {
    id: { ID: 'Customers-3328541' },
    role: 'Customer',
    type: 'AdminService.Customers'
  },
  object: { type: 'AdminService.Customers', id: { ID: 'Customers-3328541' } },
  attributes: [
    { name: 'firstName', new: 'firstName-3328538' },
    { name: 'lastName', new: 'lastName-3328538' },
    { name: 'email', new: 'email-3328538' },
    { name: 'phone', new: 'phone-3328538' },
    { name: 'creditCardNo', new: '***' }
  ],
  uuid: 'dfef4d88-1d68-49e2-aa16-e198228ea14d',
  tenant: undefined,
  user: 'incident.support@tester.sap.com',
  time: 2025-09-19T21:57:09.944Z
}
```
- ✅ Audit log generates **PersonalDataModified** entries for changes to annotated fields with @PersonalData.
- ✅ Audit log masks only fields explicitly annotated #Sensitive.
- ✅ This behavior is regulated by the @cap-js/audit-logging plugin and the audit-log.json configuration.

#### Step 5: Test Write Access to Customer Data with Support User
- Action:
  - Open test/http/AdminService.http file.
  - Change the username to 'alice'. The password should be empty.
  - Go to Line 7 and and click on 'Send Request' to run 'POST {{server}}/odata/v4/admin/Customers' request.

- Result:
  - ✅ Audit logs generate **SecurityEvent** for one customer entity. In your log, the timestamp matches the current timestamp.
```
[odata] - POST /odata/v4/admin/Customers 
[error] - 403 - Error: Forbidden
    at requires_check (/home/user/projects/incident-management/node_modules/@sap/cds/lib/srv/protocols/http.js:54:32)
    at http_log (/home/user/projects/incident-management/node_modules/@sap/cds/lib/srv/protocols/http.js:42:59) {
  code: '403',
  reason: "User 'alice' is lacking required roles: [admin]",
  user: User { id: 'alice', roles: { support: 1 } },
  required: [ 'admin' ],
  '@Common.numericSeverity': 4
}
[audit-log] - SecurityEvent: {
  data: {
    user: 'alice',
    action: 'Attempt to access restricted resource "/odata/v4/admin/Customers" with insufficient authority'
  },
  ip: '::ffff:127.0.0.1',
  uuid: 'f76c4ab8-edcd-4334-a7ee-6e971c4cb415',
  tenant: undefined,
  user: 'alice',
  time: 2025-08-29T22:54:27.493Z
```
- ✅ Audit logs generate a **SecurityEvent** entry for the unauthorized write attempt.
- ✅ No PersonalDataModified entry is created.


### 📌 Verification Summary: 
Verification confirmed that:
  * All sensitive fields (e.g., creditCardNo) are annotated with @PersonalData, masked in API responses, and tracked in audit logs.
  * Role-based access controls enforce least-privilege, effectively blocking unauthorized data exposure.
  * Audit logs  capture every critical event (SensitiveDataRead, PersonalDataModified, SecurityEvent) with full contextual details.
  * @PersonalData.IsPotentiallyPersonal → Audit logs are triggered for modification events only (create, update, delete).
  * @PersonalData.IsPotentiallySensitive → Audit logs are triggered for both modification and read (access) events.


    
## 📌 6. Summary:
In these exercise, you have learned how:
* To implement data masking and audit logging for sensitive fields (e.g., creditCardNo) using @PersonalData annotations and @cap-js/audit-logging plugin.
* To enforce strict role-based access controls that prevent unauthorized data exposure while ensuring all administrator operations are audited.
* To generate comprehensive security event logs for unauthorized access attempts, enabling regulatory compliance with PCI-DSS and GDPR requirements.


👉 Next up: [Exercise 3.2 - Security Event Monitoring in SAP BTP Production Environment](../ex3.2/README.md), where we take these audit logs beyond local testing and validate them in a production-grade enterprise environment.
