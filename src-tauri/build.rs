fn main() {
    // App commands are not allowed until they are listed here. The shell then
    // generates allow-read-save-file and the matching write and remove names.
    let attributes = tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "read_save_file",
            "write_save_file",
            "remove_save_file",
        ]),
    );
    tauri_build::try_build(attributes).expect("failed to run tauri-build");
}
