// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Meta, StoryObj } from '@storybook/react';

import React, { useState } from 'react';

import { EMPTY_SEED_WORDS, SEED_WORDS_LENGTH } from '@polkadot/extension-ui/Popup/ImportSeed/consts';

import { MnemonicInput } from '.';

export default {
  component: MnemonicInput,
  argTypes: {
    showError: { name: 'Is error shown' }
  },
  args: {
    showError: false
  }
} satisfies Meta<typeof MnemonicInput>;

const MnemonicInputWrapper = ({ showError }: { showError: boolean }) => {
  const [seedWords, setSeedWords] = useState(EMPTY_SEED_WORDS);

  const onInputChange = (nextSeedWords: string[]) =>
    setSeedWords([...nextSeedWords, ...EMPTY_SEED_WORDS].slice(0, SEED_WORDS_LENGTH));

  return (
    <MnemonicInput
      onChange={onInputChange}
      seedWords={seedWords}
      showError={showError}
    />
  );
};

type Story = StoryObj<typeof MnemonicInputWrapper>;

export const Primary: Story = {
  render: (props) => <MnemonicInputWrapper {...props} />
};
