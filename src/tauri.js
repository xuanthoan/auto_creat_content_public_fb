export const isDesktop = () => '__TAURI_INTERNALS__' in window

export async function invokeDesktop(command, args) {
  if (!isDesktop()) throw new Error('Tính năng này chỉ hoạt động trong ứng dụng desktop.')
  return window.__TAURI__.core.invoke(command, args)
}

export async function localAssetUrl(path) {
  if (!isDesktop()) return ''
  return window.__TAURI__.core.convertFileSrc(path)
}
