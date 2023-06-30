// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Call, WeightV2 } from '@polkadot/types/interfaces';
import type { Codec, SignerPayloadJSON } from '@polkadot/types/types';

import BigNumber from "bignumber.js";
import React, { useMemo } from 'react';
import styled from "styled-components";

import { formatNumber } from "@polkadot/util";

import helpIcon from '../../../assets/help.svg';
import { Svg, Table } from '../../../components';
import useMetadata from '../../../hooks/useMetadata';
import useTranslation from '../../../hooks/useTranslation';
import ExtrinsicTooltip from '../Tooltip';
import ArgumentValue from './ArgumentValue';
import { Renderable } from './types';

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
  const chain = useMetadata(requestPayload.genesisHash);
  const chainRegistry = chain?.registry;
  const transactionDetails = useMemo(() => {
    if (!chainRegistry) {
      return undefined;
    }

    const methodCall = chainRegistry.createType('Call', requestPayload.method.toString());

    return formatCall(methodCall);
  }, [requestPayload, chainRegistry]);

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
      {transactionDetails && (Array.isArray(transactionDetails) ?
        transactionDetails.map((batchTransactionDetails, i) => (
          <>
            <BatchRow key={i}>
              <HeaderCell className='label'>{t<string>('Batched transaction')} {i + 1}/{transactionDetails.length}</HeaderCell>
            </BatchRow>
            <CallDefinitionRows {...batchTransactionDetails} />
          </>
        )) :
        <CallDefinitionRows {...transactionDetails} />
      )}
    </FullWidthTable>
  );
}

export default Extrinsic;

const EllipsisCell = styled.td`
  &&& { /* Override the intrusive <Table> styles */
    display: block;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
`;

const FullWidthTable = styled(Table)`
  width: 100%;
`;

const HeaderCell = styled.td.attrs({ rowSpan: 3 })`
  &&& { /* Override the intrusive <Table> styles */
    color: #fff;
    font-size: 16px;
    white-space: nowrap;
    font-weight: 500;
    font-family: ${({theme}) => theme.secondaryFontFamily};
    line-height: 125%;
    letter-spacing: 0.96px;
  }
`;

const SubHeaderCell = styled(HeaderCell)`
  &&& { /* Override the intrusive <Table> styles */
    font-size: 14px;
    line-height: 120%;
    letter-spacing: 0.98px;
    margin-top: 10px;
  }
`;

const BatchRow = styled.tr`
  margin-top: 40px;
`;

const CallDefinitionRows = (props: {
  section: string,
  method: string,
  args: { name: string, value?: Renderable | Renderable[] }[],
  docs?: string[],
}) => {
  const { t } = useTranslation();

  return (
    <>
      <tr>
        <td className='label'>{t<string>('Section')}</td>
        <div className='separator'></div>
        <EllipsisCell className='data'>{props.section}</EllipsisCell>
      </tr>
      <tr>
        <td className='label'>{t<string>('Method')}</td>
        <div className='separator'></div>
        <EllipsisCell className='data'>{props.method}</EllipsisCell>
      </tr>
      {props.args?.length ? (
        <tr>
          <SubHeaderCell className='label'>{t<string>('Arguments')}</SubHeaderCell>
        </tr>
      ) : null}
      {props.args.map((arg) => (
        <tr key={arg.name}>
          <td className='label'>{arg.name}</td>
          <div className='separator'></div>
          <EllipsisCell className='data'>
            <ArgumentValue>{arg.value}</ArgumentValue>
          </EllipsisCell>
        </tr>
      ))}
    </>
  );
};

/**
 * Returns call details for a singular call and an array of call details for a batch.
 */
const formatCall = (call: Call) => {
  const isBatch = call.args[0]?.toRawType().startsWith('Vec<Call>');

  if (isBatch) {
    return (call.args[0] as unknown as Call[]).map((callFromBatch: Call) => ({
      section: callFromBatch.section,
      method: callFromBatch.method,
      args: formatCallArgs(callFromBatch),
      docs: getCallDocs(callFromBatch),
    }));
  }

  return {
    section: call.section,
    method: call.method,
    args: formatCallArgs(call),
    docs: getCallDocs(call),
  };
};

const formatCallArgs = (call: Call): { name: string, value?: Renderable | Renderable[] }[] =>
  call.meta.args.flatMap((argMeta, i) => {
    const argName = argMeta.name.toHuman();

    try {
      const value = call.args[i];

      // We're not displaying a transaction parameter without an argument passed to the transaction
      if (value.isEmpty) {
        return [];
      }

      const argType = argMeta.typeName.toString();
      const [, arrayItemType] = argType.match(/Vec<(.*)>/) || [];
      const isVector = !!arrayItemType;
      const formatter = (isVector ? formatters[arrayItemType] : formatters[argType]) || defaultFormatter;

      return [{
        name: argName,
        value: isVector ?
          // Type casting to limit redundant validation since any formatting errors are handled by the try-catch in this function
          (value.toHuman() as unknown as { [key: string]: Codec }[]).flatMap((item) => Object.values(item)).map(formatter) :
          formatter(value)
      }];
    } catch (e) {
      console.error(`Failed argument "${argName}" decoding:`, e);

      // In the case of an unlikely argument decoding error, for clarity we still want to display that this argument exists
      return [{ name: argName }];
    }
  });

/**
 * Formatters turn call arguments into renderable values.
 */
const formatters: { [typeName: string]: (value: Codec) => Renderable } = {
  AccountIdLookupOf: (value) => value.toString(),
  BalanceOf: (value) => toBaseUnit(value),
  Balance: (value) => toBaseUnit(value),
  // Just "refTime" from weight matters, because the other value: "proofSize" is only applicable for parachains
  Weight: (value) => toBaseUnit((value as WeightV2).refTime, 6),
  Bytes: (value) => value.toString(),
};

const toBaseUnit = (value: Codec, precision = 2) => new BigNumber(value.toString()).div(10**12).toFixed(precision);

const defaultFormatter = (value: Codec) => value.toHuman();

/**
 * "Humanized" docs from `meta` is represented in an array of lines of a documentation.
 */
const getCallDocs = (call: Call) => call.meta.docs.toHuman() as string[] | undefined;
