# Getting started
In the excercises you will use a BTP subaccount with a subaccount admin user, which is the same as platform and application user.
You can find the access information for your Subaccount on your desk and the link in the browser.
[Global Account: SAP-TechEd-2025 – Account Explorer](https://emea.cockpit.btp.cloud.sap/cockpit?idp=akihlqzx8.accounts.ondemand.com#/globalaccount/4c772782-0751-42ee-93c3-897452fdcb63/accountModel&//?section=HierarchySection&view=TreeTableView)




- xp260-0XX@education.cloud.sap ( with XX depending on your seat from 01 - 40 )
- PWD is always  Acce$$teched25
- Identity Provider they reside in is the Identity Authentication tenant akihlqzx8.accounts.ondemand.com

Additionally you will make use of some test users to test the application you are working on.
- bob.support@company.com (Support user) (PWD: Acce$$teched25 )
- alice.support@company.com (Support user) (PWD: Acce$$teched25 )
- david.admin@company.com (Admin user) (PWD: Acce$$teched25 )

- Configure User Roles in BTP cockpit
    - Assign bob.support and alice.support to role collection 'Incident Management Support' (TBD with screenshots).
    - Assign david.admin to role collection 'Incident Management Admin' (TBD with screenshots).
 
 The BTP Subaccount will have a subscriptions to 
    - Audit Log Viewer Service
    - SAP Business Application Studio
    - SAP Build Work Zone, standard edition

 The environment is the cloud foundry runtime. 
 



## Summary

Now that you have made yourself familiar with the setup,
continue to - [Exercise 1 - Broken Access Control](../ex1/README.md)
