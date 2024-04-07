use std::path::Path;

use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use tokio::fs;
use tokio::fs::{File, OpenOptions};
use tokio::io::{AsyncReadExt, AsyncSeekExt, AsyncWriteExt};

// Define an untagged enum to handle both cases
// # With the 'enabled' key
// BLJS10250:
//   All:
//     Enabled: true
// 
// # Without the 'enabled' key
// BLJS10250:
//   All: true
#[derive(Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum GameVersion {
    Bool(bool),
    Struct {
        Enabled: bool,
    },
}

#[derive(Serialize, Deserialize, PartialEq)]
pub struct GameId {
    #[serde(flatten)]
    pub versions: HashMap<String, GameVersion>,
}

#[derive(Serialize, Deserialize, PartialEq)]
pub struct GameTitle {
    #[serde(flatten)]
    pub ids: HashMap<String, GameId>,
}

#[derive(Serialize, Deserialize, PartialEq)]
pub struct Setting {
    #[serde(flatten)]
    pub titles: HashMap<String, GameTitle>,
}

#[derive(Serialize, Deserialize, PartialEq)]
pub struct PpuSpu {
    #[serde(flatten)]
    pub settings: HashMap<String, Setting>,
}

type YamlData = HashMap<String, PpuSpu>;

#[tauri::command]
pub async fn check_patch_activated(
    patch_path: &str,
) -> Result<bool, ()> {
    let path: &Path = Path::new(&patch_path);
    if !path.exists() { return Ok(false) }

    let mut file = File::open(&path).await.unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).await.expect("failed to read file contents!");
    let serde_parse: Result<YamlData, _> = serde_yaml::from_str(&contents);
    
    match serde_parse { 
        Ok(serde_parse) => {
            let entry_v1: PpuSpu = serde_yaml::from_str(r#"
                AddUnitSupport:
                  Gundam Extreme Vs. Full Boost:
                    BLJS10250:
                      All:
                        Enabled: true
                    NPJB00512:
                      All:
                        Enabled: true
            "#).expect("huh");
            
            let entry_v2: PpuSpu = serde_yaml::from_str(r#"         
              AddUnitSupport:
                Gundam Extreme Vs. Full Boost:
                  BLJS10250:
                    All: true
                  NPJB00512:
                    All: true
            "#).expect("huh");

            let ppu_spu_hash = "PPU-a787b532b03b2ebc3970a1d405639b05bec1a506";
            if let Some(existing_entry) = serde_parse.get(ppu_spu_hash) {
                if existing_entry == &entry_v1 || existing_entry == &entry_v2 {
                    return Ok(true);
                }
            }
        }
        Err(error) => { 
            // Print the error
            println!("{:?}", error);
            return Ok(false); 
        }
    } 
    
    Ok(false)
}

#[tauri::command]
pub async fn activate_patch(
    patch_path: &str,
) -> Result<bool, ()> {
    let path: &Path = Path::new(&patch_path);
    if !path.exists() { 
        // Create an empty file
        std::fs::File::create(path).expect("create failed");
    }

    let mut file = OpenOptions::new()
        .read(true)
        .write(true)
        .open(&path)
        .await
        .unwrap();    
    let mut contents = String::new();
    file.read_to_string(&mut contents).await.expect("failed to read file contents!");
    let serde_parse: Result<YamlData, _> = serde_yaml::from_str(&contents);

    return match serde_parse {
        Ok(mut serde_parse) => {
            let new_entry: PpuSpu = serde_yaml::from_str(r#"
                AddUnitSupport:
                  Gundam Extreme Vs. Full Boost:
                    BLJS10250:
                      All:
                        Enabled: true
                    NPJB00512:
                      All:
                        Enabled: true
            "#).expect("huh");

            let ppu_spu_hash = "PPU-a787b532b03b2ebc3970a1d405639b05bec1a506";
            if let Some(mut existing_entry) = serde_parse.get(ppu_spu_hash) {
                existing_entry = &new_entry;
            } else {
                serde_parse.insert(ppu_spu_hash.to_string(), new_entry);
            }
            
            let backup_path = path.with_extension("bak");
            fs::copy(&path, &backup_path).await.expect("failed to create backup");

            // Serialize the data to a YAML string and write it to the file
            let yaml = serde_yaml::to_string(&serde_parse).expect("failed to serialize yaml");
            file.set_len(0).await.unwrap();
            file.rewind().await.unwrap();
            file.write_all(yaml.as_bytes()).await.expect("failed to write yaml file");
            Ok(true)
        }
        Err(_) => Ok(false)
    }
}