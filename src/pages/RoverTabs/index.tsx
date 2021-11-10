import { ButtonMenu, ButtonMenuItem, CardBody } from "cofetch-uikit"
import Row from "components/Row"
import BNB_ROVER from "pages/BNB_ROVER"
import React, { useState } from "react"


const RoverTabs=()=>{
    const [index, setIndex] = useState(0)
    const handleClick = (newIndex) => setIndex(newIndex)
    
    return (
        <>
        <Row className="row">
            <div className="button-menu">
              <ButtonMenu activeIndex={index} onItemClick={(i) => handleClick(i)} scale="sm" variant="subtle">
                <ButtonMenuItem id="bnb-rover-nav-link">BNB+Rover</ButtonMenuItem>
                <ButtonMenuItem id="rover-nav-link">All Rover</ButtonMenuItem>
              </ButtonMenu>
            </div>
          </Row>
          <CardBody>{index === 0 ? <BNB_ROVER /> : null}</CardBody>
          </>
    )
}

export default RoverTabs