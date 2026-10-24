import { createElement, type ComponentType } from 'react';

export function pageModule(loader: () => Promise<{ default: ComponentType }>) {
  let Page: ComponentType | undefined;
  let pending: Promise<void> | undefined;
  let failure: unknown;
  const load = () =>
    (pending ??= loader().then(
      (module) => {
        Page = module.default;
        failure = undefined;
      },
      (error: unknown) => {
        pending = undefined;
        failure = error;
        throw error;
      }
    ));
  const Component = () => {
    if (failure) {
      const error = failure;
      failure = undefined;
      throw error;
    }
    if (!Page) throw load();
    return createElement(Page, {});
  };
  return { Component, load, isLoaded: () => Page !== undefined };
}
