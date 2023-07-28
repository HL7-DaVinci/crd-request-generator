/* 2017071 NCPDP SCRIPT Support */

  function xmlAddTextNode(xmlDoc, parent, sectionName, value) {
    var section = xmlDoc.createElement(sectionName);
    var textNode = xmlDoc.createTextNode(value);
    section.appendChild(textNode);
    parent.appendChild(section);
  }

  function buildNewRxName(doc, nameResource) {
    var name = doc.createElement("Name");
    xmlAddTextNode(doc, name, "LastName", nameResource.family);
    xmlAddTextNode(doc, name, "FirstName", nameResource.given[0]);
    return name;
  }

  function buildNewRxAddress(doc, addressResource) {
    var address = doc.createElement("Address");
    xmlAddTextNode(doc, address, "AddressLine1", addressResource.line[0]);
    xmlAddTextNode(doc, address, "City", addressResource.city);
    xmlAddTextNode(doc, address, "StateProvince", addressResource.state);
    xmlAddTextNode(doc, address, "PostalCode", addressResource.postalCode);
    xmlAddTextNode(doc, address, "Country", "US"); // assume US for now
    return address;
  }

  function buildNewRxPatient(doc, patientResource) {
    var patient = doc.createElement("Patient");
    var humanPatient = doc.createElement("HumanPatient");

    //     Patient Name
    const patientNameResource = patientResource.name[0];
    humanPatient.appendChild(buildNewRxName(doc, patientNameResource));

    //     Patient Gender and Sex
    var gender = "U"; // unknown
    var patientResourceGender = patientResource.gender.toLowerCase();
    if (patientResourceGender === "male") {
      gender = "M"; // male
    } else if (patientResourceGender === "female") {
      gender = "F"; // female
    } else if (patientResourceGender === "other") {
      gender = "N"; // non-binary
    }
    xmlAddTextNode(doc, humanPatient, "Gender", gender);

    //     Patient Birth Date
    var dateOfBirth = doc.createElement("DateOfBirth");
    xmlAddTextNode(doc, dateOfBirth, "Date", patientResource.birthDate);
    humanPatient.appendChild(dateOfBirth);

    //     Patient Address
    const patientAddressResource = patientResource.address[0];
    humanPatient.appendChild(buildNewRxAddress(doc, patientAddressResource));

    patient.appendChild(humanPatient);
    return patient;
  }

  function buildNewRxPrescriber(doc, practitionerResource) {
    var prescriber = doc.createElement("Prescriber");
    var nonVeterinarian = doc.createElement("NonVeterinarian");

    //     Prescriber Identifier
    for (let i = 0; i < practitionerResource.identifier.length; i++) {
      let id = practitionerResource.identifier[i];
      if ((id.system) && (id.system.includes("us-npi"))) {
        var identification = doc.createElement("Identification");
        xmlAddTextNode(doc, identification, "NPI", id.value);
        nonVeterinarian.appendChild(identification);
      }
    }

    //     Prescriber Name
    const practitionerNameResource = practitionerResource.name[0];
    nonVeterinarian.appendChild(buildNewRxName(doc, practitionerNameResource));

    //     Prescriber Address
    const practitionerAddressResource = practitionerResource.address[0];
    nonVeterinarian.appendChild(buildNewRxAddress(doc, practitionerAddressResource));

    //     Prescriber Phone Number and Email
    var communicationNumbers = doc.createElement("CommunicationNumbers");
    for (let i = 0; i < practitionerResource.telecom.length; i++) {
      const telecom = practitionerResource.telecom[i];
      if (telecom.system === "phone") {
        var primaryTelephone = doc.createElement("PrimaryTelephone");
        xmlAddTextNode(doc, primaryTelephone, "Number", telecom.value);
        communicationNumbers.appendChild(primaryTelephone);
      } else if (telecom.system === "email") {
        xmlAddTextNode(doc, communicationNumbers, "ElectronicMail", telecom.value);
      }
    }
    nonVeterinarian.appendChild(communicationNumbers)

    prescriber.appendChild(nonVeterinarian);
    return prescriber;
  }

  function quantityUnitOfMeasureFromDrugFormCode(dispenseRequest) {
    // Switch on Orderable Drug Form codes from: 
    // https://terminology.hl7.org/5.0.0/CodeSystem-v3-orderableDrugForm.html
    // Return NCPDP QuantityUnitOfMeasure
    if (dispenseRequest.quantity.system.toLowerCase().endsWith("v3-orderableDrugForm".toLowerCase())) {
      // is a subset of the codes, not a complete list
      switch (dispenseRequest.quantity.code.toUpperCase()) {
        case "APPFUL": // Applicatorful
        case "FOAMAPL": // Foam with Applicator
        case "VAGFOAMAPL": // Vaginal Foam with Applicator
        case "VAGCRMAPL": // Vaginal Cream with Applicator
        case "OINTAPL": // Ointment with Applicator
        case "VAGOINTAPL": // Vaginal Ointment with Applicator
        case "GELAPL": // Gel with Applicator
        case "VGELAPL": // Vaginal Gel with Applicator
          return "C62412";  // Applicator
        //case "":
        //  return "C54564"  // Blister
        case "CAPLET": // Caplet
          return "C64696";  // Caplet
        case 'CAP': // Capsule
          return "C48480";  // Capsule
        //case "":
        //  return "C64933"  // Each
        //case "":
        //  return "C53499"  // Film
        //case "":
        //  return "C48155"  // Gram
        case "GUM": // Chewing Gum
          return "C69124";  // Gum
        //case "":
        //  return "C48499"  // Implant
        //case "":
        //  return "C62276"  // Insert
        //case "":
        //  return "C48504"  // Kit
        //case "":
        //  return "C120263" // Lancet
        case "ORTROCHE": // Lozenge/Oral Troche
          return "C48506";  // Lozenge
        //case "":
        //  return "C28254"  // Milliliter
        //case "":
        //  return "C48521"  // Packet
        case "PAD": // Pad
        case "MEDPAD": // Medicated Pad
          return "C65032";  // Pad
        case "PATCH": // Patch
        case "TPATCH": // Transdermal Patch
        case "TPATH16": // 16 Hour Transdermal Patch
        case "TPATH24": // 24 Hour Transdermal Patch
        case "TPATH2WK": // Biweekly Transdermal Patch
        case "TPATH72": // 72 Hour Transdermal Patch
        case "TPATHWK": // Weekly Hour Transdermal Patch
          return "C48524";  // Patch
        //case "":
        //  return "C120216" // Pen Needle
        //case "":
        //  return "C62609"  // Ring
        // case "":
        //   return "C53502"  // Sponge
        //case "":
        //  return "C53503"  // Stick
        //case "":
        //  return "C48538"  // Strip
        case "SUPP": // Suppository
        case "RECSUPP": // Rectal Suppository
        case "URETHSUPP": // Urethral Suppository
        case "VAGSUPP": // Vaginal Suppository
          return "C48539";  // Suppository
        case "SWAB": // Swab
        case "MEDSWAB": // Medicated Swab
          return "C53504";  // Swab
        case "TAB": // Tablet
        case "ORTAB": // Oral Tablet
        case "BUCTAB": // Buccal Tablet
        case "SRBUCTAB": // Sustained Release Buccal Tablet
        case "CHEWTAB": // Chewable Tablet
        case "CPTAB": // Coated Particles Tablet
        case "DISINTTAB": // Disintegrating Tablet
        case "DRTAB": // Delayed Release Tablet
        case "ECTAB": // Enteric Coated Tablet
        case "ERECTTAB": // Extended Release Enteric Coated Tablet
        case "ERTAB": // Extended Release Tablet
        case "ERTAB12": // 12 Hour Extended Release Tablet
        case "ERTAB24": // 24 Hour Extended Release Tablet
        case "SLTAB": // Sublingual Tablet
        case "VAGTAB": // Vaginal Tablet
          return "C48542";  // Tablet
        //case "":
        //  return "C48548"  // Troche
        case "WAFER": // Wafer
          return "C48552";  // Wafer
        default:
          return "C38046"; // Unspecified
      }
    }
    return "C38046";       // unspecified
  }

  function buildNewRxMedication(doc, medicationRequestResource) {
    var medicationPrescribed = doc.createElement("MedicationPrescribed");

    //     Medication Product
    var drugCoded = doc.createElement("DrugCoded");

    // loop through the coding values and find the ndc code and the rxnorm code
    const medicationCodingList = medicationRequestResource.medicationCodeableConcept.coding;
    for (let i = 0; i < medicationCodingList.length; i++) {
      const coding = medicationCodingList[i];
      const system = coding.system.toLowerCase();

      if (system.endsWith("rxnorm")) {
        //     Medication Drug Description
        xmlAddTextNode(doc, medicationPrescribed, "DrugDescription", coding.display);

      } else if (system.endsWith("ndc")) {
        //     Medication Drug Code
        var productCode = doc.createElement("ProductCode");
        xmlAddTextNode(doc, productCode, "Code", coding.code);
        xmlAddTextNode(doc, productCode, "Qualifier", "ND"); // National Drug Code (NDC)
        drugCoded.appendChild(productCode);
      }
    }

    medicationPrescribed.appendChild(drugCoded);

    //     Medication Quantity
    const dispenseRequest = medicationRequestResource.dispenseRequest;
    var quantity = doc.createElement("Quantity");
    xmlAddTextNode(doc, quantity, "Value", dispenseRequest.quantity.value);
    xmlAddTextNode(doc, quantity, "CodeListQualifier", 38); // Original Quantity
    var quantityUnitOfMeasure = doc.createElement("QuantityUnitOfMeasure");
    xmlAddTextNode(doc, quantityUnitOfMeasure, "Code", quantityUnitOfMeasureFromDrugFormCode(dispenseRequest));
    quantity.appendChild(quantityUnitOfMeasure);
    medicationPrescribed.appendChild(quantity);

    //     Medication Written Date
    var writtenDate = doc.createElement("WrittenDate");
    xmlAddTextNode(doc, writtenDate, "Date", medicationRequestResource.authoredOn);
    medicationPrescribed.appendChild(writtenDate);

    //     Medication Substitutions (0 - None)
    xmlAddTextNode(doc, medicationPrescribed, "Substitutions", 0);

    //     Medication NumberOfRefills (0 - None)
    xmlAddTextNode(doc, medicationPrescribed, "NumberOfRefills", dispenseRequest.numberOfRepeatsAllowed);

    //     Medication Sig
    var sig = doc.createElement("Sig");
    xmlAddTextNode(doc, sig, "SigText", medicationRequestResource.dosageInstruction[0].text);
    medicationPrescribed.appendChild(sig);

    //     Medication REMS
    // A - Prescriber has checked REMS and the prescriber's actions have been completed.
    // B - Prescriber has checked REMS and the prescriber's actions are not yet completed.
    // N - Prescriber has not checked REMS.
    xmlAddTextNode(doc, medicationPrescribed, "PrescriberCheckedREMS", "B");

    return medicationPrescribed;
  }

  export default function buildNewRxRequest(patientResource, practitionerResource, medicationRequestResource) {
    var doc = document.implementation.createDocument("", "", null);
    var message = doc.createElement("Message");

    // Header
    var header = doc.createElement("Header");
    // generate the message id (just get the milliseconds since epoch and use that)
    const d1 = new Date();
    const messageIdValue = d1.getTime();
    xmlAddTextNode(doc, header, "MessageID", messageIdValue);
    message.appendChild(header);

    // Body
    var body = doc.createElement("Body");
    var newRx = doc.createElement("NewRx");

    //   Patient
    newRx.appendChild(buildNewRxPatient(doc, patientResource));

    //   Prescriber
    newRx.appendChild(buildNewRxPrescriber(doc, practitionerResource));

    //   Medication
    newRx.appendChild(buildNewRxMedication(doc, medicationRequestResource));

    body.appendChild(newRx);
    message.appendChild(body);

    doc.appendChild(message);

    return doc;
  }