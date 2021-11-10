import React, { useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { ButtonMenu, ButtonMenuItem } from 'cofetch-uikit'
import useI18n from 'hooks/useI18n'

const StyledNav = styled.div`
  margin-bottom: 40px;
`

function Nav({ activeIndex = 0 }: { activeIndex?: number }) {
  const [index, setIndex] = useState(activeIndex)
  const handleClick = (newIndex) => {
    setIndex(newIndex)
  }
  const TranslateString = useI18n()

  return (
    <StyledNav>
      <ButtonMenu activeIndex={index} onItemClick={(i) => handleClick(i)} scale="sm" variant="subtle">
        <ButtonMenuItem to="/deposit" as={Link}>
          {TranslateString(1142, 'Deposit')}
        </ButtonMenuItem>
        <ButtonMenuItem to="/withdraw" as={Link}>
          {TranslateString(1142, 'Withdraw')}
        </ButtonMenuItem>
        <ButtonMenuItem to="/stats" as={Link}>
          {TranslateString(1142, 'Stats')}
        </ButtonMenuItem>
      </ButtonMenu>
    </StyledNav>
  )
}

export default Nav
