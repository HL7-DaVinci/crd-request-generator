export default function getRequest(state) {
    const type = state.version;
    const year = new Date().getFullYear();
    const birthYear =  parseInt(year) - parseInt(state.age,10);
    const r4json = {
        "hookInstance": "d1577c69-dfbe-44ad-ba6d-3e05e953b2ea",
        "fhirServer": state.ehrUrl.r4,
        "hook": "order-review",
        "fhirAuthorization": {
            "access_token": state.token,
            "token_type": "Bearer",
            "expires_in": 300,
            "scope": "patient/Patient.read patient/Observation.read",
            "subject": "cds-service4"
        },
        "user": "Practitioner/example",
        "context": {
            "patientId": "pat1234",
            "encounterId": "enc89284",
            "orders": {
                "resourceType": "Bundle",
                "entry": [
                    {
                        "resource": {
                            "resourceType": "DeviceRequest",
                            "id": "devreq1234",
                            "status": "draft",
                            "codeCodeableConcept": {
                                "coding": [
                                    {
                                        "system": state.codeSystem,
                                        "code": state.code
                                    }
                                ]
                            },
                            "subject": {
                                "reference": "Patient/pat1234"
                            },
                            "authoredOn": "2018-08-08",
                            "insurance": [
                                {
                                    "reference": "Coverage/cov1234"
                                }
                            ],
                            "performer": {
                                "reference": "PractitionerRole/prarol1234"
                            }
                        }
                    }
                ]
            }
        }
    };
    if(state.prefetch){
        r4json.prefetch =  {
            "deviceRequestBundle": {
                "resourceType": "Bundle",
                "type": "collection",
                "entry": [
                    {
                        "resource": {
                            "resourceType": "DeviceRequest",
                            "id": "devreq1234",
                            "status": "draft",
                            "codeCodeableConcept": {
                                "coding": [
                                    {
                                        "system": state.codeSystem,
                                        "code": state.code
                                    }
                                ]
                            },
                            "subject": {
                                "reference": "Patient/pat1234"
                            },
                            "authoredOn": "2018-08-08",
                            "insurance": [
                                {
                                    "reference": "Coverage/cov1234"
                                }
                            ],
                            "performer": {
                                "reference": "Practitioner/pra1234"
                            }
                        }
                    },
                    {
                        "resource": {
                            "resourceType": "Patient",
                            "id": "pat1234",
                            "gender": state.gender,
                            "birthDate": birthYear+"-12-23",
                            "address": [
                                {
                                    "use": "home",
                                    "type": "both",
                                    "state": state.patientState
                                }
                            ]
                        }
                    },
                    {
                        "resource": {
                            "resourceType": "Coverage",
                            "id": "cov1234",
                            "class": [
                                {
                                    "type": {
                                        "system": "http://hl7.org/fhir/coverage-class",
                                        "code": "plan"
                                    },
                                    "value": "Medicare Part D"
                                }
                            ],
                            "payor": [
                                {
                                    "reference": "Organization/org1234"
                                }
                            ]
                        }
                    },
                    {
                  "resource": {
                    "resourceType": "Location",
                    "id": "loc1234",
                    "address": {
                      "line": [
                                    "100 Good St"
                                ],
                      "city": "Bedford",
                      "state": state.practitionerState,
                      "postalCode": "01730"
                            }
                        }
                    },
                    {
                  "resource": {
                    "resourceType": "PractitionerRole",
                    "id": "prarol1234",
                    "practitioner": {
                      "reference": "Practitioner/pra1234"
                            },
                    "location": [
                                {
                        "reference": "Location/loc1234"
                                }
                            ]
                        }
                    },
                    {
                  "resource": {
                    "resourceType": "Organization",
                    "id": "org1234",
                    "name": "Centers for Medicare and Medicaid Services"
                        }
                    },
                    {
                  "resource": {
                    "resourceType": "Practitioner",
                    "id": "pra1234",
                    "identifier": [
                                {
                        "system": "http://hl7.org/fhir/sid/us-npi",
                        "value": "1122334455"
                                }
                            ],
                    "name": [
                                {
                        "family": "Doe",
                        "given": [
                                        "Jane"
                                    ],
                        "prefix": [
                                        "Dr."
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        }
    }

    // stu3 //
    const stu3json = {
        "hook": "order-review",
        "hookInstance": "63d7d1fa-9469-4c44-a5f7-76a129e30967",
        "fhirServer": state.ehrUrl.stu3,
        "fhirAuthorization": null,
        "user": "Practitioner/1234",
        "context": {
          "patientId": "pat013",
          "encounterId": null,
          "services": null,
          "orders": {
            "resourceType": "Bundle",
            "entry": [
              {
                "resource": {
                  "resourceType": "DeviceRequest",
                  "id": "devreq013",
                  "meta": {
                    "profile": [
                      "http://hl7.org/fhir/us/davinci-crd/STU3/StructureDefinition/profile-devicerequest-stu3"
                    ]
                  },
                  "extension": [
                    {
                      "url": "http://build.fhir.org/ig/HL7/davinci-crd/STU3/ext-insurance.html",
                      "valueReference": {
                        "reference": "Coverage/cov013"
                      }
                    }
                  ],
                  "status": "draft",
                  "codeCodeableConcept": {
                    "coding": [
                      {
                        "system": state.codeSystem,
                        "code": state.code,
                        "display": "Stationary Compressed Gaseous Oxygen System, Rental"
                      }
                    ]
                  },
                  "subject": {
                    "reference": "Patient/pat013"
                  },
                  "performer": {
                    "reference": "Practitioner/pra1234"
                  }
                }
              }
            ]
          }
        }
      };

      if(state.prefetch) {
        stu3json.prefetch = {
            "deviceRequestBundle":{
                "resourceType": "Bundle",
                "type": "collection",
                "entry": [
                {
                    "resource": {
                    "resourceType": "Patient",
                    "id": "pat013",
                    "gender": state.gender,
                    "birthDate": birthYear + "-07-04",
                    "address": [
                        {
                        "use": "home",
                        "type": "both",
                        "state": state.patientState
                        }
                    ]
                    }
                },
                {
                    "resource": {
                    "resourceType": "Practitioner",
                    "id": "pra1234",
                    "identifier": [
                        {
                        "system": "http://hl7.org/fhir/sid/us-npi",
                        "value": "1122334455"
                        }
                    ],
                    "name": [
                        {
                            "use": "official",
                        "family": "Doe",
                        "given": [
                            "Jane", "Betty"
                        ],
                        "prefix": [
                            "Dr."
                        ]
                        }
                    ]
                    }
                },
                {
                    "resource": {
                    "resourceType": "Organization",
                    "id": "75f39025-65db-43c8-9127-693cdf75e712",
                    "name": "Centers for Medicare and Medicaid Services"
                    }
                },
                {
                    "resource": {
                    "resourceType": "Location",
                    "id": "99595dfb-cdd8-4813-8477-4a9fb40d6c54",
                    "address": {
                        "line": [
                        "100 Good St"
                        ],
                        "city": "Bedford",
                        "state": state.practitionerState,
                        "postalCode": "01730"
                    }
                    }
                },
                {
                    "resource": {
                    "resourceType": "PractitionerRole",
                    "id": "prarol1234",
                    "practitioner": {
                        "reference": "Practitioner/pra1234"
                    },
                    "location": [
                        {
                        "reference": "Location/99595dfb-cdd8-4813-8477-4a9fb40d6c54"
                        }
                    ]
                    }
                },
                {
                    "resource": {
                    "resourceType": "Coverage",
                    "id": "cov013",
                    "payor": [
                        {
                        "reference": "Organization/75f39025-65db-43c8-9127-693cdf75e712"
                        }
                    ],
                    "grouping": {
                        "plan": "Medicare Part D"
                    }
                    }
                },
                {
                    "resource": {
                    "resourceType": "DeviceRequest",
                    "id": "devreq013",
                    "meta": {
                        "profile": [
                        "http://hl7.org/fhir/us/davinci-crd/STU3/StructureDefinition/profile-devicerequest-stu3"
                        ]
                    },
                    "extension": [
                        {
                        "url": "http://build.fhir.org/ig/HL7/davinci-crd/STU3/ext-insurance.html",
                        "valueReference": {
                            "reference": "Coverage/cov013"
                        }
                        }
                    ],
                    "status": "draft",
                    "codeCodeableConcept": {
                        "coding": [
                        {
                            "system": state.codeSystem,
                            "code": state.code,
                            "display": "Stationary Compressed Gaseous Oxygen System, Rental"
                        }
                        ]
                    },
                    "subject": {
                        "reference": "Patient/pat013"
                    },
                    "performer": {
                        "reference": "Practitioner/pra1234"
                    }
                    }
                },
                {
                    "resource": {
                    "resourceType": "Device",
                    "type": {
                        "coding": [
                        {
                            "system": state.codeSystem,
                            "code": state.code,
                            "display": "Stationary Compressed Gaseous Oxygen System, Rental"
                        }
                        ]
                    }
                    }
                }
                ]
            }
        }
      }

    if (type==="stu3") {
        return stu3json;
    } else if (type==="r4") {
        return r4json;
    }
}
