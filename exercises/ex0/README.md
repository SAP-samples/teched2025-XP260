<img width="253" height="28" alt="image" src="https://github.com/user-attachments/assets/7a2c10b4-d78d-43be-aa3c-f8b15356c5cd" /># Getting started
In the excercises you will use a BTP subaccount wit a subaccount admin user, which is the same as platform and application user. 
xp260-0XX@education.cloud.sap ( with X depending on your seat from 01 - 40 )
PWD is always  Acce$$teched25
Identity Provider they reside in is the Identity Authentication tenant akihlqzx8.accounts.ondemand.com

Additionally you will make use of some test users to test the application you are working on.
     - bob.support@company.com (Support user).
     - alice.support@company.com (Support user).
     - david.admin@company.com (Admin user).

- Configure User Roles in BTP cockpit
    - Assign bob.support and alice.support to role collection 'Incident Management Support' (TBD with screenshots).
    - Assign david.admin to role collection 'Incident Management Admin' (TBD with screenshots).
 
 The BTP Subaccount will have a subscriptions to 
    - Audit Log Viewer Service
    - SAP Business Application Studio
    - SAP Build Work Zone, standard edition

 The environment is the cloud foundry runtime. 
 

## Level 2 Heading

After completing these steps you will have....

1.	Click here.
<br>![](/exercises/ex0/images/00_00_0010.png)

2.	Insert this code.
``` abap
 DATA(params) = request->get_form_fields(  ).
 READ TABLE params REFERENCE INTO DATA(param) WITH KEY name = 'cmd'.
  IF sy-subrc <> 0.
    response->set_status( i_code = 400
                     i_reason = 'Bad request').
    RETURN.
  ENDIF.
```

## Summary

Now that you have ... 
Continue to - [Exercise 1 - Exercise 1 Description](../ex1/README.md)
