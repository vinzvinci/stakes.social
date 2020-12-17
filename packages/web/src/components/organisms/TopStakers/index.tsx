import React from 'react'
import { useQuery } from '@apollo/client'
import getTopStakersOfPropertyQuery from './query/getTopStakersOfProperty'
import { Avatar } from 'src/components/molecules/Avatar'
import styled, { css } from 'styled-components'
import { useEffect } from 'react'
import { useListTopStakersAccountLazyQuery } from '@dev/graphql'
import { useGetAccount, useGetPropertySetting } from 'src/fixtures/dev-for-apps/hooks'
import { Spin } from 'antd'
import Link from 'next/link'

interface TopStakersProps {
  propertyAdress?: string
  authorAddress?: string
}

const PlaceHolderList = styled.div<{ noData?: boolean }>`
  ${({ noData }) => css`
    display: flex;
    min-height: ${noData ? '150px' : '300px'};
    justify-content: center;
    align-items: center;
  `}
`

const Flex = styled.div`
  display: flex;
  flex-direction: column;
`

const AccountAddress = styled.span`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 150px;
`

const TopStakerRanking = styled.div`
  display: flex;
  justify-content: space-evenly;
  flex-wrap: wrap;
`

const StakerSection = styled.div<{ isCreator?: Boolean }>`
  display: flex;
  justify-content: space-evenly;
  cursor: ${props => (props?.isCreator ? 'pointer' : 'auto')};
  flex-direction: column;
  align-items: center;
  /* padding: 1em 2em; */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  width: 180px;
  height: 180px;
  margin-bottom: 1em;
  img {
    border-radius: 90px;
  }

  @media (max-width: 768px) {
    margin-right: 0.5em;
    margin-bottom: 1em;
    width: 160px;
  }
`

const formatter = new Intl.NumberFormat('en-US')

const Staker = ({
  propertyAddress,
  accountAddress,
  value
}: {
  propertyAddress: string | undefined
  accountAddress: string
  value: number
}) => {
  const { data } = useGetAccount(accountAddress)
  const isCreator = !!data
  const { data: incognitoSettings } = useGetPropertySetting(propertyAddress, accountAddress)

  return (
    <>
      {isCreator && !incognitoSettings?.private_staking ? (
        <Link href={`/author/${accountAddress}`} passHref>
          <StakerSection isCreator={isCreator}>
            <Avatar accountAddress={incognitoSettings?.private_staking ? undefined : accountAddress} size={'100'} />
            <AccountAddress>
              {incognitoSettings?.private_staking ? (
                <span style={{ fontStyle: 'italic' }}>Hidden user</span>
              ) : (
                data?.name || accountAddress
              )}
            </AccountAddress>
            <span>{`${formatter.format(parseInt((value / Math.pow(10, 18)).toFixed(0)))}`}</span>
          </StakerSection>
        </Link>
      ) : (
        <StakerSection>
          <Avatar accountAddress={incognitoSettings?.private_staking ? undefined : accountAddress} size={'100'} />
          <AccountAddress>
            {incognitoSettings?.private_staking ? (
              <span style={{ fontStyle: 'italic' }}>Hidden user</span>
            ) : (
              data?.name || accountAddress
            )}
          </AccountAddress>
          <span>{`${formatter.format(parseInt((value / Math.pow(10, 18)).toFixed(0)))}`}</span>
        </StakerSection>
      )}
    </>
  )
}

const TopStakers = ({ authorAddress, propertyAdress }: TopStakersProps) => {
  const { data: topPropertyStakersData, loading: isPropertyStakingLoading } = useQuery(getTopStakersOfPropertyQuery, {
    variables: {
      limit: 5,
      property_address: propertyAdress
    },
    skip: !!authorAddress || !propertyAdress
  })

  const [
    fetchTopCreatorStakers,
    { data: topCreatorStakersData, loading: isCreatorStakingLoading }
  ] = useListTopStakersAccountLazyQuery()

  useEffect(() => {
    if (authorAddress) {
      fetchTopCreatorStakers({
        variables: {
          limit: 5,
          author_address: authorAddress
        }
      })
    }
  }, [authorAddress, fetchTopCreatorStakers])

  const stakerItems: Array<{ account_address: string; value: number }> =
    topPropertyStakersData?.property_lockup || topCreatorStakersData?.account_lockup

  return (
    <Flex>
      {(isPropertyStakingLoading || isCreatorStakingLoading) && (
        <PlaceHolderList>
          <Spin size="large" style={{ display: 'block', width: 'auto', padding: '100px' }} />
        </PlaceHolderList>
      )}

      {!isCreatorStakingLoading && !isPropertyStakingLoading && stakerItems?.length === 0 && (
        <PlaceHolderList noData>
          <div>No data available...</div>
        </PlaceHolderList>
      )}

      <TopStakerRanking>
        {stakerItems?.map(({ account_address, value }) => (
          <Staker
            key={account_address}
            propertyAddress={propertyAdress}
            accountAddress={account_address}
            value={value}
          />
        ))}
      </TopStakerRanking>
    </Flex>
  )
}

export default TopStakers
