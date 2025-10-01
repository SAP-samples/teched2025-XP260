const cds = require('@sap/cds');

class ProcessorService extends cds.ApplicationService {
  init() {
    // Expanded to handle CLOSE action (if implemented as a custom action)
    this.before(['UPDATE', 'DELETE'], 'Incidents', req => this.onModify(req));

    // Retain horizontal ESC fixes (auto-assignment, urgency handling)
    this.before("CREATE", "Incidents", req => this.onBeforeCreate(req));
    return super.init();
  }

  /** Helper: Adjust urgency based on title (unchanged) */
  changeUrgencyDueToSubject(data) {
    if (!data) return;
    const incidents = Array.isArray(data) ? data : [data];
    incidents.forEach(incident => {
      if (incident.title?.toLowerCase().includes("urgent")) {
        incident.urgency = { code: "H", descr: "High" };
      }
    });
  }

  // Enforce admin-only operations (vertical ESC)
  async onModify(req) {
    // Fetch current incident state (status + urgency)
    const result = await SELECT.one.from(req.subject)
      .columns('status_code', 'urgency_code')
      .where({ ID: req.data.ID });

    if (!result) return req.reject(404, `Incident ${req.data.ID} not found`);

    // 1️⃣ Check if incident is already closed
    if (result.status_code === 'C') {
      if (!req.user.is('admin')) {
        const action = req.event === 'UPDATE' ? 'modify' : 'delete';
        return req.reject(403, `Cannot ${action} a closed incident`);
      }
      return;
    }

    // 2️⃣ Check if user is attempting to close the incident (status_code set to 'C')
    if (req.data.status_code === 'C') {
      if (result.urgency_code === 'H' && !req.user.is('admin')) {
        return req.reject(403, 'Only administrators can close high-urgency incidents');
      }
    }
  }

  // Retain auto-assignment logic (unchanged)
  async onBeforeCreate(req) {
    const incident = req.data;
    if (incident.status_code === 'A' && req.user) {
      incident.assignedTo = req.user.id;
      console.log(`📝 Auto-assigned incident to ${req.user.id}`);
    }
    this.changeUrgencyDueToSubject(incident);
  }
}
// AdminService Implementation
class AdminService extends cds.ApplicationService {
  init() {
    // ✅ SECURE: Parameterized query using CAP’s fluent API
    this.on('fetchCustomer', async (req) => {
      const { customerID } = req.data;
      
    // ✅ Use parameterized query — input is automatically sanitized
    const query = SELECT.from('Customers') // Use the CDS entity name, not the full path
          .where({ ID: customerID });      
      const results = await cds.run(query);
      return results;
    });

    return super.init();
  }
}
// Export both services
module.exports = {
  ProcessorService,
  AdminService
};
