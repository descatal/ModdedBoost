use std::fs;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::time::UNIX_EPOCH;

use md5::Context;
use tauri::{AppHandle, Manager};
use tokio::fs::OpenOptions;
use tokio::io::{AsyncReadExt, AsyncSeekExt, AsyncWriteExt};

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct FileMetadata {
    path: String,
    checksum: String,
    last_modified: u64,
}

pub async fn clear_cached_metadata(
    app: &AppHandle,
) -> Result<(), ()> {
    let mut config_dir = app.path().app_config_dir().unwrap_or(std::path::PathBuf::new());
    config_dir.push(".metadata_cache.dat");
    
    if Path::exists(&config_dir) {
        fs::remove_file(&config_dir).expect("file deletion failed");
    } 
    
    Ok(())
}

pub async fn get_cached_metadata(
    app: &AppHandle,
    file_paths: Vec<String>,
    ignore_modtime: bool,
) -> Result<(Vec<FileMetadata>), ()> {
    println!("Getting cached local file metadata");

    let mut config_dir = app.path().app_config_dir().unwrap_or(std::path::PathBuf::new());
    config_dir.push(".metadata_cache.dat");

    let mut file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open(&config_dir)
        .await
        .expect("Failed to open file.");

    let mut file_content = String::new();
    file.read_to_string(&mut file_content).await.expect("Failed to read from file.");
    let mut file_metadata_cache = serde_json::from_str::<Vec<FileMetadata>>(&file_content).unwrap_or_else(|_| Vec::new());
    
    let mut result: Vec<FileMetadata> = Vec::new();
    for file_path in file_paths {
        let path: &Path = Path::new(&file_path);
        if (!path.is_file() || !path.exists()) {
            continue;
        }
        
        let file_last_modified = get_file_modified_epoch(&file_path).await.unwrap();
        let mut into_iter = file_metadata_cache.clone().into_iter();
        match into_iter.find(|file_metadata| file_metadata.path == *file_path) {
            Some(mut file) => {
                let cache_last_modified = file.last_modified;
                if (ignore_modtime || cache_last_modified != file_last_modified) {
                    file.checksum = get_checksum(&file_path).await;
                    file.last_modified = file_last_modified.clone();
                    // Update the item in the cache
                    if let Some(index) = file_metadata_cache.iter().position(|item| item.path == *file_path) {
                        file_metadata_cache[index] = file.clone();
                    }
                }
                result.push(file.clone());
            }
            None => {
                let path = file_path.clone();
                let checksum = get_checksum(&file_path).await;
                let file_metadata = FileMetadata {
                    path,
                    checksum,
                    last_modified: file_last_modified,
                };
                file_metadata_cache.push(file_metadata.clone());
                result.push(file_metadata);
            }
        }
    }

    let serialized_result = serde_json::to_string_pretty(&file_metadata_cache.clone()).expect("Error parsing to Json.");
    file.set_len(0).await.unwrap();
    file.rewind().await.unwrap();
    file.write_all(serialized_result.as_bytes()).await.expect("Failed to write to file.");
    
    Ok(result)
}

pub async fn get_file_modified_epoch(
    full_path: &str,
) -> Result<(u64), ()> {
    let path: &Path = Path::new(full_path);
    if !path.exists() {
        return Err(());
    }

    let f = File::open(path).unwrap();
    let len = f.metadata().unwrap().len();
    match f.metadata().unwrap().modified().unwrap().duration_since(UNIX_EPOCH) {
        Ok(n) => Ok(n.as_secs()),
        Err(_) => panic!("SystemTime before UNIX EPOCH!"),
    }
}

async fn get_checksum(file_path: &str) -> String {
    let path: &Path = Path::new(&file_path);
    if !path.exists() {
        panic!("File not found!");
    }

    let f = File::open(path).unwrap();
    let len = f.metadata().unwrap().len();
    let buf_len = len.min(1_000_000) as usize;
    let mut buf = BufReader::with_capacity(buf_len, f);
    let mut context = Context::new();

    loop {
        let part = buf.fill_buf().unwrap();
        if part.is_empty() {
            break;
        }
        context.consume(part);
        let part_len = part.len();
        buf.consume(part_len);
    }

    let digest = context.compute();
    format!("{:x}", digest)
}