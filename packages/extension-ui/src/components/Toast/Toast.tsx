// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SnackbarTypes, ThemeProps } from '../../types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

import useTranslation from '../../hooks/useTranslation';
import { Z_INDEX } from '../../zindex';
import * as icons from './iconsList';
import ToastCloseIcon from './ToastCloseIcon';
import { TOAST_TIMEOUT } from './ToastProvider';

interface Props extends ThemeProps {
  content: React.ReactNode;
  className?: string;
  type: SnackbarTypes;
  visible: boolean;
  undoTimeout?: NodeJS.Timeout | undefined;
  toastTimeout?: NodeJS.Timeout | undefined;
  onUndoClick?: (shouldRedirectBack: boolean) => void;
  setVisible?: (visible: boolean) => void;
}

function Toast({
  className,
  content,
  onUndoClick,
  setVisible,
  toastTimeout,
  type,
  undoTimeout
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const _getIconByType = useCallback((type: SnackbarTypes): string => icons?.[type] ?? icons.info, []);

  const _closeToast = useCallback(() => {
    setVisible && setVisible(false);
    clearTimeout(toastTimeout);
  }, [setVisible, toastTimeout]);

  const _onUndoClick = useCallback(() => {
    if (onUndoClick) {
      onUndoClick(true);
    }
  }, [onUndoClick]);

  return (
    <div className={className}>
      <div>
        <img
          className='snackbar-icon'
          src={_getIconByType(type)}
        />
      </div>
      <div className='snackbar-content'>{content}</div>
      <div className='snackbar-end-group'>
        {undoTimeout && (
          <div
            className='snackbar-undo'
            onClick={_onUndoClick}
          >
            {t<string>('Undo')}
          </div>
        )}
        <div
          className='snackbar-close'
          onClick={_closeToast}
        >
          <ToastCloseIcon animationDurationInSeconds={TOAST_TIMEOUT / 1000} />
        </div>
      </div>
    </div>
  );
}

export default styled(Toast)(
  ({ theme, type, visible }: Props) => `
  position: fixed;
  display: ${visible ? 'flex' : 'none'};
  height: 72px;
  bottom: 8px;
  left: 8px;
  right: 8px;
  flex-direction: row;
  align-items: center;
  border-radius: 4px;
  box-shadow: ${theme.toastBoxShadow};;
  gap: 14px;
  color : ${theme.toastTextColor};
  isolation: isolate;
  width: 344px;
  padding: 16px;
  box-sizing: border-box;
  animation: toast 0.2s, toast  0.2s linear ${TOAST_TIMEOUT / 1000}s reverse;
  z-index: ${Z_INDEX.TOAST}};

  @keyframes toast {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
  .snackbar-close {
    cursor: pointer;
  }
  .snackbar-undo {
    display: flex;
    width: fit-content;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    text-decoration: underline;
  }

  .snackbar-end-group {
    display: flex;
    flex-direction: row;
    gap: 8px;
  }

  .snackbar-content {
    min-width: 200px;
    font-family:  ${theme.secondaryFontFamily};
    font-weight: 500;
    font-size: 14px;
    line-height: 120%;
    letter-spacing: 0.07em;
  }

  .snackbar-icon {
    width: 20px;
    height: 20px;
  }

  && {
    border-radius: 4px;
    background: ${
      type === 'success'
        ? theme.toastSuccessBackground
        : type === 'warning'
        ? theme.toastWarningBackground
        : type === 'critical'
        ? theme.toastCriticalBackground
        : theme.toastInfoBackground
    };
  }

`
);
