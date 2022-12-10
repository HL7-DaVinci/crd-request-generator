// Prefetch Template Source:
// https://build.fhir.org/ig/HL7/davinci-crd/hooks.html#prefetch
export class PrefetchTemplate {

  static generatePrefetchMap() {

    const prefetchMap = new Map();

    const PRACTITIONER_PREFETCH = new PrefetchTemplate(
      "{{context.userId}}");
    const PATIENT_PREFETCH = new PrefetchTemplate("{{context.patientId}}");

    // prefetchMap.set("Coverage", COVERAGE_PREFETCH_QUERY);
    prefetchMap.set("practitioner", PRACTITIONER_PREFETCH);
    prefetchMap.set("patient", PATIENT_PREFETCH);
    // prefetchMap.set("ServiceRequest", SERVICE_REQUEST_BUNDLE);
    // prefetchMap.set("Encounter", ENCOUNTER_BUNDLE);

    return prefetchMap;
  }

  static generateParamElementMap() {
    const paramElementMap = new Map();
    // TODO - this should just be inferred based on context.  Or rather
    // the instructions from the hook about what context to fill in
    // Quite literally, the "context" here refers to the "context" of the
    // cds-hook, which as of now is just hard-coded in buildRequest.js
    // Rather than do this, which searches the request resource for information,
    // the cds-hook should be constructed and then the context used to actually make
    // the appropriate requests.
    paramElementMap.set('context.userId', ['requester', 'reference'])
    paramElementMap.set('context.draftOrders.DeviceRequest.id', ['id']);
    paramElementMap.set('context.medications.MedicationRequest.id', ['id']);
    paramElementMap.set('context.medications.MedicationDispense.id', ['id']);
    paramElementMap.set('context.draftOrders.NutritionOrder.id', ['id']);
    paramElementMap.set('context.draftOrders.ServiceRequest.id', ['id']);
    paramElementMap.set('context.draftOrders.ontext.appointments.Appointment.id', ['id']);
    paramElementMap.set('context.draftOrders.context.encounterId', ['id']);
    paramElementMap.set('context.patientId', ['subject', 'reference']);
    return paramElementMap;
  }

  static generateQueries(requestBundle, ...prefetchKeys) {
    var resolvedQueries = new Map();
    for (var i = 0; i < prefetchKeys.length; i++) {
      var prefetchKey = prefetchKeys[i];
      var query = prefetchMap.get(prefetchKey).getQuery();
      // Regex source: https://regexland.com/all-between-specified-characters/
      var parametersToFill = query.match(/(?<={{).*?(?=}})/gs);
      var resolvedQuery = query.slice();
      for (var j = 0; j < parametersToFill.length; j++) {
        var unresolvedParameter = parametersToFill[j];
        var resolvedParameter = PrefetchTemplate.resolveParameter(unresolvedParameter, requestBundle);
        resolvedQuery = resolvedQuery.replace('{{' + unresolvedParameter + '}}', resolvedParameter);
      }
      resolvedQueries.set(prefetchKey, resolvedQuery);
    }
    return resolvedQueries;
  }

  // Source: https://www.tutorialspoint.com/accessing-nested-javascript-objects-with-string-key
  static getProp(object, path) {
    if (path.length === 1){
      return object[path[0]];
    }
    else if (path.length === 0) {
      throw new Error("Invalid property.");
    }
    else {
        if (object[path[0]]) return PrefetchTemplate.getProp(object[path[0]], path.slice(1));
        else {
          object[path[0]] = {};
          return PrefetchTemplate.getProp(object[path[0]], path.slice(1));
        }
    }
  };

  static resolveParameter(unresolvedParameter, requestBundle) {
    const paramField = paramElementMap.get(unresolvedParameter);
    const resolvedParameter = PrefetchTemplate.getProp(requestBundle, paramField)
    return resolvedParameter;
  }

  query;

  constructor(query) {
    this.query = query;
  }

  getQuery() {
    return this.query;
  }

}

const prefetchMap = PrefetchTemplate.generatePrefetchMap();
const paramElementMap = PrefetchTemplate.generateParamElementMap();