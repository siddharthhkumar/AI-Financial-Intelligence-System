from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def get_sentiment_score(symbol: str) -> float:
    """
    Temporary sentiment logic.
    Later we will replace this with NewsAPI integration.
    """

    sample_text = f"{symbol} stock is performing strongly in the market."

    scores = analyzer.polarity_scores(sample_text)

    return scores["compound"]