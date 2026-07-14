#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from "zod";
import axios from "axios";

// Market types
const MarketType = z.enum(["spot", "um", "cm", "option"]);
type MarketType = z.infer<typeof MarketType>;

// Base URLs for different market types
const BASE_URLS: Record<MarketType, string> = {
    spot: "https://api.binance.com",
    um: "https://fapi.binance.com",
    cm: "https://dapi.binance.com",
    option: "https://eapi.binance.com"
};

const proxyURL = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

function getProxy(): any {
    const proxy: any = {};
    if (proxyURL) {
        const urlInfo = new URL(proxyURL);
        proxy.host = urlInfo.hostname;
        proxy.port = urlInfo.port;
        proxy.protocol = urlInfo.protocol.replace(":", "");
    }
    return proxy;
}

function getBaseUrl(marketType?: MarketType): string {
    return BASE_URLS[marketType || "spot"];
}

function registerTools(server: McpServer) {
    // Order Book
    server.tool(
        "get_order_book",
        {
            symbol: z.string().describe("Trading pair symbol, e.g. BTCUSDT"),
            limit: z.number().optional().describe("Order book depth, default 100, max 5000"),
            marketType: MarketType.optional().describe("Market type: 'spot' (default), 'um' (USD-M futures), 'cm' (COIN-M futures), 'option'")
        },
        async (args: { symbol: string; limit?: number; marketType?: MarketType }) => {
            try {
                const baseUrl = getBaseUrl(args.marketType);
                let endpoint = "/api/v3/depth";
                
                if (args.marketType === "um") {
                    endpoint = "/fapi/v1/depth";
                } else if (args.marketType === "cm") {
                    endpoint = "/dapi/v1/depth";
                } else if (args.marketType === "option") {
                    endpoint = "/eapi/v1/depth";
                }

                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    params: {
                        symbol: args.symbol,
                        limit: args.limit
                    },
                    proxy: getProxy(),
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Failed to get order book: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // Recent Trades List
    server.tool(
        "get_recent_trades",
        {
            symbol: z.string().describe("Trading pair symbol, e.g. BTCUSDT"),
            limit: z.number().optional().describe("Number of trades to return, default 500, max 1000"),
            marketType: MarketType.optional().describe("Market type: 'spot' (default), 'um' (USD-M futures), 'cm' (COIN-M futures), 'option'")
        },
        async (args: { symbol: string; limit?: number; marketType?: MarketType }) => {
            try {
                const baseUrl = getBaseUrl(args.marketType);
                let endpoint = "/api/v3/trades";
                
                if (args.marketType === "um") {
                    endpoint = "/fapi/v1/trades";
                } else if (args.marketType === "cm") {
                    endpoint = "/dapi/v1/trades";
                } else if (args.marketType === "option") {
                    endpoint = "/eapi/v1/trades";
                }

                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    params: {
                        symbol: args.symbol,
                        limit: args.limit
                    },
                    proxy: getProxy(),
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Failed to get recent trades: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // Historical Trades Lookup
    server.tool(
        "get_historical_trades",
        {
            symbol: z.string().describe("Trading pair symbol, e.g. BTCUSDT"),
            limit: z.number().optional().describe("Number of trades to return, default 500, max 1000"),
            fromId: z.number().optional().describe("Trade ID to start from, default returns the most recent trades"),
            marketType: MarketType.optional().describe("Market type: 'spot' (default), 'um' (USD-M futures), 'cm' (COIN-M futures)")
        },
        async (args: { symbol: string; limit?: number; fromId?: number; marketType?: MarketType }) => {
            try {
                const baseUrl = getBaseUrl(args.marketType);
                let endpoint = "/api/v3/historicalTrades";
                
                if (args.marketType === "um") {
                    endpoint = "/fapi/v1/historicalTrades";
                } else if (args.marketType === "cm") {
                    endpoint = "/dapi/v1/historicalTrades";
                }
                // Note: Options does not support historicalTrades

                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    params: {
                        symbol: args.symbol,
                        limit: args.limit,
                        fromId: args.fromId
                    },
                    headers: {
                        "X-MBX-APIKEY": process.env.BINANCE_API_KEY || ""
                    },
                    proxy: getProxy(),
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Failed to get historical trades: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // Aggregate Trades List
    server.tool(
        "get_aggregate_trades",
        {
            symbol: z.string().describe("Trading pair symbol, e.g. BTCUSDT"),
            fromId: z.number().optional().describe("Aggregate trade ID to start from"),
            startTime: z.number().optional().describe("Start timestamp (milliseconds)"),
            endTime: z.number().optional().describe("End timestamp (milliseconds)"),
            limit: z.number().optional().describe("Number of trades to return, default 500, max 1000"),
            marketType: MarketType.optional().describe("Market type: 'spot' (default), 'um' (USD-M futures), 'cm' (COIN-M futures), 'option'")
        },
        async (args: { symbol: string; fromId?: number; startTime?: number; endTime?: number; limit?: number; marketType?: MarketType }) => {
            try {
                const baseUrl = getBaseUrl(args.marketType);
                let endpoint = "/api/v3/aggTrades";
                
                if (args.marketType === "um") {
                    endpoint = "/fapi/v1/aggTrades";
                } else if (args.marketType === "cm") {
                    endpoint = "/dapi/v1/aggTrades";
                } else if (args.marketType === "option") {
                    endpoint = "/eapi/v1/aggTrades";
                }

                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    params: {
                        symbol: args.symbol,
                        fromId: args.fromId,
                        startTime: args.startTime,
                        endTime: args.endTime,
                        limit: args.limit
                    },
                    proxy: getProxy(),
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Failed to get aggregate trades: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // K-line/Candlestick Data
    server.tool(
        "get_klines",
        {
            symbol: z.string().describe("Trading pair symbol, e.g. BTCUSDT"),
            interval: z.string().describe("K-line interval, e.g. 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M"),
            startTime: z.number().optional().describe("Start timestamp (milliseconds)"),
            endTime: z.number().optional().describe("End timestamp (milliseconds)"),
            timeZone: z.string().optional().describe("Time zone, default UTC"),
            limit: z.number().optional().describe("Number of K-lines to return, default 500, max 1000"),
            marketType: MarketType.optional().describe("Market type: 'spot' (default), 'um' (USD-M futures), 'cm' (COIN-M futures), 'option'")
        },
        async (args: { symbol: string; interval: string; startTime?: number; endTime?: number; timeZone?: string; limit?: number; marketType?: MarketType }) => {
            try {
                const baseUrl = getBaseUrl(args.marketType);
                let endpoint = "/api/v3/klines";
                
                if (args.marketType === "um") {
                    endpoint = "/fapi/v1/klines";
                } else if (args.marketType === "cm") {
                    endpoint = "/dapi/v1/klines";
                } else if (args.marketType === "option") {
                    endpoint = "/eapi/v1/klines";
                }

                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    params: {
                        symbol: args.symbol,
                        interval: args.interval,
                        startTime: args.startTime,
                        endTime: args.endTime,
                        timeZone: args.timeZone,
                        limit: args.limit
                    },
                    proxy: getProxy(),
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Failed to get K-line data: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // UI K-line Data (Spot and USD-M only)
    server.tool(
        "get_ui_klines",
        {
            symbol: z.string().describe("Trading pair symbol, e.g. BTCUSDT"),
            interval: z.string().describe("K-line interval, e.g. 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M"),
            startTime: z.number().optional().describe("Start timestamp (milliseconds)"),
            endTime: z.number().optional().describe("End timestamp (milliseconds)"),
            timeZone: z.string().optional().describe("Time zone, default UTC"),
            limit: z.number().optional().describe("Number of K-lines to return, default 500, max 1000"),
            marketType: z.enum(["spot", "um"]).optional().describe("Market type: 'spot' (default) or 'um' (USD-M futures)")
        },
        async (args: { symbol: string; interval: string; startTime?: number; endTime?: number; timeZone?: string; limit?: number; marketType?: "spot" | "um" }) => {
            try {
                const baseUrl = getBaseUrl(args.marketType);
                let endpoint = "/api/v3/uiKlines";
                
                if (args.marketType === "um") {
                    endpoint = "/fapi/v1/uiKlines";
                }

                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    params: {
                        symbol: args.symbol,
                        interval: args.interval,
                        startTime: args.startTime,
                        endTime: args.endTime,
                        timeZone: args.timeZone,
                        limit: args.limit
                    },
                    proxy: getProxy(),
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Failed to get UI K-line data: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // Current Average Price (Spot only)
    server.tool(
        "get_avg_price",
        {
            symbol: z.string().describe("Trading pair symbol, e.g. BTCUSDT"),
            marketType: z.enum(["spot"]).optional().describe("Market type: 'spot' (default)")
        },
        async (args: { symbol: string; marketType?: "spot" }) => {
            try {
                const baseUrl = getBaseUrl(args.marketType);
                const response = await axios.get(`${baseUrl}/api/v3/avgPrice`, {
                    params: {
                        symbol: args.symbol
                    },
                    proxy: getProxy(),
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Failed to get average price: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // 24hr Price Change Statistics
    server.tool(
        "get_24hr_ticker",
        {
            symbol: z.string().optional().describe("Trading pair symbol, e.g. BTCUSDT"),
            symbols: z.array(z.string()).optional().describe("Array of multiple trading pair symbols"),
            marketType: MarketType.optional().describe("Market type: 'spot' (default), 'um' (USD-M futures), 'cm' (COIN-M futures), 'option'")
        },
        async (args: { symbol?: string; symbols?: string[]; marketType?: MarketType }) => {
            try {
                const baseUrl = getBaseUrl(args.marketType);
                let endpoint = "/api/v3/ticker/24hr";
                
                if (args.marketType === "um") {
                    endpoint = "/fapi/v1/ticker/24hr";
                } else if (args.marketType === "cm") {
                    endpoint = "/dapi/v1/ticker/24hr";
                } else if (args.marketType === "option") {
                    endpoint = "/eapi/v1/ticker/24hr";
                }

                let params: any = {};
                if (args.symbol) {
                    params = { symbol: args.symbol };
                } else if (args.symbols) {
                    params = { symbols: JSON.stringify(args.symbols) };
                }

                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    params,
                    proxy: getProxy(),
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Failed to get 24hr price statistics: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // Trading Day Ticker (Spot only)
    server.tool(
        "get_trading_day_ticker",
        {
            symbol: z.string().optional().describe("Trading pair symbol, e.g. BTCUSDT"),
            symbols: z.array(z.string()).optional().describe("Array of multiple trading pair symbols"),
            timeZone: z.number().optional().describe("Time zone, default 0"),
            type: z.enum(["FULL", "MINI"]).optional().describe("Return data type, FULL or MINI")
        },
        async (args: { symbol?: string; symbols?: string[]; timeZone?: number; type?: "FULL" | "MINI" }) => {
            try {
                let params: any = {};
                if (args.symbol) {
                    params.symbol = args.symbol;
                } else if (args.symbols) {
                    params.symbols = JSON.stringify(args.symbols);
                }
                if (args.timeZone) params.timeZone = args.timeZone;
                if (args.type) params.type = args.type;

                const response = await axios.get(`${BASE_URLS.spot}/api/v3/ticker/tradingDay`, {
                    params,
                    proxy: getProxy(),
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Failed to get trading day ticker: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // Price Ticker
    server.tool(
        "get_price",
        {
            symbol: z.string().optional().describe("Trading pair symbol, e.g. BTCUSDT"),
            symbols: z.array(z.string()).optional().describe("Array of multiple trading pair symbols"),
            marketType: MarketType.optional().describe("Market type: 'spot' (default), 'um' (USD-M futures), 'cm' (COIN-M futures), 'option'")
        },
        async (args: { symbol?: string; symbols?: string[]; marketType?: MarketType }) => {
            try {
                const baseUrl = getBaseUrl(args.marketType);
                let endpoint = "/api/v3/ticker/price";
                
                if (args.marketType === "um") {
                    endpoint = "/fapi/v1/ticker/price";
                } else if (args.marketType === "cm") {
                    endpoint = "/dapi/v1/ticker/price";
                } else if (args.marketType === "option") {
                    endpoint = "/eapi/v1/ticker/price";
                }

                let params = {};
                if (args.symbol) {
                    params = { symbol: args.symbol };
                } else if (args.symbols) {
                    params = { symbols: JSON.stringify(args.symbols) };
                }

                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    params,
                    proxy: getProxy(),
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Failed to get price ticker: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // Order Book Ticker
    server.tool(
        "get_book_ticker",
        {
            symbol: z.string().optional().describe("Trading pair symbol, e.g. BTCUSDT"),
            symbols: z.array(z.string()).optional().describe("Array of multiple trading pair symbols"),
            marketType: MarketType.optional().describe("Market type: 'spot' (default), 'um' (USD-M futures), 'cm' (COIN-M futures), 'option'")
        },
        async (args: { symbol?: string; symbols?: string[]; marketType?: MarketType }) => {
            try {
                const baseUrl = getBaseUrl(args.marketType);
                let endpoint = "/api/v3/ticker/bookTicker";
                
                if (args.marketType === "um") {
                    endpoint = "/fapi/v1/ticker/bookTicker";
                } else if (args.marketType === "cm") {
                    endpoint = "/dapi/v1/ticker/bookTicker";
                } else if (args.marketType === "option") {
                    endpoint = "/eapi/v1/ticker/bookTicker";
                }

                let params = {};
                if (args.symbol) {
                    params = { symbol: args.symbol };
                } else if (args.symbols) {
                    params = { symbols: JSON.stringify(args.symbols) };
                }

                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    params,
                    proxy: getProxy(),
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Failed to get order book ticker: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // Rolling Window Price Change Statistics
    server.tool(
        "get_rolling_window_ticker",
        {
            symbol: z.string().optional().describe("Trading pair symbol, e.g. BTCUSDT"),
            symbols: z.array(z.string()).optional().describe("Array of multiple trading pair symbols"),
            windowSize: z.string().optional().describe("Window size, e.g. 1m, 4h, 1d"),
            type: z.enum(["FULL", "MINI"]).optional().describe("Return data type, FULL or MINI"),
            marketType: MarketType.optional().describe("Market type: 'spot' (default), 'um' (USD-M futures), 'cm' (COIN-M futures), 'option'")
        },
        async (args: { symbol?: string; symbols?: string[]; windowSize?: string; type?: "FULL" | "MINI"; marketType?: MarketType }) => {
            try {
                const baseUrl = getBaseUrl(args.marketType);
                let endpoint = "/api/v3/ticker";
                
                if (args.marketType === "um") {
                    endpoint = "/fapi/v1/ticker";
                } else if (args.marketType === "cm") {
                    endpoint = "/dapi/v1/ticker";
                } else if (args.marketType === "option") {
                    endpoint = "/eapi/v1/ticker";
                }

                let params: any = {};
                if (args.symbol) {
                    params.symbol = args.symbol;
                } else if (args.symbols) {
                    params.symbols = JSON.stringify(args.symbols);
                }
                if (args.windowSize) params.windowSize = args.windowSize;
                if (args.type) params.type = args.type;

                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    params,
                    proxy: getProxy(),
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Failed to get rolling window price statistics: ${error.message}` }],
                    isError: true
                };
            }
        }
    );
}

async function main() {
    const server = new McpServer({
        name: "binance-mcp",
        version: "1.0.0",
        description: "Binance Cryptocurrency Market Data MCP Service (Spot, USD-M Futures, COIN-M Futures, Options)"
    });

    registerTools(server);
    let transport = new StdioServerTransport();
    await server.connect(transport);
    const cleanup = async () => {
        console.log("MCP service has been closed");
        await transport.close();
        process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    console.log("MCP service has started");
}

function handleError(error: Error) {
    console.error("An error occurred:", error);
    process.exit(1);
}

main().catch(handleError);
