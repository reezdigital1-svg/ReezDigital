package com.nico.deck;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.ActivityManager;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.StatFs;
import android.os.SystemClock;
import android.provider.Settings;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;
import android.webkit.JavascriptInterface;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.util.List;

public class WebActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> fileCb;
    private static final int FILE_REQ = 42;

    class Bridge {
        @JavascriptInterface public boolean isNative() { return true; }

        @JavascriptInterface public String deviceInfo() {
            try {
                JSONObject o = new JSONObject();
                o.put("model", Build.MODEL);
                o.put("brand", Build.BRAND);
                o.put("device", Build.DEVICE);
                o.put("androidVersion", Build.VERSION.RELEASE);
                o.put("sdk", Build.VERSION.SDK_INT);
                o.put("cpuCores", Runtime.getRuntime().availableProcessors());

                ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
                ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
                am.getMemoryInfo(mi);
                o.put("ramTotalGb", round2(mi.totalMem / 1073741824.0));
                o.put("ramAvailGb", round2(mi.availMem / 1073741824.0));
                o.put("ramLow", mi.lowMemory);
                o.put("ramPctUsed", round2(100.0 * (mi.totalMem - mi.availMem) / mi.totalMem));

                StatFs st = new StatFs(Environment.getDataDirectory().getPath());
                long total = st.getTotalBytes(), avail = st.getAvailableBytes();
                o.put("romTotalGb", round2(total / 1073741824.0));
                o.put("romFreeGb", round2(avail / 1073741824.0));
                o.put("romFreePct", round2(100.0 * avail / total));

                Intent bat = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
                if (bat != null) {
                    int level = bat.getIntExtra("level", -1), scale = bat.getIntExtra("scale", 100);
                    int status = bat.getIntExtra("status", -1);
                    o.put("batteryPct", level >= 0 ? Math.round(100.0 * level / scale) : -1);
                    o.put("batteryCharging", status == BatteryManager.BATTERY_STATUS_CHARGING
                            || status == BatteryManager.BATTERY_STATUS_FULL);
                    o.put("batteryTempC", bat.getIntExtra("temperature", -1) / 10.0);
                    int health = bat.getIntExtra("health", -1);
                    o.put("batteryHealth", health == BatteryManager.BATTERY_HEALTH_GOOD ? "good"
                            : health == BatteryManager.BATTERY_HEALTH_OVERHEAT ? "overheating"
                            : health == BatteryManager.BATTERY_HEALTH_DEAD ? "dead"
                            : health == BatteryManager.BATTERY_HEALTH_COLD ? "cold" : "unknown");
                }
                o.put("upTimeHrs", round2((double) SystemClock.elapsedRealtime() / 3600000.0));
                return o.toString();
            } catch (Exception e) { return "{\"error\":\"" + e.getMessage() + "\"}"; }
        }

        @JavascriptInterface public String apps() {
            try {
                PackageManager pm = getPackageManager();
                List<PackageInfo> all = pm.getInstalledPackages(0);
                JSONArray arr = new JSONArray();
                for (PackageInfo pi : all) {
                    if (pi == null || pi.packageName == null) continue;
                    JSONObject a = new JSONObject();
                    a.put("pkg", pi.packageName);
                    try {
                        ApplicationInfo ai = pi.applicationInfo;
                        a.put("label", String.valueOf(pm.getApplicationLabel(ai)));
                        a.put("system", (ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
                        File f = new File(ai.publicSourceDir != null ? ai.publicSourceDir : "");
                        a.put("apkMb", f.exists() ? round2(f.length() / 1048576.0) : -1);
                        a.put("launchable", pm.getLaunchIntentForPackage(pi.packageName) != null);
                    } catch (Exception e) {
                        a.put("label", pi.packageName); a.put("system", false); a.put("apkMb", -1); a.put("launchable", false);
                    }
                    a.put("version", pi.versionName == null ? "?" : pi.versionName);
                    arr.put(a);
                }
                JSONObject o = new JSONObject();
                o.put("apps", arr);
                o.put("count", arr.length());
                return o.toString();
            } catch (Exception e) { return "{\"error\":\"" + e.getMessage() + "\"}"; }
        }

        @JavascriptInterface public boolean launchApp(String pkg) {
            try {
                Intent i = getPackageManager().getLaunchIntentForPackage(pkg);
                if (i == null) return false;
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(i);
                return true;
            } catch (Exception e) { return false; }
        }

        @JavascriptInterface public boolean killBackground(String pkg) {
            try {
                ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
                am.killBackgroundProcesses(pkg);
                return true;
            } catch (Exception e) { return false; }
        }

        @JavascriptInterface public boolean freeRam() {
            try {
                ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
                List<ActivityManager.RunningAppProcessInfo> procs = am.getRunningAppProcesses();
                int killed = 0;
                if (procs != null) for (ActivityManager.RunningAppProcessInfo p : procs) {
                    if (p.importance >= ActivityManager.RunningAppProcessInfo.IMPORTANCE_BACKGROUND) {
                        am.killBackgroundProcesses(p.processName); killed++;
                    }
                }
                return killed > 0;
            } catch (Exception e) { return false; }
        }

        @JavascriptInterface public boolean openAppInfo(String pkg) {
            try {
                Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                i.setData(Uri.parse("package:" + pkg));
                startActivity(i);
                return true;
            } catch (Exception e) { return false; }
        }

        @JavascriptInterface public boolean openStorageSettings() {
            try { startActivity(new Intent(Settings.ACTION_INTERNAL_STORAGE_SETTINGS)); return true; }
            catch (Exception e) {
                try { startActivity(new Intent(Settings.ACTION_SETTINGS)); return true; }
                catch (Exception e2) { return false; }
            }
        }

        @JavascriptInterface public boolean openMemorySettings() {
            for (String brand : new String[]{"com.samsung.android.lool", "com.miui.securitycenter",
                    "com.transsion.phonemaster"}) {
                try {
                    Intent i = getPackageManager().getLaunchIntentForPackage(brand);
                    if (i != null) { i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(i); return true; }
                } catch (Exception ignore) {}
            }
            try { startActivity(new Intent(Settings.ACTION_SETTINGS)); return true; }
            catch (Exception e) { return false; }
        }

        @JavascriptInterface public boolean openUrl(String url) {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); return true; }
            catch (Exception e) { return false; }
        }

        @JavascriptInterface public void toast(String m) {
            runOnUiThread(() -> Toast.makeText(WebActivity.this, m, Toast.LENGTH_SHORT).show());
        }
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setBackgroundColor(Color.parseColor("#070B14"));
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb,
                    WebChromeClient.FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                try { startActivityForResult(p.createIntent(), FILE_REQ); }
                catch (Exception e) { fileCb = null; return false; }
                return true;
            }
            @Override public boolean onJsAlert(WebView v, String url, String msg, final JsResult r) {
                Toast.makeText(WebActivity.this, msg, Toast.LENGTH_LONG).show();
                r.confirm(); return true;
            }
            @Override public boolean onJsConfirm(WebView v, String url, String msg, final JsResult r) {
                r.confirm(); return true;
            }
            @Override public boolean onJsPrompt(WebView v, String url, String msg, String def,
                    final JsPromptResult r) {
                LinearLayout box = new LinearLayout(WebActivity.this);
                box.setOrientation(LinearLayout.VERTICAL);
                int pad = (int) (16 * getResources().getDisplayMetrics().density);
                box.setPadding(pad, pad, pad, 0);
                android.widget.TextView tv = new android.widget.TextView(WebActivity.this);
                tv.setText(msg);
                tv.setTextColor(Color.WHITE);
                final EditText et = new EditText(WebActivity.this);
                et.setText(def == null ? "" : def);
                box.addView(tv); box.addView(et);
                new AlertDialog.Builder(WebActivity.this)
                    .setTitle("Agent Deck")
                    .setView(box)
                    .setPositiveButton("OK", (d, w) -> r.confirm(et.getText().toString()))
                    .setNegativeButton("Cancel", (d, w) -> r.cancel())
                    .setOnCancelListener(d -> r.cancel())
                    .show();
                return true;
            }
        });
        web.loadUrl("file:///android_asset/index.html");
    }

    @Override protected void onActivityResult(int rq, int rc, Intent data) {
        if (rq == FILE_REQ && fileCb != null) {
            Uri[] out = null;
            if (rc == RESULT_OK) {
                Uri u = data != null ? data.getData() : null;
                if (u != null) out = new Uri[]{ u };
            }
            fileCb.onReceiveValue(out);
            fileCb = null;
            return;
        }
        super.onActivityResult(rq, rc, data);
    }

    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
