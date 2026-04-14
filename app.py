from fastapi import FastAPI, File, UploadFile
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

app = FastAPI()

model = joblib.load("ids_model.pkl")
feature_names = joblib.load("feature_names.pkl")

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

    if len(data.keys()) < 10:
        return {"error": "Input data tidak lengkap ❌"}

    required_features = ["Destination Port", "Flow Duration"]
    for f in required_features:
        if f not in data:
            return {"error": f"{f} wajib diisi ❌"}


    features = [data.get(feature, 0) for feature in feature_names]
    features = np.array(features).reshape(1, -1)

    prediction = model.predict(features)[0]

    proba = model.predict_proba(features)[0]
    confidence = float(max(proba))

    result = "ATTACK 🚨" if prediction == 1 else "NORMAL ✅"

    return {
        "prediction": int(prediction),
        "result": result,
        "confidence": confidence
    }

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
        attack = int(sum(preds))
        normal = int(total - attack)

        return {
            "total_data": total,
            "attack": attack,
            "normal": normal,
            "avg_confidence": float(np.mean(confidences))
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
        y_true = df["Label"]  

        y_pred = model.predict(X)

        return {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision": float(precision_score(y_true, y_pred)),
            "recall": float(recall_score(y_true, y_pred)),
            "f1_score": float(f1_score(y_true, y_pred))
        }

    except Exception as e:
        return {"error": str(e)}