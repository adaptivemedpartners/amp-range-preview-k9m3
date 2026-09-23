# 2176 specialty still-there wiring

Client step 3 (`client-specialty`) reads `V3_SPECIALTY_STORY` before the facility-story specialty match. Facility cards from 2174 are unchanged. Dermatology has no eligible 5-year still-there in the sample and stays on `V3_RET.proof`.

| specialtyId | V3_RET key | Year line | Facility | Place | Foot |
| --- | --- | --- | --- | --- | --- |
| fm | specFmWayne | 2013 · Family Medicine | Wayne Memorial Health System | Honesdale, PA | 12 YEARS LATER |
| family_medicine_with_ob | specFpobFrio | 2013 · Family Medicine w/ OB | Frio Regional Hospital | Pearsall, TX | 13 YEARS LATER |
| pediatrics_general | specPdAlliance | 2012 · Pediatrics | Alliance Pediatrics | Keller, TX | 14 YEARS LATER |
| dental | specDdsWinn | 2016 · Dentistry | Winn Community Health Center | Winnfield, LA | 9 YEARS LATER |
| obg | specObgChrist | 2015 · OB/GYN | Christ Community Health Services | Memphis, TN | 11 YEARS LATER |
| internal_medicine_general | specImCentral | 2019 · Internal Medicine | Central Counties Health Centers | Springfield, IL | 7 YEARS LATER |
| psychiatry_general | specPAnniston | 2014 · Psychiatry | Regional Medical Center | Anniston, AL | 12 YEARS LATER |
| psychiatry_child_and_adolescent | specPAnniston | 2014 · Psychiatry | Regional Medical Center | Anniston, AL | 12 YEARS LATER |
| psychiatry_addiction_medicine | specPAnniston | 2014 · Psychiatry | Regional Medical Center | Anniston, AL | 12 YEARS LATER |
| psychiatry_geriatric | specPAnniston | 2014 · Psychiatry | Regional Medical Center | Anniston, AL | 12 YEARS LATER |
| nurse_practitioner_family_medicine_without_ob | specNpCochise | 2013 · Nurse Practitioner | Northern Cochise Community Hospital | Willcox, AZ | 13 YEARS LATER |
| nurse_practitioner_emergency_medicine | specNpWillcox | 2013 · Nurse Practitioner | Northern Cochise Community Hospital | Willcox, AZ | 13 YEARS LATER |
| nurse_practitioner_psychiatry | specPnpChemung | 2017 · Psychiatric NP | Family Services of Chemung County | Elmira, NY | 8 YEARS LATER |
| hospitalist_internal_medicine | specHosBaptist | 2014 · Hospitalist | Baptist - Richmond | Richmond, KY | 12 YEARS LATER |
| emergency_medicine | specEmVcu | 2013 · Emergency Medicine | VCU Community Memorial Hospital | South Hill, VA | 13 YEARS LATER |
| surgery_general | specGsBaptist | 2012 · General Surgery | Baptist Regional Medical Center | Corbin, KY | 14 YEARS LATER |
| cards | specCdFrancis | 2016 · Cardiology | Saint Francis Medical Center | Cape Girardeau, MO | 10 YEARS LATER |
| orthopedic_surgery_general | specOrsHenry | 2014 · Orthopedic Surgery | Henry County Medical Center | Paris, TN | 12 YEARS LATER |
| anesthesiology | specAKansas | 2018 · Anesthesiology | Kansas Heart Hospital | Wichita, KS | 8 YEARS LATER |
| gi | specGiAdvent | 2019 · Gastroenterology | AdventHealth Medical Group | Tampa, FL | 7 YEARS LATER |
| neuro | specNBaptist | 2012 · Neurology | Baptist Health - Richmond, Pattie A. Clay | Richmond, KY | 13 YEARS LATER |
| neurology | specNBaptist | 2012 · Neurology | Baptist Health - Richmond, Pattie A. Clay | Richmond, KY | 13 YEARS LATER |
| physician_assistant_psychiatry | specPaConcho | 2019 · Physician Assistant | Concho County Hospital | Eden, TX | 7 YEARS LATER |
| dermatology | proof | Retention proof | 87% still there at three years | — | gap: no eligible 5yr still-there |

Multi-specialty / Group + Family Medicine uses Wayne Memorial (`specFmWayne`), not Alliance Pediatrics and not the 87% card.

Preview: https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2176

Specialty step: https://adaptivemedpartners.github.io/amp-range-preview-k9m3/client-specialty?v=2176
