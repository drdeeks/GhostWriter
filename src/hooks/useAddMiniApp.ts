import { useFarcaster } from '@/components/FarcasterWrapper'
import { sdk } from '@farcaster/miniapp-sdk'
import { useCallback } from 'react'

export const useAddMiniApp = () => {
  const { isMiniApp } = useFarcaster()

  const addMiniApp = useCallback(async () => {
    // Only attempt to add mini app if we're actually in Farcaster context
    if (!isMiniApp) {
      console.log('Not in Farcaster mini app context - skipping addMiniApp')
      return
    }

    try {
      await sdk.actions.addMiniApp()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('RejectedByUser')) {
          const rejectedError = new Error('RejectedByUser')
          rejectedError.cause = error
          throw rejectedError
        }
        if (error.message.includes('InvalidDomainManifestJson')) {
          const manifestError = new Error('InvalidDomainManifestJson')
          manifestError.cause = error
          throw manifestError
        }
      }
      throw error
    }
  }, [isMiniApp])

  return { addMiniApp }
}
