/*eslint no-unused-vars:0, no-console:0 */
'use strict'
import { connect } from 'react-redux'
import { denormalizeArticles } from '../utils/index'
import { fetchCategorizedArticlesIfNeeded } from '../actions/group-articles'
import _ from 'lodash'
import async from 'async'
import Daily from '../components/Daily'
import Features from '../components/Features'
import Footer from '../components/Footer'
import React, { Component } from 'react'
import SystemError from '../components/SystemError'
import TopNews from '../components/TopNews'

const MAXRESULT = 10
const PAGE = 1

if (process.env.BROWSER) {
  require('./Home.css')
}

function loadData(fetchCategorizedArticlesIfNeeded) {
  fetchCategorizedArticlesIfNeeded('評論', MAXRESULT, PAGE)
  fetchCategorizedArticlesIfNeeded('專題', MAXRESULT, PAGE)
}


export default class Home extends Component {
  static fetchData({ store }) {
    return new Promise((resolve, reject) => {
      // load tagged articles in parallel
      async.parallel([
        /*
        function (callback) {
          store.dispatch(fetchTaggedArticlesIfNeeded('hp-projects', MAXRESULT, PAGE))
          .then(() => {
            callback(null)
          })
        },
        */
        function (callback) {
          store.dispatch(fetchCategorizedArticlesIfNeeded('評論', MAXRESULT, PAGE))
          .then(() => {
            callback(null)
          })
        },
        function (callback) {
          store.dispatch(fetchCategorizedArticlesIfNeeded('專題', MAXRESULT, PAGE))
          .then(() => {
            callback(null)
          })
        }
      ], (err, results) => {
        if (err) {
          console.warn('fetchData occurs error:', err)
        }
        resolve()
      })
    })
  }

  constructor(props, context) {
    super(props, context)
    this.loadMoreArticles = this.loadMoreArticles.bind(this, '專題')
  }

  componentWillMount() {
    loadData(this.props.fetchCategorizedArticlesIfNeeded)
  }

  componentWillReceiveProps(nextProps) {
    loadData(nextProps.fetchCategorizedArticlesIfNeeded)
  }

  loadMoreArticles(cat) {
    const { articlesByCats, fetchCategorizedArticlesIfNeeded } = this.props
    const features = articlesByCats[cat] || {
      items: []
    }
    let page = Math.floor(features.items.length / MAXRESULT)  + 1
    fetchCategorizedArticlesIfNeeded(cat, MAXRESULT, page)
  }

  render() {
    const { articlesByCats, entities } = this.props
    const topnews_num = 5
    let topnewsItems = denormalizeArticles(_.get(articlesByCats, [ '專題','items' ] , []), entities)

    let dailyItems = denormalizeArticles(_.get(articlesByCats, [ '評論', 'items' ], []), entities)

    if (topnewsItems) {
      return (
        <div>
          <Daily daily={dailyItems} />
          <Features
            features={topnewsItems}
            hasMore={ _.get(articlesByCats, [ '專題', 'nextUrl' ]) !== null}
            loadMore={this.loadMoreArticles}
          />
          {this.props.children}
          <Footer/>
        </div>
      )
    } else {
      return ( <SystemError/> )
    }
  }
}

function mapStateToProps(state) {
  return {
    articlesByCats: state.articlesByCats || {},
    entities: state.entities || {}
  }
}

export { Home }
export default connect(mapStateToProps, { fetchCategorizedArticlesIfNeeded })(Home)
