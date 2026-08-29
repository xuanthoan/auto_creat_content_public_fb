export const isDesktop = () => '__TAURI_INTERNALS__' in window

export async function invokeDesktop(command, args) {
  if (!isDesktop()) throw new Error('Tính năng này chỉ hoạt động trong ứng dụng desktop.')
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke(command, args)
}

export async function localAssetUrl(path) {
  if (!isDesktop()) return ''
  const { convertFileSrc } = await import('@tauri-apps/api/core')
  return convertFileSrc(path)
}
