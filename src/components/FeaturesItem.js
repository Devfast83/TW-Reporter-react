import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'

if (process.env.BROWSER) {
    require("./FeaturesItem.css");
}

const IMG_RATIO = 0.667;

export default class FeaturesItem extends Component {
    constructor(props, context) {
        super(props, context)

        // scrollController and scrollScene are used for ScrollMagic
        this.scrollController = null
        this.scrollScene = null
    }

    _resizeImage() {
        let img = ReactDOM.findDOMNode(this.refs.listImg);
        // browser width and height
        let bHeight = window.innerHeight
        let bWidth =  window.innerWidth
        let bRatio = bHeight / bWidth
        let height
        let width
        let marginTop
        let marginLeft

        // height of browser is longer than image height in ratio.
        // use browser height as criterion
        if (bRatio > IMG_RATIO) {
            height = bHeight
            width = height / IMG_RATIO
            marginLeft = bWidth - width
        } else {
            width = bWidth
            height = width * IMG_RATIO
            marginTop = bHeight - height
        }
        img.style.marginTop = marginTop ? marginTop + 'px' : ''
        img.style.marginLeft = marginLeft ? marginLeft + 'px' : ''
        img.style.height = height + 'px'
        img.style.width = width + 'px'
    }

    _recoveryImage() {
        let img = ReactDOM.findDOMNode(this.refs.listImg);
        img.style.marginLeft = img.style.marginTop = img.style.height = img.style.width = ''
    }

    _handleResize() {

        // only for desktop, we have the parallax animation
        if (window.innerWidth  > 800 ) {

            // resize image
            this._resizeImage()

            if (!this.scrollController) {
                // init controller
                this.scrollController = new ScrollMagic.Controller()
            }

            if (this.scrollScene) {
                // remove scene from controller
                this.scrollScene.remove()
            }

            if (!this.scrollScene) {
                // create a scene
                this.scrollScene = new ScrollMagic.Scene({
                    triggerElement: '#parallax-trigger'+this.props.article.id,
                    triggerHook: 0, // don't trigger until #parallax-trigger hits the top of the viewport,
                })
            }

            this.scrollScene
            .duration(window.innerHeight)
            .setPin('#parallax-trigger'+this.props.article.id, {pushFollowers: false}) // pins the element for the the scene's duration
            // for debug
            // .addIndicators()
            .addTo(this.scrollController)

        } else {
            // remove style added by _resizeImage function
            this._recoveryImage()

            if (this.scrollScene) {
                // remove the pin from the scene and reset the pin element to its initial position (spacer is removed)
                this.scrollScene.removePin(true)
                // remove scene from controller it belonged to
                this.scrollScene.remove();
            }
        }
    }

    componentDidMount() {
        this._handleResize()
        window.addEventListener('resize', this._handleResize.bind(this));
    }

    render() {
        const { article } = this.props
        let firstImage = "https://www.twreporter.org/data/files/organization/60826/image/derivative/scale~24050x0~" + article.firstImage
        let url = (article.story_link) ? article.story_link : "https://www.twreporter.org/a/" + article.slug
        let t = new Date(article.lastPublish * 1000).toString().split(' ');
        let tags = article.tags
        let cat_display = "專題"
        for (let i = 0; i < tags.length; i++) {
            if (tags[i].substring(0,4) == 'cat:') {
                cat_display = tags[i].substring(4)
                break
            }
        }

        return (
            <li className="listing-item" key={article.id}>
                <a href={url}>
                    <div id={'parallax-trigger'+this.props.article.id} className="img-wrap">
                        <img  ref='listImg' width='1800px' height='1200px' className="img" src={firstImage}/>
                        <div className='img-overlay' />
                    </div>
                    <div ref='parallaxIndicator' className='container'>
                        <div className="border clearfix">
                            <div className='featurebox'>
                                <div className="container">
                                    <div className="category">{cat_display.substring(0,1)}</div>
                                    <div className="category">{cat_display.substring(2,1)}</div>
                                </div>
                                <div className='infobox'>
                                    <div className="published">
				                        {[t[1], t[2], t[3]].join('.')}
                                    </div>
                                    <div className="title">{article.title}</div>
                                    <div className="excerpt">{article.excerpt}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>
            </li>
        )
    }
}
