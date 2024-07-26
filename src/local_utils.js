'use strict';

function convert_form_data_to_dict(formData) {
    let data = {}
    formData.forEach((value, key) => {
        data[key] = value
    })
    return data
}

function file_sep(file_name) {
    let starts_with_volume_letter = /^[A-Za-z]:\\/
    let starts_with_slash = /^\//

    if(starts_with_volume_letter.test(file_name)) {
        // WINDOWS
        return "\\"
    } else if(starts_with_slash.text(file_name)) {
        // LINUX/MAC
        return "/"
    } else if(file_name.includes('\\')) {
        return "\\"
    } else if(file_name.includes("/")) {
        return "/"
    } else {
        throw new Error(`Not sure what file path separator we are using: '${file_name}'`)
    }
}

function get_directory_from_path(file_path) {
    if(file_sep(file_path) === "\\"){
        return file_path.substring(0, file_path.lastIndexOf('\\'));
    } else {
        return file_path.substring(0, file_path.lastIndexOf('/'));
    }
}

function is_null_or_empty(value) {
    return value == null || String(value).trim() === ""
}