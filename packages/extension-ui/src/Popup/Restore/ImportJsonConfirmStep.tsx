// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ResponseJsonGetAccountInfo } from '@polkadot/extension-base/background/types';

import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  Address,
  BackButton,
  Button,
  ButtonArea,
  FileNameDisplay,
  InputWithLabel,
  ScrollWrapper,
  ValidatedInput,
  VerticalSpace,
  Warning
} from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { DEFAULT_TYPE } from '../../util/defaultType';
import { isNotShorterThan } from '../../util/validators';
import viewOff from '../assets/viewOff.svg';
import viewOn from '../assets/viewOn.svg';

interface Props {
  className?: string;
  onPreviousStep: () => void;
  onNextStep: () => void;
  accountsInfo: ResponseJsonGetAccountInfo[];
  requirePassword: boolean;
  isPasswordError: boolean;
  onChangePass: (pass: string) => void;
  fileName: string;
}

function ImportJsonConfirmStep({
  accountsInfo,
  className,
  fileName,
  isPasswordError,
  onChangePass,
  onNextStep,
  onPreviousStep,
  requirePassword
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const _handleInputTypeChange = useCallback(() => {
    setIsPasswordVisible(!isPasswordVisible);
  }, [isPasswordVisible]);

  const MIN_LENGTH = 6;
  const isPasswordValid = useMemo(() => isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')), [t]);

  return (
    <>
      <ScrollWrapper>
        <div className={className}>
          <FileNameDisplay fileName={fileName} />
          {accountsInfo.map(({ address, genesisHash, name, type = DEFAULT_TYPE }, index) => (
            <Address
              address={address}
              genesisHash={genesisHash}
              key={`${index}:${address}`}
              name={name}
              type={type}
            />
          ))}
          {requirePassword && (
            <div>
              <ValidatedInput
                component={InputWithLabel}
                label={t<string>('Password')}
                onValidatedChange={onChangePass}
                showPasswordElement={
                  <div className='password-icon'>
                    <img
                      onClick={_handleInputTypeChange}
                      src={isPasswordVisible ? viewOn : viewOff}
                    />
                  </div>
                }
                type={isPasswordVisible ? 'text' : 'password'}
                validator={isPasswordValid}
              />
              {isPasswordError && (
                <Warning
                  isBelowInput
                  isDanger
                >
                  {t<string>('Unable to decode using the supplied passphrase')}
                </Warning>
              )}
            </div>
          )}
        </div>
      </ScrollWrapper>
      <VerticalSpace />
      <ButtonArea>
        <BackButton onClick={onPreviousStep} />
        <Button onClick={onNextStep}>{t<string>('Import')}</Button>
      </ButtonArea>
    </>
  );
}

export default styled(ImportJsonConfirmStep)`
    margin-top: 32px;
`;
