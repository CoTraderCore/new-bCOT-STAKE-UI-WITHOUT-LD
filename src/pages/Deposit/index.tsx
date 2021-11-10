import { CurrencyAmount, JSBI, Token, TokenAmount } from 'pancakes-sdk'
import { ethers } from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CardBody, Button, Text } from 'cofetch-uikit'
import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import RoverInputPanel from 'components/RoverInputPanel'
import CardNav from 'components/CardNav'
import { AutoRow } from 'components/Row'
import AdvancedSwapDetailsDropdown from 'components/swap/AdvancedSwapDetailsDropdown'
import { BottomGrouping, Wrapper } from 'components/swap/styleds'
import TokenWarningModal from 'components/TokenWarningModal'
import SyrupWarningModal from 'components/SyrupWarningModal'
import { MouseoverTooltip } from 'components/Tooltip'


import { parseEther } from '@ethersproject/units'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { Field } from 'state/swap/actions'

import {
  tryParseAmount,
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState,
} from 'state/swap/hooks'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import Loader from 'components/Loader'
import useI18n from 'hooks/useI18n'
import PageHeader from 'components/PageHeader'

import Web3 from 'web3'
import ConnectWalletButton from 'components/ConnectWalletButton'
import AppBody from '../AppBody'
import {
  useDepositerContract,
  useDexFormulaContract,
  useRouterContract,
  useStakeContract,
  useTokenContract,
} from '../../hooks/useContract'
import {
  ClaimableAddress,
  AddressDepositor,
  DEXFormulaAddress,
  RouterAddress,
  UNDERLYING_TOKEN,
  BUSDAddress
} from '../../constants/address/address'

import '../../App.css'
import { UNDERLYING_NAME } from '../../constants'
import pair from '../../config/config'

