# Agent Deck APK v1.3

Signed APK: `dist/AgentDeck.apk` (package `com.nico.deck`, minSdk 24, targetSdk 34).

## What is inside
- Home-screen Care widget: one-press FREE RAM with measured MB freed + live RAM readout (`CareWidget.java`, `res/layout/widget_care.xml`, `res/xml/care_widget_info.xml`).
- Native screens: STATUS / APPS / TOOLS / AI / WEB DECK (`MainActivity.java`), WebView deck shell (`WebActivity.java`).
- AI tab: SEND PHONE REPORT to the Agent Exchange ring, CHECK INBOX (2h), SEND MESSAGE ON RING.
- WHATSAPP BY VOICE: speech recognition fills the message, the app asks to confirm, then opens WhatsApp with the text pre-filled (user taps send in WhatsApp; Android forbids silent in-app sending).
- SPEAK FULL COMMAND: free ram / open <app> / status / settings / WhatsApp message.
- POST ANYWHERE: file picker + Android share sheet, so any video on the phone can be handed to LinkedIn, WhatsApp, Instagram, TikTok and more with one tap.
- On-device Nicodiff Lab via assets/models/nicodiff_unet.onnx (WebView deck, Lab tab).

## Rebuild locally
Needs JDK 17, Android build-tools r34, platform android-34:
```bash
export PATH=$JAVA17BIN:$PATH
BT=$SDK/build-tools/34.0.0; PLAT=$SDK/platforms/android-34/android.jar
$BT/aapt2 compile --dir res -o res.zip
$BT/aapt2 link -I $PLAT --manifest AndroidManifest.xml -A assets --min-sdk-version 24 --target-sdk-version 34 --java gen -o base.apk res.zip
javac --release 8 -cp $PLAT -d classes gen/com/nico/deck/R.java java/com/nico/deck/*.java
$BT/d8 --release --lib $PLAT --output dexout classes/com/nico/deck/*.class
(cd dexout && zip -q -u ../base.apk classes.dex)
$BT/zipalign -f 4 base.apk aligned.apk
keytool -genkeypair -keystore deck.ks -alias deck -keyalg RSA -keysize 2048 -validity 10000 -storepass ... -keypass ... -dname "CN=Nico AI Studio,O=Reez Digital,C=NG"
$BT/apksigner sign --ks deck.ks --out AgentDeck.apk aligned.apk
$BT/apksigner verify AgentDeck.apk
```
Ring URL baked in: `https://zippy-nova-m44b5ul.tmp.now/api/exchange` (update `RING` in MainActivity.java when the permanent deployment replaces it).
