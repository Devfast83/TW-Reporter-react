/*eslint no-unused-vars:0*/
'use strict'
import _ from 'lodash'
import BlockAlignmentWrapper from './BlockAlignmentWrapper'
import classNames from 'classnames'
import FitwidthMixin from '../../lib/FitwidthMixin'
import { getScreenType } from '../../lib/screen-type'
import MediaQuery from 'react-responsive'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import screenSize from '../../constants/screen-size'
import styles from './ImageDiff.scss'

class ImageDiff extends FitwidthMixin(Component) {
  constructor(props) {
    super(props)
    this.state = {
      isMounted: false,
      screenType: 'MOBILE',
      width: 200,
      placeholderOpacity: 0,
      imageOpacity: 0,
      percentage: 50
    }
    this.fitToParentWidth = this.fitToParentWidth.bind(this)
  }

  componentDidMount() {
    this.setState({
      isMounted: true,
      screenType: getScreenType(window.innerWidth)
    })
    if (super.componentDidMount) super.componentDidMount()
  }

  _renderFigure(imageObj) {
    if (imageObj) {
      return (
        <figure>
          <img src={ imageObj.url } className={classNames('img-responsive', 'center-block')} style={{ paddingBottom: '1.5rem' }}
          />
          { imageObj.description ? <figcaption className="image-caption" style={{ paddingTop: '1rem' }}>{ imageObj.description }</figcaption> : null}
        </figure>
      )
    }
    return null
  }

  render() {
    let imageByDevice = _.get(this.props, [ 'content', 0 ], {})
    let { mobile, tablet, desktop, original } = imageByDevice
    let { isMounted, screenType, width, percentage } = this.state
    const height = this._getHeight(width, original, width, width)
    let outerStyle = {
      width: width,
      minHeight: height
    }
    let imgStyle = {
      ...outerStyle,
      height: height
    }

    return (
      <div ref="imgDiff" className={styles.diffContainer} style={outerStyle}>
        <figure className={styles.wrapper}>
          <div className={styles.imgContainer}>
            <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/4273/photoshop-face-after.jpg" style={imgStyle}/>
          </div>
          <div className={styles.overlayContainer} style={{ width: percentage+'%' }}>
            <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/4273/photoshop-face-before.jpg" style={imgStyle}/>
          </div>
          <img src="/asset/slider-button.svg"
            className={styles.sliderButton} style={{ left: percentage+'%' }} />
          <input type="range" min="0" max="100" className={styles.rangeInput} style={imgStyle}
            value={percentage} onChange={ (event)=>{
              this.setState({ percentage: parseInt(event.target.value) })} } />
        </figure>
      </div>
    )
  }
}

const AlignedImageDiff = BlockAlignmentWrapper(ImageDiff)

export { AlignedImageDiff, ImageDiff }
