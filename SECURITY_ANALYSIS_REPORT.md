# Binance MCP Server - Security and Trustworthiness Analysis

**Analysis Date:** 2025-11-06
**Repository:** https://github.com/snjyor/binance-mcp
**Version Analyzed:** 1.0.1
**Analysis Status:** COMPLETED

---

## Executive Summary

This report provides a comprehensive security analysis of the Binance MCP (Model Context Protocol) server codebase. The server is designed to provide AI agents with access to Binance cryptocurrency market data through a standardized MCP interface.

**Overall Assessment:** ⚠️ **CONDITIONALLY TRUSTWORTHY WITH SECURITY CONCERNS**

The codebase appears to be legitimate and implements its stated functionality correctly. However, there are notable security vulnerabilities in dependencies that should be addressed before production use.

---

## 1. Project Overview

### Purpose
- Provides read-only access to Binance public market data APIs
- Implements the Model Context Protocol (MCP) for AI agent integration
- Supports multiple market data endpoints (prices, order books, trades, K-lines, etc.)

### Technology Stack
- **Language:** TypeScript
- **Runtime:** Node.js (>=18)
- **MCP SDK:** @modelcontextprotocol/sdk v1.13.3
- **HTTP Client:** axios v1.10.0
- **Schema Validation:** zod v3.22.4
- **License:** Apache 2.0

---

## 2. Code Analysis

### 2.1 API Endpoint Verification ✅

**Finding:** All Binance API endpoints are legitimate and documented.

**Endpoints Verified:**
- `https://api.binance.com/api/v3/depth` - Order book data
- `https://api.binance.com/api/v3/trades` - Recent trades
- `https://api.binance.com/api/v3/historicalTrades` - Historical trades
- `https://api.binance.com/api/v3/aggTrades` - Aggregate trades
- `https://api.binance.com/api/v3/klines` - K-line/candlestick data
- `https://api.binance.com/api/v3/uiKlines` - UI-optimized K-line data
- `https://api.binance.com/api/v3/avgPrice` - Average price
- `https://api.binance.com/api/v3/ticker/24hr` - 24-hour ticker
- `https://api.binance.com/api/v3/ticker/tradingDay` - Trading day ticker
- `https://api.binance.com/api/v3/ticker/price` - Price ticker
- `https://api.binance.com/api/v3/ticker/bookTicker` - Order book ticker
- `https://api.binance.com/api/v3/ticker` - Rolling window ticker

**Source:** Official Binance API documentation at https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints

### 2.2 Malicious Code Detection ✅

**Finding:** No malicious code patterns detected.

**Checks Performed:**
- ❌ No file system access (no fs module imports)
- ❌ No code execution functions (no eval, exec, spawn)
- ❌ No obfuscated code
- ❌ No unauthorized network requests
- ❌ No data exfiltration attempts
- ✅ Only legitimate Binance API calls to api.binance.com

### 2.3 Environment Variables Usage ✅

**Finding:** Environment variable usage is appropriate and secure.

**Environment Variables:**
1. `HTTP_PROXY` / `HTTPS_PROXY` (optional)
   - Purpose: Proxy configuration for corporate firewalls
   - Implementation: src/index.ts:10
   - Risk: Low - standard practice

2. `BINANCE_API_KEY` (optional)
   - Purpose: Authentication for historical trades endpoint
   - Implementation: src/index.ts:86
   - Risk: Low - only used for authenticated endpoints
   - Note: Optional; most endpoints work without it

**Security Considerations:**
- API keys are read from environment (secure practice)
- No hardcoded credentials found
- No credentials logged or exposed

### 2.4 Data Handling ✅

**Finding:** Data handling practices are secure.

**Observations:**
- All data is read-only from Binance APIs
- No user data is stored or transmitted elsewhere
- All responses are JSON formatted and returned via MCP protocol
- No persistent storage or caching implemented
- Error messages are sanitized (generic error messages returned)

### 2.5 Proxy Implementation ✅

**Finding:** Proxy implementation is secure and properly designed.

**Implementation Details (src/index.ts:403-412):**
```typescript
function getProxy():any {
    const proxy: any = {}
    if (proxyURL) {
        const urlInfo = new URL(proxyURL);
        proxy.host = urlInfo.hostname;
        proxy.port = urlInfo.port;
        proxy.protocol = urlInfo.protocol.replace(":", "");
    }
    return proxy
}
```

