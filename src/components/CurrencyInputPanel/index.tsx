import React, { useState, useCallback,useEffect } from 'react'
import { ethers } from "ethers";
import { BigNumber } from '@ethersproject/bignumber'
import { useTokenContract } from 'hooks/useContract'
import { Currency } from 'pancakes-sdk'
import { Button, Text } from 'cofetch-uikit'
import styled from 'styled-components'
import { darken } from 'polished'
import useI18n from 'hooks/useI18n'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import { RowBetween } from '../Row'
import { Input as NumericalInput } from '../NumericalInput'

import { useActiveWeb3React } from '../../hooks'
import { ClaimableAddress } from '../../constants/address/address';

const InputRow = styled.div<{ selected: boolean }>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`

const LabelRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.colors.textSubtle)};
  }
`

const InputPanel = styled.div<{ hideInput?: boolean }>`
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 1;
`
const Container = styled.div<{ hideInput: boolean }>`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.input};
  box-shadow: ${({ theme }) => theme.shadows.inset};

`


interface CurrencyInputPanelProps {

  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  onMaxPool?:(balance: string)=> void
  showMaxButton: boolean
  label?: string
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  hideInput?: boolean
  isDeposit?:boolean
  otherCurrency?: Currency | null
  id: string
  showCommonBases?: boolean
}
export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  onMaxPool,
  showMaxButton,
  label,
  onCurrencySelect,
  currency,
  disableCurrencySelect = false,
  isDeposit=true,
  hideBalance = false,
  hideInput = false,
  otherCurrency,
  id,
  showCommonBases,
}: CurrencyInputPanelProps) {
  const { account } = useActiveWeb3React()
  const stakePoolAddress=ClaimableAddress
  const tokenContract = useTokenContract(stakePoolAddress)
  const [modalOpen, setModalOpen] = useState(false)
  const [poolBalance,setPoolBalance]=useState('')
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const TranslateString = useI18n()
  const translatedLabel = label || TranslateString(132, 'Input')
  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  useEffect(() => {
      async function getPoolBalance(){
      if(account && tokenContract)
      {
        const amount = await tokenContract.balanceOf(account)
        const stringAmount=(BigNumber.from(amount._hex).toString())
        const displayAmount=ethers.utils.formatEther(stringAmount)
        setPoolBalance(parseFloat(displayAmount).toFixed(4))
      }
      }
      getPoolBalance();
}, [account,tokenContract,selectedCurrencyBalance]);
  return (
    <InputPanel id={id}>
      <Container hideInput={hideInput}>
        {!hideInput && (
          <LabelRow>
            <RowBetween>
              <Text fontSize="14px">{translatedLabel}</Text>
              {account && (
                isDeposit?
                <Text onClick={onMax} fontSize="14px" style={{ display: 'inline', cursor: 'pointer' }}>
                  {!hideBalance && !!currency && selectedCurrencyBalance
                    ? `Deposit Balance: ${selectedCurrencyBalance?.toSignificant(6)}`
                    : ' -'}
                </Text>
                : <Text onClick={onMax} fontSize="14px" style={{ display: 'inline', cursor: 'pointer' }}>
                {!hideBalance
                  ? `LP Token Balance: ${poolBalance}`
                  : ' -'}
              </Text>
              )}
            </RowBetween>
          </LabelRow>
        )}
        <InputRow style={hideInput ? {padding: '0', borderRadius: '8px' } : {}} selected={disableCurrencySelect}>
          {!hideInput && (
            <>
              <NumericalInput
                className="token-amount-input"
                value={value}
                onUserInput={(val) => {
                  onUserInput(val)
                }}
              />
              {account && showMaxButton && isDeposit?(
                <Button onClick={onMax} scale="sm" variant="text">
                  MAX
                </Button>
              ):
              onMaxPool?<Button onClick={()=>onMaxPool(poolBalance)} scale="sm" variant="text">
              MAX
            </Button>:null}
            </>
          )}

        </InputRow>
      </Container>
      {!disableCurrencySelect && onCurrencySelect && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
        />
      )}
    </InputPanel>
  )
}
