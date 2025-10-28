# Getting Started
In the exercises, you will use an SAP BTP subaccount with a subaccount admin user. We use the Identity Authentication service tenant akihlqzx8.accounts.ondemand.com as custom identity provider, both for platform and application users.

## Access your SAP BTP subaccount
Access your SAP BTP account for the session XP260 using this link: [Global Account: SAP-TechEd-2025 – Account Explorer](https://emea.cockpit.btp.cloud.sap/cockpit?idp=akihlqzx8.accounts.ondemand.com#/globalaccount/4c772782-0751-42ee-93c3-897452fdcb63/accountModel&//?section=HierarchySection&view=TreeTableView)

Login to open your subaccount XP260_0XX, where XX is your seat number.

- Username: xp260-0XX@education.cloud.sap ( with XX depending on your seat from 01 - 40 )
- Password: Will be given to you as part of the session

In the list of directories and subaccounts, click on the entry for your subaccount.

## Review the subscribed services

The SAP BTP subaccount will have subscriptions to 
- SAP Audit Log Viewer service
- SAP Business Application Studio
- SAP Build Work Zone, standard edition

You will be using the Cloud Foundry Runtime environment.

Check the subscriptions and the environment under Services > Instances and Subscriptions in the SAP BTP cockpit.

## Review the configured user access

Check the users under Security > Users.

Check your user xp260-0XX@education.cloud.sap. There will be two representations in the cockpit, one as platform user and one as business user. 

Check the role collections assigned to the platform user representation:
- Select the user.
- In the right frame, check if the role collection 'Subaccount Administrator' is assigned.

Check the role collections assigned to the business user representation:
- Select the user.
- In the right frame, check if the role collections 'Business_Application_Studio_Administrator', 'Business_Application_Studio_Developer', 'Business_Application_Studio_Extension_Deployer', and 'Launchpad_Admin' are assigned.

You will make use of some test users to test the application you are working on.
- bob.support@company.com (Support user)
- alice.support@company.com (Support user)
- david.admin@company.com (Admin user)

Check the user role collections in the SAP BTP cockpit for Bob, Alice, and David:

Select a user. In the right frame, check the role collections assigned:
- Check if bob.support@company.com and alice.support@company.com are assigned to the role collection 'Incident Management Support'. 
- Check if david.admin@company.com is assigned to the role collection 'Incident Management Admin'.

## Review the development environment
 
As we are using Cloud Foundry, check under Cloud Foundry > Org Members , if your platform user xp260-0XX@education.cloud.sap has org membership. 

Under Cloud Foundry > Spaces, verify the existence of your space called 'xp260-0XX'.

## Launch SAP Business Application Studio

Now after these checks, you can open the SAP Business Application Studio. 

Navigate to Services > Instances and Subscriptions in the SAP BTP cockpit. Then click on the small 'Go to Application' icon next to the name SAP Business Application Studio.

On the logon screen, click on the IDP 'akihlqzx8.accounts.ondemand.com' to login with single sign-on (SSO).

You will see your Dev Space called 'secure_incident_management'. Make sure it is in a running state, if not start it.
When it is running, click on 'secure_incident_management' to open the SAP Business Application Studio with your incident management application. In the Workspace on the right side, you will find your incident management application in the list of projects.

Bookmark your SAP Business Application Studio link.

## Launch SAP Build Work Zone

Go back to Services > Instances and Subscriptions in the SAP BTP cockpit. Click on the 'Go to Application' icon next to the SAP Build Work Zone, standard edition application to open the SAP Build Work Zone application. 

Check if the Secure Incident Management application is present. Open it in an incognito window or a different browser and login with the alice.support@company.com user. Bookmark the application. 

Now you are ready to start the exercises. 


## Summary

Now that you have made yourself familiar with the setup,
continue to - [Exercise 1 - Broken Access Control](../ex1/README.md)
