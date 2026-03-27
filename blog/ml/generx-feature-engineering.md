---
title: "generx-mapper: Feature Engineering Beats Model Tweaks"
date: "2025-11-02"
tags: ["ml", "python", "bioinformatics"]
summary: "I spent a weekend tuning Random Forest hyperparameters. Then I fixed the PCA pipeline and the metrics moved more than any grid search."
reading_time: "14 min"
---

This project was a humbling reminder: **representation beats algorithm** when your inputs are noisy, high-dimensional, and only partially labeled. generx-mapper started as “try cool models” and ended as “sweat the preprocessing.”

## The pipeline I should have drawn first

```text
raw genetic features
      │
      ▼
 cleaning (missingness, outliers)
      │
      ▼
 PCA  ──► reduced X
      │
      ▼
 Random Forest baseline
      │
      ▼
 hold-out metrics + feature importance
```

Random Forest isn’t magic — it’s a **robust baseline** that tolerates nonlinearities once features aren’t garbage.

## Why PCA here?

Not because it’s trendy — because **curse of dimensionality** hits small sample sizes hard. PCA trades interpretability for stability; you monitor **explained variance** like a heartbeat.

```text
choose k where cumulative variance crosses a sensible threshold
log scree plot, don't eyeball only
```

## What actually moved metrics

- Consistent scaling before PCA.
- Stratified splits — classes weren’t balanced.
- Logging **per-fold** variance — a single lucky split lies.

## Code-shaped intuition

Sketch of the idea (Python-ish):

```python
X_clean = impute_and_scale(X)
X_pca = PCA(n_components=k).fit_transform(X_clean)
model = RandomForestClassifier(...)
model.fit(X_pca, y)
```

The interesting work is everything **before** `.fit`.

## Cross-validation I should have run earlier

```python
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline

pipe = Pipeline([
    ("pca", PCA(n_components=32, random_state=42)),
    ("rf", RandomForestClassifier(random_state=42)),
])
scores = cross_val_score(pipe, X_clean, y, cv=5, scoring="f1_macro")
print(scores.mean(), scores.std())
```

When `std` is huge, your **data** is unstable — not your `n_estimators`.

## Learnings

- Importance plots are **sanity checks**, not biology — don’t overclaim.
- If metrics barely move, suspect **data leakage** before fancy ensembles.
- Document random seeds and **exact** row filters — future you will ask.

I still enjoy model tweaks — but now I reach for **feature audits** first.
