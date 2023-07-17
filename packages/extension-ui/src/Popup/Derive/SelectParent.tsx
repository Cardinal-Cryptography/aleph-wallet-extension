// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { FormEvent, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { canDerive } from '@polkadot/extension-base/utils';

import helpIcon from '../../assets/help.svg';
import {
  AccountContext,
  ActionContext,
  Address,
  AnimatedMessage,
  Button,
  ButtonArea,
  Header,
  HelperFooter,
  InputWithLabel,
  Label,
  LearnMore,
  Svg,
  ValidatedInput,
  VerticalSpace
} from '../../components';
import { useGoTo } from '../../hooks/useGoTo';
import useTranslation from '../../hooks/useTranslation';
import { LINKS } from '../../links';
import { validateAccount, validateDerivationPath } from '../../messaging';
import { nextDerivationPath } from '../../util/nextDerivationPath';
import { Result } from '../../util/validators';
import AddressDropdown from './AddressDropdown';
import DerivationPath from './DerivationPath';

interface Props {
  className?: string;
  isLocked?: boolean;
  parentAddress: string;
  parentGenesis: string | null;
  onDerivationConfirmed: (derivation: { account: { address: string; suri: string }; parentPassword: string }) => void;
  onNextStep: () => void;
  externalString: string;
}

// match any single slash
const singleSlashRegex = /([^/]|^)\/([^/]|$)/;

