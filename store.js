let store = null;

export function getStore () {
  return store;
}

export function setStore (object) {
  store = object;
  return store;
}
