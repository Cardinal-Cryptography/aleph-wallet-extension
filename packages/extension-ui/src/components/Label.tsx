// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode;
  className?: string;
  label: string;
  active?: boolean | '';
}

function Label({ active = false, children, className, label }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export default styled(Label)(
  ({ active, theme }: Props) => `
  color: ${theme.textColor};
  display: inline-block;
  position: relative;
  width: 100%;

  label {
    font-size: ${active ? theme.inputLabelFontSize : '16px'};
    line-height: 14px;
    letter-spacing: 0.04em;
    opacity: 0.65;
    margin-bottom: 8px;
    position: absolute;
    top: ${active ? '8px' : '26px'};
    left: 16px;
    transition: all 0.2s ease-out;
  }
`
);
