import { exists } from 'https://deno.land/std@0.167.0/fs/mod.ts';
import { join } from 'https://deno.land/std@0.167.0/path/mod.ts';
import { assert, assertEquals } from 'https://deno.land/std@0.167.0/testing/asserts.ts';
import { main, normalizeFilename } from '../main.ts';

Deno.test('全角半角', () => {
    const str = '０𩸽１𠮷２🌐３🌕４栁５髙６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ　＃＄％＆’（）＋，－．；＝＠［］＾＿｀｛｝♯〜·‐‑';
    const normalized = normalizeFilename(str);
    assertEquals(normalized, "0𩸽1𠮷2🌐3🌕4栁5髙6789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz #$%&'()+,-.;=@[]^_`{}#～・--");
});

Deno.test('結合文字', () => {
    const str = 'ゔがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽヴガギグゲゴザジズゼゾダヂヅデドバビブベボヷヸヹヺパピプペポ';
    const normalized = normalizeFilename(str);
    assertEquals(normalized, 'ゔがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽヴガギグゲゴザジズゼゾダヂヅデドバビブベボヷヸヹヺパピプペポ');
});

Deno.test('main', async () => {
    const dirs = [...'０𩸽１𠮷２🌐３🌕４'];
    const filename = '５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ　＃＄％＆’（）＋，－．；＝＠［］＾＿｀｛｝♯〜·‐‑.txt';
    const normalizedDirs = [...'0𩸽1𠮷2🌐3🌕4'];
    const normalizedFilename = "56789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz #$%&'()+,-.;=@[]^_`{}#～・--.txt";

    // テンポラリディレクトリを作成
    const tempDir = await Deno.makeTempDir();

    const dirPath = join(tempDir, ...dirs);
    const filePath = join(dirPath, filename);
    const normalizedFilePath = join(tempDir, ...normalizedDirs, normalizedFilename);

    // サブディレクトリとファイルを作成
    await Deno.mkdir(dirPath, { recursive: true });
    (await Deno.create(filePath)).close();

    try {
        // 正規化前のファイルが存在することを確認
        assert(await exists(filePath));

        // 指定したディレクトリ自体も変換されることを確認するため
        // テンポラリディレクトリのひとつ下のディレクトリに対して正規化を実行
        await main([join(tempDir, dirs[0])]);

        // 正規化後のファイルが存在することを確認
        assert(await exists(normalizedFilePath));
    }
    finally {
        // 作成したテンポラリディレクトリを削除
        await Deno.remove(tempDir, { recursive: true });
    }
});
