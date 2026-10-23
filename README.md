# 甩尾卡丁車 Drift Kart

瀏覽器上的 3D 卡丁車競速遊戲：6 台性能不同的車、4 條有髮夾彎、上下坡和跳台的賽道，可以跟電腦比賽，也可以用房間代碼和朋友連線對戰。

**開始玩：** https://871201billy-dev.github.io/drift-kart/

## 操作

| 按鍵 | 功能 |
|---|---|
| ↑ / W | 加速（放開會中斷氮氣） |
| ↓ / S | 煞車、倒車 |
| ← → / A D | 轉向 |
| Shift | 起甩（按越久甩越大） |
| Space / Ctrl | 氮氣 |
| R | 復位 |
| Esc | 選單 |
| M | 靜音 |

## 多人連線

選「多人連線」→「建立新房間」，把 4 碼房間代碼傳給朋友，朋友輸入代碼加入，房主按開始。連線透過公用的 MQTT 伺服器轉送（broker.emqx.io，連不上時改用 broker.hivemq.com），不需要兩台電腦直接互連，各自在家用不同網路也能玩。部分公司或學校網路可能會擋這類連線。

## 開發

- `src/drift-kart.artifact.html`：claude.ai Artifact 版本（使用平台的 room 連線）
- `tools/build_standalone.py`：把它轉成這個網站的 `index.html`，連線換成 `tools/mqttroom.js`

```
python tools/build_standalone.py src/drift-kart.artifact.html index.html
```