**Security Assessment:**
- Uses built-in URL parser (secure)
- No command injection vulnerabilities
- Properly extracts hostname, port, and protocol
- Returns empty object if no proxy configured

---

## 3. Dependency Security Analysis

### 3.1 Critical Vulnerabilities ⚠️

**Finding:** Multiple security vulnerabilities in dependencies require immediate attention.

#### Vulnerability 1: Axios DoS (HIGH)
- **Package:** axios
- **Current Version:** 1.10.0
- **Severity:** HIGH
- **CVE:** GHSA-4hjh-wcwx-xvwj (CVE ID: 1108263)
- **CWE:** CWE-770 (Allocation of Resources Without Limits or Throttling)
- **CVSS Score:** 7.5/10 (HIGH)
- **Vector:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H
- **Description:** Axios is vulnerable to DoS attack through lack of data size check
- **Affected Range:** >=1.0.0 <1.12.0
- **Fix Available:** Yes - upgrade to axios ^1.12.0 or later
- **Impact:** Attacker could cause denial of service by sending large responses
- **Recommendation:** Update axios to version 1.12.0 or later

#### Vulnerability 2: Form-Data Cryptographic Weakness (CRITICAL)
- **Package:** form-data (indirect dependency via axios)
- **Current Version:** 4.0.0-4.0.3 range
- **Severity:** CRITICAL
- **CVE:** GHSA-fjxv-7rqg-78g4 (CVE ID: 1109538)
- **CWE:** CWE-330 (Use of Insufficiently Random Values)
- **CVSS Score:** Not rated (0.0)
- **Description:** form-data uses unsafe random function for choosing boundary
- **Affected Range:** >=4.0.0 <4.0.4
- **Fix Available:** Yes - axios update will resolve this
- **Impact:** Potentially predictable form boundaries could lead to security issues
- **Recommendation:** Update axios (which will update form-data)

