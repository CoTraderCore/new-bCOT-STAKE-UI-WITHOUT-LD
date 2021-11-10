import { Token } from 'pancakes-sdk'
import React, { useCallback, useMemo, useState } from 'react'
import {
  CardBody,
  // ButtonMenu,
  // ButtonMenuItem
} from 'cofetch-uikit'
import CardNav from 'components/CardNav'
import Row from 'components/Row'
import AdvancedSwapDetailsDropdown from 'components/swap/AdvancedSwapDetailsDropdown'
import { Wrapper } from 'components/swap/styleds'
import TokenWarningModal from 'components/TokenWarningModal'
import SyrupWarningModal from 'components/SyrupWarningModal'

import ConnectWalletButton from 'components/ConnectWalletButton'
import { useCurrency } from 'hooks/Tokens'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { Field } from 'state/swap/actions'
import { useActiveWeb3React } from 'hooks'
import { useDefaultsFromURLSearch, useDerivedSwapInfo, useSwapState } from 'state/swap/hooks'
import useI18n from 'hooks/useI18n'
import PageHeader from 'components/PageHeader'
import Claimable from '../Claimable'
// import NonClaimable from '../Non-Claimable'
import AppBody from '../AppBody'

import '../../App.css'

const Withdraw = () => {
  // const [index, setIndex] = useState(0)
  // const handleClick = (newIndex) => setIndex(newIndex)
  const loadedUrlParams = useDefaultsFromURLSearch()
  const TranslateString = useI18n()

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const [isSyrup, setIsSyrup] = useState<boolean>(false)
  const [syrupTransactionType, setSyrupTransactionType] = useState<string>('')
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

  // swap state
  const { typedValue } = useSwapState()
  const { v2Trade,currencies,} = useDerivedSwapInfo()
  const { wrapType} = useWrapCallback(
    currencies[Field.INPUT],
    currencies[Field.OUTPUT],
    typedValue
  )
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade
  const { account } = useActiveWeb3React()




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
      <CardNav activeIndex={1} />
      <AppBody>
        <Wrapper id="withdraw-page">
          <PageHeader
            title={TranslateString(8, 'Withdraw')}
          />

          {account?
          <>
          <Row className="row">
          {
           /*
           <div className="button-menu">
             <ButtonMenu activeIndex={index} onItemClick={(i) => handleClick(i)} scale="sm" variant="subtle">
               <ButtonMenuItem id="claimable-nav-link">Claimable</ButtonMenuItem>
               <ButtonMenuItem id="non-claimable-nav-link">Non Claimable</ButtonMenuItem>
             </ButtonMenu>
           </div>
          */
          }

          </Row>
          {
            /*
             <CardBody>{index === 0 ? <Claimable /> : <NonClaimable />}</CardBody>
            */
          }

          <Claimable />
          </>:<CardBody><ConnectWalletButton width="100%" /></CardBody>
      }
        </Wrapper>
      </AppBody>
      <AdvancedSwapDetailsDropdown trade={trade} />
    </>
  )
}

export default Withdraw
