# Getting started
In the excercises you will use a BTP subaccount with a subaccount admin user, which is the same as platform and application user.
You can find the access information for your Subaccount on your desk and the link in the browser.
[Global Account: SAP-TechEd-2025 – Account Explorer](https://emea.cockpit.btp.cloud.sap/cockpit?idp=akihlqzx8.accounts.ondemand.com#/globalaccount/4c772782-0751-42ee-93c3-897452fdcb63/accountModel&//?section=HierarchySection&view=TreeTableView)

Login and open your subaccount  XP260_0XX, where XX is your seat number.

- xp260-0XX@education.cloud.sap ( with XX depending on your seat from 01 - 40 )
- PWD is always  Acce$$teched25
- Identity Provider they reside in is the Identity Authentication tenant akihlqzx8.accounts.ondemand.com

 The BTP Subaccount will have a subscriptions to 
    - Audit Log Viewer Service
    - SAP Business Application Studio
    - SAP Build Work Zone, standard edition

 The environment is the cloud foundry runtime. 

Check the subscriptions and the envrionent under Services > Instances and Subscriptions in the BTP Cockpit.

Check the users under Security > Users

Check your user xp260-0XX@education.cloud.sap. He will have two representations in the cockpit, one as platform user and one as business user. 
Check the role collections assigned to the platform user representation. Select the user. On the right frame check if the role collection Subaccount Administrator is assigned.
Check the role collections assigned to the business user representation. Select the user. On the right frame check if the role collections Business_Application_Studio_Administrator, Business_Application_Studio_Developer, Business_Application_Studio_Extension_Deployer, Launchpad_Admin are assigned.

You will make use of some test users to test the application you are working on.
- bob.support@company.com (Support user) (PWD: Acce$$teched25 )
- alice.support@company.com (Support user) (PWD: Acce$$teched25 )
- david.admin@company.com (Admin user) (PWD: Acce$$teched25 )

Check User Role Collections in the BTP cockpit for Bob, Alice and David.
Select a user. On the right frame check the role collections assigned.
    - Check if bob.support and alice.support are assigned to role collection 'Incident Management Support' 
    - Check if david.admin is assigned to role collection 'Incident Management Admin'
 
As we are using Cloud Foundry, check under Cloud Fondry > Org Members , if your platform user xp260-0XX@education.cloud.sap has org memebership. 

Under Cloud Foundry > Spaces, verify the existience of your Space called xp260-0XX.

Now after hese checks, you can open the Business Application Studio.

## Summary

Now that you have made yourself familiar with the setup,
continue to - [Exercise 1 - Broken Access Control](../ex1/README.md)
