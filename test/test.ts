import { existsSync } from "https://deno.land/std@0.112.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.112.0/path/mod.ts";
import { assert, assertEquals } from "https://deno.land/std@0.112.0/testing/asserts.ts";
import { main, generateNormalizeFilename } from "../normalize-filename.ts";

Deno.test("normalize filename", () => {
    const nf = generateNormalizeFilename();
    const str = "０𩸽１𠮷２🌐３🌕４栁５髙６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ　＃＄％＆’（）＋，－．；＝＠［］＾＿｀｛｝♯〜·‐‑";
    const normalized = nf(str);
    assertEquals(normalized, "0𩸽1𠮷2🌐3🌕4栁5髙6789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz #$%&'()+,-.;=@[]^_`{}#～・--");
});

Deno.test("main", () => {
    const dirs = [..."０𩸽１𠮷２🌐３🌕４"];
    const filename = "５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ　＃＄％＆’（）＋，－．；＝＠［］＾＿｀｛｝♯〜·‐‑.txt";
    const normalizedDirs = [..."0𩸽1𠮷2🌐3🌕4"];
    const normalizedFilename = "56789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz #$%&'()+,-.;=@[]^_`{}#～・--.txt";

    // テンポラリディレクトリを作成
    const tempDir = Deno.makeTempDirSync();

    const dirPath = join(tempDir, ...dirs);
    const filePath = join(dirPath, filename);
    const normalizedFilePath = join(tempDir, ...normalizedDirs, normalizedFilename);

    // サブディレクトリとファイルを作成
    Deno.mkdirSync(dirPath, { recursive: true });
    const file = Deno.createSync(filePath);
    file.close();

    // 正規化前のファイルが存在することを確認
    assert(existsSync(filePath));

    // 正規化
    main([tempDir]);

    // 正規化後のファイルが存在することを確認
    assert(existsSync(normalizedFilePath));

    // 作成したテンポラリディレクトリを削除
    Deno.removeSync(tempDir, { recursive: true });
});
