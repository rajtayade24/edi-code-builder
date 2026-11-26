# Model artifacts directory

Keep model weights and manifests outside source control. This folder intentionally contains no trained weights.

The service requires four independently validated adapters:

- `xgboost`: tabular baseline model
- `bilstm`: sequence model for longitudinal vitals/labs
- `gat`: graph model for structured comorbidity relationships
- `biobert`: clinical-text model (only when approved clinical-note processing is enabled)

After all branches are registered in `app/models/register_adapters.py`, add a reviewed
`ensemble-config.json` using `ensemble-config.example.json` as the schema reference.
Do not use example weights or an unreviewed model artifact in a clinical workflow.
