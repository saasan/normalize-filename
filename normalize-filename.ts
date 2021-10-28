import { existsSync } from "https://deno.land/std@0.112.0/fs/mod.ts";
import {
    basename,
    dirname,
    join,
    resolve
} from "https://deno.land/std@0.112.0/path/mod.ts";

//------------------------------------------------------------------------------
// ファイル名を正規化する関数を生成する
//------------------------------------------------------------------------------
type NormalizeFilename = (str: string) => string;
function generateNormalizeFilename(): NormalizeFilename {
    // 変換する文字
    // 変換したくないものはこのリストから取り除く
    // \/:*?"<>|はWindosのファイル名に使えない
    // サロゲートペア対策のためスプレッド構文で文字単位に分割
    const IN = [..."０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ　＃＄％＆’（）＋，－．；＝＠［］＾＿｀｛｝♯〜·‐‑"];
    const OUT = [..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz #$%&'()+,-.;=@[]^_`{}#～・--"];
    const MAP = new Map<string, string>();

    if (IN.length != OUT.length) {
        throw new Error("変換する文字リストの長さが異なります。");
    }

    for (let i = 0; i < IN.length; i++) {
        MAP.set(IN[i], OUT[i]);
    }

    return ((str: string): string => {
        // サロゲートペア対策のためスプレッド構文で文字単位に分割
        const chars = [...str];
        // 正規化した文字列
        let normalized = "";

        for (let i = 0; i < chars.length; i++) {
            normalized += MAP.has(chars[i]) ? MAP.get(chars[i]) : chars[i];
        }

        return normalized;
    });
}
export const normalizeFilename = generateNormalizeFilename();

//------------------------------------------------------------------------------
// ファイル/フォルダ名を変更する
//------------------------------------------------------------------------------
function rename(path: string, name: string): void {
    const newName = normalizeFilename(name);
    const oldPath = join(path, name);
    const newPath = join(path, newName);

    if (newName != name) {
        if (existsSync(newPath)) {
            console.log(`${newPath} は既に存在します。`);
            return;
        }

        console.log(`${oldPath} -> ${newName}`);
        Deno.renameSync(oldPath, newPath);
    }
}

//------------------------------------------------------------------------------
// フォルダ内を再帰する
//------------------------------------------------------------------------------
function recursive(path: string): void {
    const dirEntries = Array.from(Deno.readDirSync(path));
    const dirs = dirEntries.filter(dirEntry => dirEntry.isDirectory);
    const files = dirEntries.filter(dirEntry => dirEntry.isFile);

    dirs.forEach((dir: Deno.DirEntry) => {
        const next = join(path, dir.name);
        recursive(next);
        rename(path, dir.name);
    });

    files.forEach((file: Deno.DirEntry) => {
        rename(path, file.name);
    });
}

//------------------------------------------------------------------------------
// メイン
//------------------------------------------------------------------------------
export function main(args: string[]): void {
    if (args.length === 0) {
        console.error("処理対象のファイルまたはフォルダを指定してください。");
        Deno.exit(1);
    }

    args.forEach(arg => {
        if (existsSync(arg)) {
            const absolutePath = resolve(arg);
            const stat = Deno.lstatSync(absolutePath);

            if (stat.isDirectory) {
                console.log(`処理対象フォルダ: ${absolutePath}`);
                recursive(absolutePath);
                rename(dirname(absolutePath), basename(absolutePath));
            }
            else if (stat.isFile) {
                console.log(`処理対象ファイル: ${absolutePath}`);
                rename(dirname(absolutePath), basename(absolutePath));
            }
        }
        else {
            console.log(`${arg} が見つかりません。`);
        }
    });

    console.log("完了");
}

if (import.meta.main) {
    main(Deno.args);
}
