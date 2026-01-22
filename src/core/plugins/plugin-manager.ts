import type { Plugin, PluginContext, PluginHooks } from '@core/types/plugin.types';

type HookArgs<K extends keyof PluginHooks> = PluginHooks[K] extends (
  ...args: infer A
) => unknown
  ? A
  : never;

type HookResult<K extends keyof PluginHooks> = PluginHooks[K] extends (
  ...args: unknown[]
) => infer R
  ? R
  : never;

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  async register(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" already registered`);
      return;
    }

    try {
      await plugin.init(this.context);
      this.plugins.set(plugin.name, plugin);
      console.log(`Plugin "${plugin.name}" v${plugin.version} registered`);
    } catch (error) {
      console.error(`Failed to initialize plugin "${plugin.name}":`, error);
    }
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin?.destroy) {
      plugin.destroy();
    }
    this.plugins.delete(name);
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  async executeHook<K extends keyof PluginHooks>(
    hookName: K,
    ...args: HookArgs<K>
  ): Promise<HookResult<K>[]> {
    const results: HookResult<K>[] = [];

    for (const plugin of this.plugins.values()) {
      const hook = plugin.hooks[hookName] as
        | ((...args: HookArgs<K>) => HookResult<K>)
        | undefined;

      if (hook) {
        try {
          const result = await hook(...args);
          results.push(result);
        } catch (error) {
          console.error(
            `Error in plugin "${plugin.name}" hook "${hookName}":`,
            error
          );
        }
      }
    }

    return results;
  }

  async executePipeline<T>(hookName: keyof PluginHooks, initialValue: T): Promise<T | null> {
    let value: T | null = initialValue;

    for (const plugin of this.plugins.values()) {
      const hook = plugin.hooks[hookName] as
        | ((v: T) => T | null | Promise<T | null>)
        | undefined;

      if (hook && value !== null) {
        try {
          value = await hook(value);
        } catch (error) {
          console.error(
            `Error in plugin "${plugin.name}" pipeline "${hookName}":`,
            error
          );
        }
      }
    }

    return value;
  }

  destroy(): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.destroy) {
        plugin.destroy();
      }
    }
    this.plugins.clear();
  }
}

let instance: PluginManager | null = null;

export const getPluginManager = (context?: PluginContext): PluginManager => {
  if (!instance && context) {
    instance = new PluginManager(context);
  }
  if (!instance) {
    throw new Error('PluginManager not initialized');
  }
  return instance;
};

export const destroyPluginManager = (): void => {
  instance?.destroy();
  instance = null;
};
