from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import shap

THREAT_MAP = {
    "BENIGN": {
        "severity": "LOW 🟢",
        "recommendation": "No action needed"
    },
    "DDoS": {
        "severity": "CRITICAL 🚨",
        "recommendation": "Block IP & enable rate limiting"
    },
    "DoS": {
        "severity": "HIGH ⚠️",
        "recommendation": "Apply firewall rules"
    },
    "PortScan": {
        "severity": "MEDIUM ⚡",
        "recommendation": "Monitor suspicious scanning activity"
    }
}

def get_threat_info(label: str):
    return THREAT_MAP.get(label, {
        "severity": "UNKNOWN",
        "recommendation": "Investigate manually"
    })

app = FastAPI()

model = joblib.load("ids_model.pkl")
feature_names = joblib.load("feature_names.pkl")
le = joblib.load("label_encoder.pkl")  

explainer = shap.TreeExplainer(model)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "IDS API is running 🚀"}

class NetworkData(BaseModel):
    data: dict

@app.post("/predict")
def predict(input_data: NetworkData):
    data = input_data.data

    # 🔥 FIX duplicate feature
    if "Fwd Header Length" in data and "Fwd Header Length.1" in feature_names:
        data["Fwd Header Length.1"] = data["Fwd Header Length"]

    # cek missing
    missing = [f for f in feature_names if f not in data]
    if missing:
        return {"error": f"Missing features: {missing[:5]}"}

    features = [data.get(feature, 0) for feature in feature_names]
    features_df = pd.DataFrame([features], columns=feature_names)

    # 🔥 Prediction
    prediction = model.predict(features_df)[0]
    proba = model.predict_proba(features_df)[0]
    confidence = float(max(proba))

    label = le.inverse_transform([prediction])[0].strip()

    threat_info = get_threat_info(label)
    result = "ATTACK 🚨" if label != "BENIGN" else "NORMAL"

    # 🔥 Global importance
    importance = model.feature_importances_
    top_idx = np.argsort(importance)[-5:]
    top_features = [feature_names[i] for i in top_idx]

    # 🔥 SHAP
    try:
        shap_values = explainer.shap_values(features_df)

        if isinstance(shap_values, list):
            shap_val = shap_values[prediction][0]
        else:
            shap_val = shap_values[0]

        top_idx = np.argsort(np.abs(shap_val))[-5:]

        shap_features = [
            {
                "feature": feature_names[i],
                "impact": float(shap_val[i])
            }
            for i in top_idx[::-1]
        ]

    except Exception:
        shap_features = []

    return {
        "prediction": int(prediction),
        "label": label,
        "attack_type": label,
        "result": result,
        "confidence": confidence,
        "top_features": top_features,
        "severity": threat_info["severity"],
        "recommendation": threat_info["recommendation"],
        "shap_explanation": shap_features,
    }

@app.post("/predict-single-from-csv")
async def predict_single_from_csv(file: UploadFile = File(...)):
    try:
        # =========================
        # 🔥 LOAD & CLEAN DATA
        # =========================
        df = pd.read_csv(file.file)
        df.columns = df.columns.str.strip()

        df.replace([np.inf, -np.inf], 0, inplace=True)
        df.fillna(0, inplace=True)

        # =========================
        # 🔥 AMBIL 1 SAMPLE (RANDOM)
        # =========================
        sample = df.sample(1).iloc[0].to_dict()

        # =========================
        # 🔥 FIX DUPLICATE FEATURE
        # =========================
        if "Fwd Header Length" in sample and "Fwd Header Length.1" in feature_names:
            sample["Fwd Header Length.1"] = sample["Fwd Header Length"]

        # =========================
        # 🔥 SUSUN SESUAI TRAINING
        # =========================
        features = [sample.get(f, 0) for f in feature_names]
        features_df = pd.DataFrame([features], columns=feature_names)

        # =========================
        # 🔥 PREDICTION
        # =========================
        prediction = model.predict(features_df)[0]
        proba = model.predict_proba(features_df)[0]
        confidence = float(max(proba))

        label = le.inverse_transform([prediction])[0].strip()

        threat_info = get_threat_info(label)
        result = "ATTACK 🚨" if label != "BENIGN" else "NORMAL"

        # =========================
        # 🔥 GLOBAL FEATURE IMPORTANCE
        # =========================
        importance = model.feature_importances_
        top_idx = np.argsort(importance)[-5:]
        top_features = [feature_names[i] for i in top_idx]

        # =========================
        # 🔥 SHAP EXPLAINABILITY
        # =========================
        try:
            shap_values = explainer.shap_values(features_df)

            # handle multi-class (xgboost / tree model)
            if isinstance(shap_values, list):
                shap_val = shap_values[prediction][0]
            else:
                shap_val = shap_values[0]

            top_idx = np.argsort(np.abs(shap_val))[-5:]

            shap_features = [
                {
                    "feature": feature_names[i],
                    "impact": float(shap_val[i])
                }
                for i in top_idx[::-1]
            ]

        except Exception as e:
            shap_features = []
            print("SHAP ERROR:", e)

        # =========================
        # 🔥 RESPONSE (MATCH FRONTEND)
        # =========================
        return {
            "prediction": int(prediction),
            "label": label,
            "attack_type": label,
            "result": result,
            "confidence": confidence,
            "top_features": top_features,          # ✅ penting buat chart
            "severity": threat_info["severity"],
            "recommendation": threat_info["recommendation"],
            "shap_explanation": shap_features,     # ✅ penting buat SHAP chart
        }

    except Exception as e:
        return {"error": str(e)}

@app.post("/predict-csv")
async def predict_csv(file: UploadFile = File(...)):
    try:
        df = pd.read_csv(file.file)
        df.columns = df.columns.str.strip()

        df.replace([np.inf, -np.inf], 0, inplace=True)
        df.fillna(0, inplace=True)

        for col in feature_names:
            if col not in df.columns:
                df[col] = 0

        X = df[feature_names]

        preds = model.predict(X)
        probas = model.predict_proba(X)
        confidences = np.max(probas, axis=1)

        total = len(preds)

       
        labels = le.inverse_transform(preds)

        attack = int(sum(label != "BENIGN" for label in labels))
        normal = int(total - attack)

        importance = model.feature_importances_
        top_idx = np.argsort(importance)[-5:]
        top_features = [feature_names[i] for i in top_idx]

        return {
            "total_data": total,
            "attack": attack,
            "normal": normal,
            "avg_confidence": float(np.mean(confidences)),
            "top_features": top_features
        }

    except Exception as e:
        return {"error": str(e)}

    
@app.get("/metrics")
def get_metrics():
    try:
        df = pd.read_csv("test_data.csv")

        df.columns = df.columns.str.strip()
        df.replace([np.inf, -np.inf], 0, inplace=True)
        df.fillna(0, inplace=True)

        X = df[feature_names]

        y_true = le.transform(df["Label"])

        y_pred = model.predict(X)

        return {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision": float(precision_score(y_true, y_pred)),
            "recall": float(recall_score(y_true, y_pred)),
            "f1_score": float(f1_score(y_true, y_pred))
        }

    except Exception as e:
        return {"error": str(e)}