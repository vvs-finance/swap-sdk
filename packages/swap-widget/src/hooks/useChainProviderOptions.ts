import { useMemo } from 'react'
import { CHAIN_EXPLORER_BASE_URL, CHAIN_PROVIDER_OPTIONS } from '@config/chains'
import { useWidgetWallet } from '@states/wallet'

const useChainProviderOptions = () => {
  const { supportedChainId } = useWidgetWallet()

  const chainProviderOptions = useMemo(() => {
    return CHAIN_PROVIDER_OPTIONS[supportedChainId]
  }, [supportedChainId])

  const chainExplorerBaseUrl = useMemo(() => {
    return CHAIN_EXPLORER_BASE_URL[supportedChainId]
  }, [supportedChainId])

  return { chainProviderOptions, chainExplorerBaseUrl }
}

export default useChainProviderOptions