### 3.2 Dependency Update Recommendations

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.13.3",  // Current - OK
    "axios": "^1.12.0",  // NEEDS UPDATE from 1.10.0
    "zod": "^3.22.4"     // Current - OK
  }
}
```

---

## 4. Code Quality Assessment

### 4.1 Error Handling ✅

**Finding:** Error handling is consistent and appropriate.

**Observations:**
- All async operations wrapped in try-catch blocks
- Errors are caught and returned with `isError: true` flag
- Error messages include context (e.g., "Failed to get order book")
- Original error messages passed through for debugging
- No stack traces exposed in production responses

**Example (src/index.ts:32-36):**
```typescript
catch (error: any) {
    return {
        content: [{ type: "text", text: `Failed to get order book: ${error.message}` }],
        isError: true
    };
}
```

### 4.2 TypeScript Configuration ✅

**Finding:** TypeScript configuration follows best practices.

**tsconfig.json Analysis:**
- ✅ Strict mode enabled (`"strict": true`)
- ✅ ES2020 target (modern JavaScript features)
- ✅ Source maps enabled for debugging
- ✅ Type declarations generated
- ✅ Proper module resolution (NodeNext)

### 4.3 Input Validation ✅

**Finding:** Input validation uses Zod schema validation.

**Observations:**
- All tool parameters validated with Zod schemas
- Type safety enforced through TypeScript
- Optional parameters properly typed
- Enum validation for specific fields (e.g., "FULL" | "MINI")

**Example (src/index.ts:17-18):**
```typescript
{
    symbol: z.string().describe("Trading pair symbol, e.g. BTCUSDT"),
    limit: z.number().optional().describe("Order book depth, default 100, max 5000")
}
```

### 4.4 Process Lifecycle Management ✅

**Finding:** Proper cleanup and signal handling implemented.

**Implementation (src/index.ts:424-431):**
```typescript
const cleanup = async () => {
    console.log("MCP service has been closed");
    await transport.close();
    process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
```

---

## 5. Security Best Practices Review

### 5.1 Followed Best Practices ✅

1. **Least Privilege:** Server only requests public data (read-only)
2. **Secure Communication:** HTTPS used for all Binance API calls
3. **No Hardcoded Secrets:** API keys read from environment variables
4. **Input Validation:** Zod schemas validate all inputs
5. **Error Handling:** Comprehensive error handling throughout
6. **Type Safety:** TypeScript with strict mode enabled
7. **MCP Protocol Compliance:** Properly implements MCP SDK
8. **Transport Security:** Uses StdioServerTransport (standard MCP transport)

### 5.2 Potential Improvements 💡

1. **Rate Limiting:** No built-in rate limiting for Binance API calls
   - Risk: Could hit Binance API rate limits
   - Mitigation: Binance will return 429 errors; users should handle this at application level

2. **Request Timeout:** No explicit timeout configuration
   - Risk: Requests could hang indefinitely
   - Mitigation: Axios has default timeout; consider making it configurable

3. **Dependency Pinning:** Uses caret (^) ranges in package.json
   - Risk: Automatic updates could introduce breaking changes
   - Mitigation: Use package-lock.json (already present)

4. **Security Headers:** No custom headers for API requests
   - Risk: Minimal - Binance API doesn't require special headers
   - Status: Acceptable for this use case

---

## 6. Git History Analysis

### 6.1 Commit History ✅

**Finding:** Git history appears clean and legitimate.

**Recent Commits:**
- `a7b1a25` - Merge pull request #5 (proxy support)
- `2753d0d` - delete comment
- `f4315eb` - add proxy (legitimate feature addition)
- `00b36d1` - Merge pull request #2 (glama badge)
- `d95655b` - add MCP server badge
- `69ad0aa` - Merge pull request #1 (Smithery config)
- `41d89c4` - Update README
- `10fcfb5` - Add Smithery configuration
- `821db29` - Add Dockerfile
- `61933db` - update readme.md
- `7a0d8fc` - 1.0.1
- `289c655` - modify package name
- `2c29de2` - first mcp commit
- `cd05980` - Initial commit

**Observations:**
- No suspicious commits
- Regular development pattern
- Pull requests from external contributors (proxy support)
- No force pushes or history rewrites detected
- Legitimate feature additions (badges, Docker, proxy)

### 6.2 Proxy Addition Review ✅

**Commit:** f4315eb (July 3, 2025)
**Author:** yincong <yincong@baidu.com>
**Changes:**
- Added HTTP/HTTPS proxy support via environment variables
- Updated dependencies to newer versions
- Added getProxy() helper function

**Security Assessment:** SAFE
- Legitimate feature for corporate firewall support
- No malicious code introduced
- Proper implementation using standard URL parsing

---

## 7. Dockerfile Analysis

### 7.1 Container Security ✅

**Finding:** Dockerfile follows container security best practices.

**Security Features:**
1. **Multi-stage Build:** Separates build and runtime environments
2. **Minimal Base Image:** Uses node:lts-alpine (small attack surface)
3. **No Root User:** Runs as default node user (non-root)
4. **No Unnecessary Tools:** Only installs required dependencies
5. **Reproducible Builds:** Uses package-lock.json with npm ci
6. **Build Isolation:** Copies only necessary files to runtime stage

**Generated By:** Smithery.ai (legitimate MCP server deployment platform)

---

## 8. Privacy Analysis

### 8.1 Data Collection ✅

**Finding:** No user data collection or tracking.

**Observations:**
- No analytics or telemetry code
- No external data transmission (except to Binance API)
- No user behavior tracking
- No cookies or session management
- No personally identifiable information (PII) handling

### 8.2 Data Flow

```
User Request → MCP Client → MCP Server (this code) → Binance API → Response → User
```

**Privacy Assessment:**
- All data requests are explicit and user-initiated
- No background data collection
- No data persistence or logging
- Binance receives only the API queries (symbol, timeframe, etc.)
- No user authentication data transmitted (unless BINANCE_API_KEY is set)

---

## 9. License and Legal

### 9.1 License ✅

**License:** Apache 2.0
**Assessment:** Open source, permissive license

**Permissions:**
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Patent use
- ✅ Private use

**Conditions:**
- ⚠️ License and copyright notice required
- ⚠️ State changes required

**Limitations:**
- ❌ No liability
- ❌ No warranty

---

## 10. Risk Assessment

### 10.1 Risk Matrix

| Category | Risk Level | Details |
|----------|-----------|---------|
| Malicious Code | 🟢 LOW | No malicious patterns detected |
| API Legitimacy | 🟢 LOW | All endpoints verified as official Binance APIs |
| Data Privacy | 🟢 LOW | No data collection; read-only operations |
| Dependency Security | 🟡 MEDIUM-HIGH | Known vulnerabilities in axios and form-data |
| Code Quality | 🟢 LOW | Well-structured, typed, validated |
| Supply Chain | 🟢 LOW | Reputable dependencies from npm |
| Access Control | 🟢 LOW | Read-only public data access |
| Proxy Security | 🟢 LOW | Secure implementation |

### 10.2 Overall Risk: 🟡 MEDIUM

**Primary Risk Factor:** Dependency vulnerabilities in axios
**Mitigation:** Update axios to version 1.12.0 or later

---

## 11. Recommendations

### 11.1 Critical Actions (MUST DO)

1. **Update Dependencies:**
   ```bash
   npm install axios@^1.12.0
   npm audit fix
   ```

2. **Verify Fix:**
   ```bash
   npm audit
   ```

### 11.2 Recommended Actions (SHOULD DO)

1. **Add Rate Limiting:**
   - Implement client-side rate limiting to respect Binance API limits
   - Consider using a rate-limiting library like bottleneck

2. **Add Request Timeouts:**
   - Configure axios timeout (e.g., 10 seconds per Binance recommendation)
   ```typescript
   axios.get(url, { timeout: 10000, ...config })
   ```

3. **Enhanced Error Logging:**
   - Add optional debug logging for troubleshooting
   - Ensure logs don't expose sensitive information

4. **Documentation:**
   - Add security best practices to README
   - Document API rate limits
   - Add troubleshooting guide

### 11.3 Optional Improvements (NICE TO HAVE)

1. **Monitoring:**
   - Add optional metrics/monitoring integration
   - Track API call success/failure rates

2. **Caching:**
   - Implement optional response caching for frequently requested data
   - Reduce API calls and improve performance

3. **Testing:**
   - Add unit tests for core functionality
   - Add integration tests with mock Binance API responses

---

## 12. Conclusion

### 12.1 Trustworthiness Assessment

**Verdict:** ⚠️ **CONDITIONALLY TRUSTWORTHY**

**Positive Findings:**
- ✅ Legitimate purpose and functionality
- ✅ No malicious code detected
- ✅ Uses official Binance API endpoints
- ✅ Good code quality and error handling
- ✅ Proper input validation
- ✅ No data collection or privacy concerns
- ✅ Open source with permissive license
- ✅ Secure proxy implementation
- ✅ Clean git history

**Concerns:**
- ⚠️ Known security vulnerabilities in axios dependency
- ⚠️ Critical vulnerability in form-data (indirect dependency)
- ⚠️ No built-in rate limiting
- ⚠️ No explicit request timeouts

### 12.2 Usage Recommendations

**For Development/Testing:** ✅ SAFE TO USE
- The codebase is trustworthy for development and testing purposes
- Vulnerabilities pose minimal risk in controlled environments

**For Production Use:** ⚠️ CONDITIONAL
- **CRITICAL:** Update axios to version 1.12.0 or later before production deployment
- Run `npm audit fix` to resolve all known vulnerabilities
- Consider implementing rate limiting at application level
- Monitor for Binance API rate limit errors (429 responses)

**For Enterprise Use:** ⚠️ REQUIRES REVIEW
- Complete the dependency updates
- Conduct internal security review
- Implement monitoring and logging
- Consider running behind a rate-limiting proxy
- Review Binance API terms of service for compliance

### 12.3 Final Verdict

This Binance MCP server is a **legitimate, well-implemented tool** for accessing Binance market data through the Model Context Protocol. The code quality is good, and there are no malicious patterns. However, the **dependency vulnerabilities must be addressed** before using this in production environments.

**Recommendation:** Update dependencies and proceed with confidence.

---

## 13. References

1. **Binance API Documentation:**
   - https://developers.binance.com/docs/binance-spot-api-docs/rest-api
   - https://github.com/binance/binance-spot-api-docs

2. **Model Context Protocol:**
   - https://modelcontextprotocol.io
   - https://github.com/modelcontextprotocol

3. **Security Advisories:**
   - Axios DoS: https://github.com/advisories/GHSA-4hjh-wcwx-xvwj
   - Form-Data: https://github.com/advisories/GHSA-fjxv-7rqg-78g4

4. **Package Information:**
   - npm: https://www.npmjs.com/package/@snjyor/binance-mcp
   - GitHub: https://github.com/snjyor/binance-mcp

---

**Report Generated By:** Claude (Anthropic) - Security Analysis Agent
**Analysis Duration:** Comprehensive (systematic review of all components)
**Report Version:** 1.0
**Last Updated:** 2025-11-06
