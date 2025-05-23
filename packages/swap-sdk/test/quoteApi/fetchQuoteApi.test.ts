import type { PoolType, TradeType } from '../../src'
import { BuiltInChainId, DEFAULT_FETCH_BEST_TRADE_OPTS } from '../../src'
import { fetchQuoteApi } from '../../src/quoteApi/fetchQuoteApi'

const mockedFetch = jest.fn()
global.fetch = mockedFetch

describe('fetchQuoteApi', () => {
  beforeEach(() => {
    mockedFetch.mockClear()
  })
  const MOCK_ARGS = {
    ...DEFAULT_FETCH_BEST_TRADE_OPTS,
    chainId: BuiltInChainId.CRONOS_TESTNET,
    inputTokenAddress: '0x6a3173618859C7cd40fAF6921b5E9eB6A76f1fD4',
    outputTokenAddress: '0x321106e51b78e0e9cebcfec63c5250f0f3ccb82b',
    amount: '10',
    quoteApiClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  }

  describe('happy path', () => {
    it('should fetch quote with correct parameters', async () => {
      const mockResponse = {
        code: 0,
        data: {
          route: [],
          inputAmount: '10',
          outputAmount: '9.5',
        },
        message: 'success',
      }

      mockedFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      })

      const result = await fetchQuoteApi(MOCK_ARGS)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          },
          body: JSON.stringify({
            chain: 'CRONOS',
            currencyIn: MOCK_ARGS.inputTokenAddress,
            currencyOut: MOCK_ARGS.outputTokenAddress,
            amount: MOCK_ARGS.amount,
            tradeType: 'EXACT_INPUT',
            maxHops: MOCK_ARGS.maxHops,
            maxSplits: MOCK_ARGS.maxSplits,
            poolTypes: MOCK_ARGS.poolTypes,
          }),
        }),
      )

      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('error cases', () => {
    it('should throw NetworkUnsupportedError for unsupported chain', async () => {
      const args = {
        ...MOCK_ARGS,
        chainId: 999999,
      }

      await expect(fetchQuoteApi(args)).rejects.toThrow(
        'No quote api endpoint for chain 999999, you may need to specify via quoteApiEndpoint option or SWAP_SDK_QUOTE_API_ENDPOINT_999999 environment variable',
      )
    })

    it('should throw TradeTypeUnsupportedError for unsupported trade type', async () => {
      const args = {
        ...MOCK_ARGS,
        tradeType: 'INVALID_TYPE' as TradeType,
      }

      await expect(fetchQuoteApi(args)).rejects.toThrow('Not supported tradeType: INVALID_TYPE')
    })

    it('should throw PoolUnsupportedError for unsupported pool type', async () => {
      const args = {
        ...MOCK_ARGS,
        poolTypes: ['INVALID_POOL' as PoolType],
      }

      await expect(fetchQuoteApi(args)).rejects.toThrow('Not supported pool: INVALID_POOL')
    })

    it('should throw ServerChainUnsupportedError when server returns code 40000', async () => {
      mockedFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            code: 40000,
            message: 'Chain not supported',
          }),
      })

      await expect(fetchQuoteApi(MOCK_ARGS)).rejects.toThrow('Server does not support chainId: 338')
    })

    it('should throw ServerPoolUnsupportedError when server returns code 40001', async () => {
      mockedFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            code: 40001,
            message: 'Pool not supported',
          }),
      })

      await expect(fetchQuoteApi(MOCK_ARGS)).rejects.toThrow('Server does not support pool types: V2')
    })

    it('should throw ServerTokenUnsupportedError when server returns code 40002', async () => {
      mockedFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            code: 40002,
            message: 'Token not supported',
          }),
      })

      await expect(fetchQuoteApi(MOCK_ARGS)).rejects.toThrow(
        'Server does not support token, input: 0x6a3173618859C7cd40fAF6921b5E9eB6A76f1fD4, output: 0x321106e51b78e0e9cebcfec63c5250f0f3ccb82b',
      )
    })

    it('should throw ServerInsufficientLiquidityError when server returns code 40003', async () => {
      mockedFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            code: 40003,
            message: 'Insufficient liquidity',
          }),
      })

      await expect(fetchQuoteApi(MOCK_ARGS)).rejects.toThrow('Server: Inefficient liquidity')
    })

    it('should throw ServerOtherError for unknown error codes', async () => {
      const errorMessage = 'Unknown server error'
      mockedFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            code: 50000,
            message: errorMessage,
          }),
      })

      await expect(fetchQuoteApi(MOCK_ARGS)).rejects.toThrow(errorMessage)
    })
  })
})
