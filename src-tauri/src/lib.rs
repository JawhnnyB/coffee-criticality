use std::fs;
use std::path::PathBuf;
use tauri::Manager;

const NAMES: &[&str] = &[
    "cc.save.v2",
    "cc.save.v2.1",
    "cc.save.v2.2",
    "cc.save.v2.3",
    "cc.save.v1",
    "cc.save.v2.corrupt",
];

fn save_path(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, String> {
    if !NAMES.contains(&name) {
        return Err("bad save name".into());
    }
    let dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir.join(name))
}

#[tauri::command]
fn read_save_file(app: tauri::AppHandle, name: String) -> Result<Option<String>, String> {
    let path = save_path(&app, &name)?;
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(path).map(Some).map_err(|err| err.to_string())
}

#[tauri::command]
fn write_save_file(app: tauri::AppHandle, name: String, body: String) -> Result<(), String> {
    let path = save_path(&app, &name)?;
    fs::write(path, body).map_err(|err| err.to_string())
}

#[tauri::command]
fn remove_save_file(app: tauri::AppHandle, name: String) -> Result<(), String> {
    let path = save_path(&app, &name)?;
    if path.exists() {
        fs::remove_file(path).map_err(|err| err.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_save_file,
            write_save_file,
            remove_save_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running the desktop shell");
}
