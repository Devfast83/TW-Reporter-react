/*eslint no-unused-vars:0*/
'use strict'
import _ from 'lodash'
import { CHARACTERS_LIMIT, LOAD_MORE_ARTICLES, ITEMS_LIMIT } from '../../constants/index'
import { shortenString } from '../../lib/string-processor'
import classNames from 'classnames'
import commonStyles from '../article/Common.scss'
import LazyLoad from 'react-lazy-load'
import React, { Component } from 'react'
import styles from './BottomRelateds.scss'

export class BottomRelateds extends Component {
  constructor(props) {
    const itemWidth = 420
    let relateds = _.get(props, 'relateds', [])
    let count = relateds.length || 0

    super(props)

    this.totalWidth = Math.max(count * itemWidth, 0)
    this.state = {
      width: 'auto',
      isCollapse: false
    }
  }

  _setHtml(html) {
    return { __html: html }
  }

  _handleResize() {
    let totalWidth = this.totalWidth || 0
    let wrapperWidth = this.state.width
    let winWidth = window.innerWidth

    if (winWidth > 767 && winWidth < totalWidth && wrapperWidth === 'auto') {
      this.setState({ width: totalWidth })
    } else if (wrapperWidth !== 'auto') {
      this.setState({ width: 'auto' })
    }
  }

  componentDidMount() {
    this._handleResize()
    window.addEventListener('resize', this._handleResize.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._handleResize.bind(this))
  }

  render() {
    const { relateds } = this.props
    const { isCollapse } = this.state

    if (!_.get(relateds, '0')) {
      return null
    }

    const relatedRows = _.map(relateds, (related, index) => {
      let imageUrl = _.get(related, 'heroImage.image.resizedTargets.mobile.url', '/asset/review.png')
      const description = _.get(related, 'ogDescription', '')
      let itemDisplayClass = (index >= ITEMS_LIMIT.ARTICLE_RELATED && !isCollapse)? commonStyles['hide'] : null

      return (  
        <li className={classNames(styles.relatedItem, itemDisplayClass)} key={'related-' + (index++)}>
          <a className={styles.relatedAnchor} href={'/a/' + related.slug}>
            <div className={styles.relatedImgWrapper}>
              <div className={styles.relatedImg}>
                <LazyLoad>
                  <img className={styles['crop']} src={imageUrl} />
                </LazyLoad>
              </div>
            </div>
            <div className={styles.relatedContent}>
              <p className={styles.relatedTitle} dangerouslySetInnerHTML={ this._setHtml(related.title) }></p>
              <p className={styles.relatedDescription}>{shortenString(description, CHARACTERS_LIMIT.BOTTOM_RELATED_DESC)}</p>
            </div>
          </a>
        </li>
      )
    })

    const loadMoreBtn = isCollapse ? null : <div className={classNames(styles.loadMore, 'text-center')} onClick={()=>{this.setState({ isCollapse: true })}}>
            {LOAD_MORE_ARTICLES}
          </div>

    return (
      <div className={classNames(commonStyles['component'], 'center-block')}>
        <div className={classNames(styles.bottomRelatedsWrapper, commonStyles['inner-block'])}>
          <ul>
            { relatedRows }
          </ul>
          {loadMoreBtn}
        </div>
      </div>
    )
  }
}
