/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { PrivacySettings } from './privacySettings';


export async function get_global_access()
{
    let global_context: vscode.ExtensionContext|undefined = global.global_context;
    if (global_context === undefined) {
        return 0;
    }
    let access: number|undefined = await global_context.globalState.get('global_access');
    if (access === undefined) {
        // FIXME: get from login
        await global_context.globalState.update('global_access', 2);
        return 2;
    }
    if (typeof access !== 'number') {
        access = Number(access);
    }
    return access;
}

export async function set_global_access(new_global_default: number)
{
    if (typeof new_global_default !== 'number') {
        new_global_default = Number(new_global_default);
    }
    let global_context: vscode.ExtensionContext|undefined = global.global_context;
    if (global_context !== undefined) {
        await global_context.globalState.update('global_access', new_global_default);
        console.log(['Global Access set to:', new_global_default]);
        PrivacySettings.update_webview(PrivacySettings._panel);
    }
}

export async function set_access_override(uri: string, mode: number)
{
    let global_context: vscode.ExtensionContext|undefined = global.global_context;
    if (global_context === undefined) {
        return;
    }
    let data: {[key: string]: number} = {};
    let storage: {[key: string]: number}|undefined = await global_context.globalState.get('codifyAccessOverrides');
    if (storage !== undefined) {
        data = storage;
    }
    data[uri] = mode;
    console.log(['Setting access override:', uri, mode]);
    console.log(["type", typeof mode]);
    await global_context.globalState.update('codifyAccessOverrides', data);
    PrivacySettings.update_webview(PrivacySettings._panel);
}

export async function delete_access_override(uri: string)
{
    let global_context: vscode.ExtensionContext|undefined = global.global_context;
    if (global_context === undefined) {
        return;
    }
    let storage: {[key: string]: number}|undefined = await global_context.globalState.get('codifyAccessOverrides');
    if(storage === undefined) {
        storage = {};
    } else {
        delete storage[uri];
        console.log(['Override deleted:', uri]);
    }
    await global_context.globalState.update('codifyAccessOverrides', storage);
    PrivacySettings.update_webview(PrivacySettings._panel);
}

export async function get_access_overrides(): Promise<{[key: string]: number}>
{
    let global_context: vscode.ExtensionContext|undefined = global.global_context;
    if (global_context === undefined) {
        return {};
    }
    let storage: {[key: string]: number}|undefined = await global_context.globalState.get('codifyAccessOverrides');
    if(storage === undefined) {
        return {};
    }
    return storage;
}

export async function get_file_access(uri: string)
{
    let global_context: vscode.ExtensionContext|undefined = global.global_context;
    if (global_context === undefined) {
        return 0;
    }
    // This code implements this logic: if inference_url is set (private server), then all disable all third party,
    // because the user cares about privacy to bother setting up a private server.
    // Later we found it's better to give users third party APIs on their own server.
    // let inference_url = vscode.workspace.getConfiguration().get("refactai.infurl");
    // inference_url is never undefined (because of package.json)
    // if (inference_url !== "") {
    //     return 1;
    // }
    let storage: {[key: string]: number}|undefined = global_context.globalState.get('codifyAccessOverrides');
    if(storage === undefined) {
        return await get_global_access();
    }
    let segments = uri.split('/');
    let segments_cnt = segments.length;
    for(let i = 0; i < segments_cnt; i++) {
        let temp = segments.join('/');
        // console.log(['checking', temp]);
        if(storage[temp] !== undefined) {
            console.log(['=> found override', storage[temp]]);
            global.status_bar.choose_color();
            return storage[temp];
        }
        segments.pop();
    }
    let g =  await get_global_access();
    // console.log(['=> revert to global default', g]);
    return g;
}
