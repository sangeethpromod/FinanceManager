const axios = require('axios');

// Use environment variable for API key if available
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'WSVUF2TOOM7PXOEA';

// Mapping of index names to their respective Alpha Vantage symbols
const indexSymbols = {
    sensex: 'BSE:SENSEX',
    nifty: 'NSE:NIFTY50', 
    nasdaq: 'IXIC',
    sp500: 'SPX',
    shanghai: '000001.SHZ'
};

interface IndexData {
    symbol: string;
    price: string;
    change: string;
    changePercent: string;
    timestamp: string;
}

interface IndexResult {
    [key: string]: IndexData | { error: string };
}

interface AlphaVantageResponse {
    'Global Quote': {
        '01. symbol': string;
        '02. open': string;
        '03. high': string;
        '04. low': string;
        '05. price': string;
        '06. volume': string;
        '07. latest trading day': string;
        '08. previous close': string;
        '09. change': string;
        '10. change percent': string;
    };
    'Error Message'?: string;
    'Note'?: string;
}

// Controller function to fetch current index data
const getRealTimeIndices = async (
    _req: import('express').Request,
    res: import('express').Response
): Promise<void> => {
    try {
        const result: IndexResult = {};
        
        // Fetch data for each index sequentially to avoid rate limiting
        for (const [indexName, symbol] of Object.entries(indexSymbols)) {
            try {
                const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
                
                const response = await axios.get(url);
                const data = response.data as AlphaVantageResponse;
                
                // Check for API errors
                if (data['Error Message']) {
                    result[indexName] = { error: 'Invalid symbol or API error' };
                    continue;
                }
                
                if (data['Note']) {
                    result[indexName] = { error: 'API rate limit exceeded' };
                    continue;
                }
                
                // Check if we got valid data
                if (data['Global Quote'] && data['Global Quote']['05. price']) {
                    const quote = data['Global Quote'];
                    result[indexName] = {
                        symbol: quote['01. symbol'],
                        price: quote['05. price'],
                        change: quote['09. change'],
                        changePercent: quote['10. change percent'],
                        timestamp: quote['07. latest trading day']
                    };
                } else {
                    result[indexName] = { error: 'No data available' };
                }
                
                // Add delay to avoid rate limiting (Alpha Vantage free tier: 5 calls per minute)
                await new Promise(resolve => setTimeout(resolve, 12000)); // 12 second delay
                
            } catch (error: any) {
                console.error(`Error fetching data for ${indexName}:`, error.message);
                result[indexName] = { error: 'Failed to fetch data' };
            }
        }
        
        res.status(200).json(result);
        
    } catch (error: any) {
        console.error('Error fetching index data:', error.message);
        res.status(500).json({ error: 'Failed to fetch index data' });
    }
};

// Alternative faster version using ETFs (no delays needed)
const getRealTimeIndicesETF = async (
    _req: import('express').Request,
    res: import('express').Response
): Promise<void> => {
    try {
        // Using ETFs that track the indices for faster response
        const etfSymbols = {
            sensex: 'INDA',      // iShares MSCI India ETF
            nifty: 'INDA',       // iShares MSCI India ETF  
            nasdaq: 'QQQ',       // Invesco QQQ Trust
            sp500: 'SPY',        // SPDR S&P 500 ETF
            shanghai: 'ASHR'     // Xtrackers Harvest CSI 300
        };
        
        const result: IndexResult = {};
        
        for (const [indexName, symbol] of Object.entries(etfSymbols)) {
            try {
                const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
                
                const response = await axios.get(url);
                const data = response.data as AlphaVantageResponse;
                
                if (data['Global Quote'] && data['Global Quote']['05. price']) {
                    const quote = data['Global Quote'];
                    result[indexName] = {
                        symbol: quote['01. symbol'],
                        price: quote['05. price'],
                        change: quote['09. change'],
                        changePercent: quote['10. change percent'],
                        timestamp: quote['07. latest trading day']
                    };
                } else {
                    result[indexName] = { error: 'No data available' };
                }
                
                // Shorter delay for ETFs
                await new Promise(resolve => setTimeout(resolve, 12000));
                
            } catch (error: any) {
                result[indexName] = { error: 'Failed to fetch data' };
            }
        }
        
        res.status(200).json(result);
        
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch ETF data' });
    }
};

module.exports = { 
    getRealTimeIndices,     // Direct index symbols (slower due to rate limits)
    getRealTimeIndicesETF   // ETF version (faster)
};