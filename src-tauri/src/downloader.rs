use std::collections::HashMap;

use futures_util::TryStreamExt;
use serde::{ser::Serializer, Serialize};
use tauri::{command, Manager, Runtime, Window};
use tokio::{
    fs::File,
    io::{AsyncWriteExt, BufWriter},
};

type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Request(#[from] reqwest::Error),
    #[error("{0}")]
    ContentLength(String),
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[derive(Clone, Serialize)]
struct ProgressPayload {
    id: u32,
    progress: u64,
    total: u64,
}

// Shamelessly taken from https://github.com/tauri-apps/tauri-plugin-upload/blob/v1/src/lib.rs
// The original does not accumulate the progress, and I am too lazy to find a way to implement a background task service for js to keep track of the progress
#[command]
pub async fn custom_downloader<R: Runtime>(
    window: Window<R>,
    id: u32,
    url: &str,
    file_path: &str,
    headers: HashMap<String, String>,
) -> Result<u32> {
    let client = reqwest::Client::new();

    let mut request = client.get(url);
    // Loop trought the headers keys and values
    // and add them to the request object.
    for (key, value) in headers {
        request = request.header(&key, value);
    }

    let response = request.send().await?;
    let total = response.content_length().unwrap_or(0);

    let mut file = BufWriter::new(File::create(file_path).await?);
    let mut stream = response.bytes_stream();
    let mut accumulated_progress: u64 = 0; // Accumulate
    let event_name = format!("download://progress/{}", id);

    while let Some(chunk) = stream.try_next().await? {
        file.write_all(&chunk).await?;
        accumulated_progress += chunk.len() as u64;
        let _ = window.emit(
            &event_name,
            ProgressPayload {
                id,
                progress: accumulated_progress,
                total,
            },
        );
    }
    file.flush().await?;

    Ok(id)
}
