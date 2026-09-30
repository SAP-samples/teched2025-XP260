# Exercise 1.1 - Horizontal Privilege Escalation
Vulnerability: [A01:2021 – Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)

## Table of Contents
- [📖  1. Overview](./README.md#--1-overview)
- [🚨 2. Vulnerable Code](./README.md#-2-vulnerable-code)
- [💥 3. Exploitation](./README.md#-3-exploitation)
- [🛡️ 4. Remediation](./README.md#%EF%B8%8F-4-remediation)
- [✅ 5. Verification](./README.md#-5-verification)
- [📌 6. Summary](./README.md#-6-summary)

## 📖  1. Overview

Horizontal Privilege Escalation occurs when a user accesses resources belonging to another user at the same privilege level. In our Incident Management system, this means a support user could modify incidents assigned to other support users, violating critical business rules.

### 📐 Business Rules for Support Users

  - ✅ Can view and create incidents.
  - ✅ Can update or delete incidents assigned to them or unassigned incidents.
  - ❌ Cannot modify or delete incidents assigned to other support users.
  - ❌ Cannot modify or delete closed incidents.

### 🎯 Key Learning Objectives

- Identify and remediate vulnerabilities that allow support users to perform actions reserved for other support users.  
- Enforce strict access controls to ensure only authorized users can perform sensitive operations.  
- Reinforce business logic by preventing unauthorized actions.  

## 🚨 2. Vulnerable Code
⚠️ Note: Do not copy the code from the **Vulnerabile Code** section into your project.

**File**: `db/schema.cds`
```cds
// VULNERABLE CODE - Missing assignedTo field
using { cuid, managed, sap.common.CodeList } from '@sap/cds/common';
namespace sap.capire.incidents; 

/**
* Incidents created by Customers.
*/
entity Incidents : cuid, managed {  
  customer     : Association to Customers;
  title        : String  @title : 'Title';
  urgency      : Association to Urgency default 'M';
  status       : Association to Status default 'N';
  // ❌ MISSING: assignedTo field - no way to track incident ownership
  conversation : Composition of many {
    key ID    : UUID;
    timestamp : type of managed:createdAt;
    author    : type of managed:createdBy;
    message   : String;
  };
}
```

**File**: `srv/services.cds`
```cds
// VULNERABLE CODE - No access restrictions
using { sap.capire.incidents as my } from '../db/schema';

/**
 * Service used by support personnel, i.e. the incidents' 'processors'.
 */
service ProcessorService {

    @requires: 'support'                               // ❌ VULNERABILITY: 'support' role grants unrestricted access to all operations.
                                                       // ❌ Missing row-level or field-level restrictions exposes sensitive incident data.
    entity Incidents as projection on my.Incidents;    // ❌ 'support' role can access all incidents (read, write, delete) 

    @readonly                                          // ✅ Read-only customers (correct)
    @requires: 'support'
    entity Customers as projection on my.Customers;    // ✅ 'support' role can only read customers (correct)
}

annotate ProcessorService.Incidents with @odata.draft.enabled;
annotate ProcessorService with @(requires: 'authenticated-user');  // ✅ Any logged-in user can load $metadata

```
**Why this is vulnerable:**
- The database schema lacks an 'assignedTo' field to track incident ownership.
- The `@(requires: 'support')` annotation only checks if the user has the support role.
- Any support user can UPDATE/DELETE any incident, regardless of assignment.


## 💥 3. Exploitation

### 🪜 Step 1: Login as Alice (Support User) 

- Access SAP Build Work Zone.
- Login with alice.support@company.com.
- Navigate to the Incident Management application.

### 🪜 Step 2: Exploit Modifying an Incident

- ▶️ Action:
  - View the incidents list - Alice can see all incidents.
  - Click on any non-closed incident (e.g., "No current on a sunny day").
  - Click "Edit" button - **This works because there are no ownership restrictions**.
  - Modify the incident:
      - Change title to "URGENT - Modified by Alice".
      - Change status to "In Process".
      - Add a conversation entry: "Alice was here".
  - Click "Save".
   
- ✅ Result:
  - ❌ The system allows Alice to modify and save ANY non-closed incident.
  - ❌ Root Cause: No 'assignedTo' field,  means no ownership tracking is possible.
 
### 🪜 Step 3: Attempt Updating a Closed Incident

- ▶️ Action:
  - Navigate to a closed incident (e.g., one with status "Closed").
  - Click "Edit".
  - Try to modify the incident details (e.g., change the title or add a conversation entry).
  - Click "Save".
    
- ✅ Result:
  - ✅ The system prevents the update and displays an error (e.g., "Cannot modify a closed incident").
  - 👉 This is due to the existing check in services.js, which blocks updates on closed incidents regardless of the user role.
  - ❌ However, this does not mitigate the core Horizontal Privilege Escalation issue, as Alice can still update non-closed incidents not assigned to her.

### 🪜 Step 4: Exploit Deleting an Incident

- ▶️ Action:
  - Navigate to any incident.
  - Click "Delete" (or select the incident and click the Delete button).
  - Confirm deletion when prompted (e.g., "Are you sure you want to delete this incident?").
    
- ✅ Result:
  - ❌ The system allows Alice to delete ANY incident.
  - ❌ Root Cause: No 'assignedTo' field, means no ownership tracking is possible.
    
### 🪜 Step 5: Test with Another User

- ▶️ Action:
  - Log out as Alice and log in as bob.support@company.com (another support user).
  - Repeat the update and delete actions on any incidents.
  - 
- ✅ Result: ❌ The system allows Bob to perform the same unauthorized updates and deletions, confirming that all support users have unrestricted access to all open incidents.

### 📌 Critical Vulnerability Summary

* ❌ **No ownership validation:** Without the 'assignedTo' field in the schema, there's no way to enforce restrictions, allowing any support user to update or delete any open incident.
* ❌ **Partial safeguards:** While updates to closed incidents are blocked, deletions remain unrestricted, amplifying risks.
* ❌ **Security risks:** This enables widespread data tampering and deletion, directly aligning with OWASP Top 10 A01: Broken Access Control.

## 🛡️ 4. Remediation
The fix requires both database schema changes and service-level security implementation.

### 🪜 Step 1: Add Assignment Tracking to Database Schema

- Copy the contents of [schema.cds](./db/schema.cds) into your project’s db/schema.cds file.
- Ensure the following corrected code is included in the file:

**File**: `db/schema.cds`
```cds
// db/schema.cds - FIXED VERSION
using { cuid, managed, sap.common.CodeList } from '@sap/cds/common';
namespace sap.capire.incidents; 

/**
* Incidents created by Customers.
*/
entity Incidents : cuid, managed {  
  customer     : Association to Customers;
  title        : String  @title : 'Title';
  urgency      : Association to Urgency default 'M';
  status       : Association to Status default 'N';

  // ✅ NEW: ADD User assignment fields
  assignedTo   : String(255);  // Email of assigned support user

  conversation : Composition of many {
    key ID    : UUID;
    timestamp : type of managed:createdAt;
    author    : type of managed:createdBy;
    message   : String;
  };
}
... // Other entity
```

### 🪜 Step 2: Update Test Data with Assignments

- Copy the contents of [sap.capire.incidents-Incidents.csv](./db/data/sap.capire.incidents-Incidents.csv) into your project’s **db/data/sap.capire.incidents-Incidents.csv** file.
- Ensure the following data is included in the file:

File: `db/data/sap.capire.incidents-Incidents.csv`
 *   Add the 'assignedTo' column and assign incidents to our test users.
 *   **Note:** Use the actual user IDs from your identity provider (IdP). For this workshop, we'll use their email addresses as a stand-in.

```
ID,customer_ID,title,urgency_code,status_code,assignedTo
3b23bb4b-4ac7-4a24-ac02-aa10cabd842c,1004155,Inverter not functional,H,C,bob.support@company.com
3a4ede72-244a-4f5f-8efa-b17e032d01ee,1004161,No current on a sunny day,H,N,bob.support@company.com
3ccf474c-3881-44b7-99fb-59a2a4668418,1004161,Strange noise when switching off Inverter,M,N,alice.support@company.com
3583f982-d7df-4aad-ab26-301d4a157cd7,1004100,Solar panel broken,H,I,alice.support@company.com
3583f982-d7df-4aad-ab45-301d4a157cc7,1004100,Door lock broken,H,N,

```

### 🪜 Step 3: Implement Service-Level Security

- Copy the contents of [services.cds](./srv/services.cds) into your project’s **srv/services.cds** file.
- Ensure the following corrected code is included in the file:

File: `srv/services.cds`

```
using { sap.capire.incidents as my } from '../db/schema';

/**
 * Service used by support personel, i.e. the incidents' 'processors'.
 */
// ✅ SECURED: ProcessorService with proper access controls

  service ProcessorService {
    
  @restrict: [ // You can use the @restrict annotation to define authorizations on a fine-grained level.
        
        { grant: ['READ', 'CREATE'], to: 'support' },          // ✅ Support users can view and create incidents

        // ✅ THIS IS THE KEY CHANGE:
        // Support users can only UPDATE or DELETE incidents that are either
        // unassigned (assignedTo is null) or assigned to themselves.
        { 
            grant: ['UPDATE', 'DELETE'], 
            to: 'support', 
            where: 'assignedTo is null or assignedTo = $user' 
        },
    ]
    entity Incidents as projection on my.Incidents;    

    @readonly
    entity Customers as projection on my.Customers;        
}

    annotate ProcessorService.Incidents with @odata.draft.enabled; 
    annotate ProcessorService with @(requires: ['support']);

... // Other methods
```

>**Note:**  
> In SAP CAP, the `@restrict` annotations in `services.cds` are processed **before** the `services.js` logic and generate system-level errors (e.g., `403 Forbidden`) directly at the database query layer.  
> These errors are not directly customizable via `services.js` because the framework does not expose them to the JavaScript runtime.  
>  
> However, you can handle or override error behavior in `services.js` for **application-level validations** (e.g., dynamic business rules requiring runtime checks).  
>  
> 📌 **Rule of Thumb:**  
> - `@restrict` in `services.cds` → **static authorization checks**. Enforced by CDS *before* any custom code runs.  
> - `before`/`after` handlers in `services.js` → **dynamic business rules** that cannot be expressed using static `where` conditions.

- Copy the contents of [services.js](./srv/services.js) into your project’s **srv/services.js** file.
- Ensure the following corrected code is included in the file:

File: `srv/services.js`

```javascript
const cds = require('@sap/cds')

class ProcessorService extends cds.ApplicationService {
  /** Registering custom event handlers */
  init() {
    // ✅ NEW: Validate business rules
    this.before(['UPDATE', 'DELETE'], 'Incidents', req => this.onModify(req));

    // ✅ NEW: Enrich before CREATE (auto‑assignment + urgency handling)
    this.before("CREATE", "Incidents", req => this.onBeforeCreate(req))

    return super.init();
  }

...

//  ✅ NEW : block updates or deletes for closed incidents */
  async onModify(req) {
    const result = await SELECT.one.from(req.subject)
      .columns('status_code')
      .where({ ID: req.data.ID })

    if (!result) return req.reject(404, `Incident ${req.data.ID} not found`)
    // 'C' : Closed incident
    if (result.status_code === 'C') { 
      const action = req.event === 'UPDATE' ? 'modify' : 'delete'
      return req.reject(403, `Cannot ${action} a closed incident`)
    }
  }

// ✅ NEW: Before CREATE: Auto‑assign + urgency keyword detection */
  async onBeforeCreate(req) {
    const incident = req.data

    // Auto‑assign if status = 'A' Assigned incident
    if (incident.status_code === 'A' && req.user) {
      incident.assignedTo = req.user.id
      console.log(`📝 Auto‑assigned incident to ${req.user.id}`)
    }

    // Adjust urgency based on title
    this.changeUrgencyDueToSubject(incident)
  }
}

module.exports = { ProcessorService }
```

### 🪜 Step 4: Update UI to Show Assignment
To make the new assignedTo field visible and usable in your Fiori Elements application, you need to
add the following parts in the code:

**annotations.cds file:**
  - **General Information:** Add assignedTo field to UI.FieldGroup #GeneratedGroup
  - **Extend UI:** Show assignedTo on the user interface.
  - **Selection Fields:** Add assignedTo to UI.SelectionFields for filtering/sorting

**i18n.properties file:** Add new property: AssignedTo=Assigned To

- Copy the contents of [annotations.cds](./app/incidents/annotations.cds) into your project’s **app/incidents/annotations.cds** file.
- Ensure the following corrected code is included in the file:

**File**: app/incidents/annotations.cds changes:

```
UI.FieldGroup #GeneratedGroup : {

    $Type : 'UI.FieldGroupType',
    Data : [
        {
            $Type : 'UI.DataField',
            Value : title,
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>Customer}',
            Value : customer_ID,
        },
        // ✅ NEW: 'assignedTo' field to UI.FieldGroup #GeneratedGroup
        {
            $Type : 'UI.DataField',
            Label : '{i18n>AssignedTo}', // Use consistent i18n label for assigned user in general info
            Value : assignedTo,
        },
    ],
},
...
  UI.LineItem : [
      ...
      {
          $Type : 'UI.DataField',
          Value : urgency.descr,
          Label : '{i18n>Urgency}',
      },
      // ✅ NEW: Show assigned user in the list view
      {
          $Type : 'UI.DataField',
          Value : assignedTo,
          Label : '{i18n>AssignedTo}',
          @UI.Importance : #High   // ✅ NEW: ensures visible by default
      },

  ],

  // ✅ ADDED: Add 'assignedTo' field to selection fields for filtering/sorting
  UI.SelectionFields : [
      status_code,
      urgency_code,
      assignedTo, 
  ],

... // Other methods
```

**File**: /i18n/i18n.properties changes

- Copy the contents of [i18n.properties](./_i18n/i18n.properties) into your project’s **/_i18n/i18n.properties** file.
- Ensure the following corrected code is included in the file:
  
```
... Other entries

#XFLD,121: ✅ ADDED Label for assigned user field
AssignedTo=Assigned To

```

## ✅ 5. Verification
This section outlines the steps to confirm that the remediation for the Horizontal Privilege Escalation vulnerability has been successfully implemented. The goal is to verify that support users can only modify or delete incidents assigned to them or unassigned incidents, and that updates or deletions on closed incidents are blocked.

### 🪜 Step 1: Deploy the Updated Application to Cloud Foundry
- Open a terminal window.
  - In the Explorer Pane, right-click on the project name to open the context menu.
  - Select the menu item "Open in Integrated Terminal".
- Update the node modules in the development environment to ensure you have the current versions.
  ```
  npm update
  ```  
- Unless you already logged-in in the "Getting Started" section, login with the Cloud Foundry command line interface.
  ```
  cf login -a https://api.cf.eu10-004.hana.ondemand.com  --origin akihlqzx8-platform
  ```
  - Enter your credentials, email "XP260***@education.cloud.sap" and the corresponding password.
  - As you are only assigned to one org and one space, these are selected automatically.
- Start the build and deploy the new version. These steps may take a few minutes.  
  ```
  mbt build
  cf deploy mta_archives/incident-management_1.0.0.mtar
  ```

### 🪜 Step 2: Login as Alice (Support User)
- ▶️ Action:
  - Access SAP Build Work Zone and log in with alice.support@company.com. (Note: Make sure to refresh the application first.)
  - In the incident list, locate an incident assigned to Alice (e.g., "Strange noise when switching off Inverter").
  - Confirm the 'Assigned To' column displays alice.support@company.com.
  - Click on the incident to open its details.
  - Click "Edit", modify the title (e.g., change to "UPDATED BY ALICE - Test"), add a conversation entry, and save.
- ✅ Result:
  - ✅ The system allows Alice to successfully edit and save her own incident.
  - ✅ This confirms that the **@restrict: { grant: ['UPDATE', 'DELETE'], to: 'support', where: 'assignedTo is null or assignedTo = $user' }** rule correctly permits actions on incidents assigned to her.    

### 🪜 Step 3: Verify Alice Cannot Modify Another User's Incident
- ▶️ Action:
  - In the incident list, locate an incident assigned to Bob (e.g., "No current on a sunny day").
  - Click "Edit" on this incident.
- ✅ Result:
  - ❌ The system blocks the edit attempt.
  - ❌ The UI shows a 403 Forbidden error (or "Access denied" message).
  - ✅ This confirms that the where: 'assignedTo = $user' condition is effectively enforced — Alice cannot access Bob’s incident, even though both are support users. 👉 This resolves the Horizontal Privilege Escalation vulnerability.
 
### 🪜 Step 4: Verify Alice Cannot Modify or Delete a Closed Incident that is on Alice's Name
- Action:
  - Locate a closed incident (e.g., one with status "Closed").
  - Click "Edit" and make changes.
  - Click "Save". If editing is not possible, attempt to select the incident and click "Delete".
- ✅ Result:
  - ❌ For updates: The system blocks the edit with an error (e.g., "Cannot modify a closed incident" from services.js).
  - ❌ For deletions: The system prevents deletion with a similar error. This confirms the combined effect of @restrict and the onModify handler in services.js.

### 🪜 Step 5: Verify Alice Can Modify an Unassigned Incident
- ▶️ Action:
  - Locate an unassigned incident (e.g., one where "Assigned To" is null).
  - Click "Edit", make changes (e.g., update the title), and save.
- ✅ Result: The system allows the modification, as per the remediated rule (where: 'assignedTo is null or assignedTo = $user'), demonstrating that unassigned incidents are accessible to support users.

## 📌 Verification Summary
The remediation is successful as a combination of:
- Adding the 'assignedTo' field in schema.cds.
- Implementing @restrict with where: 'assignedTo = $user'.
- Enforcing business rules in services.js

This eliminates Horizontal Privilege Escalation and enforces the principle of least privilege.
  
## 📌 6. Summary

In these exercises, you have learned how:

* To address Horizontal Privilege Escalation by implementing the crucial data ownership field (assignedTo) and enforcing granular authorization rules.
* To leverage CAP's native @restrict annotation and the $user context to declaratively define and enforce security policies directly within the service definition.
* To secure the application by ensuring support users can only modify/delete incidents assigned to them, thereby reinforcing business logic and mitigating a critical OWASP Top 10 vulnerability.

👉 Next up: [Exercise 1.2 - Vertical Privilege Escalation](../ex1.2/README.md), where we prevent low-privilege users from exploiting authorization gaps to assume elevated administrative rights and perform restricted operations.
