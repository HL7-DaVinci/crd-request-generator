
// Prefetch Template Source:
// https://build.fhir.org/ig/HL7/davinci-crd/hooks.html#prefetch
export class PrefetchTemplate {

  static generatePrefetchMap() {

    const prefetchMap = new Map();

    const COVERAGE_PREFETCH_QUERY = "Coverage?_member={{context.patientId}}";

    const DEVICE_REQUEST_BUNDLE = new PrefetchTemplate(
      "DeviceRequest?_id={{context.draftOrders.DeviceRequest.id}}"
      + "&_include=DeviceRequest:patient"
      + "&_include=DeviceRequest:performer"
      + "&_include=DeviceRequest:requester"
      + "&_include=DeviceRequest:device"
      + "&_include:iterate=PractitionerRole:organization"
      + "&_include:iterate=PractitionerRole:practitioner",
      COVERAGE_PREFETCH_QUERY);

    const MEDICATION_REQUEST_BUNDLE = new PrefetchTemplate(
      "MedicationRequest?_id={{context.medications.MedicationRequest.id}}"
      + "&_include=MedicationRequest:patient"
      + "&_include=MedicationRequest:intended-dispenser"
      + "&_include=MedicationRequest:requester:PractitionerRole"
      + "&_include=MedicationRequest:medication"
      + "&_include:iterate=PractitionerRole:organization"
      + "&_include:iterate=PractitionerRole:practitioner",
      COVERAGE_PREFETCH_QUERY);

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
      + "&_include:iterate=PractitionerRole:practitioner",
      COVERAGE_PREFETCH_QUERY);

    const APPOINTMENT_BUNDLE = new PrefetchTemplate(
      "appointmentBundle",
      "Appointment?_id={{context.appointments.Appointment.id}}"
      + "&_include=Appointment:patient"
      + "&_include=Appointment:practitioner:PractitionerRole"
      + "&_include:iterate=PractitionerRole:organization"
      + "&_include:iterate=PractitionerRole:practitioner"
      + "&_include=Appointment:location",
      COVERAGE_PREFETCH_QUERY);

    const ENCOUNTER_BUNDLE = new PrefetchTemplate(
      "",
      "Encounter?_id={{context.encounterId}}"
      + "&_include=Encounter:patient"
      + "&_include=Encounter:service-provider"
      + "&_include=Encounter:practitioner"
      + "&_include=Encounter:location",
      COVERAGE_PREFETCH_QUERY);

    prefetchMap.set("deviceRequestBundle", DEVICE_REQUEST_BUNDLE);
    prefetchMap.set("medicationRequestBundle", MEDICATION_REQUEST_BUNDLE);
    prefetchMap.set("nutritionOrderBundle", NUTRITION_ORDER_BUNDLE);
    prefetchMap.set("serviceRequestBundle", SERVICE_REQUEST_BUNDLE);
    prefetchMap.set("encounterBundle", ENCOUNTER_BUNDLE);
    console.log(prefetchMap);

    return prefetchMap;
  }

  static generatePramElementMap() {
    const paramElementMap = new Map();
    paramElementMap.set('context.draftOrders.DeviceRequest.id', ['id']);
    paramElementMap.set('context.draftOrders.MedicationRequest.id', ['id']);
    paramElementMap.set('context.draftOrders.NutritionOrder.id', ['id']);
    paramElementMap.set('context.draftOrders.ServiceRequest.id', ['id']);
    paramElementMap.set('context.draftOrders.ontext.appointments.Appointment.id', ['id']);
    paramElementMap.set('context.draftOrders.context.encounterId', ['id']);
    paramElementMap.set('context.patientId', ['subject', 'reference']);
    return paramElementMap;
  }

  static generateQueries(prefetchKey, requestBundle) {
    var resolvedQueries = [];
    var queries = prefetchMap.get(prefetchKey).getQueries();
    for (var i = 0; i < queries.length; i++) {
      var query = queries[i];
      // Regex source: https://regexland.com/all-between-specified-characters/
      var parametersToFill = query.match(/(?<={{).*?(?=}})/gs);
      var resolvedQuery = query.slice();
      for (var j = 0; j < parametersToFill.length; j++) {
        var unresolvedParameter = parametersToFill[j];
        var resolvedParameter = PrefetchTemplate.resolveParameter(unresolvedParameter, requestBundle);
        var resolvedQuery = resolvedQuery.replace(unresolvedParameter, resolvedParameter);
      }
      resolvedQueries.push(resolvedQuery);
      console.log(resolvedQueries);
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

  queries;

  constructor(...queries) {
    this.queries = queries;
  }

  getQueries() {
    return this.queries;
  }

}

const prefetchMap = PrefetchTemplate.generatePrefetchMap();
const paramElementMap = PrefetchTemplate.generatePramElementMap();