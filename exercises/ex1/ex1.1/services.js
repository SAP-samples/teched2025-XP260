const cds = require('@sap/cds')

class ProcessorService extends cds.ApplicationService {
  init() {
    // ✅ NEW: Validate business rules
    this.before(['UPDATE', 'DELETE'], 'Incidents', req => this.onModify(req));

    // ✅ NEW: Enrich before CREATE (auto‑assignment + urgency handling)
    this.before("CREATE", "Incidents", req => this.onBeforeCreate(req))

    return super.init()
  }

  /** Helper: Adjust urgency based on incident title text */
  changeUrgencyDueToSubject(data) {
    if (!data) return
    const incidents = Array.isArray(data) ? data : [data]
    incidents.forEach(incident => {
      if (incident.title?.toLowerCase().includes("urgent")) {
        incident.urgency = { code: "H", descr: "High" }
      }
    })
  }

//  ✅ NEW : block updates or deletes for closed incidents */
  async onModify(req) {
    const result = await SELECT.one.from(req.subject)
      .columns('status_code')
      .where({ ID: req.data.ID })

    if (!result) return req.reject(404, `Incident ${req.data.ID} not found`)
    // 'C' : Closed incident
    if (result.status_code === 'C') { 
      const action = req.event === 'UPDATE' ? 'modify' : 'delete'
      return req.reject(403, `Cannot ${action} a closed incident`)
    }
  }
  
// ✅ NEW: Before CREATE: Auto‑assign + urgency keyword detection */
  async onBeforeCreate(req) {
    const incident = req.data

    // Auto‑assign if status = 'A' Assigned incident
    if (incident.status_code === 'A' && req.user) {
      incident.assignedTo = req.user.id
      console.log(`📝 Auto‑assigned incident to ${req.user.id}`)
    }

    // Adjust urgency based on title
    this.changeUrgencyDueToSubject(incident)
  }
}

module.exports = { ProcessorService }


