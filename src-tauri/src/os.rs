use std::env;

#[derive(Clone, PartialEq, serde::Serialize)]
pub enum OS {
    Windows,
    Linux,
    Macos,
}

pub fn get_os() -> OS {
    match env::consts::OS {
        "windows" => OS::Windows,
        "linux" => OS::Linux,
        "macos" => OS::Macos,
        _ => panic!("Unsupported operating system"),
    }
}
