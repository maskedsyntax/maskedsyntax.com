---
title: "generx-mapper: loading GCTX and thinking about PCA"
date: "2025-11-02"
tags: ["ml", "python", "bioinformatics"]
summary: "The repo started with cmapPy and huge LINCS-style matrices. Most of the learning was how to subset rows and columns without loading the full tensor into RAM by accident."
reading_time: "5 min"
---

I wanted to experiment with genetic expression style tables without pretending I had a clean Kaggle CSV. generx-mapper sits next to `.gctx` files from the GEO / LINCS world. The Python in the tree is mostly **I/O probes**: parse with `cmapPy`, check paths, and think about what a modeling pipeline would look like once the tensor is addressable. For blog-sized honesty: most of the "ML" here is **data framing**. The Python is the hook that proves the files are parseable.

## Subsetting before you call `head()`

`parse` can take `rid` and `cid` lists so you do not materialize millions of rows by default:

```python
from cmapPy.pandasGEXpress.parse import parse

gctx_file = "/path/to/level5_beta_trt_cp_n720216x12328.gctx"
gctoo = parse(gctx_file, rid=["Gene_1", "Gene_2", "Gene_3"], cid=["Sample_1", "Sample_2"])
data_df = gctoo.data_df
print(data_df.shape)
print(data_df.head())
```

**Name the genes and samples you care about** before you call `head()` on something tens of thousands wide. Full matrices need workstations; CI jobs should stick to toy slices or skip entirely. Subsetting keeps RAM sane.

`check_ds.py` uses `os.path.exists` and `os.access` so you fail fast when the mount is wrong:

```python
import os

print("File exists:", os.path.exists(gctx_file))
print("File is readable:", os.access(gctx_file, os.R_OK))
```

It sounds trivial until you run batch jobs on a cluster where paths move. The script is a template for "can this process even see the data?"

## Metadata, leakage, and the sklearn-shaped middle

`gctoo.row_metadata_df` and `col_metadata_df` are where drug names, doses, and cell lines live. The numeric matrix without those tables is half the story. I keep joins explicit: merge on string IDs, assert uniqueness, drop ambiguous rows instead of letting pandas pick a winner.

If the same patient or plate shows up in train and test through different sample IDs, metrics lie. Before any PCA, I group by whatever identifier the experiment design provides and split by group. Cross-validation without grouping is fast and wrong for plate effects.

Once `data_df` is a numeric matrix with aligned labels, the sklearn shape is standard:

```python
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline

pipe = Pipeline([
    ("pca", PCA(n_components=32, random_state=42)),
    ("rf", RandomForestClassifier(random_state=42)),
])
scores = cross_val_score(pipe, X_clean, y, cv=5, scoring="f1_macro")
```

The project does not check in a full `X_clean` pipeline because real matrices live outside git. The **intent** is documentation: scaling and imputation belong **before** `PCA`, stratified splits matter when classes are rare, and you log per-fold variance to catch a single lucky split. I spent time on `n_estimators` early; the bigger jumps came from asking whether missing values were MCAR, whether rows duplicated after merges, and whether sample IDs matched metadata. Random Forest is forgiving; it cannot invent signal from misaligned joins.

Gene set enrichment and pathway scores belong downstream of `data_df`; I sketch them in notebooks instead of committing half-working pipelines. Elastic net or gradient boosting often beat RF on wide sparse biology matrices once `X_clean` exists; I would still start with RF for a baseline because it is robust to scaling mistakes.

## Versions, ethics, collaboration, and negative results

Notebooks may use `parse` or `parse_gctx` depending on cmapPy version; pin versions in `requirements.txt` when sharing. Seeds on `PCA` and `RandomForestClassifier` matter when you diff branches; I log sklearn and numpy versions in notebook footers. I keep exploratory plots out of git; the repo holds loaders and checks only. `conda` or `venv` with pinned cmapPy lives outside the repo when a notebook stabilizes.

Expression data can identify individuals in rare cases; I treat access-controlled files carefully. Many GEO and LINCS files require authentication; scripts assume files are already local and do not embed API keys.

When sharing with wet lab folks, I export gene lists and effect sizes to CSV alongside model metrics. Sometimes PCA plus RF barely beats baseline; publishing that in lab notes still matters so the next person does not repeat the same grid search.

## After

generx-mapper is a thin scaffold. If I extend it, the next code I add is explicit train and validation keys in config, not another model class.

LINCS-scale matrices are a humility engine. The notebook that loads "just ten thousand genes" still teaches more about IO and joins than any tweak to `n_components`. I am fine with that ordering: get the tensor addressable, then argue about models.

When cmapPy updates, I diff the parse output on a tiny fixture before trusting old notebooks. Header fields drift; silent NaN columns are worse than a loud parse error.

Group splits for leakage checks are tedious to explain in a README; they belong in a short methods appendix in any paper draft. The code comments in this repo are placeholders for that appendix.

I treat negative results as first-class outputs: if PCA variance explained is flat, that is still a figure worth saving. Otherwise the next student assumes the pipeline was never run.
