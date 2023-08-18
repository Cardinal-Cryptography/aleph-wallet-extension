import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';

const getScrollIntoViewCenter = (elem: HTMLElement) => {
  elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

document.addEventListener(
  'focus',
  (event: FocusEvent) => event.target && getScrollIntoViewCenter(event.target as HTMLElement),
  true
);

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
  overflow-y: auto;

  outline-offset: -3px;

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
  overflow-x: clip;
  min-height: 100%;
  padding-top: 32px;

  padding-inline: 16px;
  width: 100vw;
  box-sizing: border-box;
`;
