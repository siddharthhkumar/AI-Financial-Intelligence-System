import yfinance as yf

def get_stock_history(symbol: str):

    stock = yf.Ticker(symbol)

    df = stock.history(period="6mo")

    df = df.reset_index()

    return {
        "dates": df["Date"].astype(str).tolist(),
        "prices": df["Close"].tolist()
    }