function SelectParent({
  className,
  externalString,
  isLocked,
  onDerivationConfirmed,
  onNextStep,
  parentAddress,
  parentGenesis
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const { accounts, hierarchy } = useContext(AccountContext);
  const defaultPath = useMemo(() => nextDerivationPath(accounts, parentAddress), [accounts, parentAddress]);
  const [suriPath, setSuriPath] = useState<null | string>(defaultPath);
  const [parentPassword, setParentPassword] = useState<string>('');
  const [isProperParentPassword, setIsProperParentPassword] = useState(false);
  const [pathError, setPathError] = useState('');
  const passwordInputRef = useRef<HTMLDivElement>(null);
  const allowSoftDerivation = useMemo(() => {
    const parent = accounts.find(({ address }) => address === parentAddress);

    return parent?.type === 'sr25519';
  }, [accounts, parentAddress]);

  const formId = useId();

  // reset the password field if the parent address changes
  useEffect(() => {
    setParentPassword('');
  }, [parentAddress]);

  useEffect(() => {
    // forbid the use of password since Keyring ignores it
    if (suriPath?.includes('///')) {
      setPathError(t('`///password` not supported for derivation.'));
    }

    if (!allowSoftDerivation && suriPath && singleSlashRegex.test(suriPath)) {
      setPathError(t('Soft derivation is only allowed for sr25519 accounts.'));
    }
  }, [allowSoftDerivation, suriPath, t]);

  const allAddresses = useMemo(
    () =>
      hierarchy
        .filter(({ isExternal }) => !isExternal)
        .filter(({ type }) => canDerive(type))
        .map(({ address, genesisHash }): [string, string | null] => [address, genesisHash || null]),
    [hierarchy]
  );

  const _onParentPasswordEnter = useCallback((parentPassword: string): void => {
    setParentPassword(parentPassword);
    setIsProperParentPassword(!!parentPassword);
  }, []);

  const _onSuriPathChange = useCallback((path: string): void => {
    setSuriPath(path);
    setPathError('');
  }, []);

  const _onParentChange = useCallback((address: string) => onAction(`/account/derive/${address}`), [onAction]);

  const _confirmDerivation = useCallback(async (): Promise<void> => {
    if (suriPath && parentAddress && parentPassword) {
      setIsBusy(true);

      const isUnlockable = await validateAccount(parentAddress, parentPassword);

      if (isUnlockable) {
        try {
          const account = await validateDerivationPath(parentAddress, suriPath, parentPassword);

          onDerivationConfirmed({ account, parentPassword });
          onNextStep();
        } catch (error) {
          setIsBusy(false);
          setPathError(t('Invalid derivation path.'));
          console.error(error);
        }
      } else {
        setIsBusy(false);
        setIsProperParentPassword(false);
      }
    }
  }, [suriPath, parentAddress, parentPassword, onDerivationConfirmed, onNextStep, t]);

  useEffect(() => {
    setParentPassword('');
    setIsProperParentPassword(false);

    passwordInputRef.current?.querySelector('input')?.focus();
  }, [_onParentPasswordEnter]);

  const { goTo } = useGoTo();

  const footer = (
    <StyledFooter>
      <Svg
        className='icon'
        src={helpIcon}
      />
      <span>
        {t<string>('What is the difference between an\naccount and a sub-account?')}&nbsp;
        <LearnMore href={LINKS.DERIVE_SUB_ACCOUNT} />
      </span>
    </StyledFooter>
  );

  const isFormValid = isProperParentPassword && suriPath && !pathError;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isFormValid) {
      _confirmDerivation();
    }
  };

  return (
    <>
      <form
        className={className}
        id={formId}
        onSubmit={onSubmit}
      >
        <StyledHeader
          text={t<string>('Choose a sub-account derivation path for additional account organization.')}
          title={t<string>('Add sub-account')}
        />
        <AddressWrapper>
          {isLocked ? (
            <Address
              address={parentAddress}
              genesisHash={parentGenesis}
            />
          ) : (
            <Label label={t<string>('Choose Parent Account:')}>
              <AddressDropdown
                allAddresses={allAddresses}
                onSelect={_onParentChange}
                selectedAddress={parentAddress}
                selectedGenesis={parentGenesis}
              />
            </Label>
          )}
        </AddressWrapper>
        <InputWrapper ref={passwordInputRef}>
          <ValidatedInput
            component={InputWithLabel}
            data-input-password
            label={t<string>('Main account password')}
            onValidatedChange={_onParentPasswordEnter}
            shouldCheckCapsLock
            type='password'
            validator={Result.ok}
          />
          <StyledAnimatedMessage
            in={!!parentPassword && !isProperParentPassword}
            messageType='critical'
            text={t('Wrong password.')}
          />
        </InputWrapper>
        <InputWrapper>
          <DerivationPath
            defaultPath={defaultPath}
            isError={!!pathError}
            onChange={_onSuriPathChange}
            parentAddress={parentAddress}
            parentPassword={parentPassword}
            withSoftPath={allowSoftDerivation}
          />
          <StyledAnimatedMessage
            in={!suriPath}
            messageType='critical'
            text={t('Derivation path is required.')}
          />
          <StyledAnimatedMessage
            in={!!pathError}
            messageType='critical'
            text={pathError}
          />
        </InputWrapper>
      </form>
      <VerticalSpace />
      <ButtonArea footer={footer}>
        <Button
          isDisabled={isBusy}
          onClick={goTo(`/account/edit-menu/${parentAddress}?isExternal=${externalString}`)}
          secondary
          type='button'
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          form={formId}
          isBusy={isBusy}
          isDisabled={!isFormValid}
          type='submit'
        >
          {t<string>('Next')}
        </Button>
      </ButtonArea>
    </>
  );
}

const StyledAnimatedMessage = styled(AnimatedMessage)`
  margin-inline: 16px;
`;

const StyledFooter = styled(HelperFooter)`
  .icon {
    margin-bottom: 12px;
  }
  gap: 8px;
`;

const StyledHeader = styled(Header)`
  margin-bottom: 16px;
`;

const AddressWrapper = styled.div`
  margin-bottom: 24px;
`;

const InputWrapper = styled.div`
  &:not(:last-child) {
    margin-bottom: 16px;
  }

  & > :not(:last-child) {
    margin-bottom: 8px;
  }
`;

export default React.memo(SelectParent);
