// Prefetch Template Source:
// https://build.fhir.org/ig/HL7/davinci-crd/hooks.html#prefetch
export class PrefetchTemplate {

  static generatePrefetchMap() {

    const prefetchMap = new Map();

    const COVERAGE_PREFETCH_QUERY = new PrefetchTemplate(
      "Coverage?patient={{context.patientId}}");

    const DEVICE_REQUEST_BUNDLE = new PrefetchTemplate(
      "DeviceRequest?_id={{context.draftOrders.DeviceRequest.id}}"
      + "&_include=DeviceRequest:patient"
      + "&_include=DeviceRequest:performer"
      + "&_include=DeviceRequest:requester"
      + "&_include=DeviceRequest:device"
      + "&_include:iterate=PractitionerRole:organization"
      + "&_include:iterate=PractitionerRole:practitioner");

    const MEDICATION_REQUEST_BUNDLE = new PrefetchTemplate(
      "MedicationRequest?_id={{context.medications.MedicationRequest.id}}"
      + "&_include=MedicationRequest:patient"
      + "&_include=MedicationRequest:intended-dispenser"
      + "&_include=MedicationRequest:requester:PractitionerRole"
      + "&_include=MedicationRequest:medication"
      + "&_include:iterate=PractitionerRole:organization"
      + "&_include:iterate=PractitionerRole:practitioner");

    const MEDICATION_DISPENSE_BUNDLE = new PrefetchTemplate(
      "MedicationDispense?_id={{context.medications.MedicationDispense.id}}"
      + "&_include=MedicationDispense:patient"
      + "&_include=MedicationDispense:intended-dispenser"
      + "&_include=MedicationDispense:requester:PractitionerRole"
      + "&_include=MedicationDispense:medication"
      + "&_include:iterate=PractitionerRole:organization"
      + "&_include:iterate=PractitionerRole:practitioner");

    const NUTRITION_ORDER_BUNDLE = new PrefetchTemplate(
      "NutritionOrder?_id={{context.draftOrders.NutritionOrder.id}}"
      + "&_include=NutritionOrder:patient"
      + "&_include=NutritionOrder:provider"
      + "&_include=NutritionOrder:requester"
      + "&_include=PractitionerRole:organization"
      + "&_include=PractitionerRole:practitioner"
      + "&_include=NutritionOrder:encounter"
      + "&_include=Encounter:location");

    const SERVICE_REQUEST_BUNDLE = new PrefetchTemplate(
      "ServiceRequest?_id={{context.draftOrders.ServiceRequest.id}}"
      + "&_include=ServiceRequest:patient"
      + "&_include=ServiceRequest:performer"
      + "&_include=ServiceRequest:requester"
      + "&_include:iterate=PractitionerRole:organization"
      + "&_include:iterate=PractitionerRole:practitioner");

    const APPOINTMENT_BUNDLE = new PrefetchTemplate(
      "appointmentBundle",
      "Appointment?_id={{context.appointments.Appointment.id}}"
      + "&_include=Appointment:patient"
      + "&_include=Appointment:practitioner:PractitionerRole"
      + "&_include:iterate=PractitionerRole:organization"
      + "&_include:iterate=PractitionerRole:practitioner"
      + "&_include=Appointment:location");

    const ENCOUNTER_BUNDLE = new PrefetchTemplate(
      "encounterBundle",
      "Encounter?_id={{context.encounterId}}"
      + "&_include=Encounter:patient"
      + "&_include=Encounter:service-provider"
      + "&_include=Encounter:practitioner"
      + "&_include=Encounter:location");

    prefetchMap.set("Coverage", COVERAGE_PREFETCH_QUERY);
    prefetchMap.set("DeviceRequest", DEVICE_REQUEST_BUNDLE);
    prefetchMap.set("MedicationRequest", MEDICATION_REQUEST_BUNDLE);
    prefetchMap.set("MedicationDispense", MEDICATION_DISPENSE_BUNDLE);
    prefetchMap.set("ServiceRequest", SERVICE_REQUEST_BUNDLE);
    prefetchMap.set("Encounter", ENCOUNTER_BUNDLE);

    return prefetchMap;
  }

  static generateParamElementMap() {
    const paramElementMap = new Map();
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