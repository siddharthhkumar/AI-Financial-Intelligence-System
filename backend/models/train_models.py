"""
train_models.py
---------------
Train and evaluate regression models for next-day stock price prediction.

Run:
    python train_models.py

Outputs:
    linear.pkl / random_forest.pkl / xgboost.pkl
"""

import os
import numpy as np
import joblib

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

from utils.feature_engineering import fetch_stock_data, add_technical_indicators, prepare_dataset

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SYMBOL      = "AAPL"
TEST_SIZE   = 0.20
RANDOM_STATE = 42
MODEL_DIR   = os.path.dirname(os.path.abspath(__file__))   # same folder as this script


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def evaluate(name: str, model, X_test, y_test) -> None:
    preds = model.predict(X_test)
    mae   = mean_absolute_error(y_test, preds)
    rmse  = np.sqrt(mean_squared_error(y_test, preds))
    r2    = r2_score(y_test, preds)
    print(f"  {name:<22}  MAE={mae:.4f}  RMSE={rmse:.4f}  R²={r2:.4f}")


def save(name: str, model, filename: str) -> None:
    path = os.path.join(MODEL_DIR, filename)
    joblib.dump(model, path)
    print(f"  Saved {name:<22} → {path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # --- Data ---
    print(f"Fetching {SYMBOL} data...")
    df = fetch_stock_data(SYMBOL)
    df = add_technical_indicators(df)
    X, y = prepare_dataset(df)
    print(f"Dataset ready: {X.shape[0]} samples, {X.shape[1]} features\n")

    # --- Split (chronological — no shuffle) ---
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, shuffle=False
    )

    # --- Models ---
    models = [
        ("LinearRegression",  LinearRegression(),                               "linear.pkl"),
        ("RandomForest",      RandomForestRegressor(n_estimators=200,
                                                    random_state=RANDOM_STATE,
                                                    n_jobs=-1),                 "random_forest.pkl"),
        ("XGBoost",           XGBRegressor(n_estimators=200,
                                           learning_rate=0.05,
                                           max_depth=6,
                                           random_state=RANDOM_STATE,
                                           verbosity=0),                        "xgboost.pkl"),
    ]

    # --- Train, evaluate, save ---
    print("Results")
    print("-" * 62)
    trained = []
    for name, model, filename in models:
        model.fit(X_train, y_train)
        evaluate(name, model, X_test, y_test)
        trained.append((name, model, filename))

    print("\nSaving models...")
    for name, model, filename in trained:
        save(name, model, filename)

    print("\nDone.")


if __name__ == "__main__":
    main()