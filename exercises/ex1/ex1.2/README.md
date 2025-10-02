# Exercise 1.2 - Vertical Privilege Escalation

## 📖  1. Overview :

After addressing in [Exercise 1.1 - Horizontal Privilege Escalation](../ex1.1/README.md), the next step is to tackle vertical privilege escalation, which occurs when a user gains access to higher-privileged functions they shouldn't have. 
In our Incident Management system, this means a support user could perform actions that are reserved for administrators, such as closing high-urgency incidents, or modifying or deleting closed incidents. 
This violates critical business rules and poses significant risks to the integrity and compliance of the system.

### 📐 Business Rules

* Support Users:
  - ✅ Can view and create incidents.
  - ✅ Can update or delete non-closed incidents assigned to them or unassigned.
  - ❌ Cannot modify or delete incidents assigned to other support users.
  - ❌ Cannot modify or delete closed incidents.
  - ❌ Cannot close high-urgency incidents.

* Administrators:
  - ✅ Can view, create, update, and delete all incidents.
  - ✅ Can close all incidents, including high-urgency incidents.
  - ✅ Can modify or delete closed incidents.

### 🎯 Key Learning Objectives :
  - Identify vulnerabilities that allow support users to perform actions reserved for administrators
  - Remediate these vulnerabilities by enforcing strict access controls
  - Ensure only authorized users can perform sensitive operations
  - Reinforce business logic to mitigate security risks

