# コンポーネントの構造
子要素から検討していく
## User
メインユーザの場合はマウスによる移動
サブユーザの場合はUser内での処理は，不連続な移動を滑らかにするための処理

propsに持たせている要素は
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

```


## Providers
全体を囲む要素で，Menuでもusersでも共有したい内容をcontextで保持する


