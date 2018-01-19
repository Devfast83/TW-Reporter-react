'use strict'
import React from 'react'
import PrintIcon from '../../../static/asset/print.svg'
import styled from 'styled-components'
import { screen } from '../../themes/screen'

const PrintBt = styled.button`
  border: none;
  background: none;
  margin-right: 15px;
  cursor: pointer;
  outline: none;
  padding: 0;
  img {
    width: 100%;
    height: auto;
  }

  ${screen.mobile`
    display: none;
  `}
`


class PrintButton extends React.PureComponent {
  _print() {
    window.print()
  }

  render() {
    return (
      <PrintBt onClick={this._print}>
        <PrintIcon />
      </PrintBt>
    )
  }
}

export default PrintButton
