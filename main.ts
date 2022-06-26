import { move, WalkEntry } from "https://deno.land/std@0.145.0/fs/mod.ts";
import {
    basename,
    dirname,
    join,
    normalize,
    resolve
} from "https://deno.land/std@0.145.0/path/mod.ts";

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
// メイン
//------------------------------------------------------------------------------
export async function main(args: string[]) {
    if (args.length === 0) {
        console.error("処理対象のファイルまたはフォルダを指定してください。");
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

    console.log("完了");
}

if (import.meta.main) {
    main(Deno.args);
}
