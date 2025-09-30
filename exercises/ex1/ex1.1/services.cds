using { sap.capire.incidents as my } from '../db/schema';

/**
 * Service used by support personel, i.e. the incidents' 'processors'.
 */
// ✅ SECURED: ProcessorService with proper access controls

    service ProcessorService {
    
// ✅  Use the @restrict annotation to define authorizations on a fine-grained level

  @restrict: [ 
        
        { grant: ['READ', 'CREATE'], to: 'support' },            // ✅ Support users Can view and create incidents


        // ✅THIS IS THE KEY CHANGE:
        // Support users can only UPDATE or DELETE incidents that are either
        // unassigned (assignedTo is null) or assigned to themselves.
        { 
            grant: ['UPDATE', 'DELETE'], to: 'support', 
            where: 'assignedTo is null or assignedTo = $user' 
        },
    ]
    entity Incidents as projection on my.Incidents;    

    @readonly
    entity Customers as projection on my.Customers;        
}

    annotate ProcessorService.Incidents with @odata.draft.enabled; 
    annotate ProcessorService with @(requires: ['support']);

/**
 * Service used by administrators to manage customers and incidents.
 */
service AdminService {
    entity Customers as projection on my.Customers;
    entity Incidents as projection on my.Incidents;
    }

annotate AdminService with @(requires: 'admin');
