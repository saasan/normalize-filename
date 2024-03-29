import { move, WalkEntry } from 'https://deno.land/std@0.167.0/fs/mod.ts';
import {
    basename,
    dirname,
    join,
    normalize,
    resolve
} from 'https://deno.land/std@0.167.0/path/mod.ts';

//------------------------------------------------------------------------------
// ファイル名を正規化する関数を生成する
//------------------------------------------------------------------------------
type NormalizeFilename = (str: string) => string;
function generateNormalizeFilename(): NormalizeFilename {
    // 全角半角
    // \/:*?"<>|はWindosのファイル名に使えない
    const fullWidth = /[＃＄％＆＇（）＋，－．０-９；＝＠Ａ-Ｚ［］＾＿｀ａ-ｚ｛｝]/g;
    // 全角と半角のcodePointの差
    const diff = '０'.codePointAt(0)! - '0'.codePointAt(0)!;
    // 結合文字
    const combiningChar = /[うか-とは-ほゝウカ-トハ-ホワ-ヲヽ]\u{3099}|[は-ほハ-ホ]\u{309A}/gu;
    // その他記号
    const symbols = [
        ["·", "・"],
        ["‐", "-"],
        ["‑", "-"],
        ["’", "'"],
        ["♯", "#"],
        ["　", " "],
        ["〜", "～"]
    ];

    return ((str: string): string => {
        // 正規化した文字列
        let normalized = str;

        // 全角半角
        normalized = normalized.replace(fullWidth, match => String.fromCodePoint(match.codePointAt(0)! - diff));
        // 結合文字
        normalized = normalized.replace(combiningChar, match => match.normalize());
        // その他記号
        for (const [key, value] of symbols) {
            const regexp = new RegExp(key, 'g')
            normalized = normalized.replace(regexp, value)
        }

        return normalized;
    });
}
export const normalizeFilename = generateNormalizeFilename();

//------------------------------------------------------------------------------
// ファイル/フォルダ名を変更する
//------------------------------------------------------------------------------
async function rename(path: string) {
    const name = basename(path);
    const newName = normalizeFilename(name);
    const newPath = join(dirname(path), newName);

    if (newName != name) {
        console.log(`${path}\n-> ${newName}`);
        try {
            await move(path, newPath);
        }
        catch (e) {
            throw new Error(`ファイル名の変更に失敗しました。: ${e.message}`);
        }
    }
}

//------------------------------------------------------------------------------
// Create WalkEntry for the `path` asynchronously
// https://deno.land/std@0.145.0/fs/_util.ts?codeview=#L61
//------------------------------------------------------------------------------
async function createWalkEntry(path: string): Promise<WalkEntry> {
    path = normalize(path);
    const name = basename(path);
    const info = await Deno.stat(path);
    return {
        path,
        name,
        isFile: info.isFile,
        isDirectory: info.isDirectory,
        isSymlink: info.isSymlink,
    };
}

//------------------------------------------------------------------------------
// フォルダ内のフォルダとファイルを深いディレクトリ優先で取得する
//------------------------------------------------------------------------------
async function* reverseWalk(root: string): AsyncIterableIterator<WalkEntry> {
    for await (const entry of Deno.readDir(root)) {
        const path = join(root, entry.name);

        if (entry.isDirectory) {
            yield* reverseWalk(path);
        }
        else if (entry.isFile) {
            yield { path, ...entry };
        }
    }

    yield await createWalkEntry(root);
}

//------------------------------------------------------------------------------
// キー入力を待つ
//------------------------------------------------------------------------------
async function waitKey() {
    console.log('Press any key to continue...');
    Deno.stdin.setRaw(true);
    await Deno.stdin.read(new Uint8Array(1024));
    Deno.stdin.setRaw(false);
}

//------------------------------------------------------------------------------
// メイン
//------------------------------------------------------------------------------
export async function main(args: string[]) {
    if (args.length === 0) {
        console.error('処理対象のファイルまたはフォルダを指定してください。');
        Deno.exit(1);
    }

    await Promise.all(args.map(async arg => {
        const absolutePath = resolve(arg);
        const stat = await Deno.lstat(absolutePath);

        if (stat.isDirectory) {
            console.log(`処理対象フォルダ: ${absolutePath}`);
            for await (const entry of reverseWalk(absolutePath)) {
                await rename(entry.path).catch(e => console.error(e));
            }
        }
        else if (stat.isFile) {
            console.log(`処理対象ファイル: ${absolutePath}`);
            await rename(absolutePath).catch(e => console.error(e));
        }
    }));

    console.log('完了');

    if (Deno.build.os === 'windows') {
        await waitKey();
    }
}

if (import.meta.main) {
    main(Deno.args);
}
