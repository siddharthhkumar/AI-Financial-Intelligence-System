import axios from 'axios';

const BASE = "https://ai-financial-intelligence-system-1.onrender.com";
const http = axios.create({ baseURL: BASE, timeout: 20000 });

export interface StockPrice {
  symbol: string;
  current_price: number;
  timestamp: string;
}

export interface HistoricalPoint {
  date: string;
  close: number;
}

export interface Prediction {
  symbol: string;
  current_price: number;
  predicted_price: number;
  best_model: string;
  model_errors: {
    LinearRegression_RMSE: number;
    RandomForest_RMSE: number;
    XGBoost_RMSE: number;
  };
  future_predictions: {
    '3_months': number;
    '6_months': number;
    '9_months': number;
  };
  risk_score: number;
  sentiment_score: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
}

export const fetchPrediction    = (sym: string) => http.get<Prediction>(`/predict?symbol=${sym}`).then(r => r.data);
export const fetchHistory       = (sym: string) => http.get<HistoricalPoint[]>(`/history?symbol=${sym}`).then(r => r.data);
export const fetchPrice         = (sym: string) => http.get<StockPrice>(`/price?symbol=${sym}`).then(r => r.data);