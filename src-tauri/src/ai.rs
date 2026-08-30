use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratePayload {
    pub prompt: String,
    pub style: String,
    #[serde(default)]
    pub custom_style: Option<String>,
    #[serde(default)]
    pub length: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateResult {
    pub title: String,
    pub body: String,
    pub prompt: String,
    pub style: String,
    pub is_mock: bool,
}

fn mock_generate(payload: &GeneratePayload) -> GenerateResult {
    let style_label = if payload.style == "Custom" {
        payload
            .custom_style
            .as_deref()
            .filter(|s| !s.trim().is_empty())
            .unwrap_or("Custom")
    } else {
        &payload.style
    };
    let words: Vec<&str> = payload.prompt.split_whitespace().take(8).collect();
    let snippet = if words.is_empty() {
        "Nội dung mới".to_string()
    } else {
        words.join(" ")
    };
    let title = format!("[{}] {}", style_label, snippet);
    let length_hint = payload.length.as_deref().unwrap_or("Vừa");
    let body = format!(
        "Nội dung mẫu ({}, {}) cho \"{}\".\n\n\
        Đây là bản mock để demo Kho nội dung trước khi nối OmniRoute API thật. \
        Bạn có thể chỉnh sửa tiêu đề và nội dung, gắn media, rồi Lưu vào kho.\n\n\
        Style: {} | Độ dài: {} | Prompt gốc: {}",
        style_label,
        if payload.custom_style.is_some() { "custom" } else { "preset" },
        payload.prompt,
        style_label,
        length_hint,
        payload.prompt
    );
    GenerateResult {
        title,
        body,
        prompt: payload.prompt.clone(),
        style: payload.style.clone(),
        is_mock: true,
    }
}

#[tauri::command]
pub fn generate_content(payload: GeneratePayload) -> Result<GenerateResult, String> {
    if payload.prompt.trim().is_empty() {
        return Err("Vui lòng nhập prompt".into());
    }
    if payload.style.trim().is_empty() {
        return Err("Vui lòng chọn style".into());
    }
    // Mock implementation for Phase 1 demo. Real OmniRoute proxy will be added later:
    // - Read omniroute_key from secure store (keyring + fallback)
    // - reqwest POST to https://api.omniroute.xxx/v1/chat/completions with Bearer token
    // For now, always return mock to allow Kho demo without API key.
    Ok(mock_generate(&payload))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mock_generate_basic() {
        let p = GeneratePayload {
            prompt: "Bí quyết năng lượng buổi sáng".into(),
            style: "Viral".into(),
            custom_style: None,
            length: Some("Ngắn".into()),
        };
        let r = mock_generate(&p);
        assert!(r.title.contains("Viral"));
        assert!(r.title.contains("Bí quyết"));
        assert!(r.is_mock);
        assert!(r.body.contains("Bí quyết năng lượng"));
    }

    #[test]
    fn test_mock_custom_style() {
        let p = GeneratePayload {
            prompt: "Hello world".into(),
            style: "Custom".into(),
            custom_style: Some("Hài hước GenZ".into()),
            length: None,
        };
        let r = mock_generate(&p);
        assert!(r.title.contains("Hài hước GenZ"));
        assert!(r.body.contains("Hài hước GenZ"));
    }

    #[test]
    fn test_generate_content_validation() {
        let p = GeneratePayload {
            prompt: "   ".into(),
            style: "Viral".into(),
            custom_style: None,
            length: None,
        };
        let err = generate_content(p).unwrap_err();
        assert!(err.contains("prompt"));
    }

    #[test]
    fn test_generate_content_empty_style() {
        let p = GeneratePayload {
            prompt: "Hello".into(),
            style: "   ".into(),
            custom_style: None,
            length: None,
        };
        let err = generate_content(p).unwrap_err();
        assert!(err.contains("style"));
    }
}
