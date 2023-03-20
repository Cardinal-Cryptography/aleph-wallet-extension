// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import animatedForget from '../assets/anim_vanish.svg';
import helpIcon from '../assets/help.svg';
import {
  AccountContext,
  ActionContext,
  Address,
  Button,
  ButtonArea,
  LearnMore,
  Svg,
  VerticalSpace
} from '../components';
import HelperFooter from '../components/HelperFooter';
import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import { LINKS } from '../links';
import { forgetAccount } from '../messaging';
import { Header } from '../partials';

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

const StyledAddress = styled(Address)`
  .name {
    width: 150px;
  }
`;

function Forget({
  className,
  match: {
    params: { address }
  }
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { accounts } = useContext(AccountContext);
  const [isBusy, setIsBusy] = useState(false);
  const { show } = useToast();

  const account = accounts.find((account) => account.address === address);

  const isExternal = account?.isExternal || 'false';

  const _goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  const _onClick = useCallback((): void => {
    show(t<string>('Account forgotten'), 'success', () => {
      setIsBusy(true);
      forgetAccount(address)
        .then(() => {
          setIsBusy(false);
        })
        .catch((error: Error) => {
          setIsBusy(false);
          console.error(error);
        });
    });
    onAction('/');
  }, [address, onAction, show, t]);

  const CustomFooter = styled(HelperFooter)`
  .wrapper {
    display: flex;
    gap: 8px;
    margin-left: -12px;
  }`;

  const footer = (
    <CustomFooter>
      <div className='wrapper'>
        <Svg
          className='icon'
          src={helpIcon}
        />
        <span>
          {t<string>('How to restore your account?')}&nbsp;
          <LearnMore href={LINKS.FORGET} />
        </span>
      </div>
    </CustomFooter>
  );

  return (
    <>
      <Header
        text={t<string>('Forget account')}
        withBackArrow
        withHelp
      />
      <div className={className}>
        <div className='text-container'>
          <img
            className='forgetIcon'
            key={crypto.randomUUID()}
            src={animatedForget}
          />
          <span className='heading'>{t<string>('Forget account')}</span>
          <span className='subtitle'>
            {t<string>(
              'Even though you can remove account from Aleph Zero Signer, you can restore it here or in another wallet with the secret phrase. '
            )}
          </span>
          <span className='subtitle'>
            {t<string>('Not sure if you have it? You can export JSON file and use it as well.')}
          </span>
        </div>
        <StyledAddress
          address={address}
          withExport
        />
      </div>
      <VerticalSpace />
      <ButtonArea footer={footer}>
        <Button
          isDisabled={isBusy}
          onClick={_goTo(`/account/edit-menu/${address}?isExternal=${isExternal.toString()}`)}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          isDanger
          onClick={_onClick}
        >
          {t<string>('Forget')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default withRouter(
  styled(Forget)(
    ({ theme }: Props) => `

  .text-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-top: 16px;
    margin-bottom: 16px;
    gap: 16px;
    
    .heading {
      font-weight: 700;
      font-size: 24px;
      line-height: 118%;
      letter-spacing: 0.03em;
      font-family: ${theme.secondaryFontFamily};
      color: ${theme.textColorDanger};
    }

    .subtitle {
      font-weight: 300;
      font-size: 14px;
      line-height: 145%;
      text-align: center;
      letter-spacing: 0.07em; 
      color: ${theme.subTextColor};
    }
  }

  .forgetIcon {
    margin: 0 auto;
    width: 96px;
    height: 96px;
  }

`
  )
);
