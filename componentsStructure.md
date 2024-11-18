# コンポーネントの構造
子要素から検討していく
## User 一旦ＯＫ
propsに持たせている要素は以下のようになっている
```
{
  id,
  setting : {
      name,
      avatar系のやつ
  },
  position : {
      x, y
  },
  state : {
      isSelf    //自分かを判定
      isHolding  //ユーザがマウス移動してるか
      isWriting  //チャットに何か書いてるか
      isInRange  //メインユーザから一定距離にいるか
  },
  chatText : { //変更の可能性あり，正直普段のやり取りはcurrentのみで十分
    current,
    previous
  }
}
```
メインユーザの場合はマウスによる移動
サブユーザの場合はUser内での処理は，不連続な移動を滑らかにするための処理(現在のstyleのleftとrightの位置から設定されたpositionまでの移動)
**どちらもleftとrightの位置を計算後にtransitionで滑らかに移動させた方が良い**
メインユーザのマウス移動は20msで，サブユーザの更新は20msで位置計算と再レンダリング
メインユーザの場合は自身の位置情報とisHolding情報に関しては，ProviderのuserMapRefのcontextの方にmainUserIdRefのContext使用して更新しておくことでUsersで使用可能
userMapRefのメインユーザのIsWritnigやChatTExtの更新があった場合には，~~useEffectでメインユーザは検知してstate変化で更新しておく（0.1秒でUsersからの更新が入るので正直必要ないかも）~~
Users側のupdate処理によって一定時間ごとに更新される。

***一個に気になるのは、マウスムーブ時にマウス位置の更新をしているので、スクロールだけとかした場合はその位置が反映されない
⇒ｕｓｅＥｆｆｅｃｔでスクロールやズームの変更を取得して、マウスの位置をｒｅｆに更新する方向で***

***アバターの作成***

役割：ユーザの目標位置に対するtransitionを用いた移動，userMapRefのisHoldingやpositionの更新

## Users 一旦disconnect書ければＯＫ
USersではContextに持たせておいたmainUserIdRefにログイン後IDメッセージ受け取ったタイミングで格納しておく．
またcontextのuserMapRefに全ユーザ情報を格納しておいて，サブユーザの情報は受けとったメッセージを元にメインユーザの内容はUserからの変更があるので正直関係ない
userMapRefの値はメッセージ毎に更新される可能性があるので，**0.1秒ごとにstate変更による再更新はかけておく，キー設定しておいて値変化なければ再レンダリング不発でパフォーマンス下げないようになるはず**(このタイミングでメインユーザのisHoldingついてたらIsInrangeの計算関数を起動しておく，positionのメッセージが来たタイミングでもその更新を発生させておく)
役割：メッセージを元にuserMapRefを更新，IsInRangeの計算，0.1秒後毎に再レンダリングをトリガー

## Field
フィールドのスクロール情報等をrefを用いてUserまでバケツリレーしていく（一旦さぼる）
それ以外は一旦なし，しいて言うならデザイン作成時にこの辺でフィールドｎアニメーション入るかも

## Menu　
userMapRefを用いたメンバーの表示や，Chat送信時にはuserMapRefの更新とmainUSerIdRefを用いたsendMessageの実施が行われる
メニュー内容は，チャット送信，みんなのチャットの表示（messageの受領が必要），メンバー一覧の表示（選択したユーザへの移動実装するならuserMapRefへの干渉は発生するね），設定情報の更新（userMapRefの更新）がある
この辺は常時更新したいものではないので，useEffectによる更新がメインになると思う

## ログイン サインイン
この辺は一旦放置だけど頑張るよ

## WebsockerRenderみたいなやつ
websocket接続が確立されるまで下位の要素を出さないようにする中継役

## Providers
全体を囲む要素で，Menuでもusersでも共有したい内容をcontextで保持する
mainUSerIDRefとuserMapRefが共有したい内容になると思う


