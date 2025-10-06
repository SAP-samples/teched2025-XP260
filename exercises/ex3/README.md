# Exercise 2 - SQL injection
Vulnerability: [A03:2021-Injection](https://owasp.org/Top10/A03_2021-Injection/)

## 📖  1. Overview :

This exercise demonstrates how unsanitized user inputs can be exploited to perform SQL Injection attacks, thereby compromising the integrity and confidentiality of enterprise data. In the Incident Management system, input fields—such as those accepting the customer ID, are vulnerable if not properly validated. As a result, attackers might inject malicious SQL code to retrieve, alter, or delete sensitive records without detection.

### 📐Business Rules

  - ❌ Users Must not exploit insecure input fields to inject or modify SQL queries.
  - ⚠️ All user inputs must be rigorously validated and sanitized to prevent SQL Injection.

### ⚠️ Why This Matters

 * **Business Impact:** Successful SQL Injection attacks can compromise the integrity and confidentiality of critical data, leading to unauthorized data disclosure, manipulation, or deletion.
 * **Compliance Risk:** Violates [OWASP Top 10 A03](https://owasp.org/Top10/A03_2021-Injection/) and GDPR/PCI DSS requirements for input validation.
 * **Security Risk:** Malicious actors could exfiltrate sensitive data (e.g., credit card numbers) or bypass authorization controls.

### 🎯 Key Learning Objectives

- Understand how SQL Injection works and how unsafe handling of input can be exploited.
- Learn to use CAP’s safe query APIs (parameterized queries) to prevent SQL Injection.
- Test the remediation to confirm that malicious inputs are neutralized while legitimate application functionality remains intact.

## 🚨 2. Vulnerable Code :
We’ll build upon [Exercise 1.2 - Vertical Privilege Escalation](../ex1/ex1.2/README.md)  by introducing an SQL Injection vulnerability resulting from unsanitized user input.

### What We're Adding

1. **CDS Service Definition (srv/services.cds):** A new fetchCustomer function in AdminService that accepts unvalidated input
2. **Vulnerable Implementation (srv/services.js):** Raw SQL query with direct string insertion

**Updated File:** srv/services.cds
- The updated services.cds file now includes a new function called fetchCustomer in the AdminService. This function is intentionally designed to be vulnerable to SQL injection for demonstration purposes.

```
... Other methods

annotate ProcessorService.Incidents with @odata.draft.enabled; 
annotate ProcessorService with @(requires: ['support', 'admin']);  // ✅ NEW: Allow both roles support and admin at service level.

/**
 * Service used by administrators to manage customers and incidents.
 */
service AdminService {
    entity Customers as projection on my.Customers;
    entity Incidents as projection on my.Incidents;
  
  // ✅ Add Custom Vulnerable Operation fetchCustomer to AdminService
  // ✅ Exposed via HTTP GET  {{server}}/odata/v4/admin/fetchCustomer with JSON body
    @tags: ['security', 'vulnerable']
    @summary: 'Returns customer data using unvalidated input (for testing only)'
    function fetchCustomer(customerID: String) returns array of Customers;
}
annotate AdminService with @(requires: 'admin');

```
Copy the contents of [services.cds](./srv/services.cds) into your project’s srv/services.cds file.

**Updated File:** srv/services.js
- The updated services.js file now includes a new function handler for fetchCustomer in the AdminService class.

```
const cds = require('@sap/cds');

... Other methods

// AdminService Implementation
class AdminService extends cds.ApplicationService {
  init() {
    // ❌ VULNERABLE: fetchCustomer (SQL Injection)
    this.on('fetchCustomer', async (req) => {
      const { customerID } = req.data;

      // ❌ VULNERABLE CODE: // Direct string embedding in query
      const query = `SELECT * FROM sap_capire_incidents_Customers WHERE ID = '${customerID}'`;
      const results = await cds.run(query);
      return results;
    });

    return super.init();
  }
}
// Export both services
module.exports = {ProcessorService, AdminService};
```
Copy the contents of [services_vulnerable.js](./srv/services_vulnerable.js) into your project’s srv/services.js file.


**Why this is vulnerable:**
- ❌ **No Input Validation:** The user-supplied customerID is concatenated directly into the SQL query without validation, making it possible for an attacker to inject malicious SQL code.
- ❌ **Lack of Parameterized Queries:** The raw SQL query does not use parameter binding or prepared statements, leaving the query structure exposed to manipulation.

## 💥 3. Exploitation (TBD with screenshots)

### Step 1: Create a Test File for HTTP Endpoint:
- Action :
  - Navigate to the `test/http` directory in your CAP project folder.
  - Click on "Add New File" and name it "sql-injection-demo.http".
  - Copy the contents of [sql-injection-demo.http](./test/sql-injection-demo.http) into your project’s test/http/sql-injection-demo.http file:
  
```
@server=http://localhost:4004
@username=incident.support@tester.sap.com // admin role
@password=initial

### ✅ Test 1: Legitimate Customer Lookup
### Action: Normal request with valid customer ID
### Expected: Returns single customer record
### Result: System returns data for customer ID 1004100
GET {{server}}/odata/v4/admin/fetchCustomer
Content-Type: application/json
Authorization: Basic {{username}}:{{password}}

{
  "customerID": "1004100"
}
  
### 🚨 Test 2: SQL Injection True-Clause Attack
### Action: Inject malicious payload ' OR '1'='1
### Expected: Returns ALL customer records
### Result: Full database exposure vulnerability
GET {{server}}/odata/v4/admin/fetchCustomer
Content-Type: application/json
Authorization: Basic {{username}}:{{password}}

{
  "customerID": "1004100' OR '1'='1"
}
... other method

``` 
  
- Result:
  - The test/http/sql-injection-demo.http file is now created and ready for testing.
  - This file contains three HTTP requests:
    - Test 1: A legitimate request to retrieve a specific customer.
    - Test 2: A malicious request that demonstrates a SQL injection vulnerability.
    - Test 3: A SQL injection using multiple SQL statements.

### Step 2: Exploit the SQL Injection Vulnerability

- Action:
  - Open the `sql-injection-demo.http` file in your editor.
  - Confirm in your `package.json` file that the user `incident.support@tester.sap.com` is assigned the `admin` role under the `cds.requires.[development].auth.users` configuration.
  - Navigates to a function in ###Step2 that looks up customer information and click on send request.
  
``` 
  ### 🚨 Test 2: SQL Injection True-Clause Attack
  ### Action: Inject malicious payload ' OR '1'='1
  ### Expected: Returns ALL customer records
  ### Result: Full database exposure vulnerability
  GET {{server}}/odata/v4/admin/fetchCustomer
  Content-Type: application/json
  Authorization: Basic {{username}}:{{password}}
  {
    "customerID": "1004100' OR '1'='1"
  }
```
- Result:

``` 
  HTTP/1.1 200 OK
  X-Powered-By: Express
  X-Correlation-ID: 06576897-f3fa-4d90-ab7c-bd175dd21abf
  OData-Version: 4.0
  Content-Type: application/json; charset=utf-8
  Content-Length: 950
  Date: Sun, 28 Sep 2025 19:02:26 GMT
  Connection: close
  
  {
    "@odata.context": "$metadata#Customers",
    "value": [
      {
        "createdAt": "2025-09-28T19:02:19.936Z",
        "createdBy": "anonymous",
        "modifiedAt": "2025-09-28T19:02:19.936Z",
        "modifiedBy": "anonymous",
        "ID": "1004155",
        "firstName": "Daniel",
        "lastName": "Watts",
        "name": "Daniel Watts",
        "email": "daniel.watts@demo.com",
        "phone": "+39-555-123",
        "creditCardNo": "4111111111111111"
      },
      {
        "createdAt": "2025-09-28T19:02:19.936Z",
        "createdBy": "anonymous",
        "modifiedAt": "2025-09-28T19:02:19.936Z",
        "modifiedBy": "anonymous",
        "ID": "1004161",
        "firstName": "Stormy",
        "lastName": "Weathers",
        "name": "Stormy Weathers",
        "email": "stormy.weathers@demo.com",
        "phone": "+49-020-022",
        "creditCardNo": "5500000000000004"
      },
      {
        "createdAt": "2025-09-28T19:02:19.936Z",
        "createdBy": "anonymous",
        "modifiedAt": "2025-09-28T19:02:19.936Z",
        "modifiedBy": "anonymous",
        "ID": "1004100",
        "firstName": "Sunny",
        "lastName": "Sunshine",
        "name": "Sunny Sunshine",
        "email": "sunny.sunshine@demo.com",
        "phone": "+49-555-789",
        "creditCardNo": "3400000000000094"
      }
    ]
  }  

``` 

✅ Exploitation Successful: The application returned the entire contents of the Customers table instead of just the record for customer ID 1004100.

    
### 📌Critical Vulnerability Summary
- ❌ **Complete Data Breach:** Any authenticated user can extract the entire contents of the customer table.
- ❌ **Insecure SQL Concatenation:** The services.js code uses direct string concatenation ('${customerID}') to build an SQL query instead of using parameterized queries.
- ❌ **Lack of Input Sanitization:** No validation or sanitization is performed on the customerID input parameter before it is used in the SQL query.

## 🛡️ 4. Remediation:
- This section outlines the steps required to fix the SQL Injection vulnerability identified in the fetchCustomer function.

### Step 1: Update the Vulnerable Code in srv/services.js
- The updated services.js now includes a secure version of the fetchCustomer function. It replaces the vulnerable SQL string concatenation with CAP’s built-in parameterized query API (SELECT.from), which automatically sanitizes inputs and prevents SQL injection.

```
// ✅ SECURE: Parameterized query using CAP’s fluent API
this.on('fetchCustomer', async (req) => {
  const { customerID } = req.data;

  // ✅ Use parameterized query — input is automatically sanitized
const query = SELECT.from('Customers') // Use the CDS entity name, not the full path
      .where({ ID: customerID });      

  return results;
});

```
Copy the contents of [services.js](./srv/services.js) into your project’s srv/services.js file.

### Key Changes:
  - ✅ Replaced raw SQL string concatenation with CAP’s SELECT.from().where() syntax.
  - ✅ Input is automatically parameterized and sanitized by the framework.
  - ✅ Eliminates the risk of SQL injection.

## ✅ 5. Verification:
This section outlines the steps to confirm that the remediation for the SQL Injection vulnerability has been successfully implemented. The goal is to verify that:

- Malicious SQL injection payloads are neutralized and no longer return unauthorized data.
- Legitimate requests continue to function correctly and return expected results.
- The application now correctly uses parameterized queries, preventing any manipulation of the query structure.

### Step 1: Test Legitimate Request (Valid Input)
- Action :
  - Run the following commands from integrated terminal :

```
  cds build
  cds deploy
  cds watch
```
* 💡**Note:** Ensure the deployment includes the updated [services.js](./srv/services.js) file with the secure parameterized query implementation.

- Open the sql-injection-demo.http file.
- Execute the **Test 1: Legitimate Customer Lookup request:**

```
GET http://localhost:4004/odata/v4/admin/fetchCustomer
Content-Type: application/json
Authorization: Basic incident.support@tester.sap.com:initial
{
  "customerID": "1004100"
}
```
- Result:
  - ✅ The system returns a single customer record for ID = 1004100.
  - ✅ This confirms that legitimate functionality remains intact after the fix.

### Step 2: Test SQL Injection Attempt (Malicious Input)
- Action:
  - Execute the **Test 2: SQL Injection True-Clause Attack request:**
```
  GET http://localhost:4004/odata/v4/admin/fetchCustomer
  Content-Type: application/json
  Authorization: Basic incident.support@tester.sap.com:initial
  {
    "customerID": "1004100' OR '1'='1"
  }
```
- Result:
```
  HTTP/1.1 200 OK  
  X-Powered-By: Express  
  X-Correlation-ID: 5dea2017-7c3a-46cd-9e45-0b119edce4ff  
  OData-Version: 4.0  
  Content-Type: application/json; charset=utf-8  
  Content-Length: 51  
  Date: Sun, 28 Sep 2025 19:45:56 GMT  
  Connection: close  
  
  {
    "@odata.context": "$metadata#Customers",
    "value": []
  }
```
- ✅ Empty array [] returned.
- ✅ The malicious payload ' OR '1'='1 is treated as a literal string value rather than executable SQL.
- ✅ This confirms that the SQL injection vulnerability has been successfully mitigated.

### Step 3: Test Additional Malicious Payloads (Optional)
- Action:
  - - Execute the **Test 3: SQL Injection - multiple sql statements payloads to ensure robustness:**

```
  ### Test 3: SQL Injection -  multiple sql statements
  ### Payload: 'UNION SELECT * FROM Customers --"   (multiple sql statements)
  ### Expected: Returns empty array
  GET  {{server}}/odata/v4/admin/fetchCustomer
  Content-Type: application/json
  Authorization: Basic {{username}}:{{password}}

{
     "customerID": "1004100'; SELECT * from sap_capire_incidents_Customers;-- "
}
```
- Result:
- ✅ All malicious payloads fail to return unintended data or alter query behavior.
- ✅ The application either returns no results or a validation error, confirming comprehensive protection.

### 📌 Verification Summary
The remediation successfully addresses the SQL Injection vulnerability by:
- **Eliminating String Concatenation:** Replaced unsafe SQL string building with CAP’s parameterized query API (SELECT.from().where({...})).
- **Neutralizing Malicious Inputs:** Attack payloads (e.g., ' OR '1'='1) are treated as data values, not executable code.
- **Preserving Legitimate Functionality:** Valid requests continue to work as expected without disruption.
- **Leveraging Framework Security:** CAP’s built-in query translation to CQN (Core Query Language) and parameter binding prevent SQL injection at runtime.

## 📌 Summary

### 🔑 Key Take‑aways (SAP CAP Recommendations)
Whenever there’s user input involved:
  1. **Never use string concatenation when constructing queries! :** Use parameterized APIs (e.g., CAP’s SELECT.from().where()) to ensure user input is treated as data, not executable code.
  2. **Never surround tagged template strings with parentheses! :** The parentheses (${userInput}) force JavaScript to evaluate the template literal as a raw string before it reaches the SQL parser. The malicious input becomes part of the SQL command: WHERE id = (1; DROP TABLE users--).

In this exercise, you have learned how to:
- **Identify SQL Injection Vulnerabilities:** Recognize unsafe patterns like direct string interpolation in queries.
- **Implement Parameterized Queries:** Use CAP’s fluent API (SELECT.from().where()) to securely handle user input.
- **Test Remediation:** Verify the fix via the HTTP endpoint by testing that valid inputs succeed and SQL injection attempts are blocked.
- **Adopt Secure Coding Practices:** Prevent OWASP A03:2021–Injection risks by avoiding manual SQL string construction.


👉 Next up: [Exercise 2 - Security Logging and Monitoring Failures](../../ex2/README.md), where we address critical [OWASP Top 10 2021 list (A09)](https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/) risks by implementing CAP's audit logging framework to detect unauthorized data access, track sensitive information flow, and ensure regulatory compliance through comprehensive security monitoring in enterprise environments.






