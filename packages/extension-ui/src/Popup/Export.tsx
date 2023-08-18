// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { saveAs } from 'file-saver';
import React, { FormEvent, useCallback, useContext, useId, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import {
  ActionContext,
  Address,
  AnimatedMessage,
  Button,
  ButtonArea,
  InputWithLabel,
  VerticalSpace,
  WarningBox
} from '../components';
import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import { exportAccount } from '../messaging';
import { Header } from '../partials';

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

function Export({
  className,
  match: {
    params: { address }
  }
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { show } = useToast();
  const [isBusy, setIsBusy] = useState(false);
  const [pass, setPass] = useState('');
  const [isProvidedPassWrong, setIsProvidedPassWrong] = useState(false);

  const formId = useId();

  const _goTo = (path: string) => () => onAction(path);

  const onPassChange = useCallback((password: string) => {
    setPass(password);
    setIsProvidedPassWrong(false);
  }, []);

  const _onExport = useCallback((): void => {
    setIsBusy(true);

    exportAccount(address, pass)
      .then(({ exportedJson }) => {
        const blob = new Blob([JSON.stringify(exportedJson)], { type: 'application/json; charset=utf-8' });

        saveAs(blob, `AlephZeroSigner_${address}.json`);
        show(t<string>('Export successful'), 'success');
        onAction('..');
      })
      .catch((error: Error) => {
        console.error(error);
        setIsProvidedPassWrong(true);
        setIsBusy(false);
      });
  }, [address, onAction, pass, show, t]);

  const isFormValid = Boolean(pass && !isProvidedPassWrong);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isFormValid) {
      _onExport();
    }
  };

  return (
    <>
      <Header
        text={t<string>('Export account')}
        withBackArrow
        withHelp
      />
      <div className={className}>
        <WarningBox
          description={
            <WarningList>
              <li>{t<string>('Do not share your JSON file - whoever gets hold of it, gains full control of your accounts.')}</li>
              <li>{t<string>('Store your password safely - you are going to need it to import the account.')}</li>
            </WarningList>
          }
          title={t<string>('Keep in mind!')}
        />
        <Address address={address} />
        <form
          className='password-container'
          id={formId}
          onSubmit={onSubmit}
        >
          <InputWithLabel
            data-export-password
            disabled={isBusy}
            isError={isProvidedPassWrong}
            label={t<string>('Password')}
            onChange={onPassChange}
            type='password'
            value={pass}
          />
          <StyledAnimatedMessage
            in={isProvidedPassWrong}
            messageType='critical'
            text={t('Unable to decode using the supplied passphrase.')}
          />
        </form>
      </div>
      <VerticalSpace />
      <ButtonArea>
        <Button
          onClick={_goTo(`..`)}
          secondary
          type='button'
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          className='export-button'
          data-export-button
          form={formId}
          isBusy={isBusy}
          isDisabled={!isFormValid}
          type='submit'
        >
          {t<string>('Export')}
        </Button>
      </ButtonArea>
    </>
  );
}

const StyledAnimatedMessage = styled(AnimatedMessage)`
  margin-inline: 16px;
`;

export default withRouter(styled(Export)`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 32px;

  .password-container {
    position: relative;

    & > :not(:last-child) {
      margin-bottom: 8px;
    }
  }

  .center {
    margin: auto;
  }

  .export-button {
    margin-top: 6px;
  }

  .movedWarning {
    margin-top: 8px;
  }

  .withMarginTop {
    margin-top: 4px;
  }
`);

const WarningList = styled.ul`
  padding: 0;
`;
