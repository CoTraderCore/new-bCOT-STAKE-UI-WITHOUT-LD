import { createReducer } from '@reduxjs/toolkit'
import { Field, selectCurrency, setEarnedRewards, setIsClaimable, setPoolAmount, setRecipient, switchCurrencies, typeInput ,typeInput2, typeInputClaimable,typeInputNonClaimable} from './actions'

export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
  readonly typedValue2: string
  readonly typedValueClaimable: string
  readonly typedValueNonClaimable: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined
  }
  readonly [Field.INPUT2]: {
    readonly currencyId: string | undefined
  }
  readonly [Field.INPUT_CLAIMABLE]: {
    readonly currencyId: string | undefined
  }
  readonly [Field.INPUT_NONCLAIMABLE]: {
    readonly currencyId: string | undefined
  }
  readonly [Field.OUTPUT]: {
    readonly currencyId: string | undefined
  }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
  readonly earnedRewards: string | null
  readonly poolAmount: string | null
  readonly isClaimable: string | null
}

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  typedValue2:'',
  typedValueClaimable:'',
  typedValueNonClaimable:'',
  [Field.INPUT]: {
    currencyId: '',
  },
  [Field.INPUT2]: {
    currencyId: '',
  },
  [Field.INPUT_CLAIMABLE]: {
    currencyId: '',
  },
  [Field.INPUT_NONCLAIMABLE]: {
    currencyId: '',
  },
  [Field.OUTPUT]: {
    currencyId: '',
  },
  recipient: null,
  earnedRewards:null,
  poolAmount:null,
  isClaimable:'true'
}

export default createReducer<SwapState>(initialState, (builder) =>
  builder
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (currencyId === state[otherField].currencyId) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { currencyId },
          [otherField]: { currencyId: state[field].currencyId },
        }
      }
      // the normal case
      return {
        ...state,
        [field]: { currencyId },
      }
    })
    .addCase(switchCurrencies, (state) => {
      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue,
      }
    })
    .addCase(typeInput2, (state, { payload: { field, typedValue2 } }) => {
      return {
        ...state,
        independentField: field,
        typedValue2,
      }
    })
    .addCase(typeInputClaimable, (state, { payload: { field, typedValueClaimable } }) => {
      return {
        ...state,
        independentField: field,
        typedValueClaimable,
      }
    })
    .addCase(typeInputNonClaimable, (state, { payload: { field, typedValueNonClaimable } }) => {
      return {
        ...state,
        independentField: field,
        typedValueNonClaimable,
      }
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
    .addCase(setEarnedRewards, (state, { payload: { earnedRewards } }) => {
      state.earnedRewards = earnedRewards
    })

    .addCase(setPoolAmount, (state, { payload: { poolAmount } }) => {
      state.poolAmount = poolAmount
    })

    .addCase(setIsClaimable, (state, { payload: { isClaimable } }) => {
      state.isClaimable = isClaimable
    }) 
)