const Deposit = () => {
  let web3 = new Web3()
  if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider)
  } else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:3000'))
  }

  const inputCurrency = useCurrency('BNB')
  const addTransaction = useTransactionAdder()
  const { account } = useActiveWeb3React()
  const contract = useDepositerContract(AddressDepositor)
  const DexFormula = useDexFormulaContract(DEXFormulaAddress)
  const Router = useRouterContract(RouterAddress)
  const loadedUrlParams = useDefaultsFromURLSearch()
  const TranslateString = useI18n()
  const [roverBalance, setRoverBalance] = useState('')
  const [CotToBnb, setCotToBnb] = useState('')
  const [CotToUsd, setCotToUsd] = useState('')
  const [useRover, setUserRover] = useState(false)
  const roverTokenContract = useTokenContract(UNDERLYING_TOKEN)
  const ClaimableStakeContract = useStakeContract(ClaimableAddress)


  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const [isSyrup, setIsSyrup] = useState<boolean>(false)
  const [syrupTransactionType, setSyrupTransactionType] = useState<string>('')
  const [apr, setApr] = useState<string>('66857247')
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  const handleConfirmSyrupWarning = useCallback(() => {
    setIsSyrup(false)
    setSyrupTransactionType('')
  }, [])

  const { independentField, typedValue, typedValue2, poolAmount: calculatedPoolAmount } = useSwapState()
  const { v2Trade, currencyBalances, parsedAmount, currencies, inputError, inputErrorDeposit } = useDerivedSwapInfo()
  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(
    currencies[Field.INPUT],
    currencies[Field.OUTPUT],
    typedValue
  )
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount,
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
      }

  const {
    onCurrencySelection,
    onUserInput,
    onUserInput2,
    onChangeEarnedRewards,
    onChangePoolAmount,
  } = useSwapActionHandlers()

  const isValid = !inputError && !inputErrorDeposit

  // GET APR
  useEffect(() => {
    async function getAPR(){
      if (roverTokenContract && ClaimableStakeContract){
        // Total pools deposited
        const totalSupply = web3.utils.fromWei(String(await ClaimableStakeContract.totalSupply()))
        // Total rewards
        const totalRewards = web3.utils.fromWei(String(await roverTokenContract.balanceOf(ClaimableAddress)))
        // APR = 100% * ( rewards / deposits) * (365 / 30)
        const _apr = 100 * (Number(totalRewards) / Number(totalSupply)) * (365 / 30)
        const resApr = Number((Number(_apr) / 1000)).toFixed(4)
        setApr(resApr)
      }
    }
    getAPR()
  }, [apr,
      account,
      roverTokenContract,
      ClaimableStakeContract,
      web3.utils])

  // GET UPDATE UNDERLYING Amount
  useEffect(() => {
    async function getRoverBalance() {
      if (account && roverTokenContract) {
        const amount = await roverTokenContract.balanceOf(account)
        const stringAmount = BigNumber.from(amount._hex).toString()
        const displayAmount = ethers.utils.formatEther(stringAmount)
        setRoverBalance(parseFloat(displayAmount).toFixed(4))
      }
    }

    getRoverBalance()

  }, [account,
      roverTokenContract,
      ClaimableStakeContract,
      calculatedPoolAmount,
      onChangeEarnedRewards,
      web3.utils]
  )

  // get BNB to UNDERLYING
  useEffect(() => {
    async function getCotToBnbPrice(){
      if(Router && DexFormula){
        const addressTemp = await Router.WETH()

        // get COT to BNB
        const _CotToBnb = await Router.getAmountsOut("1000000000000000000",[UNDERLYING_TOKEN, addressTemp])
        // get COT to USD
        const _CotToUsd = await Router.getAmountsOut("1000000000000000000",[UNDERLYING_TOKEN, addressTemp, BUSDAddress])

        // set ratios
        setCotToBnb(web3.utils.fromWei(String(_CotToBnb[1])))
        setCotToUsd(web3.utils.fromWei(String(_CotToUsd[2])))
      }
    }
    getCotToBnbPrice()
  }, [DexFormula, Router, web3.utils])


  const handleTypeInput = useCallback(
    async (value: string) => {
      if (DexFormula && Router) {
        const addressTemp = await Router.WETH()
        if (tryParseAmount(value, inputCurrency ?? undefined)) {
          onUserInput(Field.INPUT, value)
          const BNBAmountHalf = BigNumber.from(web3.utils.toWei(value)).div(2).toString()
          const UnderlyingAmount = await DexFormula.routerRatio(addressTemp, UNDERLYING_TOKEN, web3.utils.toWei(value))
          const UnderlyingAmountForRewards = await DexFormula.routerRatio(addressTemp, UNDERLYING_TOKEN, BNBAmountHalf)
          if (roverBalance !== '' && roverBalance !== '0') {
            onUserInput2(Field.INPUT2, parseFloat(web3.utils.fromWei(UnderlyingAmount.toString())).toFixed(6))

            const poolAmount = await DexFormula.calculatePoolToMint(
              web3.utils.toWei(UnderlyingAmount.toString()),
              web3.utils.toWei(value),
              pair
            )

            const earned = await (ClaimableStakeContract)?.earnedByShare(
              poolAmount
            )
            onChangePoolAmount(poolAmount)

            onChangeEarnedRewards(parseFloat(web3.utils.fromWei(earned.toString())).toFixed(6))
          } else {
            // we don't have rover
            const poolAmount = await DexFormula.calculatePoolToMint(UnderlyingAmountForRewards, BNBAmountHalf, pair)

            const earned = await (ClaimableStakeContract)?.earnedByShare(
              poolAmount
            )

            onChangeEarnedRewards(parseFloat(web3.utils.fromWei(earned.toString())).toFixed(6))
          }
        } else {
          onUserInput(Field.INPUT, value)
          onUserInput2(Field.INPUT2, '0')
        }
      }
    },
    [
      onChangePoolAmount,
      onChangeEarnedRewards,
      onUserInput,
      onUserInput2,
      DexFormula,
      Router,
      web3.utils,
      inputCurrency,
      ClaimableStakeContract,
      roverBalance,
    ]
  )

  const handleTypeInput2 = useCallback(
    async (value: string) => {
      if (DexFormula && Router) {
        // const display = web3.utils.toWei(value)
        const addressTemp = await Router.WETH()
        if (tryParseAmount(value, inputCurrency ?? undefined)) {
          onUserInput2(Field.INPUT2, value)
          const bnbAmount = await DexFormula.routerRatio(UNDERLYING_TOKEN, addressTemp, web3.utils.toWei(value))
          onUserInput(Field.INPUT, parseFloat(web3.utils.fromWei(bnbAmount.toString())).toFixed(6))
          const poolAmount = await DexFormula.calculatePoolToMint(
            web3.utils.toWei(value),
            web3.utils.toWei(bnbAmount.toString()),
            pair
          )

          const earned = await (ClaimableStakeContract)?.earnedByShare(
            poolAmount
          )

          onChangePoolAmount(poolAmount)
          onChangeEarnedRewards(parseFloat(web3.utils.fromWei(earned.toString())).toFixed(6))
        } else {
          onUserInput2(Field.INPUT2, value)
          onUserInput(Field.INPUT, '0')
        }
      }
    },
    [
      onChangePoolAmount,
      onChangeEarnedRewards,
      onUserInput,
      onUserInput2,
      DexFormula,
      Router,
      web3.utils,
      inputCurrency,
      ClaimableStakeContract,
    ]
  )

  const route = trade?.route
  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )
  const noRoute = !route

  // check whether the user has approved the router on the input token
  const amount = parseFloat(typedValue2) > 0 ? web3.utils.toWei(String(typedValue2)) : '0'

  const [approval, approveCallback] = useApproveCallback(
    new TokenAmount(
      new Token(Number(process.env.REACT_APP_CHAIN_ID), UNDERLYING_TOKEN, 0), amount
    ),
    AddressDepositor
  )

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const maxAmountInput2: string = roverBalance

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))


  // This will check to see if the user has selected Syrup to either buy or sell.
  // If so, they will be alerted with a warning message.
  const checkForSyrup = useCallback(
    (selected: string, purchaseType: string) => {
      if (selected === 'syrup') {
        setIsSyrup(true)
        setSyrupTransactionType(purchaseType)
      }
    },
    [setIsSyrup, setSyrupTransactionType]
  )

  const handleInputSelect = useCallback(
    (inputCurrencySelect) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrencySelect)
      if (inputCurrencySelect.symbol.toLowerCase() === 'syrup') {
        checkForSyrup(inputCurrencySelect.symbol.toLowerCase(), 'Selling')
      }
    },
    [onCurrencySelection, setApprovalSubmitted, checkForSyrup]
  )

  const handleMaxInput = useCallback(() => {
    if (maxAmountInput) {
      handleTypeInput(maxAmountInput.toExact())
      // onUserInput(Field.INPUT, maxAmountInput.toExact())
    }
  }, [maxAmountInput, handleTypeInput])

  const handleMaxInput2 = useCallback(() => {
    if (maxAmountInput2) {
      handleTypeInput2(maxAmountInput2)
      // onUserInput2(Field.INPUT2, maxAmountInput2)
    }
  }, [maxAmountInput2, handleTypeInput2])

  const handleDeposit = async () => {
    if (account) {
      if (contract != null) {
        try {
          const inputAmount = parseEther(typedValue)
          const txReceipt = await contract.deposit({ value: inputAmount._hex })
          addTransaction(txReceipt)
        } catch (error) {
          console.error('Could not deposit', error)
        }
      }
    } else {
      alert('Please connect to web3')
    }
  }

  const handleDepositWithRover = async () => {
    if(approval === ApprovalState.PENDING){
      alert(`Please wait for ${UNDERLYING_NAME} approve`)
      return
    }

    if(approval === ApprovalState.NOT_APPROVED){
      alert(`Please approve ${UNDERLYING_NAME}`)
      return
    }

    if (account) {
      if (contract != null) {
        try {
          const bnbAmount = parseEther(typedValue)
          const roverAmount = parseEther(typedValue2)
          const txReceipt = await contract.depositETHAndERC20(roverAmount._hex, { value: bnbAmount._hex })
          addTransaction(txReceipt)
        } catch (error) {
          console.error('Could not deposit', error)
        }
      }
    } else {
      alert('Please connect to web3')
    }
  }
  return (
    <>
      <TokenWarningModal
        isOpen={urlLoadedTokens.length > 0 && !dismissTokenWarning}
        tokens={urlLoadedTokens}
        onConfirm={handleConfirmTokenWarning}
      />
      <SyrupWarningModal
        isOpen={isSyrup}
        transactionType={syrupTransactionType}
        onConfirm={handleConfirmSyrupWarning}
      />
      <CardNav activeIndex={0} />
      <AppBody>
        <Wrapper id="swap-page">
          <PageHeader
            title={TranslateString(8, `Deposit to Earn APY:`)}
            description={TranslateString(1192, `${Number(Number(Number(apr) * 2.718).toFixed(2)).toLocaleString()}  %`)}
          />
          {account?
          <CardBody>
            <AutoColumn gap="md">

              <CurrencyInputPanel
                label={
                  independentField === Field.OUTPUT && !showWrap && trade
                    ? TranslateString(194, 'BNB Amount (estimated)')
                    : TranslateString(76, 'BNB Amount')
                }
                value={typedValue}
                isDeposit
                showMaxButton
                currency={currencies[Field.INPUT]}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                onCurrencySelect={handleInputSelect}
                otherCurrency={currencies[Field.OUTPUT]}
                id="swap-currency-input"
              />

              <label htmlFor="understand-checkbox" style={{ cursor: 'pointer', userSelect: 'none' }}>
              <input
                id="use-underlying-checkbox"
                type="checkbox"
                className="use-underlying-checkbox"
                checked={useRover}
                onChange={() => setUserRover(!useRover)}
              />
              <Text as="span">Use {UNDERLYING_NAME}</Text>
              </label>

              {useRover
                ?
                (
                <RoverInputPanel
                  label={TranslateString(76, `${UNDERLYING_NAME} Amount`)}
                  value={typedValue2}
                  roverBalance={roverBalance}
                  showMaxButton
                  currency={currencies[Field.INPUT2]}
                  onUserInput={handleTypeInput2}
                  onMax={handleMaxInput2}
                  id="swap-currency-input"
                />
              )
              :
              null
            }

            </AutoColumn>
            <BottomGrouping>
              {!account ? (
                <ConnectWalletButton width="100%" />
              ) : // <Button disabled={Boolean(wrapInputError)}>Hello</Button>
              showWrap ? (
                <Button disabled={Boolean(wrapInputError)} onClick={onWrap} width="100%">
                  {wrapInputError ??
                    (wrapType === WrapType.WRAP ? 'Wrap' : wrapType === WrapType.UNWRAP ? 'Unwrap' : null)}
                </Button>
              ) : noRoute && userHasSpecifiedInputOutput ? (
                <GreyCard style={{ textAlign: 'center' }}>
                  <Text mb="4px">{TranslateString(1194, 'Insufficient liquidity for this trade.')}</Text>
                </GreyCard>
              ) : useRover && showApproveFlow ? (
                <Button
                  onClick={approveCallback}
                  disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                  style={{ width: '100%' }}
                  variant={approval === ApprovalState.APPROVED ? 'success' : 'primary'}
                >
                  {approval === ApprovalState.PENDING ? (
                    <AutoRow gap="6px" justify="center">
                      Approving <Loader stroke="white" />
                    </AutoRow>
                  ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                    'Approved'
                  ) : (
                    `Approve ${UNDERLYING_NAME}`
                  )}
                </Button>
              ) : (
                null
              )}
              <br/>
              <br/>
              <div>
                <Button
                  onClick={() =>
                    useRover ? handleDepositWithRover() : handleDeposit()
                  }
                  // onClick={() => handleDeposit()}
                  id="deposit-button"
                  disabled={!isValid}
                  variant={!isValid ? 'danger' : 'primary'}
                  width="100%"
                >
                  {inputError || inputErrorDeposit || 'Deposit'}
                </Button>
              </div>
            </BottomGrouping>


          </CardBody>:<CardBody><ConnectWalletButton width="100%" /></CardBody>
       }
       {
         CotToBnb
         ?
         (
           <GreyCard style={{ textAlign: 'center' }}>
             <Text mb="4px">{TranslateString(1194, `1 TEST TOKEN = ${Number(CotToBnb).toFixed(8)} BNB`)}</Text>
           </GreyCard>
         )
         :
         null
       }
       <br/>
       {
         CotToUsd
         ?
         (
           <GreyCard style={{ textAlign: 'center' }}>
             <Text mb="4px">{TranslateString(1194, `1 TEST TOKEN = ${Number(CotToUsd).toFixed(8)} USD`)}</Text>
           </GreyCard>
         )
         :
         null
       }
        </Wrapper>
      </AppBody>
      <MouseoverTooltip text={
        `
        1. Converts BNB to COT from Pancake
        2. Stake COTBNB LP pool COS-v2
        `
      }>
        <Text mb="4px">How this works <strong>?</strong></Text>
      </MouseoverTooltip>
      <AdvancedSwapDetailsDropdown trade={trade} />
    </>
  )
}

export default Deposit
