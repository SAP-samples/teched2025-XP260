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

// Annotating the my.Incidents entity with @PersonalData to enable data privacy
annotate my.Incidents with @PersonalData : {
  EntitySemantics : 'DataSubjectDetails'                            // Incidents relate to data subjects (customers)
} {
  customer        @PersonalData.FieldSemantics : 'DataSubjectID';   // Link to customer
  title           @PersonalData.IsPotentiallyPersonal;              // May contain PII
  urgency         @PersonalData.IsPotentiallyPersonal;
  status          @PersonalData.IsPotentiallyPersonal;
  assignedTo      @PersonalData.IsPotentiallyPersonal;              // Email of assigned support user
}

// Annotate the conversation element of Incidents
annotate my.Incidents:conversation with @PersonalData {
  message @PersonalData.IsPotentiallySensitive;  // Messages may include sensitive details
};
