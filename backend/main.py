from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import yfinance as yf
import pandas as pd
import numpy as np

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error

from xgboost import XGBRegressor

from datetime import datetime

app = FastAPI(title="AI Financial Intelligence System")

# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# FEATURE ENGINEERING
# -----------------------------

def create_features(df):

    df["MA10"] = df["Close"].rolling(window=10).mean()
    df["MA20"] = df["Close"].rolling(window=20).mean()
    df["MA50"] = df["Close"].rolling(window=50).mean()

    df["Daily_Return"] = df["Close"].pct_change()

    df = df.dropna()

    return df


# -----------------------------
# RISK CALCULATION
# -----------------------------

def calculate_risk(df):

    returns = df["Close"].pct_change().dropna()

    volatility = np.std(returns) * 100

    risk_score = min(round(volatility * 2, 2), 100)

    return risk_score


# -----------------------------
# SENTIMENT (placeholder)
# -----------------------------

def sentiment_analysis():

    score = np.random.uniform(-1, 1)

    return round(score, 2)


# -----------------------------
# RECOMMENDATION
# -----------------------------

def recommendation(current_price, predicted_price):

    if predicted_price > current_price * 1.05:
        return "BUY"

    elif predicted_price < current_price * 0.95:
        return "SELL"

    else:
        return "HOLD"


# -----------------------------
# FUTURE PREDICTIONS
# -----------------------------

def future_predictions(base_price):

    return {

        "3_months": round(base_price * 1.05, 2),
        "6_months": round(base_price * 1.10, 2),
        "9_months": round(base_price * 1.18, 2)

    }


# -----------------------------
# HOME
# -----------------------------

@app.get("/")
def home():

    return {
        "message": "AI Stock Prediction System Running",
        "status": "OK"
    }


# -----------------------------
# CURRENT PRICE
# -----------------------------

@app.get("/price")
def current_price(symbol: str):

    try:

        ticker = yf.Ticker(symbol)

        data = ticker.history(period="1d")

        price = float(data["Close"].iloc[-1])

        return {
            "symbol": symbol.upper(),
            "current_price": round(price, 2),
            "timestamp": datetime.now()
        }

    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# HISTORICAL DATA
# -----------------------------

@app.get("/history")
def history(symbol: str):

    try:

        ticker = yf.Ticker(symbol)

        df = ticker.history(period="1y")

        history_data = []

        for index, row in df.iterrows():

            history_data.append({

                "date": index.strftime("%Y-%m-%d"),
                "close": round(float(row["Close"]), 2)

            })

        return history_data

    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# TRAIN MODELS
# -----------------------------

def train_models(df):

    df = create_features(df)

    X = df[["MA10", "MA20", "MA50", "Daily_Return"]]

    y = df["Close"]

    split = int(len(df) * 0.8)

    X_train = X[:split]
    X_test = X[split:]

    y_train = y[:split]
    y_test = y[split:]

    # -------------------
    # Linear Regression
    # -------------------

    lr = LinearRegression()
    lr.fit(X_train, y_train)

    lr_pred = lr.predict(X_test)

    lr_rmse = np.sqrt(mean_squared_error(y_test, lr_pred))

    # -------------------
    # Random Forest
    # -------------------

    rf = RandomForestRegressor(n_estimators=100)

    rf.fit(X_train, y_train)

    rf_pred = rf.predict(X_test)

    rf_rmse = np.sqrt(mean_squared_error(y_test, rf_pred))

    # -------------------
    # XGBoost
    # -------------------

    xgb = XGBRegressor(n_estimators=100)

    xgb.fit(X_train, y_train)

    xgb_pred = xgb.predict(X_test)

    xgb_rmse = np.sqrt(mean_squared_error(y_test, xgb_pred))

    models = {

        "LinearRegression": (lr, lr_rmse),
        "RandomForest": (rf, rf_rmse),
        "XGBoost": (xgb, xgb_rmse)

    }

    best_model_name = min(models, key=lambda k: models[k][1])

    best_model = models[best_model_name][0]

    latest_features = X.iloc[-1].values.reshape(1, -1)

    predicted_price = best_model.predict(latest_features)[0]

    return best_model_name, predicted_price, models


# -----------------------------
# PREDICTION API
# -----------------------------

@app.get("/predict")
def predict(symbol: str):

    try:

        ticker = yf.Ticker(symbol)

        df = ticker.history(period="2y")

        if df.empty:

            raise HTTPException(status_code=404, detail="Stock not found")

        current_price = float(df["Close"].iloc[-1])

        model_name, predicted_price, models = train_models(df)

        risk_score = calculate_risk(df)

        sentiment_score = sentiment_analysis()

        rec = recommendation(current_price, predicted_price)

        forecasts = future_predictions(predicted_price)

        return {

            "symbol": symbol.upper(),

            "current_price": round(current_price, 2),

            "predicted_price": round(predicted_price, 2),

            "best_model": model_name,

            "model_errors": {

                "LinearRegression_RMSE": round(models["LinearRegression"][1], 2),
                "RandomForest_RMSE": round(models["RandomForest"][1], 2),
                "XGBoost_RMSE": round(models["XGBoost"][1], 2)

            },

            "future_predictions": forecasts,

            "risk_score": risk_score,

            "sentiment_score": sentiment_score,

            "recommendation": rec

        }

    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))