# normalize-filename

ファイル名を正規化する。

以前作成した
[ファイル名の全角英数を半角に変換.wsf](https://github.com/saasan/WSH/blob/master/%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E5%90%8D%E3%81%AE%E5%85%A8%E8%A7%92%E8%8B%B1%E6%95%B0%E3%82%92%E5%8D%8A%E8%A7%92%E3%81%AB%E5%A4%89%E6%8F%9B.wsf)
の
[Deno](https://deno.land/)
版。

## 変換対象文字

|変換対象|変換後|
|-|-|
|全角英数記号|半角英数記号|
|♯ (シャープ, U+266F)|# (番号記号, U+0023)|
|〜 (波ダッシュ, U+301C)|～ (全角チルダ, U+FF5E)|
|· (半角中点, U+00B7)|・ (全角中点, U+30FB)|
|‐ (Hyphen, U+2010)|- (Hyphen-Minus, U+002D)|
|‑ (Non-Breaking Hyphen, U+2011)|- (Hyphen-Minus, U+002D)|

## 実行

    deno run --unstable --allow-read --allow-write main.ts 対象ファイル/フォルダ

## コンパイル (Windows 用)

    deno compile --unstable --allow-read --allow-write --target x86_64-pc-windows-msvc main.ts

Visual Studio Code ならデフォルトのビルドタスク
(`Ctrl + Shift + B`) でコンパイル可能。
この場合 build ディレクトリに出力される。

## --unstable フラグ

`--unstable` フラグは `InputLoop` で使用されている `Deno.setRaw` のために必要。
`--unstable` フラグがない場合は `Enter` キー以外に反応しない。
