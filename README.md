# FlowPost AI Desktop

[![CI](https://github.com/xuanthoan/auto_creat_content_public_fb/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/xuanthoan/auto_creat_content_public_fb/actions/workflows/ci.yml)

FlowPost AI là ứng dụng desktop React + Tauri để chuẩn bị nội dung Facebook. Bản hiện tại bao gồm dashboard và kho media lưu trực tiếp trên ổ cứng; media không được tải lên máy chủ bên thứ ba.

## Yêu cầu

- Node.js 20 trở lên.
- Rust stable và Cargo.
- Các system dependency của Tauri 2 dành cho hệ điều hành đang sử dụng.

Hướng dẫn cài system dependency chính thức: <https://v2.tauri.app/start/prerequisites/>.

## Chạy giao diện trên trình duyệt

```bash
npm install
npm run dev
```

Mở <http://localhost:1420>. Chế độ trình duyệt không có quyền nhập media vào vùng dữ liệu desktop.

## Chạy ứng dụng desktop

```bash
npm install
npm run tauri:dev
```

Trong ứng dụng, mở **Thư viện media** → **Nhập media**. File được sao chép vào thư mục dữ liệu riêng của FlowPost AI, vì vậy việc xóa hoặc di chuyển file gốc không ảnh hưởng đến kho media.

## Đóng gói bộ cài

```bash
npm run tauri:build
```

Bộ cài được tạo trong `src-tauri/target/release/bundle/`. Định dạng phụ thuộc hệ điều hành build: MSI/NSIS trên Windows, DMG trên macOS và AppImage/deb/rpm trên Linux.

> Tauri không cross-compile bộ cài desktop theo cách thông thường. Hãy build bản Windows trên Windows, bản macOS trên macOS và bản Linux trên Linux.

## Lưu trữ cục bộ

Rust backend tạo thư mục `media` bên trong app data directory của hệ điều hành và lưu `media-index.json` tại cùng vị trí. Mỗi file được đổi sang UUID khi sao chép để tránh trùng tên; tên gốc, loại file, dung lượng và thời điểm nhập vẫn được giữ trong index.

Token Facebook và API key OpenAI Compatible Provider **không nên** lưu trong frontend hoặc file index này. Đã dùng secure credential store của hệ điều hành (`secure-credentials.json` + keyring) và chỉ chuyển secret sang Rust backend khi gọi API.
