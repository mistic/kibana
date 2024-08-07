/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { PromptResponse } from '@kbn/elastic-assistant-common';
import { Conversation } from '../../../../assistant_context/types';

export const getSelectedConversations = (
  allSystemPrompts: PromptResponse[],
  conversationSettings: Record<string, Conversation>,
  systemPromptId: string
) => {
  return Object.values(conversationSettings).filter((conversation) => {
    const conversationSystemPrompt = allSystemPrompts.find(
      (prompt) => prompt.id === conversation?.apiConfig?.defaultSystemPromptId
    );
    return conversationSystemPrompt?.id === systemPromptId;
  });
};
