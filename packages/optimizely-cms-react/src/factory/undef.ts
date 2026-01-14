import { ComponentType, ComponentTypeDictionary, type ComponentFactory } from "./types.js";

export class UndefinedComponentFactory implements ComponentFactory {
  get ignoredContracts() : string[] {
    throw new Error("Factory not specified, please specify a factory.");
  }
  set ignoredContracts(newList: string[]) {
    throw new Error("Factory not specified, please specify a factory.");
  }
  has(): boolean {
    throw new Error("Factory not specified, please specify a factory.");
  }
  register(): void {
    throw new Error("Factory not specified, please specify a factory.");
  }
  registerAll(): void {
    throw new Error("Factory not specified, please specify a factory.");
  }
  resolve(): ComponentType | undefined {
    throw new Error("Factory not specified, please specify a factory.");
  }
  extract(): ComponentTypeDictionary {
    throw new Error("Factory not specified, please specify a factory.");
  }
}

export default UndefinedComponentFactory
