import { useCallback, useEffect, useState } from 'react';
import type { Args, DocsContextProps, PreparedStory, StoryId, Renderer } from '@storybook/types';
import { STORY_ARGS_UPDATED, UPDATE_STORY_ARGS, RESET_STORY_ARGS } from '@storybook/core-events';
import { useStories } from './useStory';

export const useArgs = (
  story: PreparedStory,
  context: DocsContextProps
): [Args, (args: Args) => void, (argNames?: string[]) => void] => {
  const result = useArgsIfDefined(story, context);
  if (!result) throw new Error('No result when story was defined');
  return result;
};

export const useArgsIfDefined = (
  story: PreparedStory | void,
  context: DocsContextProps
): [Args, (args: Args) => void, (argNames?: string[]) => void] | void => {
  const storyContext = story ? context.getStoryContext(story) : { args: {} };
  const { id: storyId } = story || { id: 'none' };

  const [args, setArgs] = useState(storyContext.args);
  useEffect(() => {
    const onArgsUpdated = (changed: { storyId: string; args: Args }) => {
      if (changed.storyId === storyId) {
        setArgs(changed.args);
      }
    };
    context.channel.on(STORY_ARGS_UPDATED, onArgsUpdated);
    return () => context.channel.off(STORY_ARGS_UPDATED, onArgsUpdated);
  }, [storyId, context.channel]);
  const updateArgs = useCallback(
    (updatedArgs) => context.channel.emit(UPDATE_STORY_ARGS, { storyId, updatedArgs }),
    [storyId, context.channel]
  );
  const resetArgs = useCallback(
    (argNames?: string[]) => context.channel.emit(RESET_STORY_ARGS, { storyId, argNames }),
    [storyId, context.channel]
  );
  return story && [args, updateArgs, resetArgs];
};

export function useStoriesAndArgs<TRenderer extends Renderer = Renderer>(
  storyIds: StoryId[],
  context: DocsContextProps<TRenderer>
) {
  const stories = useStories(storyIds, context);
  return stories.map((story) => useArgs(story, context));
}
