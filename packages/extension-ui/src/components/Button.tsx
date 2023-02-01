// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

import Spinner from './Spinner';

interface Props extends ThemeProps {
  className?: string;
  children?: React.ReactNode;
  isBusy?: boolean;
  isDanger?: boolean;
  isDisabled?: boolean;
  isSuccess?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  onClick?: () => void | "" | Promise<boolean | void> | null;
  to?: string;
}

function Button({
  children,
  className = '',
  isBusy,
  // isDanger,
  isDisabled,
  // isSuccess,
  onClick,
  secondary,
  tertiary,
  to
}: Props): React.ReactElement<Props> {
  const _onClick = useCallback((): void => {
    if (isBusy || isDisabled) {
      return;
    }

    onClick && onClick();

    if (to) {
      window.location.hash = to;
    }
  }, [isBusy, isDisabled, onClick, to]);

  return (
    <button
      className={`${className}${isDisabled || isBusy ? ' isDisabled' : ''}${isBusy ? ' isBusy' : ''}${
        secondary ? ' secondary' : ''
      }${
        tertiary ? ' tertiary' : ''
      }`}
      disabled={isDisabled || isBusy}
      onClick={_onClick}
    >
      <div className='children'>{children}</div>
      <div className='disabledOverlay' />
      <Spinner className='busyOverlay' />
    </button>
  );
}

export default styled(Button)(({ isDanger, isSuccess, secondary, tertiary, theme }: Props) => `
  background: ${
    isDanger
      ? theme.buttonBackgroundDanger
      : isSuccess
      ? theme.buttonBackgroundSuccess
      : secondary
      ? theme.buttonSecondaryBackground 
      : tertiary 
      ? theme.buttonTertiaryBackground
      : theme.buttonBackground
  };

  cursor: pointer;
  display: block;
  width: ${tertiary ? 'max-content': '100%'};
  height: ${isDanger ? '40px' : tertiary ? 'unset' : '48px'};
  box-sizing: border-box;
  border: none;
  border-radius: ${tertiary ? '2px' : theme.buttonBorderRadius};
  color: ${secondary ? theme.buttonSecondaryTextColor : tertiary ? theme.buttonTertiaryTextColor : theme.buttonTextColor};
  font-family: ${theme.secondaryFontFamily};
  font-weigth: 500;
  font-size: 16px;
  line-height: 135%;
  padding: ${tertiary ? '2px 0px;' : '0 1rem'};
  position: relative;
  text-align: center;
  letter-spacing: 0.05em;
  transition: .4s ease-in-out;

  &:disabled {
    cursor: default;
    background: ${secondary ? theme.buttonSecondaryBackgroundDisabled : tertiary ? theme.buttonTertiaryBackground : theme.buttonBackgroundDisabled};
    opacity: ${secondary || tertiary ? theme.buttonTertiaryDisabledOpacity : 1};
  }

  &:focus{
    outline: none;
    border: ${secondary ? theme.buttonSecondaryBorderFocused : tertiary ? theme.buttonTertiaryBorder : theme.buttonBorderFocused};
  }

  &:not(:disabled):hover, &:active {
    background: ${
      isDanger
        ? theme.buttonBackgroundDangerHover
        : secondary
        ? theme.buttonSecondaryBackgroundHover
        : tertiary
        ? theme.buttonTertiaryBackground
        : theme.buttonBackgroundHover
    };
    color: ${secondary ? theme.buttonSecondaryTextColor :tertiary ? theme.buttonTertiaryHoverTextColor : theme.buttonTextColor};
    box-shadow: ${secondary ? theme.buttonSecondaryHoverBoxShadow : tertiary ? 'none' : theme.buttonHoverBoxShadow};
  }
  
  
  .busyOverlay,
  .disabledOverlay {
    visibility: hidden;

  }

  .disabledOverlay {
    background: rgba(96,96,96,0.15);
    border-radius: ${tertiary ? '2px': theme.buttonBorderRadius};
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  svg {
    margin-right: 0.3rem;
  }

  &.isBusy {
    background: rgba(96,96,96,0.15);

    .children {
      font-family: ${theme.secondaryFontFamily};
      border: 1px solid ${theme.buttonTextColor};
      color: ${theme.buttonTextColor};
    }

    .busyOverlay {
      visibility: visible;
    }
  }

  &.isDisabled .disabledOverlay {
    visibility: visible;
  }

`
);
