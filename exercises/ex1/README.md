# Exercise 1 - Broken Access Control
Vulnerability: [A01:2021 – Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)

## 📖 Overview
Broken Access Control  is the most critical web application security risk, according to the [OWASP Top 10 2021 list (A01)](https://owasp.org/Top10/A01_2021-Broken_Access_Control/). It occurs when an application fails to enforce proper authorization, allowing users to view or modify resources they are not permitted to access. When access control is broken, threat actors can act outside of their intended permissions. This can manifest itself in several ways:

- **Horizontal Privilege Escalation :** When a user gains access to another user’s data or actions at the same privilege level.
- **Vertical Privilege Escalation :** When a user gains higher‑level privileges, such as performing admin‑level operations.
- **Insecure Direct Object References (IDOR) :** When attackers access restricted resources by directly manipulating object identifiers (e.g., IDs in a URL)

> 💡 **Note:** In the following exercises, we will focus only on **Horizontal Privilege Escalation** and **Vertical Privilege Escalation**.

## ⚠️ Why This Matters

* **Business Impact:** Unauthorized modifications could lead to incorrect incident handling, data tampering, and workflow disruption.
* **Compliance Risk:** Violates [OWASP Top 10 A01](https://owasp.org/Top10/A01_2021-Broken_Access_Control/) and the principle of least privilege.
* **Security Risk:** Malicious or careless users could alter other peoples' work, close tickets improperly, or delete evidence.

## 🔐 CAP Security Concept 

CAP provides a multi-layered security approach:

- **Authentication:** Verifies the user identity (managed by XSUAA/Identity Authentication service).

- **Authorization:** Controls what authenticated users can do.
    - **Role-based [(`@requires` annotations)](https://cap.cloud.sap/docs/guides/security/authorization#requires):** : Controls access to functions or resources based on predefined organizational roles assigned to the user.
    - **Instance-based [(`@restrict` annotations)](https://cap.cloud.sap/docs/guides/security/authorization#restrict-annotation):** : Limit which specific records or instances a user can interact with (e.g., a user can only see data they created).
    - **Programmatic checks  [(in service handlers)](https://cap.cloud.sap/docs/guides/providing-services#custom-logic):** Used when annotations are insufficient for complex business rules.

There are two exercises related to this topic.

Continue to [Exercise 1.1 - Horizontal Privilege Escalation](./ex1.1/README.md)

and then to  [Exercise 1.2 - Vertical Privilege Escalation](./ex1.2/README.md)


## Summary

When you have finished the two exercises related to Broken Access Control

continue to - [Exercise 2 - SQL Injection](../ex2/README.md)

