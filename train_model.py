import pandas as pd
import numpy as np

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix

from xgboost import XGBClassifier

import joblib
import matplotlib.pyplot as plt

df = pd.read_csv("Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv")
df.columns = df.columns.str.strip()


df.replace([np.inf, -np.inf], np.nan, inplace=True)
df.dropna(inplace=True)

for col in ["Flow ID", "Source IP", "Destination IP", "Timestamp"]:
    if col in df.columns:
        df.drop(col, axis=1, inplace=True)

X = df.drop("Label", axis=1)
y = df["Label"]

le = LabelEncoder()
y = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)
neg, pos = np.bincount(y_train)
scale_pos_weight = neg / pos

model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.7,
    colsample_bytree=0.7,
    reg_alpha=0.1,
    reg_lambda=1.0,
    objective="binary:logistic",
    eval_metric="logloss",
    scale_pos_weight=scale_pos_weight,
    random_state=42
)


model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("\n=== Confusion Matrix ===")
print(confusion_matrix(y_test, y_pred))

print("\n=== Classification Report ===")
print(classification_report(y_test, y_pred))

print("\n=== Cross Validation ===")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

scores = cross_val_score(model, X, y, cv=cv, scoring="f1")

print("F1 Scores:", scores)
print("Mean F1:", scores.mean())

importances = model.feature_importances_
indices = np.argsort(importances)[-15:]

plt.figure()
plt.title("Top 15 Feature Importance")
plt.barh(range(len(indices)), importances[indices])
plt.yticks(range(len(indices)), [X.columns[i] for i in indices])
plt.xlabel("Importance")
plt.show()

joblib.dump(model, "ids_model.pkl")
joblib.dump(X.columns.tolist(), "feature_names.pkl")
joblib.dump(le, "label_encoder.pkl")

print("\n✅ Model berhasil disimpan (stable version)")