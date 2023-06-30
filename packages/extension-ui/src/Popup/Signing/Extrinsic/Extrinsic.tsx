// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SignerPayloadJSON } from '@polkadot/types/types';

import React from 'react';
import styled from "styled-components";

import { formatNumber } from "@polkadot/util";

import helpIcon from '../../../assets/help.svg';
import { Svg, Table } from '../../../components';
import useTranslation from '../../../hooks/useTranslation';
import ExtrinsicTooltip from '../Tooltip';
import ErrorBoundary from './ErrorBoundary';
import TransactionDetails from './TransactionDetails';

type Props = {
  className?: string;
  requestPayload: SignerPayloadJSON;
  url: string;
}

function Extrinsic({
  className,
  requestPayload,
  url
}: Props) {
  const { t } = useTranslation();

  return (
    <FullWidthTable className={className}>
      <tr>
        <td className='label'>{t<string>('from')}</td>
        <div className='separator'></div>
        <td className='from'>{url}</td>
      </tr>
      <tr>
        <td className='label'>
          {t<string>('nonce')}&nbsp;
          <ExtrinsicTooltip content='The overall lifetime transaction count of your account.'>
            <Svg
              className='help-icon'
              src={helpIcon}
            />
          </ExtrinsicTooltip>
        </td>
        <div className='separator'></div>
        <td className='data'>{formatNumber(Number(requestPayload.nonce))}</td>
      </tr>
      <ErrorBoundary Fallback={() => null}>
        <TransactionDetails requestPayload={requestPayload} />
      </ErrorBoundary>
    </FullWidthTable>
  );
}

export default Extrinsic;

const FullWidthTable = styled(Table)`
  width: 100%;
`;
