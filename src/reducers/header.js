'use strict'
import * as types from '../constants/action-types'

function header(state = {}, action) {
  switch (action.type) {
    case types.SET_PROGRESS_PRECENTAGE:
      return {
        ...state,
        readPercent: action.percent
      }
    case types.SET_PAGE_TYPE:
      return {
        ...state,
        pageType: action.pageType
      }
    case types.SET_PAGE_TITLE:
      return {
        ...state,
        pageTitle: action.pageTitle
      }
    default:
      return state
  }
}

export default header
