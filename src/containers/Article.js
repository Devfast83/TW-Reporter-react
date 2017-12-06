/* eslint no-console:0 */
'use strict'

import ArticleMeta from '../components/article/article-meta'
import * as ArticleComponents from '../components/article/index'
import DesktopArticleTools from '../components/article/tools/DesktopArticleTools'
import Header from '@twreporter/react-components/lib/header'
import Helmet from 'react-helmet'
import LeadingVideo from '../components/shared/LeadingVideo'
import MobileArticleTools from '../components/article/tools/MobileArticleTools'
import PromotionBanner from '../components/shared/PromotionBanner'
import React, { PureComponent } from 'react'
import ReadingProgress from '../components/article/ReadingProgress'
import SystemError from '../components/SystemError'
import TitleRowUpon from '../components/article/title-row-upon'
import TitleRowAbove from '../components/article/title-row-above'
import backToTopicIcon from '../../static/asset/back-to-topic.svg'
import commonStyles from '../components/article/Common.scss'
import cx from 'classnames'
import deviceConst from '../constants/device'
import fbIcon from '../../static/asset/fb.svg'
import leadingImgStyles from '../components/article/LeadingImage.scss'
import lineIcon from '../../static/asset/line.svg'
import logoIcon from '../../static/asset/icon-placeholder.svg'
import withLayout, { defaultTheme, photoTheme } from '../helpers/with-layout'
import styles from './Article.scss'
import styled from 'styled-components'
import { screen } from '../themes/screen'
import twitterIcon from '../../static/asset/twitter.svg'
import twreporterRedux from '@twreporter/redux'
import { PHOTOGRAPHY_ARTICLE_STYLE, SITE_META, SITE_NAME, appId, LINK_PREFIX } from '../constants/index'
import { globalColor, colors, componentMargin, layout, letterSpace } from '../themes/common-variables'
import { Link, browserHistory } from 'react-router'
import { camelizeKeys } from 'humps'
import { connect } from 'react-redux'
import { getAbsPath, getScreenType } from '../utils/index'

//testing
import { TITLE_POSITION_ABOVE, TITLE_POSITION_UPON_LEFT,  NAVBAR_POSITION_UPON } from '../constants/page-themes'

// lodash
import forEach from 'lodash/forEach'
import get from 'lodash/get'
import has from 'lodash/has'
import map from 'lodash/map'
import merge from 'lodash/merge'
import set from 'lodash/set'
import sortBy from 'lodash/sortBy'
import throttle from 'lodash/throttle'

const _ = {
  throttle,
  forEach,
  get,
  has,
  map,
  merge,
  set,
  sortBy
}

const { actions, reduxStateFields, utils } = twreporterRedux
const { fetchAFullPost, createBookmark, deleteBookmark, getCurrentBookmark } = actions

const ArticleContainer = styled.div`
  background-color: ${ props => (props.bgColor ? props.bgColor : colors.gray.lightGray) };
  min-height: 20em;
  padding-top: ${ props => (props.titlePosition === TITLE_POSITION_UPON_LEFT ? '0' : '20px') };
`

const Content = styled.div`
  color: ${ props => (props.fontColor ? props.fontColor : globalColor.textColor)};
  a {
      border-bottom: 1px ${globalColor.primaryColor} solid;
      cursor: pointer;
      transition: 0.5s all ease;
      position: relative;
      color: ${ props => (props.fontColor ? props.fontColor : globalColor.textColor)};
      letter-spacing: ${letterSpace.generalLetterSpace};
      &:hover {
        color: ${globalColor.primaryColor};
      }
      &:after {
        position: absolute;
        content: "";
        left: 0;
        bottom: -0.13em;
        height: 0.11rem;
        width: 0;
        background: ${globalColor.primaryColor};
        transition: 0.5s all ease;
      }
      &:hover:after {
        width: 100%;
      }
  }
`

const IntroductionContainer = styled.div`
  display: block;
  margin: 0 auto ${componentMargin.doubleMarginBottom} auto;
  ${screen.desktopAbove`
    width: ${layout.desktop.small};
  `}
  ${screen.tablet`
    width: ${layout.tablet.small};
  `}
  ${screen.mobile`
    margin: 0 ${componentMargin.horizontalMargin} ${componentMargin.doubleMarginBottom} ${componentMargin.horizontalMargin};
  `}
`

