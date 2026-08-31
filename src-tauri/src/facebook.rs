use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Debug, Deserialize, Serialize)]
pub struct MeResponse {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageInfo {
    pub id: String,
    pub name: String,
}

#[derive(Deserialize)]
struct GraphErrorResponse {
    error: GraphError,
}

#[derive(Deserialize)]
struct GraphError {
    message: String,
    #[serde(rename = "type")]
    #[allow(dead_code)]
    error_type: Option<String>,
    code: Option<i32>,
    #[allow(dead_code)]
    error_subcode: Option<i32>,
}

fn graph_base() -> String {
    "https://graph.facebook.com/v19.0".to_string()
}

fn page_token_key(page_id: &str) -> String {
    format!("fb_page_{}", page_id)
}

pub fn parse_me_response(json: &str) -> Result<MeResponse, String> {
    serde_json::from_str::<MeResponse>(json).map_err(|e| e.to_string())
}

fn map_graph_error(status: u16, body: &str) -> String {
    // Try to parse Graph error JSON
    if let Ok(err) = serde_json::from_str::<GraphErrorResponse>(body) {
        let code = err.error.code.unwrap_or(0);
        let msg = err.error.message;
        // Common OAuth errors
        if code == 190 || status == 401 {
            return format!("Token không hợp lệ hoặc hết hạn (code {}): {}", code, msg);
        }
        if code == 100 {
            return format!("Tham số không hợp lệ (code 100): {}", msg);
        }
        return format!("Lỗi Graph API ({}): {}", code, msg);
    }
    format!("Lỗi HTTP {}: {}", status, body.chars().take(300).collect::<String>())
}

#[tauri::command]
pub async fn validate_facebook_token(token: String) -> Result<MeResponse, String> {
    let token = token.trim().to_string();
    if token.is_empty() {
        return Err("Vui lòng nhập Facebook Token".into());
    }
    if token.len() < 10 {
        return Err("Token quá ngắn, vui lòng kiểm tra lại".into());
    }

    let url = format!("{}/me?fields=id,name&access_token={}", graph_base(), urlencoding::encode(&token));

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Không thể kết nối Graph API: {}", e))?;

    let status = resp.status().as_u16();
    let body = resp.text().await.map_err(|e| e.to_string())?;

    if status >= 200 && status < 300 {
        parse_me_response(&body).map_err(|e| format!("Phản hồi không hợp lệ: {} | body: {}", e, &body[..body.len().min(200)]))
    } else {
        Err(map_graph_error(status, &body))
    }
}

// Helper for urlencoding without extra crate (reqwest already has urlencoding via `url` crate if needed, but we add manual)
mod urlencoding {
    pub fn encode(input: &str) -> String {
        let mut out = String::new();
        for b in input.bytes() {
            match b {
                b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => out.push(b as char),
                _ => out.push_str(&format!("%{:02X}", b)),
            }
        }
        out
    }
}

#[tauri::command]
pub async fn list_facebook_pages(app: AppHandle, token: String) -> Result<Vec<PageInfo>, String> {
    let token = token.trim().to_string();
    let token = if token.is_empty() {
        // Thử lấy từ keyring/fallback nếu frontend gửi rỗng (PublishModal dùng token: '')
        crate::security::get_secret_hybrid(Some(&app), "facebook_token")
            .ok()
            .flatten()
            .unwrap_or_default()
    } else {
        token
    };
    if token.is_empty() {
        return Err("Vui lòng nhập Facebook Token".into());
    }
    if token.len() < 10 {
        return Err("Token quá ngắn, vui lòng kiểm tra lại".into());
    }
    let url = format!(
        "{}/me/accounts?fields=id,name,access_token&access_token={}",
        graph_base(),
        urlencoding::encode(&token)
    );
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Không thể kết nối Graph API: {}", e))?;
    let status = resp.status().as_u16();
    let body = resp.text().await.map_err(|e| e.to_string())?;
    if status >= 200 && status < 300 {
        let v: serde_json::Value = serde_json::from_str(&body).map_err(|_| "Phản hồi Graph API không hợp lệ".to_string())?;
        let mut pages = Vec::new();
        if let Some(arr) = v.get("data").and_then(|d| d.as_array()) {
            for raw in arr {
                if let (Some(id), Some(name), Some(at)) = (
                    raw.get("id").and_then(|x| x.as_str()),
                    raw.get("name").and_then(|x| x.as_str()),
                    raw.get("access_token").and_then(|x| x.as_str()),
                ) {
                    let key = page_token_key(id);
                    let _ = crate::security::set_secret_hybrid(Some(&app), &key, at);
                    pages.push(PageInfo { id: id.to_string(), name: name.to_string() });
                }
            }
        }
        Ok(pages)
    } else {
        Err(map_graph_error(status, &body))
    }
}

#[tauri::command]
pub async fn publish_content(
    app: AppHandle,
    page_id: String,
    message: String,
    image_path: Option<String>,
) -> Result<serde_json::Value, String> {
    if page_id.trim().is_empty() {
        return Err("Thiếu pageId".into());
    }
    if message.trim().is_empty() {
        return Err("Vui lòng nhập nội dung".into());
    }
    if image_path.is_some() {
        return Err("Tải ảnh lên chưa được hỗ trợ trong phiên bản này".into());
    }
    // Resolve token: ưu tiên Page token đã cache, fallback User token
    let access_token = crate::security::get_secret_hybrid(Some(&app), &page_token_key(&page_id))
        .ok()
        .flatten()
        .or_else(|| {
            crate::security::get_secret_hybrid(Some(&app), "facebook_token")
                .ok()
                .flatten()
        })
        .ok_or("Không tìm thấy Page/User token, vui lòng Tải Trang lại".to_string())?;
    if access_token.trim().is_empty() {
        return Err("Không tìm thấy Page/User token, vui lòng Tải Trang lại".into());
    }
    let url = format!("{}/{}/feed", graph_base(), page_id.trim());
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    let params = [("message", message.as_str()), ("access_token", access_token.as_str())];
    let resp = client
        .post(&url)
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Không thể kết nối Graph API: {}", e))?;
    let status = resp.status().as_u16();
    let body = resp.text().await.map_err(|e| e.to_string())?;
    if status >= 200 && status < 300 {
        serde_json::from_str::<serde_json::Value>(&body).map_err(|_| "Không parse được phản hồi".into())
    } else {
        Err(map_graph_error(status, &body))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_me_response_ok() {
        let json = r#"{"id":"123456789","name":"Test User"}"#;
        let me = parse_me_response(json).unwrap();
        assert_eq!(me.id, "123456789");
        assert_eq!(me.name, "Test User");
    }

    #[test]
    fn test_parse_me_response_invalid() {
        let json = r#"{"error": "bad"}"#;
        assert!(parse_me_response(json).is_err());
    }

    #[test]
    fn test_map_graph_error_oauth() {
        let body = r#"{"error":{"message":"Invalid OAuth access token","type":"OAuthException","code":190,"error_subcode":460}}"#;
        let msg = map_graph_error(400, body);
        assert!(msg.contains("Token không hợp lệ"));
        assert!(msg.contains("190"));
    }

    #[test]
    fn test_map_graph_error_generic() {
        let body = r#"{"error":{"message":"Missing param","type":"GraphMethodException","code":100}}"#;
        let msg = map_graph_error(400, body);
        assert!(msg.contains("100"));
    }

    #[test]
    fn test_validate_token_empty() {
        // We test the sync validation part via a helper
        // Since validate_facebook_token is async and does network, we test parse logic only here
        // Empty token should be caught before network in real command
        assert!(parse_me_response("").is_err());
    }
}
