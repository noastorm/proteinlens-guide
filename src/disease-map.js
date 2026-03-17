/**
 * disease-map.js
 * Curated fast-path: maps common disease/symptom queries to the most
 * clinically relevant UniProt accession.
 *
 * Used by search.js before falling back to full proteins.json search.
 * Covers ~200 conditions across major disease categories.
 */

export const DISEASE_MAP = {

  // ─── NEUROLOGICAL & NEURODEGENERATIVE ─────────────────────────────────────
  "alzheimer":              "P05067", // APP
  "alzheimer's":            "P05067",
  "alzheimer's disease":    "P05067",
  "amyloid":                "P05067",
  "parkinson":              "P37840", // SNCA (alpha-synuclein)
  "parkinson's":            "P37840",
  "parkinson's disease":    "P37840",
  "alpha-synuclein":        "P37840",
  "huntington":             "P42858", // HTT
  "huntington's":           "P42858",
  "huntington's disease":   "P42858",
  "huntingtin":             "P42858",
  "als":                    "P00441", // SOD1
  "amyotrophic lateral sclerosis": "P00441",
  "lou gehrig":             "P00441",
  "multiple sclerosis":     "P01911", // HLA-DRB1
  "ms":                     "P01911",
  "epilepsy":               "P35499", // SCN4A
  "seizures":               "P35499",
  "migraine":               "Q13936", // CACNA1A
  "prion":                  "P04156", // PRNP
  "creutzfeldt-jakob":      "P04156",
  "spinal muscular atrophy":"Q16637", // SMN1
  "sma":                    "Q16637",
  "friedreich ataxia":      "Q14 197", // FXN
  "ataxia":                 "Q14197", // FXN
  "narcolepsy":             "O43612", // HCRT (orexin)
  "neurofibromatosis":      "P21359", // NF1
  "tuberous sclerosis":     "P49815", // TSC2
  "fragile x":              "Q06787", // FMR1
  "rett syndrome":          "P51608", // MECP2
  "mecp2":                  "P51608",
  "spina bifida":           "P00374", // DHFR
  "cerebral palsy":         "P00374",

  // ─── MENTAL HEALTH & PSYCHIATRIC ──────────────────────────────────────────
  "adhd":                   "Q01959", // SLC6A3 (DAT1)
  "attention deficit":      "Q01959",
  "dopamine transporter":   "Q01959",
  "dat1":                   "Q01959",
  "depression":             "P31645", // SLC6A4 (serotonin transporter)
  "major depression":       "P31645",
  "serotonin transporter":  "P31645",
  "sert":                   "P31645",
  "anxiety":                "P34913", // GABRA2
  "gaba":                   "P34913",
  "schizophrenia":          "P14416", // DRD2
  "dopamine receptor":      "P14416",
  "drd2":                   "P14416",
  "bipolar":                "O15554", // KCNN3
  "bipolar disorder":       "O15554",
  "autism":                 "Q9ULH4", // SHANK2
  "autism spectrum":        "Q9ULH4",
  "asd":                    "Q9ULH4",
  "ocd":                    "P31645", // SLC6A4
  "obsessive compulsive":   "P31645",
  "ptsd":                   "P06213", // FKBP5
  "stress":                 "P06213",
  "addiction":              "P35462", // DRD3
  "substance use":          "P35462",
  "alcoholism":             "P48549", // GABRA2
  "eating disorder":        "P28222", // HTR1B
  "anorexia":               "P28222",
  "bulimia":                "P28222",
  "psychosis":              "P14416", // DRD2
  "tourette":               "P21728", // DRD1

  // ─── CANCER ───────────────────────────────────────────────────────────────
  "cancer":                 "P04637", // TP53
  "tumor":                  "P04637",
  "tumour":                 "P04637",
  "tp53":                   "P04637",
  "p53":                    "P04637",
  "breast cancer":          "P38398", // BRCA1
  "brca":                   "P38398",
  "brca1":                  "P38398",
  "brca2":                  "P51587", // BRCA2
  "lung cancer":            "P00533", // EGFR
  "egfr":                   "P00533",
  "colorectal cancer":      "P01116", // KRAS
  "colon cancer":           "P01116",
  "kras":                   "P01116",
  "ras":                    "P01116",
  "melanoma":               "P15056", // BRAF
  "braf":                   "P15056",
  "leukemia":               "P00519", // ABL1
  "abl1":                   "P00519",
  "bcr-abl":                "P00519",
  "lymphoma":               "P11717", // BCL2
  "bcl2":                   "P11717",
  "prostate cancer":        "P10275", // AR
  "androgen receptor":      "P10275",
  "ovarian cancer":         "P51587", // BRCA2
  "cervical cancer":        "P03126", // HPV E6
  "pancreatic cancer":      "P01116", // KRAS
  "liver cancer":           "P04637", // TP53
  "glioblastoma":           "P00533", // EGFR
  "brain tumor":            "P00533",
  "neuroblastoma":          "P04629", // NTRK1
  "retinoblastoma":         "P06400", // RB1
  "rb1":                    "P06400",
  "myeloma":                "P22681", // CBL
  "thyroid cancer":         "P15056", // BRAF
  "renal cancer":           "P40337", // VHL
  "vhl":                    "P40337",
  "her2":                   "P04626", // ERBB2
  "erbb2":                  "P04626",
  "mtor":                   "P42345", // MTOR
  "pten":                   "P60484", // PTEN

  // ─── CARDIOVASCULAR ───────────────────────────────────────────────────────
  "heart disease":          "P35916", // FLT4
  "heart failure":          "P16860", // NPPA (ANP)
  "atrial fibrillation":    "Q14524", // SCN5A
  "arrhythmia":             "Q14524",
  "long qt syndrome":       "Q12809", // KCNH2
  "hypertrophic cardiomyopathy": "P12883", // MYH7
  "cardiomyopathy":         "P12883",
  "hypertension":           "P01019", // AGT (angiotensinogen)
  "high blood pressure":    "P01019",
  "angiotensin":            "P01019",
  "cholesterol":            "P01130", // LDLR
  "familial hypercholesterolemia": "P01130",
  "ldl receptor":           "P01130",
  "atherosclerosis":        "P02649", // APOE
  "apoe":                   "P02649",
  "stroke":                 "P00734", // F2 (thrombin)
  "blood clot":             "P00734",
  "thrombin":               "P00734",
  "factor v leiden":        "P12259", // F5
  "deep vein thrombosis":   "P12259",
  "pulmonary embolism":     "P12259",
  "marfan syndrome":        "P35555", // FBN1
  "aortic aneurysm":        "P35555",
  "ehlers-danlos":          "P02452", // COL1A1

  // ─── METABOLIC & ENDOCRINE ────────────────────────────────────────────────
  "diabetes":               "P07756", // INS (insulin)
  "type 1 diabetes":        "P07756",
  "type 2 diabetes":        "P07756",
  "insulin":                "P07756",
  "insulin resistance":     "P06213", // INSR
  "obesity":                "P41159", // LEP (leptin)
  "leptin":                 "P41159",
  "thyroid":                "P01241", // GH1
  "hypothyroidism":         "P10828", // THRB
  "hyperthyroidism":        "P10828",
  "graves disease":         "P16473", // TSHR
  "hashimoto":              "P16473",
  "cushing":                "P01189", // POMC
  "addison":                "P10275", // AR
  "growth hormone":         "P01241", // GH1
  "acromegaly":             "P01241",
  "phenylketonuria":        "P00439", // PAH
  "pku":                    "P00439",
  "galactosemia":           "P07902", // GALT
  "gaucher":                "P04062", // GBA
  "fabry":                  "P06280", // GLA
  "pompe":                  "P10253", // GAA
  "wilson disease":         "P35670", // ATP7B
  "hemochromatosis":        "Q30201", // HFE
  "gout":                   "P47989", // XDH
  "uric acid":              "P47989",
  "porphyria":              "P08397", // HMBS

  // ─── IMMUNE & INFLAMMATORY ────────────────────────────────────────────────
  "rheumatoid arthritis":   "P01375", // TNF
  "tnf":                    "P01375",
  "inflammation":           "P01375",
  "lupus":                  "P09960", // LTA4H
  "psoriasis":              "P05113", // IL17A
  "crohn's":                "P15692", // VEGFA
  "inflammatory bowel":     "P15692",
  "ulcerative colitis":     "P15692",
  "celiac":                 "P01911", // HLA-DRB1
  "asthma":                 "P05113", // IL17A
  "allergy":                "P06734", // IL4
  "il4":                    "P06734",
  "anaphylaxis":            "P14778", // IL1R1
  "sepsis":                 "P01375", // TNF
  "cytokine storm":         "P05231", // IL6
  "il6":                    "P05231",
  "sjogren":                "P15924", // DSP
  "scleroderma":            "P04637", // TP53
  "myasthenia gravis":      "P02708", // CHRNA1
  "vasculitis":             "P01375", // TNF

  // ─── INFECTIOUS DISEASE ───────────────────────────────────────────────────
  "hiv":                    "P03369", // HIV-1 gag
  "aids":                   "P03369",
  "covid":                  "P0DTD1", // SARS-CoV-2 3CLpro
  "covid-19":               "P0DTD1",
  "sars":                   "P0DTD1",
  "coronavirus":            "P0DTD1",
  "influenza":              "P03435", // influenza hemagglutinin
  "flu":                    "P03435",
  "hepatitis b":            "P03138", // HBV surface antigen
  "hepatitis c":            "P26663", // HCV NS3
  "tuberculosis":           "P9WGK9", // Mtb KatG
  "malaria":                "P08248", // PfDHFR
  "ebola":                  "Q05320", // EBOV GP

  // ─── RESPIRATORY ──────────────────────────────────────────────────────────
  "cystic fibrosis":        "P13569", // CFTR
  "cftr":                   "P13569",
  "copd":                   "P01009", // SERPINA1
  "emphysema":              "P01009",
  "alpha-1 antitrypsin":    "P01009",
  "pulmonary fibrosis":     "P35916", // FLT4
  "sarcoidosis":            "P01375", // TNF

  // ─── MUSCULOSKELETAL ──────────────────────────────────────────────────────
  "muscular dystrophy":     "P11532", // DMD (dystrophin)
  "duchenne":               "P11532",
  "dystrophin":             "P11532",
  "osteoporosis":           "Q04721", // NOTCH2
  "osteoarthritis":         "P15692", // VEGFA
  "osteogenesis imperfecta":"P02452", // COL1A1
  "achondroplasia":         "P21802", // FGFR2
  "myotonic dystrophy":     "P21815", // DMPK

  // ─── RENAL & UROLOGICAL ───────────────────────────────────────────────────
  "kidney disease":         "P29317", // EPHA2
  "polycystic kidney":      "P98161", // PKD1
  "pkd":                    "P98161",
  "nephrotic syndrome":     "O60500", // NPHS2
  "alport syndrome":        "P29400", // COL4A5
  "kidney cancer":          "P40337", // VHL

  // ─── HEMATOLOGICAL ────────────────────────────────────────────────────────
  "sickle cell":            "P68871", // HBB
  "sickle cell anemia":     "P68871",
  "hemoglobin":             "P68871",
  "thalassemia":            "P68871",
  "hemophilia":             "P00451", // F8
  "hemophilia a":           "P00451",
  "hemophilia b":           "P00740", // F9
  "von willebrand":         "P04275", // VWF
  "anemia":                 "P02516", // HBA1
  "polycythemia":           "P49699", // EPOR

  // ─── EYE DISEASE ──────────────────────────────────────────────────────────
  "macular degeneration":   "P15692", // VEGFA
  "amd":                    "P15692",
  "glaucoma":               "Q02388", // MYOC
  "retinitis pigmentosa":   "P08100", // RHO
  "color blindness":        "P04001", // OPN1LW
  "cataracts":              "P02489", // CRYAA

  // ─── SKIN ─────────────────────────────────────────────────────────────────
  "melanoma":               "P15056", // BRAF
  "epidermolysis bullosa":  "Q03001", // COL17A1
  "ichthyosis":             "P20930", // FLG
  "vitiligo":               "P14679", // TYR
  "albinism":               "P14679",

  // ─── REPRODUCTIVE & DEVELOPMENTAL ────────────────────────────────────────
  "infertility":            "P01215", // FSHB
  "pcos":                   "P22888", // LHCGR
  "endometriosis":          "P03372", // ESR1
  "estrogen receptor":      "P03372",
  "down syndrome":          "P05067", // APP
  "turner syndrome":        "P31749", // AKT1
  "klinefelter":            "P10275", // AR

  // ─── LIVER ────────────────────────────────────────────────────────────────
  "liver disease":          "P35555", // FBN1
  "cirrhosis":              "P01009", // SERPINA1
  "fatty liver":            "P55209", // NR1I3
  "nash":                   "P55209",

  // ─── PAIN ─────────────────────────────────────────────────────────────────
  "chronic pain":           "P35499", // SCN4A
  "neuropathic pain":       "P35499",
  "fibromyalgia":           "P31645", // SLC6A4
  "opioid":                 "P35372", // OPRM1
  "mu opioid receptor":     "P35372",

};

/**
 * Look up a query in the curated disease map.
 * Returns a UniProt accession string or null.
 */
export function lookupDisease(rawQuery) {
  const q = rawQuery.toLowerCase().trim();
  // Exact match first
  if (DISEASE_MAP[q]) return DISEASE_MAP[q];
  // Partial match — query is contained in a key
  for (const [key, id] of Object.entries(DISEASE_MAP)) {
    if (key.includes(q) || q.includes(key)) return id;
  }
  return null;
}