## 🚨 2. Vulnerable Code
we will use exactly the [remediated code from Exercise 1.1.](../ex1.1#%EF%B8%8F-4-remediation), It correctly prevents support users from touching other users’ incidents, but it does not yet enforce admin‑only rules (e.g. closing high‑urgency incidents, modifying closed incidents, deleting any incident).

**File**: `srv/services.cds`
```cds
using { sap.capire.incidents as my } from '../db/schema';

service ProcessorService {
  @restrict: [
    { grant: ['READ', 'CREATE'], to: 'support' },        // ✅ Support can view all incidents
    { grant: ['UPDATE', 'DELETE'],                       // ✅ UPDATE, DELETE granted to support users
      to: 'support',
      where: 'assignedTo is null or assignedTo = $user'  // ✅ Horizontal control (correct)
    }
  ]
  entity Incidents as projection on my.Incidents;
  @readonly
    entity Customers as projection on my.Customers;     
}

annotate ProcessorService with @(requires: 'support');  // ❌ Only support role required, Admins excluded

```
**File**: `srv/services.js`
```
const cds = require('@sap/cds')

class ProcessorService extends cds.ApplicationService {
  init() {

... // Other methods...

// ❌ VULNERABILITY:
// No check for admin role and for high-urgency incidents when status is changed to 'closed'
// No check that only admins can modify closed incidents.
// No updates or deletes on closed incidents.
  async onModify(req) {
    const result = await SELECT.one.from(req.subject)
      .columns('status_code')
      .where({ ID: req.data.ID })

    if (!result) return req.reject(404, `Incident ${req.data.ID} not found`)

    if (result.status_code === 'C') {
      const action = req.event === 'UPDATE' ? 'modify' : 'delete'
      return req.reject(403, `Cannot ${action} a closed incident`)
    }
  }
  
}

... // Other methods

```

**Why This is Vulnerable:**
  - ❌ No DELETE validation in JavaScript to enforce admin-only deletion.
  - ❌ No check for incident urgency when a support user tries to close an incident.
  - ❌ Admin privileges are not enforced at both service (ProcessorService) and CRUD operation level.
    
## 💥 3. Exploitation (TBD with screenshots)

### Step 1: Login as Alice (Support User) :
- Access SAP Build Work Zone.
- Login with alice.support@company.com. This user is set up from the from the previous exercise.
- Navigate to Incident Management application.

### Step 2: Exploit Closing High-Urgency Incident
- Action: 
  - Find a high-urgency incident assigned to Alice (e.g., "Strange noise when switching off Inverter").
  - Click "Edit" → Change Status to "Closed".
  - Add a conversation message: "Closing this high-urgency incident as support user"
  - Click "Save"
- Result:
  - ❌ The system allows Alice to close High-Urgency incident, violating the business rule.

### Step 3: Login as Admin User

- Action:
  - Log out and log in as david.admin@company.com (admin role).
  - Navigate to the closed incident modified by Alice.
  - Attempt to edit the closed incident (e.g., add a comment).
- Result:
  - ❌ UI displays a blank loading screen (no error message).
  - ❌ Root Cause: @requires: 'support' in services.cds blocks admin access to the service.

### 📌Critical Vulnerability Summary
- ❌ Support users can close high-urgency incidents.
- ❌ Admins are excluded entirely from modifying closed incidents due to misconfigured @requires.
- ❌ No validation in services.js for:
  - Admin role when closing high-urgency incidents.
  - Admin role when modifying closed incidents.
- ❌ Silent errors for admins reduce transparency and hinder operations.

## 🛡️ 4. Remediation
The fixes follow the principle of least privilege, ensuring support users are blocked from unauthorized actions while admins retain elevated permissions.

### Key Remediation Steps

* **Enhance Service-Level and Entity-Level Authorization:** Update services.cds to include explicit grants for admins and ensure proper role requirements.
* **Implement Custom Validation Logic:** Add checks in services.js to validate urgency and user roles during UPDATE operations, rejecting invalid closures.
* **Improve UI Error Handling:** Modify the frontend to display meaningful error messages for forbidden actions.

### Step 1: Update Services.cds
The updated version for this exercise introduces vertical privilege escalation protections, explicitly defining admin privileges for Processorservice while maintaining the horizontal controls from [Exercise 1.1 - Horizontal Privilege Escalation]((../ex1.1/README.md))


```
// Updated srv/services.cds

using { sap.capire.incidents as my } from '../db/schema';

service ProcessorService {
  @restrict: [
    { grant: ['READ', 'CREATE'], to: 'support' },  // Support can view and create
    { grant: ['UPDATE', 'DELETE'], 
      to: 'support',
      where: 'assignedTo is null or assignedTo = $user'  // Horizontal control for support
    },
    { grant: '*', to: 'admin' }  // ✅ NEW: Explicit full access for admins (CREATE, READ, UPDATE, DELETE)
  ]
  entity Incidents as projection on my.Incidents;

}

annotate ProcessorService with @(requires: ['support', 'admin']);  // ✅ NEW: Allow both roles support and admin at service level.

...

```
Copy the contents of [services.cds](./services.cds) into your project’s srv/services.cds file.

Key Changes:

* ✅ Admin Full Access: { grant: '*', to: 'admin' } grants admins complete CRUD permissions.
* ✅ Service-Level Role Requirements: @requires: ['support', 'admin'] allows both roles to access the service.

### Step 2: Update Services.js
The initial remediation code from [Exercise 1.1]((../ex1.1/README.md)) secured against horizontal privilege escalation (support users interfering with others' incidents). 
However, it still allowed support users to perform actions reserved for administrators, such as closing high-urgency incidents. We enhance the existing services.js to fix vertical privilege escalation.

Here is the updated services.js with added checks to enforce the admin-only rules:

```
// Updated srv/services.js

... // Other methods

 // ✅ NEW : Enforce admin-only operations (vertical ESC)
  async onModify(req) {
    // Fetch current incident state (status + urgency)
    const result = await SELECT.one.from(req.subject)
      .columns('status_code', 'urgency_code')
      .where({ ID: req.data.ID });

    if (!result) return req.reject(404, `Incident ${req.data.ID} not found`);

    // Check if incident is already closed
    if (result.status_code === 'C') {
    // ✅ NEW : Allow only admins to modify/delete closed incidents
      if (!req.user.isAdmin()) {
        const action = req.event === 'UPDATE' ? 'modify' : 'delete';
        return req.reject(403, `Cannot ${action} a closed incident`);
      }
      // Admins can proceed
      return;
    }
    // ✅ UPDATE : Check if user is attempting to close the incident (status_code set to 'C')
    if (req.data.status_code === 'C') {
    // ✅ NEW : Block support users from closing high-urgency incidents
      if (result.urgency_code === 'H' && !req.user.isAdmin()) {
        return req.reject(403, 'Only administrators can close high-urgency incidents');
      }
    }

... // Other methods

module.exports = { ProcessorService }

```
Copy the contents of [services.js](./services.js) into your project’s srv/services.js file.

Key Changes:

* ✅ Implements role-based access control using req.user.isAdmin().
* ✅ Allows administrators to modify/delete closed incidents.
* ✅ Returns 403 Forbidden with descriptive error message
* ✅ Prevents support users from closing high-urgency incidents (urgency_code === 'H').
* ✅ Allows administrators to close any incident, including high-urgency ones.

## ✅ 5. Verification:
This section outlines the steps to confirm that the remediation for the Vertical Privilege Escalation vulnerability has been successfully implemented. The goal is to verify that:

* Support users cannot perform admin-only operations (e.g., closing high-urgency incidents, modifying/deleting closed incidents).
* Admin users can perform all operations, including those restricted for support users.

### Step 1: Deploy the Updated Application

```
mbt build
cf deploy mta_archives/incident-management_1.0.0.mtar
```
💡 Ensure the deployment includes both updated srv/services.cds and services.js logic.

### Step 2: Login as Alice (Support User)
- Action:
  - Access SAP Build Work Zone and log in with alice.support@company.com.
  - Locate a high-urgency incident assigned to Alice or unassigned.
  - Confirm the urgency is set to "High" and the status is "New" (not closed).
  - Click "Edit" and try to set the status to "Closed" (status_code = 'C').
  - Save the changes.
- Result:
  - ❌ The system blocks the action.
  - ❌ The UI displays an error: "Only administrators can close high-urgency incidents."
  - ✅ This confirms that vertical privilege escalation is prevented for high-urgency incidents.

### Step 3: Verify Alice Can Modify Non-High-Urgency Incidents
- Action:
  - Locate a medium-urgency (code: 'M') incident assigned to Alice or unassigned.
  - Click "Edit", change status to "Closed", and save.
- Result:
  - ✅ The system allows the update and closes the incident.
  - ✅ This confirms that normal workflow operations are preserved for non-critical incidents. Support users can close regular tickets — only high-urgency closures are restricted.
 
### Step 4: Login as David (Admin User)
  - Action:
    - Log in with david.admin@company.com
    - Locate a high-urgency open incident (assigned to anyone or unassigned).
    - Click "Edit", change status to "Closed", and save.
- Result:
    - ✅ The system successfully closes the high-urgency incident.
    - ✅ This confirms that only administrators can perform sensitive actions like closing high-risk incidents, as enforced by { grant: '*', to: 'admin' } and correct role-based access control.
 
### Step 5: Verify David can Modify/Delete a Closed Incident
- Action:
  - Locate the closed incident from Step 4.
  - Edit the title or delete the incident.
- Result:
- ✅ The system allows both operations.
- ✅ This confirms admins bypass restrictions applied to support users.

### 📌 Verification Summary

The remediation successfully addresses Vertical Privilege Escalation by:

**1. Restricting Support Users:**

  - Cannot close high-urgency incidents.
  - Cannot modify/delete closed incidents.
  - Retain modify only to their own non-high-urgency incidents.

**2. Empowering Admin Users:**
  - Full access to all incidents and operations.
  - Can close high-urgency incidents and modify closed incidents.

**3. Security Mechanisms:**
  - Declarative Security: @restrict rules in services.cds enforce role-based access.
  - Imperative Security: services.js handlers (e.g., onModify) validate business rules.
  - Defense in Depth: Combined CDS annotations and JavaScript logic prevent bypasses.

## 📌 Summary

In these exercises, you have learned how to:
  - Mitigate Vertical Privilege Escalation by explicitly defining admin-only operations in @restrict rules.
  - Leverage CAP’s Role-Based Access Control (RBAC) to separate support and admin capabilities.
  - Combine Declarative and Imperative Security for comprehensive protection:
    * CDS Annotations (@restrict) for coarse-grained access control.
    * JavaScript Handlers (e.g., onModify) for fine-grained business logic enforcement.
  - Test Security Rules by validating both allowed and denied operations for each role.
    
👉 Next up: [Exercise 2 - Security Logging and Monitoring Failures](../../ex2/README.md), where we address critical  [OWASP Top 10 2021 list (A09)](https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures) risks by implementing CAP's audit logging framework to detect unauthorized data access, track sensitive information flow, and ensure regulatory compliance through comprehensive security monitoring in enterprise environments.
