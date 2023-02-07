// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { AccountContext, ActionContext, Address, Button, ButtonArea, VerticalSpace } from '../../components';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { editAccount } from '../../messaging';
import { Header, Name } from '../../partials';

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

function EditName({
  className,
  match: {
    params: { address }
  }
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { show } = useToast();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);

  const _goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  const account = accounts.find((account) => account.address === address);

  const [editedName, setName] = useState<string | undefined | null>(account?.name);

  const _onNameChange = useCallback((name: string | null): void => {
    setName(name);
  }, []);

  const _saveChanges = useCallback(async (): Promise<void> => {
    if (editedName) {
      try {
        await editAccount(address, editedName);
        onAction(`/account/edit-menu/${address}`);
        show(t<string>('Account name changed successfully'), 'success');
      } catch (error) {
        console.error(error);
      }
    }
  }, [editedName, address, show, t, onAction]);

  return (
    <>
      <Header
        showBackArrow
        showHelp
        text={t<string>('Account name')}
      />
      <div className={className}>
        <Address address={address} />
        <div className='name'>
          <Name
            label=' '
            onChange={_onNameChange}
            value={account?.name}
          />
        </div>
      </div>
      <VerticalSpace />
      <ButtonArea>
        <Button
          onClick={_goTo(`/account/edit-menu/${address}`)}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          isDisabled={!editedName}
          onClick={_saveChanges}
        >
          {t<string>('Save')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default withRouter(
  styled(EditName)`
    display: flex;
    flex-direction: column;
    gap: 24px;
`
);
