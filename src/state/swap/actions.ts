import { createAction } from '@reduxjs/toolkit'

export enum Field {
  INPUT = 'INPUT',
  INPUT_CLAIMABLE = 'INPUT_CLAIMABLE',
  INPUT_NONCLAIMABLE = 'INPUT_NONCLAIMABLE',
  OUTPUT='OUTPUT',
  INPUT2 = 'INPUT2',
}

export const selectCurrency = createAction<{ field: Field; currencyId: string }>('swap/selectCurrency')
export const switchCurrencies = createAction<void>('swap/switchCurrencies')
export const typeInput = createAction<{ field: Field; typedValue: string }>('swap/typeInput')
export const typeInput2 = createAction<{ field: Field; typedValue2: string }>('swap/typeInput2')
export const typeInputClaimable = createAction<{ field: Field; typedValueClaimable: string }>('swap/typeInputClaimable')
export const typeInputNonClaimable = createAction<{ field: Field; typedValueNonClaimable: string }>('swap/typeInputNonClaimable')
export const replaceSwapState = createAction<{
  field: Field
  typedValue: string
  inputCurrencyId?: string
  outputCurrencyId?: string
  recipient: string | null
  earnedRewards: string | null
  poolAmount: string | null
}>('swap/replaceSwapState')
export const setRecipient = createAction<{ recipient: string | null }>('swap/setRecipient')
export const setEarnedRewards = createAction<{ earnedRewards: string | null }>('swap/setEarnedRewards')
export const setPoolAmount = createAction<{ poolAmount: string | null }>('swap/setPoolAmount')
export const setIsClaimable = createAction<{ isClaimable: string | null }>('swap/setIsClaimable')
