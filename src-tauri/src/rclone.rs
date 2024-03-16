use std::fs::File;
use std::io::{LineWriter, Write};
use std::path::PathBuf;
use std::process::Stdio;

use configparser::ini::Ini;
use tauri::{AppHandle, Manager};
use tauri::path::BaseDirectory;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use crate::os::{get_os, OS};

pub async fn rclone(
    app: &AppHandle,
    command: &str,
    remote: &str,
    remote_path: &str,
    target_path: &str,
    additional_flags: &str,
    exclude_items: Vec<String>,
    listener_id: &str,
) -> Result<bool, ()> {
    let rclone_name = match get_os() {
        OS::Windows => "rclone-win.exe",
        OS::Linux => "rclone-linux.exe",
        OS::Macos => "rclone-mac.exe",
    };

    let rclone_path = app.path()
        .resolve(format!("tools/rclone/{}", rclone_name), BaseDirectory::AppData)
        .expect("failed to resolve resource");

    let rclone_conf_path = app.path()
        .resolve("tools/rclone.conf", BaseDirectory::AppData)
        .expect("failed to resolve resource");
    
    let exclusion_list_path = app.path()
        .resolve("exclude_files.txt", BaseDirectory::Temp)
        .unwrap();

    // Create a new exclusion list file
    let file = File::create(&exclusion_list_path).unwrap();
    let mut writer = LineWriter::new(file);

    for line in exclude_items.iter() {
        writer.write_all(format!("{}\n", line).as_bytes()).unwrap()
    }

    // Refetch cookie for teracloud
    if remote == "teracloud" {
        // parse the conf
        let mut config = Ini::new();
        config.load(&rclone_conf_path).unwrap();

        // https://wani.teracloud.jp/ds/dav/11f24a9855df6b18/ --> WebDav link
        let url = config.get(remote, "url").unwrap();

        // https://wani.teracloud.jp/v2/api/share/public/11f24a9855df6b18 --> Share link
        let share_url = url.replace("/ds/dav/", "/v2/api/share/public/");

        let client = reqwest::Client::new();
        let res = client
            .post(share_url)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .send()
            .await
            .expect("api request failed!");

        let cookie = res.headers().get("Set-Cookie").unwrap().to_str().unwrap().to_owned();
        config.set(remote, "headers", Option::from(format!("Cookie,\"{}\"", cookie))).unwrap();
        config.write(&rclone_conf_path).expect("rclone config save failed");
    }

    let arg_pairs: Vec<&str> = additional_flags.split("--").collect();

    let mut cmd = Command::new(rclone_path);
    
    cmd.arg(command)
        .arg("--progress")
        .arg("--exclude-from")
        .arg(&exclusion_list_path.clone().into_os_string().to_str().unwrap());

    for pair in arg_pairs {
        let trimmed = pair.trim();
        if !trimmed.is_empty() {
            let parts: Vec<&str> = trimmed.split(' ').collect();
            cmd.arg(format!("--{}", parts[0]));
            if parts.len() > 1 {
                cmd.arg(parts[1]);
            }
        }
    }

    cmd.arg(format!("{}", remote_path))
        .arg(format!("{}", target_path));

    println!("{}", format!("{:?}", cmd).replace("\"", ""));
    
    // Specify that we want the command's standard output piped back to us.
    // By default, standard input/output/error will be inherited from the
    // current process (for example, this means that standard input will
    // come from the keyboard and standard output/error will go directly to
    // the terminal if this process is invoked from the command line).
    cmd.stdout(Stdio::piped());

    let mut child = cmd.spawn()
        .expect("failed to spawn command");

    let stdout = child.stdout.take()
        .expect("child did not have a handle to stdout");

    let mut reader = BufReader::new(stdout).lines();

    // Ensure the child process is spawned in the runtime, so it can
    // make progress on its own while we await for any output.
    tokio::spawn(async move {
        let status = child.wait().await
            .expect("child process encountered an error");

        println!("child status was: {}", status);
    });

    let mut execution_success = true;
    let event_name = format!("rclone_{}", listener_id).to_string();
    app.emit(&event_name, "start").expect("failed to emit progress!");
    while let Some(line) = reader.next_line().await.expect("") {
        app.emit(&event_name, format!("\r{}", line)).expect("failed to emit progress!");
        println!("\r{}", line);
        
        if line.to_lowercase().contains("errors:") { 
            execution_success = false
        }
    }
    app.emit(&event_name, "end").expect("failed to emit progress!");
    
    Ok(execution_success)
}