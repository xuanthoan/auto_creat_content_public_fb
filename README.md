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

## Lấy Facebook Token (5 quyền bắt buộc)

Để tránh `Token không hợp lệ hoặc hết hạn (code 190)` (ví dụ `Application has been deleted` như ảnh lỗi Providers), hãy tạo **User Token dài hạn** trên Graph Explorer với đúng 5 scopes:

- `pages_show_list` → `GET /me/accounts` liệt kê Trang (`facebook.rs:128` `list_facebook_pages`)
- `pages_manage_posts` → `POST /{page_id}/feed` và `POST /{page_id}/photos` đăng bài (`facebook.rs:220` `publish_content`)
- `pages_read_engagement` → `likes.summary(true)` và `comments.summary(true)` trong `list_page_posts`
- `pages_read_user_content` → `message`/`created_time` trong `list_page_posts`
- `read_insights` → `post_impressions`, `post_impressions_unique`, `post_engaged_users`, `post_clicks`, `post_reactions_by_type_total`, `post_video_views` (6 metric cho tooltip 2 cột `facebook.rs:327` `get_post_insights`)

1. Mở https://developers.facebook.com/tools/explorer/ → chọn App của bạn → `User Token` → `Add a Permission` tick 5 scopes trên → `Generate Access Token` → Copy.
2. Mở FlowPost AI → `Cài đặt` → `Kết nối` → dán vào `Nhập Facebook User/Page Access Token` → `Lưu` (lưu vào `Credential Manager` `service: vn.flowpost.desktop` key `facebook_token` + `fb_page_{id}`, không vào JSON) → `Kiểm tra` phải hiện `Token hợp lệ` (`GET /me` `facebook.rs:72`), nếu `code 190` → app đã bị xóa, tạo lại ở app khác.
3. Bấm `Tải Trang` → backend `GET /me/accounts?fields=id,name,access_token` tự đổi User Token → Page Token và cache `fb_page_{id}` (`security.rs:14`). Frontend chỉ thấy `id/name`.
4. Chọn `Trang mặc định cho Lịch` → Dashboard sau 4s tự gọi `list_page_posts` + `get_post_insights` 6 metric, hover `TIẾP CẬN` hiện bảng 2 cột; nếu thiếu `read_insights` thì `reach` giữ `—` (đã có fallback `App.jsx:984`).

> Tip: User Token ngắn hạn 1-2h nên đổi sang dài hạn 60 ngày: `GET /oauth/access_token?grant_type=fb_exchange_token&client_id={app_id}&client_secret={app_secret}&fb_exchange_token={short_token}` — chỉ cần khi bạn có `APP_ID/SECRET` (FlowPost AI không lưu, bạn tự đổi trên Graph Explorer). Khi hết hạn (`code 190`) chỉ cần `Tải Trang` lại, không cần `APP_ID/SECRET` trong app (tránh lộ secret trên desktop).

## Lưu trữ cục bộ

Rust backend tạo thư mục `media` bên trong app data directory của hệ điều hành và lưu `media-index.json` tại cùng vị trí. Mỗi file được đổi sang UUID khi sao chép để tránh trùng tên; tên gốc, loại file, dung lượng và thời điểm nhập vẫn được giữ trong index.

Token Facebook và API key OpenAI Compatible Provider **không nên** lưu trong frontend hoặc file index này. Đã dùng secure credential store của hệ điều hành (`secure-credentials.json` + keyring) và chỉ chuyển secret sang Rust backend khi gọi API.
