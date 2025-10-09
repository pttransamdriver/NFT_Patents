/**
 * Base singleton class to eliminate duplicate singleton patterns across services
 */
export abstract class BaseSingleton {
  private static instances = new Map<new() => any, any>();

  constructor() {
    const constructor = this.constructor as new() => any;
    if (BaseSingleton.instances.has(constructor)) {
      return BaseSingleton.instances.get(constructor);
    }
    BaseSingleton.instances.set(constructor, this);
  }

  /**
   * Get singleton instance of the service
   */
  public static getInstance<T extends BaseSingleton>(this: new() => T): T {
    if (!BaseSingleton.instances.has(this)) {
      BaseSingleton.instances.set(this, new this());
    }
    return BaseSingleton.instances.get(this);
  }
}