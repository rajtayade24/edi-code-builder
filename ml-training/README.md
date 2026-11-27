# CardiacRisk-AI / SurgRisk-AI ML Training Pipeline

Offline dataset governance, leakage-free splitting, multimodal model training (XGBoost, BiLSTM, Comorbidity GAT, BioBERT), calibration, and baseline clinical score benchmarking for the **CardiacRisk-AI** research workflow.

## Why There Are Two Python Folders

- `python-ai-service/` is the **runtime FastAPI inference microservice** (`127.0.0.1:8100`) invoked by `backend/src/services/ai-client.js`. It is compulsory when serving live AI predictions in the web app and stays lightweight with inference dependencies only.
- `ml-training/` is the **offline research & training workspace**. It handles clinical CSV validation, pre-index leakage guards, patient-grouped splits, training, Platt calibration, and external score benchmarking without coupling heavy training dependencies (`torch`, `transformers`, `xgboost`) or raw clinical datasets into the production service.

## Integrated Open-Access Datasets

Large registries cited in the **CardiacRisk-AI** paper (STS Adult Cardiac Surgery DB, MIMIC-IV, ACS-NSQIP, HiRID) require institutional credentialing / DUAs before redistribution. To ground every pipeline stage in real, open-access (**CC BY 4.0**) clinical cohorts right now, this repository integrates two complementary cohorts:

### 1. Primary Cardiac Surgery Benchmark — Méderi Adult Cardiac Surgery Cohort (`CC BY 4.0`)
- **Sources:** [Zenodo 22797059](https://zenodo.org/records/22797059) (`102` preoperative/echocardiography/coronary/comorbidity/lab variables) aligned with [Zenodo 19220755](https://zenodo.org/records/19220755) (per-patient **EuroSCORE II**, **Additive EuroSCORE**, **STS-PROM v2.9**, and **MederiScore** probabilities).
- **Script:** `scripts/prepare_mederi_cardiac.py` -> outputs `ml-training/data/processed/mederi-cardiac/`
- **Cohort (`1,486` procedures, `117` in-hospital deaths = `7.87%`):** Isolated CABG, AVR, MVR, Mitral Repair, Combined Valve+CABG, Thoracic Aorta Surgery.
- **Cardiac Modalities:**
  - `comorbidities.csv` (`5,292` rows): LVEF category (`<30%`, `30–39%`, `40–49%`), NYHA Class II–IV, Insulin-treated Diabetes, CKD stage / Dialysis, Pulmonary Hypertension (`PASP`), Redo Cardiac Surgery / Sternotomy, PVD, Carotid stenosis, Atrial Fibrillation/Flutter, Ventricular Arrhythmias, COPD, Cardiogenic Shock, Recent MI, Active Endocarditis, Heart Failure.
  - `labs.csv` (`5,482` rows): Preoperative `CREATININE` (`mg/dL`), `HGB` (`g/dL`), `WBC` (`10^3/uL`), `PLATELETS` (`10^3/uL`).
  - `notes.csv` (`1,486` rows): Deterministic de-identified preoperative cardiac, echo, and angiography summaries (`is_deidentified = true`).
  - `benchmarks.csv`: EuroSCORE II, Additive EuroSCORE, STS-PROM v2.9 (`sts_eligible = 1,056`), and MederiScore probabilities.

#### Held-Out Test Split Results (`runs/mederi-cardiac-baseline/benchmark-comparison.md`, `n = 223`, `17` events)
| Model / Risk Score | AUROC | AUPRC | Brier | ECE |
| --- | ---: | ---: | ---: | ---: |
| Additive EuroSCORE | 0.8220 | 0.4068 | 0.0627 | 0.0800 |
| EuroSCORE II | 0.8732 | 0.3945 | 0.0693 | 0.0589 |
| MederiScore | 0.8515 | 0.4622 | 0.0555 | 0.0269 |
| XGBoost (Platt Calibrated) | 0.8201 | 0.2930 | 0.0668 | 0.0551 |

On the **STS-PROM eligible held-out test subset** (`n = 166`, `10` events), calibrated XGBoost achieved **Brier `0.0534`** (`AUROC 0.8179`) vs **STS-PROM v2.9** (`AUROC 0.8426`, `Brier 0.0564`) and **EuroSCORE II** (`AUROC 0.8651`, `Brier 0.0558`).

### 2. Supplemental Multi-Specialty Surgical Lab/Cohort — VitalDB (`CC BY 4.0`)
- **Source:** [VitalDB Open Dataset](https://vitaldb.net/dataset/) (`6,388` surgeries across `6,090` unique patients; General, Thoracic, Gynecology, Urology; `57` in-hospital mortality events).
- **Script:** `scripts/prepare_vitaldb.py` -> outputs `ml-training/data/processed/vitaldb/` (`104,034` time-stamped pre-op lab measurements with `dt <= 0`, `3,756` comorbidities, `16,957` pre-op SpO2/glucose rows, `6,388` structured notes).

> **Research Paper Disclosure Notes:** Both open-access cohorts record **in-hospital surgical mortality** rather than 30-day post-discharge follow-up and omit raw free-text clinical notes and 48-hour preoperative ICU telemetry waveforms. Accordingly, validation and training pass `--min-followup-days 0 --endpoint IN_HOSPITAL_MORTALITY`, and trained release manifests retain `PENDING_EXTERNAL_REVIEW` (`approved_for_use: false`) until full multi-task institutional data (e.g., MIMIC-IV / STS) is validated.

## Reproducible Commands (Windows PowerShell)

```powershell
# 1. Prepare Méderi Adult Cardiac Surgery dataset (add --download if not cached)
ml-training\.venv\Scripts\python.exe ml-training\scripts\prepare_mederi_cardiac.py --download

# 2. Validate strict pre-index schema & create patient-disjoint splits
$env:PYTHONPATH='ml-training\src'
ml-training\.venv\Scripts\python.exe ml-training\scripts\validate_dataset.py `
  --data-dir ml-training\data\processed\mederi-cardiac `
  --require-deidentified-notes `
  --min-followup-days 0 `
  --report ml-training\runs\mederi-cardiac-baseline\dataset-validation.json

ml-training\.venv\Scripts\python.exe ml-training\scripts\create_splits.py `
  --data-dir ml-training\data\processed\mederi-cardiac `
  --output-dir ml-training\runs\mederi-cardiac-baseline `
  --min-followup-days 0

# 3. Train XGBoost branch & benchmark against EuroSCORE II / STS-PROM
ml-training\.venv\Scripts\python.exe ml-training\scripts\train_xgboost.py `
  --data-dir ml-training\data\processed\mederi-cardiac `
  --run-dir ml-training\runs\mederi-cardiac-baseline `
  --config ml-training\configs\training.json `
  --model-version xgboost-mederi-0.1.0 `
  --min-followup-days 0 `
  --endpoint IN_HOSPITAL_MORTALITY

ml-training\.venv\Scripts\python.exe ml-training\scripts\evaluate_cardiac_benchmarks.py `
  --data-dir ml-training\data\processed\mederi-cardiac `
  --run-dir ml-training\runs\mederi-cardiac-baseline

# 4. Seed 15 de-identified Méderi cardiac cases into MongoDB Atlas for the web dashboard
ml-training\.venv\Scripts\python.exe ml-training\scripts\export_clinical_seed.py
cd backend; npm run db:seed-cohort
```
