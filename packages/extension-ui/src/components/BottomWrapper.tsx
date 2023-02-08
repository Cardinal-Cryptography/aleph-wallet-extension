// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';

interface Props extends ThemeProps {
  className?: string;
  children: React.ReactNode;
}

const BottomWrapper: React.FC<Props> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export default styled(BottomWrapper)(
  ({ theme }: Props) => `
  display: flex;
  backdrop-filter: blur(10px);
  flex-direction: column;
    position: sticky;
    bottom: 0;

`
);
