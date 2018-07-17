import { colors } from '../../../themes/common-variables'
import { gray, numbersInfullPage } from './utils'
import { replaceStorageUrlPrefix } from '@twreporter/react-components/lib/shared/utils'
import { storageUrlPrefix } from '../utils/config'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  position: relative;
  display: block;
  width: 100%;
  height: 465px;
  padding: 0 13px 0 13px;
  margin-top: 49px;
  background: ${colors.gray.gray96};
`

const MemberBlock = styled.div `
  position: relative;
  width: 100%;
  height: calc(100% / 4);
  padding: 0 20px; 
  span{
    display: inline-block;
    height: 100%;
    vertical-align: middle;
  }
  img{
    vertical-align: middle;
    width: calc(60.5px * 1.2);
  }
`

const MemberBorder = styled.div `
  width: 100%;
  height: 100%;
  padding: 20px 0;
  border-bottom: solid 1px ${gray.bordergray};
`

const ProfileWrapper = styled.div `
  position: relative;
  display: table;
  float: right;
  width: calc(100% - ( 60.5px * 1.2));
  height: 100%;
  padding-left: 9px;
  img{
    visibility: ${props => props.isMailIconVisible ? 'visible' : 'hidden'};
    width: 26px;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
  }
`

const Profile = styled.div `
  display: table-cell; 
  vertical-align: middle; 
  text-align: left;
  p:first-child{
    font-size: 14px;
    letter-spacing: 1px;
  }
  p:last-child{
    font-size: 22px;
    font-weight: bold;
    letter-spacing: 0.5px;
  }
`

export default class PaginatedMemberList extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    const { cursor, selectedMemberList } = this.props
    let MemberBlocks = selectedMemberList.slice(cursor - numbersInfullPage.mobile, cursor).map((member) => {
      return(
        <MemberBlock key={member.name}>
          <MemberBorder>
            <span />
            <img src={member.profile} />
            <ProfileWrapper
              isMailIconVisible={typeof member.email !== 'undefined'}
            >
              <Profile>
                <p>{member.job}</p>
                <p>{member.name}</p>
              </Profile>
              <img 
                onClick={() => this.props.sendEmail(member.email)} 
                src={`${replaceStorageUrlPrefix(`${storageUrlPrefix}/mail.png`)}`}
              />
            </ProfileWrapper>
          </MemberBorder>          
        </MemberBlock>
      )
    })    
    return (
      <Container>
        {MemberBlocks}
      </Container>
    )
  }
}

PaginatedMemberList.defaultProps = {
  cursor: 0,
  selectedMemberList: []
}

PaginatedMemberList.propTypes = {
  cursor: PropTypes.number.isRequired,
  selectedMemberList: PropTypes.array.isRequired,
  sendEmail: PropTypes.func.isRequired
}
