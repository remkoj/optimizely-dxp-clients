import { ComponentType, ComponentTypeDictionary, ComponentTypeHandle, type ComponentFactory } from "./types.js";

export class UndefinedComponentFactory implements ComponentFactory {
  get ignoredContracts() : string[] {
    throw new Error("Factory not specified, please specify a factory.");
  }
  set ignoredContracts(newList: string[]) {
    throw new Error("Factory not specified, please specify a factory.");
  }
  has(type: ComponentTypeHandle): boolean {
    throw new Error("Factory not specified, please specify a factory.");
  }
  register(type: ComponentTypeHandle, componentType: ComponentType): void {
    throw new Error("Factory not specified, please specify a factory.");
  }
  registerAll(components: ComponentTypeDictionary): void {
    throw new Error("Factory not specified, please specify a factory.");
  }
  resolve(type: ComponentTypeHandle): ComponentType | undefined {
    throw new Error("Factory not specified, please specify a factory.");
  }
  extract(): ComponentTypeDictionary {
    throw new Error("Factory not specified, please specify a factory.");
  }
}

export default UndefinedComponentFactory
