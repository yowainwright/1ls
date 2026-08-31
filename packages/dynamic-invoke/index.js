export function invokeMethod(target, method, args) {
  return Reflect.apply(target[method], target, args);
}
