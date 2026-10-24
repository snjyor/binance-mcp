# Binance Cryptocurrency MCP
[![LightNow capabilities](https://lightnow.ai/badge/io.github.snjyor/binance-mcp)](https://lightnow.ai/servers/io.github.snjyor/binance-mcp)

<a href="https://glama.ai/mcp/servers/@snjyor/binance-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@snjyor/binance-mcp/badge" alt="Binance Cryptocurrency MCP server" />
</a>

[Model Context Protocol](https://modelcontextprotocol.io) service for accessing Binance cryptocurrency market data.

## Overview

This MCP service allows AI agents (such as Claude, Cursor, Windsurf, etc.) to execute Binance API calls and obtain real-time data from the cryptocurrency market, including prices, candlestick charts, order books, and more.

**Purpose**
You can directly ask AI about the latest cryptocurrency prices, trading volume, price trends, and other information, without having to check the Binance website or use other tools.

**Available Information**

Through this MCP service, you can obtain the following information:

- Current price information - Get real-time prices for specified cryptocurrencies
- Order book data - View buy and sell order depth
- Candlestick chart data - Obtain candlestick data for different time periods
- 24-hour price changes - View price changes within 24 hours
- Trading history - View recent trading records
- Price statistics - Get price statistics for various time windows

## Available Tools

| Tool                       | Description                                    |
| -------------------------- | ----------------------------------------------- |
| `get_price`                | Get current price for specified cryptocurrency  |
| `get_order_book`           | Get order book data                            |
| `get_recent_trades`        | Get list of recent trades                      |
| `get_historical_trades`    | Get historical trade data                      |
| `get_aggregate_trades`     | Get list of aggregate trades                   |
| `get_klines`               | Get K-line/candlestick data                    |
| `get_ui_klines`            | Get UI-optimized K-line data                   |
| `get_avg_price`            | Get current average price                      |
| `get_24hr_ticker`          | Get 24-hour price change statistics            |
| `get_trading_day_ticker`   | Get trading day market information             |
| `get_book_ticker`          | Get order book ticker                          |
| `get_rolling_window_ticker` | Get rolling window price change statistics    |

## Using in Cursor

**Global Installation**

Use npx to run the MCP service:

```bash
npx -y @snjyor/binance-mcp@latest
```

In Cursor IDE:

1. Go to `Cursor Settings` > `MCP`
2. Click `+ Add New MCP Service`
3. Fill in the form:
   - Name: `binance`
   - Type: `command`
   - Command: `npx -y @snjyor/binance-mcp@latest`

**Project Installation**

Add a `.cursor/mcp.json` file to your project:

```json
{
  "mcpServers": {
    "binance": {
      "command": "npx",
      "args": [
        "-y",
        "@snjyor/binance-mcp@latest"
      ]
    }
  }
}
```

**Usage**

After configuration, the Binance market data tools will be automatically available to Cursor AI agents:

1. The tool will be listed under `Available Tools` in the MCP settings
2. Agents will automatically use it when relevant
3. You can explicitly ask agents to use these tools

## Using in Other MCP-Compatible Environments

```json
{
  "mcpServers": {
    "binance": {
      "command": "npx",
      "args": [
        "-y",
        "@snjyor/binance-mcp@latest"
      ]
    }
  }
}
```

## Usage Examples

Here are some usage examples:

**Query Bitcoin Price**
```
Please tell me the current price of Bitcoin
```

**View Ethereum's 24-hour Price Movement**
```
How has Ethereum's price changed in the past 24 hours?
```

**Get BNB's K-line Data**
```
Show me the daily K-line data for BNB over the last 5 days
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Local testing
npm run start
```

## Debugging Server

To debug your server, you can use [MCP Inspector](https://github.com/modelcontextprotocol/inspector).

First build the server

```
npm run build
```

Run the following command in terminal:

```
# Start MCP Inspector and server
npx @modelcontextprotocol/inspector node dist/index.js
```

## License

[Apache 2.0](LICENSE) 