// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';

interface Props extends ThemeProps {
  className?: string;
  children: React.ReactNode;
}

const ScrollWrapper: React.FC<Props> = ({ children, className }) => {
  return (
    <ScrollbarContainer className={className}>
      <ScrollWrapperContent>{children}</ScrollWrapperContent>
    </ScrollbarContainer>
  );
};

export default styled(ScrollWrapper)``;

const ScrollbarContainer = styled.div`
  height: 100%;
  scrollbar-color: ${({ theme }) => theme.boxBorderColor};

  width: 100vw;
  overflow-x: hidden;

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.boxBorderColor};
    border-radius: 50px;
    width: 4px;
    border-right: 4px solid #111B24;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }
`;

const ScrollWrapperContent = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 100%;

  padding-inline: 20px;
  width: 100vw;
  box-sizing: border-box;
`;