const HeaderContainer = styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  @media (max-width: 1023px) {
    display: none;
  }
`

const scrollPosition = {
  y: 0
}

const DESKTOP = deviceConst.type.desktop
const MOBILE = deviceConst.type.MOBILE
const DEFAULT_INVALID_BOOKMARK_ID = 0
const DEFAULT_BOOKMARK_HOST = 'https://www.twreporter.org'

const viewport = {
  screenType: DESKTOP
}

const ArticlePlaceholder = () => {
  return (
    <div className={cx(styles['placeholder'])}>
      <div className={cx(styles['title-row'], commonStyles['inner-block'])}>
        <div className={styles['ph-title-1']}></div>
        <div className={styles['ph-title-2']}></div>
        <div className={styles['ph-author']}></div>
      </div>
      <div className={cx(styles['leading-img'], leadingImgStyles['leading-img'])}>
        <div className={styles['ph-image']}>
          <img src={logoIcon} className={styles['logo-icon']}/>
        </div>
      </div>
      <IntroductionContainer>
        <div className={styles['ph-content']}></div>
        <div className={styles['ph-content']}></div>
        <div className={styles['ph-content-last']}></div>
      </IntroductionContainer>
    </div>
  )
}

class Article extends PureComponent {

  static fetchData({ params, store }) {
    const slug = params.slug
    return store.dispatch(fetchAFullPost(slug)).then(() => {
      const state = store.getState()
      const selectedPost = _.get(state, reduxStateFields.selectedPost, {})
      if (_.get(selectedPost, 'error')) {
        return Promise.reject(_.get(selectedPost, 'error'))
      }
    })
  }

  constructor(props, context) {
    super(props, context)

    this._onScroll = _.throttle(this._onScroll, 300).bind(this)
    this._handleScroll = this._handleScroll.bind(this)
    this._onResize =  _.throttle(this._onResize, 500).bind(this)
    this.toggleTools = this._toggleTools.bind(this)
    this.handleOnClickBookmark = this._handleOnClickBookmark.bind(this)

    this.state = {
      fontSize:'medium',
      isFontSizeSet:false,
      isBookmarkListed: false,
      bookmarkId: DEFAULT_INVALID_BOOKMARK_ID
    }

    // reading progress component
    this.rp = null

    // desktop article tools
    this.dat = null

    // mobile article tools
    this.mat = null

    this.articleMeta = null
  }

  async _toGetCurrentBookmark(slug, host) {
    try {
      const id = await this.props.getCurrentBookmark(slug, host)
      if (id) {
        this.setState({
          isBookmarkListed: true,
          bookmarkId: id
        })
      }
    } catch (error) {
      this.setState({
        isBookmarkListed: false,
        bookmarkId: DEFAULT_INVALID_BOOKMARK_ID
      })
    }
  }

  _checkIfBookmarkListed(slug) {
    this._toGetCurrentBookmark(slug, DEFAULT_BOOKMARK_HOST)
  }

  getChildContext() {
    const { entities, selectedPost } = this.props
    const slug = _.get(selectedPost, 'slug', '')
    let post = _.get(entities, [ reduxStateFields.postsInEntities, slug ], {})
    let style = _.get(post, 'style')
    return {
      isPhotography: style === PHOTOGRAPHY_ARTICLE_STYLE
    }
  }

  changeFontSize(fontSize) {
    this.setState({
      fontSize:fontSize,
      isFontSizeSet:true
    })
    localStorage.setItem('fontSize',fontSize)
  }

  componentDidMount() {
    viewport.screenType = getScreenType(window.innerWidth)
    window.addEventListener('resize', this._onResize)
    // detect sroll position
    window.addEventListener('scroll', this._onScroll)
    let storedfontSize = localStorage.getItem('fontSize')
    if(storedfontSize !== null && !this.state.isFontSizeSet) {
      this.setState({
        fontSize:storedfontSize,
        isFontSizeSet:true
      })
    }

  }

  componentDidUpdate(prevProps, prevState) {
    // Make sure any change like clicking related article will scroll to top
    if (prevState.fontSize !== this.state.fontSize) {
      return
    }
    window.scrollTo(0, 0)
  }

  componentWillMount() {
    const { params } = this.props
    let slug = _.get(params, 'slug')
    this.props.fetchAFullPost(slug)
    this._checkIfBookmarkListed(slug)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._onResize)
    window.removeEventListener('scroll', this._onScroll)
    scrollPosition.y = 0

    // unset components
    this.rp = null
    this.dat = null
    this.mat = null
  }

  componentWillReceiveProps(nextProps) {
    const { params } = nextProps
    const slug = _.get(params, 'slug')
    const isFetching = _.get(nextProps, 'selectedPost.isFetching') || _.get(this.props, 'selectedPost.isFetching')
    if (slug !== _.get(this.props, 'selectedPost.slug') && !isFetching) {
      this.props.fetchAFullPost(slug)

      // unset components
      this.rp = null
      this.dat = null
      this.mat = null
      this._checkIfBookmarkListed(slug)
    }
  }

  _onScroll() {
    this._handleScroll()
  }

  _getCumulativeOffset(element) {
    let top = 0
    do {
      top += element.offsetTop  || 0
      element = element.offsetParent
    } while(element)

    return top
  }

  _onResize() {
    viewport.screenType = getScreenType(window.innerWidth)
  }

  _toggleTools(device, toShow) {
    if (device === MOBILE) {
      if (this.mat) {
        if (toShow) {
          return this.mat.showTools()
        }
        this.mat.hideTools()
      }
    } else if (this.dat) {
      if (toShow) {
        return this.dat.showTools()
      }
      this.dat.hideTools()
    }
  }

  _handleScroll() {
    const currentTopY = window.scrollY
    const beginY = _.get(this.progressBegin, 'offsetTop', 0)
    const endY = _.get(this.progressEnding, 'offsetTop', 0)
    const { theme } = this.props
    const titlePosition = _.get(theme, 'titlePosition')

    /* Calculate reading progress */
    let scrollRatio = Math.abs((currentTopY-beginY) / (endY-beginY))
    if(currentTopY < beginY) {
      scrollRatio = 0
    } else if (scrollRatio > 1) {
      scrollRatio = 1
    }
    let curPercent = Math.round(scrollRatio*100)

    if (this.rp) {
      // update the header progress bar
      this.rp.updatePercentage(curPercent)
    }

    /* Handle Article Tools */
    const screenType = viewport.screenType

    const isInTopRegion = currentTopY < beginY + 600

    if (screenType === DESKTOP) {
      if (titlePosition === TITLE_POSITION_UPON_LEFT && this.articleMeta) {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
        if ( currentScrollTop >= this.articleMeta.offsetTop) {
          this.toggleTools(DESKTOP, true)
        } else {
          this.toggleTools(DESKTOP, false)
        }
      } else {
        this.toggleTools(DESKTOP, true)
      }
    }

    // Calculate scrolling distance to determine whether tools are displayed
    if (screenType !== DESKTOP) {
      const lastY = scrollPosition.y
      const distance = currentTopY - lastY
      if (distance > 30) {
        scrollPosition.y = currentTopY
        this.toggleTools(MOBILE, false)
      } else {
        if (Math.abs(distance) > 150) {
          scrollPosition.y = currentTopY
          if (!isInTopRegion) {
            this.toggleTools(MOBILE, true)
          }
        }
      }
    }
  }

  _composeAuthors(article) {
    article = article || {}
    let authors = []
    const list = [ 'writters', 'photographers', 'designers', 'engineers' ]
    list.forEach((item) => {
      if (Array.isArray(article[item])) {
        article[item].forEach((author) => {
          // remove 's'. writters -> writter
          let type = item.slice(0, -1)
          authors.push(_.merge({}, author, { type: type }))
        })
      }
    })
    return authors
  }

  async _toDeleteBookmark(bookmarkId) {
    try {
      await this.props.deleteBookmark(bookmarkId)
      this.setState({
        isBookmarkListed: false,
        bookmarkId: DEFAULT_INVALID_BOOKMARK_ID
      })
    } catch (error) {
      console.error(error)
    }
  }

  async _toCreateBookmark(bookmarkData) {
    try {
      const bookmarkId = await this.props.createBookmark({
        ...bookmarkData,
        host: DEFAULT_BOOKMARK_HOST
      })
      if(bookmarkId) {
        this.setState({
          isBookmarkListed: true,
          bookmarkId
        })
      }
    } catch(error) {
      const { selectedPost, entities } = this.props
      const slug = _.get(selectedPost, 'slug')
      const type = _.get(entities, `posts.${slug}.style`) === 'interactive' ? 'i' : 'a'
      const webStatus = _.get(error, 'response.status')
      if (webStatus === 401) {
        browserHistory.push(`/signin/?path=${type}/${slug}`)
      }
    }
  }

  _handleOnClickBookmark(bookmarkData) {
    const { isBookmarkListed } = this.state
    if (!isBookmarkListed) {
      this._toCreateBookmark(bookmarkData)
    } else {
      const { bookmarkId } = this.state
      this._toDeleteBookmark(bookmarkId)
    }
  }

  render() {
    const { entities, params, selectedPost, theme } = this.props
    const error = _.get(selectedPost, 'error')
    if (error) {
      return (
        <div>
          <SystemError error={error} />
        </div>
      )
    }

    if (_.get(selectedPost, 'slug') !== _.get(params, 'slug')) {
      return null
    }

    const postEntities = _.get(entities, reduxStateFields.postsInEntities)
    const topicEntities = _.get(entities, reduxStateFields.topicsInEntities)
    const slug = _.get(selectedPost, 'slug', '')
    const article = camelizeKeys(_.get(postEntities, slug))
    const articleStyle = _.get(article, 'style')
    // const outerClass = (articleStyle===PHOTOGRAPHY_ARTICLE_STYLE) ?
                //  cx(styles['article-container'], styles['photo-container']) : styles['article-container']
    const contentClass = (articleStyle===PHOTOGRAPHY_ARTICLE_STYLE) ?
                 cx(styles['article-inner'], styles['photo-page-inner']) : styles['article-inner']
    const isFetching = _.get(selectedPost, 'isFetching')
    if (isFetching) {
      return (
        <ArticleContainer>
          <div className={contentClass}>
            <ArticlePlaceholder />
          </div>
        </ArticleContainer>
      )
    }

    const relateds = camelizeKeys(utils.denormalizePosts(_.get(article, 'relateds', []), postEntities))
    const topics = camelizeKeys(utils.denormalizeTopics(_.get(article, 'topics', []), topicEntities, postEntities))
    const topic = topics[0]
    const authors = this._composeAuthors(article)
    const bodyData = _.get(article, [ 'content', 'apiData' ], [])
    const leadingVideo = _.get(article, 'leadingVideo', null)
    const heroImage = _.get(article, [ 'heroImage' ], null)
    const heroImageSize = _.get(article, [ 'heroImageSize' ], 'normal')
    const introData = _.get(article, [ 'brief', 'apiData' ], [])
    const cUrl = getAbsPath(this.context.location.pathname, this.context.location.search)

    const topicName = _.get(topic, 'topicName')
    const topicTitle = _.get(topic, 'title')
    const topicSlug = _.get(topic, 'slug')
    const topicArr = _.get(topic, 'relateds')

    // const updatedAt = _.get(article, 'updatedAt') || _.get(article, 'publishedDate')

    // for head tag
    const canonical = SITE_META.URL + 'a/' + slug
    const articleTitle = _.get(article, 'title', '') + SITE_NAME.SEPARATOR + SITE_NAME.FULL
    const articleDes = _.get(article, 'ogDescription', SITE_META.DESC)
    const articleImg = _.get(article, 'ogImage.resizedTargets.desktop.url', SITE_META.LOGO)

    const createBookmarkData = () => {
      const slug = _.get(selectedPost, 'slug', '')
      return {
        slug,
        is_external: _.get(entities, `posts.${slug}.style`) === 'interactive',
        title: _.get(entities, `posts.${slug}.title`),
        desc: _.get(entities, `posts.${slug}.og_description`),
        thumbnail: _.get(entities, `posts.${slug}.hero_image.resized_targets.mobile.url`),
        category: _.get(entities, `posts.${slug}.categories[0].name`),
        published_date: _.get(entities, `posts.${slug}.published_date`)
      }
    }

    const pathname = _.get(this.props, 'location.pathname')
    // theme
    const bgColor = _.get(theme, 'bgColor')
    // const footerBgColor = _.get(theme, 'footer_bg_color')
    const fontColor = _.get(theme, 'fontColor')
    const titlePosition = _.get(theme, 'titlePosition')
    const headerPosition = _.get(theme, 'headerPosition')
    const titleColor = _.get(theme, 'titleColor')
    const subTitleColor = _.get(theme, 'subtitleColor')
    const topicColor = _.get(theme, 'topicColor')
    const logoColor =  _.get(theme, 'logoColor')
    const fontColorSet = {
      topicFontColor: topicColor,
      titleFontColor: titleColor,
      subtitleFontColor: subTitleColor
    }
    return (
      <div>
        <Helmet
          title={articleTitle}
          link={[
            { rel: 'canonical', href: canonical }
          ]}
          meta={[
            { name: 'description', content: articleDes },
            { name: 'twitter:title', content: articleTitle || SITE_NAME.FULL },
            { name: 'twitter:image', content: articleImg || SITE_META.OG_IMAGE },
            { name: 'twitter:description', content: articleDes },
            { name: 'twitter:card', content: 'summary_large_image' },
            { property: 'og:title', content: articleTitle || SITE_NAME.FULL },
            { property: 'og:description', content: articleDes },
            { property: 'og:image', content: articleImg || SITE_META.OG_IMAGE },
            { property: 'og:type', content: 'article' },
            { property: 'og:url', content: canonical },
            { property: 'og:rich_attachment', content: 'true' }
          ]}
        />
        <div itemScope itemType="http://schema.org/Article">
          {isFetching ? <ArticleContainer><ArticlePlaceholder /></ArticleContainer> :
          <ArticleContainer
            bgColor={bgColor}
            titlePosition={titlePosition}
          >
            {
              leadingVideo ?
                <LeadingVideo
                  filetype={_.get(leadingVideo, 'filetype')}
                  title={_.get(leadingVideo, 'title')}
                  src={_.get(leadingVideo, 'url')}
                  poster={_.get(heroImage, 'resizedTargets')}
                /> : null
            }
            <ReadingProgress ref={ele => this.rp = ele}/>
            <Content
              fontColor={fontColor}
            >
              <article ref={div => {this.progressBegin = div}} className={contentClass}>
                {
                  titlePosition === TITLE_POSITION_ABOVE ?
                  <div>
                    <TitleRowAbove
                      article={article}
                      topic={topic}
                      canonical={canonical}
                      fontColorSet={fontColorSet}
                    />
                    <ArticleMeta
                      authors={authors}
                      extendByline={_.get(article, 'extendByline')}
                      publishedDate={article.publishedDate}
                      appId={appId}
                      url={cUrl}
                      title={article.title}
                      fbIcon={fbIcon}
                      twitterIcon={twitterIcon}
                      lineIcon={lineIcon}
                      changeFontSize={(fontSize)=>this.changeFontSize(fontSize)}
                      fontSize={this.state.fontSize}
                    />
                  </div>
                : null
                }

                {
                  !leadingVideo && !this.props.ifDelegateImage ?
                    <div className={styles['leading-img']}>
                      <ArticleComponents.LeadingImage
                        size={heroImageSize}
                        image={_.get(heroImage, 'resizedTargets')}
                        id={_.get(heroImage, 'id')}
                        description={_.get(article, 'leadingImageDescription', '')}
                        titlePosition={titlePosition}
                      >
                        {
                          headerPosition === NAVBAR_POSITION_UPON ?
                            <HeaderContainer>
                              <Header
                                isIndex={false}
                                pathName={pathname}
                                fontColor={fontColor}
                                bgColor={''}
                                logoColor={logoColor}
                                headerPosition={headerPosition}
                              />
                            </HeaderContainer>
                          : null
                        }
                        {
                          titlePosition === TITLE_POSITION_UPON_LEFT ?
                            <TitleRowUpon
                              article={article}
                              topic={topic}
                              canonical={canonical}
                              fontColorSet={fontColorSet}
                            />
                          : null
                        }
                      </ArticleComponents.LeadingImage>
                    </div> : null
                }

                {
                  titlePosition === TITLE_POSITION_UPON_LEFT ?
                  <div ref={(node) => { this.articleMeta = node }}>
                    <ArticleMeta
                      authors={authors}
                      extendByline={_.get(article, 'extendByline')}
                      publishedDate={article.publishedDate}
                      appId={appId}
                      url={cUrl}
                      title={article.title}
                      fbIcon={fbIcon}
                      twitterIcon={twitterIcon}
                      lineIcon={lineIcon}
                      changeFontSize={(fontSize)=>this.changeFontSize(fontSize)}
                      fontSize={this.state.fontSize}
                    />
                  </div>
                  : null
                }
                <IntroductionContainer>
                  <ArticleComponents.Introduction
                    data={introData}
                    fontSize={this.state.fontSize}
                  />
                </IntroductionContainer>

                <ArticleComponents.Body
                  data={bodyData} fontSize={this.state.fontSize}
                />
              </article>
            </Content>
            <div ref={div => {this.progressEnding = div}}
                className={cx(commonStyles['components'], 'hidden-print', styles['padding-patch'])}>
              <div className={cx('inner-max', commonStyles['component'])}>
                <ArticleComponents.BottomTags
                  data={article.tags}
                />
              </div>
              { topicTitle ?
                <Link to={`${LINK_PREFIX.TOPICS}${topicSlug}`}>
                  <div className={cx(styles['promotion'], 'center-block')}>
                    <PromotionBanner
                      bgImgSrc={_.get(topic, 'leadingImage.resizedTargets.tablet.url')}
                      headline={_.get(topic, 'headline')}
                      iconImgSrc={backToTopicIcon}
                      title={topicTitle}
                      subtitle={_.get(topic, 'subtitle')}
                    />
                  </div>
                </Link>
                : null }
              <ArticleComponents.BottomRelateds
                relateds={relateds}
                currentId={article.id}
                topicName={topicName}
                topicArr={topicArr}
              />
            </div>
          </ArticleContainer>
          }
          {/*<ArticleComponents.PageNavigation
            article={ get(article, [ 'relateds', 0 ])}
            navigate="next"
          />
          <ArticleComponents.PageNavigation
            article={get(article, [ 'relateds', 1 ])}
            navigate="previous"
          />*/}
          <div className="hidden-print">
          </div>
        </div>
        <MobileArticleTools
          ref={ ele => this.mat = ele }
          topicTitle={topicTitle}
          topicSlug={topicSlug}
          toShow={false}
          onClickBookmark={() => {this.handleOnClickBookmark(createBookmarkData())}}
          isBookmarkListed={this.state.isBookmarkListed}
        />
        <DesktopArticleTools
          ref={ ele => this.dat = ele}
          topicTitle={topicTitle}
          topicSlug={topicSlug}
          toShow={false}
          onClickBookmark={() => {this.handleOnClickBookmark(createBookmarkData())}}
          isBookmarkListed={this.state.isBookmarkListed}
        />
      </div>
    )
  }
}

export function mapStateToProps(state) {
  const entities = state[reduxStateFields.entities]
  const selectedPost = state[reduxStateFields.selectedPost]
  const post = _.get(entities, [ reduxStateFields.postsInEntities, selectedPost.slug ], {})
  const style = post.style
  let theme = defaultTheme

  // backwards compatible for photo articles
  if (style === PHOTOGRAPHY_ARTICLE_STYLE) {
    theme = photoTheme
  }

  theme = post.theme || theme

  return {
    entities,
    selectedPost,
    theme: camelizeKeys(theme)
  }
}

Article.childContextTypes = {
  isPhotography: React.PropTypes.bool
}

Article.contextTypes = {
  device: React.PropTypes.string,
  location: React.PropTypes.object
}

Article.propTypes = {
  createBookmark: React.PropTypes.func,
  deleteBookmark: React.PropTypes.func,
  entities: React.PropTypes.object,
  getCurrentBookmark: React.PropTypes.func,
  ifDelegateImage: React.PropTypes.bool,
  params: React.PropTypes.object,
  selectedPost: React.PropTypes.object,
  theme: React.PropTypes.object
}

Article.defaultProps = {
  createBookmark: () => {},
  deleteBookmark: () => {},
  entities: {},
  getCurrentBookmark: () => {},
  ifDelegateImage: false,
  params: {},
  selectedPost: {},
  theme: defaultTheme
}

export { Article }
export default connect(mapStateToProps, { fetchAFullPost, createBookmark, deleteBookmark, getCurrentBookmark })(withLayout(Article))
