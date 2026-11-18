package com.nico.deck;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.StatFs;
import android.os.SystemClock;
import android.provider.Settings;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.speech.RecognizerIntent;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;

public class MainActivity extends Activity {
    static final int BG=0xFF070B14, PANEL2=0xFF121A2C, LINE=0xFF22304A;
    static final int TEXT=0xFFEDF1F7, MUTED=0xFFA7B3C7, AMBER=0xFFF5B027;

    TextView statusText;
    EditText appSearch;
    LinearLayout appList, appsView, toolsView;
    android.view.View statusView;
    PackageManager pm;
    List<PackageInfo> allApps;
    LinearLayout aiView;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        try { pm = getPackageManager(); buildUi(); runStatus(); }
        catch (Throwable t) {
            TextView fb = new TextView(this);
            fb.setTextColor(TEXT);
            fb.setText("The app hit a problem starting:\n\n" + t +
                "\n\nClose and reopen. Send this text to the ring if it repeats.");
            setContentView(fb);
        }
    }

    void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);

        TextView head = new TextView(this);
        head.setText("AGENT DECK \u00b7 phone care v1.3");
        head.setTextColor(AMBER);
        head.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        head.setTextSize(15);
        head.setPadding(px(16), px(14), px(16), px(6));
        root.addView(head);

        LinearLayout tabs = new LinearLayout(this);
        tabs.setPadding(px(10), px(4), px(10), px(4));
        String[] names = {"STATUS", "APPS", "TOOLS", "AI", "WEB DECK"};
        for (final String n : names) {
            Button t = new Button(this);
            t.setText(n);
            t.setTextColor(TEXT);
            t.setTextSize(11);
            t.setAllCaps(false);
            t.setBackgroundColor(PANEL2);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0,
                ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            lp.setMargins(px(4), 0, px(4), 0);
            t.setLayoutParams(lp);
            t.setTag(n);
            t.setOnClickListener(v -> switchTab(n));
            tabs.addView(t);
        }
        root.addView(tabs);

        FrameLayout flip = new FrameLayout(this);
        flip.setBackgroundColor(BG);

        // STATUS
        statusText = new TextView(this);
        statusText.setTextColor(TEXT);
        statusText.setTypeface(Typeface.MONOSPACE);
        statusText.setTextSize(12.5f);
        statusText.setPadding(px(16), px(12), px(16), px(24));
        ScrollView statusScroll = new ScrollView(this);
        statusScroll.addView(statusText);
        statusView = statusScroll;
        flip.addView(statusView);

        // APPS
        appsView = buildAppsPanel();
        flip.addView(appsView);

        // TOOLS
        toolsView = buildToolsPanel();
        flip.addView(toolsView);

        // AI
        aiView = buildAiPanel();
        flip.addView(aiView);

        root.addView(flip, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        setContentView(root);
    }

    void switchTab(String n) {
        statusView.setVisibility("STATUS".equals(n) ? View.VISIBLE : View.GONE);
        appsView.setVisibility("APPS".equals(n) ? View.VISIBLE : View.GONE);
        toolsView.setVisibility("TOOLS".equals(n) ? View.VISIBLE : View.GONE);
        aiView.setVisibility("AI".equals(n) ? View.VISIBLE : View.GONE);
        if ("STATUS".equals(n)) runStatus();
        if ("APPS".equals(n)) loadApps();
        if ("WEB DECK".equals(n)) {
            try { startActivity(new Intent(this, WebActivity.class)); }
            catch (Throwable t) { toast("web deck failed to open"); }
        }
    }

    // STATUS -------------------------------------------------------------
    void runStatus() {
        StringBuilder sb = new StringBuilder();
        try {
            ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
            am.getMemoryInfo(mi);
            StatFs st = new StatFs(Environment.getDataDirectory().getPath());
            long tot = st.getTotalBytes(), av = st.getAvailableBytes();
            double romPct = 100.0 * av / tot;
            Intent bat = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
            int level = bat != null ? bat.getIntExtra("level", -1) : -1;
            int scale = bat != null ? bat.getIntExtra("scale", 100) : 100;
            int temp = bat != null ? bat.getIntExtra("temperature", -1) : -1;

            sb.append("MODEL      ").append(Build.BRAND).append(" ").append(Build.MODEL)
              .append("\n           Android ").append(Build.VERSION.RELEASE)
              .append(" \u00b7 ").append(Runtime.getRuntime().availableProcessors()).append(" CPU cores\n");
            sb.append("RAM        ").append(gb(mi.availMem)).append(" free of ").append(gb(mi.totalMem))
              .append("\n           ").append(Math.round(100.0 * (mi.totalMem - mi.availMem) / mi.totalMem))
              .append("% in use").append(mi.lowMemory ? "  !! LOW MEMORY RIGHT NOW" : "").append("\n");
            sb.append("STORAGE    ").append(gb(av)).append(" free of ").append(gb(tot))
              .append("\n           ").append(Math.round(romPct))
              .append("% free").append(romPct < 10 ? "   !! UNDER 10%: THE FREEZE MACHINE" : "").append("\n");
            if (bat != null && level >= 0) {
                sb.append("BATTERY    ").append(Math.round(100.0 * level / scale))
                  .append("% \u00b7 temp ").append(temp / 10.0).append("\u00b0C\n");
            }
            sb.append("AWAKE      ").append(String.format("%.1f", SystemClock.elapsedRealtime() / 3600000.0)).append(" h\n");
            sb.append("\nWHAT TO DO NOW\n");
            if (romPct < 10) sb.append("0. Free storage first (TOOLS tab). This alone fixes most 'app is not responding'.\n");
            sb.append("1. TOOLS > RAM expansion: turn it ON (free, uses spare storage).\n");
            sb.append("2. APPS: find the freezing app, tap FREEZE, reopen the app.\n");
            sb.append("3. TOOLS > FREE RAM when the phone feels slow.\n");
            sb.append("\nNOTE: no app can change Developer settings. Android forbids it for your safety. See TOOLS for the honest way to unlock phone power yourself.\n");
            statusText.setText(sb.toString());
        } catch (Throwable t) {
            statusText.setText("status failed: " + t);
        }
    }

    // APPS ---------------------------------------------------------------
    LinearLayout buildAppsPanel() {
        LinearLayout p = new LinearLayout(this);
        p.setOrientation(LinearLayout.VERTICAL);
        p.setBackgroundColor(BG);
        p.setPadding(px(12), px(8), px(12), px(12));

        appSearch = new EditText(this);
        appSearch.setHint("search installed apps...");
        appSearch.setTextColor(TEXT);
        appSearch.setHintTextColor(MUTED);
        appSearch.setBackgroundColor(PANEL2);
        appSearch.addTextChangedListener(new TextWatcher() {
            public void beforeTextChanged(CharSequence c, int a, int b2, int d) {}
            public void onTextChanged(CharSequence c, int a, int b2, int d) {}
            public void afterTextChanged(Editable e) { renderApps(); }
        });
        p.addView(appSearch);

        ScrollView sc = new ScrollView(this);
        appList = new LinearLayout(this);
        appList.setOrientation(LinearLayout.VERTICAL);
        sc.addView(appList);
        p.addView(sc, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        return p;
    }

    void loadApps() {
        try { allApps = pm.getInstalledPackages(0); }
        catch (Throwable t) { allApps = new ArrayList<>(); }
        renderApps();
    }

    void renderApps() {
        if (appList == null) return;
        appList.removeAllViews();
        if (allApps == null) return;
        String q = appSearch.getText() != null ? appSearch.getText().toString().toLowerCase() : "";
        List<PackageInfo> shown = new ArrayList<>();
        for (PackageInfo pi : allApps) {
            try {
                String label = label(pi).toLowerCase();
                if (q.isEmpty() || label.contains(q) || pi.packageName.toLowerCase().contains(q)) shown.add(pi);
            } catch (Throwable t) { if (q.isEmpty()) shown.add(pi); }
        }
        TextView count = new TextView(this);
        count.setTextColor(MUTED); count.setTextSize(11);
        count.setPadding(px(6), px(6), px(6), px(6));
        count.setText(shown.size() + " app(s) on this phone");
        appList.addView(count);
        Collections.sort(shown, (a, b) -> label(a).compareToIgnoreCase(label(b)));
        for (PackageInfo pi : shown) appList.addView(appRow(pi));
    }

    String label(PackageInfo pi) {
        try { return String.valueOf(pm.getApplicationLabel(pi.applicationInfo)); }
        catch (Throwable t) { return pi.packageName == null ? "?" : pi.packageName; }
    }

    LinearLayout appRow(PackageInfo pi) {
        LinearLayout row = new LinearLayout(this);
        row.setPadding(px(10), px(8), px(6), px(8));
        row.setBackgroundColor(PANEL2);
        row.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, 0, 0, px(6));
        row.setLayoutParams(lp);

        LinearLayout info = new LinearLayout(this);
        info.setOrientation(LinearLayout.VERTICAL);
        TextView name = new TextView(this);
        name.setTextColor(TEXT); name.setTextSize(13.5f);
        name.setText(label(pi));
        TextView sub = new TextView(this);
        sub.setTextColor(MUTED); sub.setTextSize(10.5f);
        long apk = -1;
        try { File f = new File(pi.applicationInfo.publicSourceDir); apk = f.exists() ? f.length() : -1; }
        catch (Throwable t) {}
        boolean system = false;
        try { system = (pi.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0; } catch (Throwable t) {}
        sub.setText(pi.packageName + (pi.versionName != null ? "  v" + pi.versionName : "")
            + (apk >= 0 ? "  \u00b7 " + (apk / 1048576) + " MB" : "") + (system ? "  \u00b7 system" : ""));
        info.addView(name); info.addView(sub);
        LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(0,
            ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        ilp.setMargins(0, 0, px(6), 0);
        info.setLayoutParams(ilp);
        row.addView(info);

        if (pm.getLaunchIntentForPackage(pi.packageName) != null) {
            row.addView(smallBtn("OPEN", () -> {
                try {
                    Intent i = pm.getLaunchIntentForPackage(pi.packageName);
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Throwable t) { toast("cannot open"); }
            }));
        }
        if (!system) {
            row.addView(smallBtn("FREEZE", () -> {
                try {
                    ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
                    am.killBackgroundProcesses(pi.packageName);
                    toast("background stopped: " + label(pi));
                } catch (Throwable t) { toast("freeze failed"); }
            }));
        }
        row.addView(smallBtn("INSPECT", () -> {
            try {
                Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                i.setData(Uri.parse("package:" + pi.packageName));
                startActivity(i);
            } catch (Throwable t) { toast("settings did not open"); }
        }));
        return row;
    }

    // TOOLS ----------------------------------------------------------------
    LinearLayout buildToolsPanel() {
        LinearLayout p = new LinearLayout(this);
        p.setOrientation(LinearLayout.VERTICAL);
        p.setBackgroundColor(BG);
        p.setPadding(px(14), px(10), px(14), px(14));

        ScrollView sc = new ScrollView(this);
        LinearLayout inner = new LinearLayout(this);
        inner.setOrientation(LinearLayout.VERTICAL);
        sc.addView(inner);

        inner.addView(bigBtn("FREE RAM NOW", () -> {
            try {
                ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
                List<ActivityManager.RunningAppProcessInfo> procs = am.getRunningAppProcesses();
                int n = 0;
                if (procs != null) for (ActivityManager.RunningAppProcessInfo pr : procs)
                    if (pr.importance >= ActivityManager.RunningAppProcessInfo.IMPORTANCE_BACKGROUND) {
                        am.killBackgroundProcesses(pr.processName); n++;
                    }
                toast("freeing RAM: trimmed " + n + " background app(s)");
            } catch (Throwable t) { toast("failed"); }
        }));
        inner.addView(bigBtn("OPEN RAM EXPANSION SETTINGS", this::openMemory));
        inner.addView(bigBtn("OPEN STORAGE SETTINGS", () -> {
            try { startActivity(new Intent(Settings.ACTION_INTERNAL_STORAGE_SETTINGS)); }
            catch (Throwable t) {
                try { startActivity(new Intent(Settings.ACTION_SETTINGS)); }
                catch (Throwable t2) { toast("failed"); }
            }
        }));
        inner.addView(bigBtn("RUN STATUS CHECK AGAIN", () -> { switchTab("STATUS"); }));

        TextView guide = new TextView(this);
        guide.setTextColor(MUTED);
        guide.setTextSize(12);
        guide.setLineSpacing(0, 1.25f);
        guide.setPadding(0, px(14), 0, 0);
        guide.setText(
            "RAM EXPANSION: where your phone hides it\n\n" +
            "Samsung: Settings > Device care > Memory > RAM Plus\n" +
            "Xiaomi/Redmi/POCO: Settings > Additional settings > Memory extension\n" +
            "Infinix/Tecno/itel (XOS/HIOS): Settings > System or Special function > Memory\n" +
            "Other phones: open Settings and search \"RAM\" or \"memory\"\n\n" +
            "Truth about RAM and ROM:\n" +
            "- No app, website or developer option can add physical RAM or storage. Only hardware does.\n" +
            "- RAM expansion borrows storage as extra memory: real help for freezes, free, safe to enable.\n" +
            "- Keep 10%+ storage free or freezes return.\n\n" +
            "Developer options, honestly:\n" +
            "- An app CANNOT change developer settings. Android forbids it to block malware.\n" +
            "- You can unlock it yourself: Settings > About phone > tap Build number 7 times.\n" +
            "- With Developer options on, wireless debugging + the free Shizuku tool gives apps ADB-level power on this phone only: no PC, no root. Say the word and we build on that next.");
        inner.addView(guide);
        p.addView(sc, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        return p;
    }

    void openMemory() {
        String[] brands = {"com.samsung.android.lool", "com.miui.securitycenter", "com.transsion.phonemaster"};
        for (String brand : brands) {
            try {
                Intent i = pm.getLaunchIntentForPackage(brand);
                if (i != null) { i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(i); return; }
            } catch (Throwable ignore) {}
        }
        try { startActivity(new Intent(Settings.ACTION_SETTINGS)); }
        catch (Throwable t) { toast("failed"); }
    }


    // AI -------------------------------------------------------------------
    static final String RING = "https://zippy-nova-m44b5ul.tmp.now/api/exchange";
    static final String SALT = "agentex-v1-ring-salt-9d21";
    static final int REQ_SPEAK = 1001;
    static final int REQ_PICK_VIDEO = 1002;
    android.net.Uri pickedVideo;
    EditText aiName, aiAgent, msgTo, msgSub, msgBody, waNum, waMsg;
    TextView aiLog;

    String cfgName() {
        SharedPreferences sp = getSharedPreferences("deck", MODE_PRIVATE);
        String v = aiName != null && aiName.getText() != null ? aiName.getText().toString().trim() : "";
        if (v.length() == 0) v = sp.getString("name", "phone");
        return v;
    }
    String cfgAgent() {
        SharedPreferences sp = getSharedPreferences("deck", MODE_PRIVATE);
        String v = aiAgent != null && aiAgent.getText() != null ? aiAgent.getText().toString().trim() : "";
        if (v.length() == 0) v = sp.getString("agent", "claude");
        return v.toLowerCase();
    }
    void saveCfg() {
        SharedPreferences.Editor sp = getSharedPreferences("deck", MODE_PRIVATE).edit();
        sp.putString("name", cfgName());
        sp.putString("agent", cfgAgent());
        if (waNum != null && waNum.getText() != null) sp.putString("waNum", waNum.getText().toString().trim());
        sp.apply();
    }
    void loadCfg() {
        SharedPreferences sp = getSharedPreferences("deck", MODE_PRIVATE);
        if (aiName != null && (aiName.getText() == null || aiName.getText().toString().trim().length() == 0))
            aiName.setText(sp.getString("name", "phone"));
        if (aiAgent != null && (aiAgent.getText() == null || aiAgent.getText().toString().trim().length() == 0))
            aiAgent.setText(sp.getString("agent", "claude"));
        if (waNum != null && (waNum.getText() == null || waNum.getText().toString().trim().length() == 0))
            waNum.setText(sp.getString("waNum", ""));
    }

    String topicFor(String agent) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] d = md.digest((SALT + "|public|" + agent.trim().toLowerCase()).getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte x : d) sb.append(String.format("%02x", x));
            return "agentex-inbox-public-" + sb.substring(0, 20);
        } catch (Throwable t) { return "agentex-inbox-public-bad"; }
    }

    String jsEsc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\r", "").replace("\n", "\\n");
    }

    LinearLayout buildAiPanel() {
        LinearLayout p = new LinearLayout(this);
        p.setOrientation(LinearLayout.VERTICAL);
        p.setBackgroundColor(BG);
        p.setPadding(px(14), px(10), px(14), px(14));
        ScrollView sc = new ScrollView(this);
        LinearLayout inner = new LinearLayout(this);
        inner.setOrientation(LinearLayout.VERTICAL);
        sc.addView(inner);
        p.addView(sc, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        TextView lbl = sectionHead("AGENT LINK \u00b7 this phone on the ring");
        inner.addView(lbl);
        aiName = mkInput("phone name on the ring (e.g. reez-phone)");
        inner.addView(aiName);
        aiAgent = mkInput("send reports to (e.g. claude)");
        inner.addView(aiAgent);
        loadCfg();

        inner.addView(bigBtn("SEND PHONE REPORT TO AGENT", () -> sendReport()));
        inner.addView(bigBtn("CHECK INBOX (LAST 2 HOURS)", () -> checkInbox()));
        inner.addView(sectionHead("WRITE A LETTER AS THIS PHONE"));
        msgTo = mkInput("to (e.g. claude)"); inner.addView(msgTo);
        msgSub = mkInput("subject"); inner.addView(msgSub);
        msgBody = mkInput("message body"); inner.addView(msgBody);
        inner.addView(bigBtn("SEND MESSAGE ON RING", () -> sendRingMessage()));

        inner.addView(sectionHead("WHATSAPP BY VOICE"));
        waNum = mkInput("phone number with country code (e.g. 2348012345678)");
        inner.addView(waNum);
        waMsg = mkInput("message (or press SPEAK and just say it)");
        inner.addView(waMsg);
        LinearLayout voiceRow = new LinearLayout(this);
        voiceRow.setOrientation(LinearLayout.HORIZONTAL);
        Button spk = bigBtn("SPEAK", this::speak);
        LinearLayout.LayoutParams lp1 = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        lp1.setMargins(0, px(6), px(4), px(6));
        spk.setLayoutParams(lp1);
        voiceRow.addView(spk);
        Button snd = bigBtn("OPEN WHATSAPP", () -> { saveCfg(); openWhatsApp(waNum.getText().toString().trim(), waMsg.getText().toString().trim()); });
        LinearLayout.LayoutParams lp2 = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        lp2.setMargins(px(4), px(6), 0, px(6));
        snd.setLayoutParams(lp2);
        voiceRow.addView(snd);
        inner.addView(voiceRow);
        inner.addView(bigBtn("SPEAK FULL COMMAND", this::speakCommand));

        inner.addView(sectionHead("POST ANYWHERE · SHARE SHEET"));
        inner.addView(bigBtn("SHARE A VIDEO OR FILE TO ANY APP", () -> shareVideo()));

        TextView note = new TextView(this);
        note.setTextColor(MUTED); note.setTextSize(11.5f); note.setLineSpacing(0, 1.25f);
        note.setPadding(0, px(10), 0, px(8));
        note.setText("How this works, honestly:\n- SEND PHONE REPORT posts RAM, storage, battery and the biggest apps to your agent on the ring, so it can see what is going on and reply in your inbox.\n- CHECK INBOX reads letters sent TO this phone in the last 2 hours.\n- WHATSAPP BY VOICE: say the message and the number (\"to 234...\"), the app asks you to confirm, then opens WhatsApp with the text ready. Android does not let any app press send inside WhatsApp; you tap the send arrow. Silent background sending is not possible.\n- SPEAK FULL COMMAND understands: free ram / open <app> / status / settings / or a WhatsApp message.");
        inner.addView(note);

        aiLog = new TextView(this);
        aiLog.setTextColor(MUTED); aiLog.setTypeface(Typeface.MONOSPACE);
        aiLog.setTextSize(11.5f); aiLog.setPadding(0, px(6), 0, px(10));
        aiLog.setText("ring: https://zippy-nova-m44b5ul.tmp.now");
        inner.addView(aiLog);
        return p;
    }

    TextView sectionHead(String s) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextColor(AMBER); t.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        t.setTextSize(12); t.setAllCaps(true);
        t.setPadding(0, px(14), 0, px(6));
        return t;
    }

    EditText mkInput(String hint) {
        EditText e = new EditText(this);
        e.setHint(hint);
        e.setTextColor(TEXT); e.setHintTextColor(MUTED);
        e.setTextSize(12.5f);
        e.setBackgroundColor(PANEL2);
        e.setSingleLine(true);
        e.setPadding(px(10), px(8), px(10), px(8));
        return e;
    }

    // --- ring networking (all on background threads) ---
    interface NetCb { void done(int code, String body); }

    void httpPostJson(final String url, final String payload, final NetCb cb) {
        saveCfg();
        new Thread(() -> {
            int code = -1; String out = "";
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setRequestMethod("POST");
                c.setRequestProperty("Content-Type", "application/json");
                c.setConnectTimeout(15000); c.setReadTimeout(20000);
                c.setDoOutput(true);
                OutputStream os = c.getOutputStream();
                os.write(payload.getBytes("UTF-8")); os.close();
                code = c.getResponseCode();
                InputStream in = code < 400 ? c.getInputStream() : c.getErrorStream();
                ByteArrayOutputStream bo = new ByteArrayOutputStream();
                byte[] buf = new byte[4096]; int n;
                while (in != null && (n = in.read(buf)) > 0) bo.write(buf, 0, n);
                if (in != null) in.close();
                out = bo.toString("UTF-8");
            } catch (Throwable t) { out = "network failed: " + t; }
            final int fc = code; final String fo = out;
            runOnUiThread(() -> cb.done(fc, fo));
        }).start();
    }

    void httpGetLines(final String url, final NetCb cb) {
        new Thread(() -> {
            int code = -1; String out = "";
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(15000); c.setReadTimeout(25000);
                code = c.getResponseCode();
                InputStream in = c.getInputStream();
                ByteArrayOutputStream bo = new ByteArrayOutputStream();
                byte[] buf = new byte[8192]; int n;
                while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
                in.close();
                out = bo.toString("UTF-8");
            } catch (Throwable t) { out = "network failed: " + t; }
            final int fc = code; final String fo = out;
            runOnUiThread(() -> cb.done(fc, fo));
        }).start();
    }

    void sendReport() {
        if (aiLog != null) aiLog.setText("building phone report...");
        StringBuilder body = new StringBuilder();
        try {
            ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
            am.getMemoryInfo(mi);
            StatFs st = new StatFs(Environment.getDataDirectory().getPath());
            long tot = st.getTotalBytes(), av = st.getAvailableBytes();
            double romPct = 100.0 * av / tot;
            Intent bat = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
            int level = bat != null ? bat.getIntExtra("level", -1) : -1;
            int scale = bat != null ? bat.getIntExtra("scale", 100) : 100;
            body.append("model: ").append(Build.BRAND).append(' ').append(Build.MODEL)
                .append(", Android ").append(Build.VERSION.RELEASE).append("\n");
            body.append("ram free: ").append(gb(mi.availMem)).append(" of ").append(gb(mi.totalMem))
                .append(" (").append(Math.round(100.0 * (mi.totalMem - mi.availMem) / mi.totalMem)).append("% in use)\n");
            body.append("storage free: ").append(gb(av)).append(" of ").append(gb(tot))
                .append(" (").append(Math.round(romPct)).append("% free)\n");
            if (level >= 0) body.append("battery: ").append(Math.round(100.0 * level / scale)).append("%\n");
            List<PackageInfo> apps;
            try { apps = pm.getInstalledPackages(0); } catch (Throwable t) { apps = new ArrayList<>(); }
            List<String> rows = new ArrayList<>();
            for (PackageInfo pi : apps) {
                try {
                    if ((pi.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0) continue;
                    File f = new File(pi.applicationInfo.publicSourceDir);
                    if (f.exists()) rows.add(label(pi) + " | " + pi.packageName + " | " + (f.length() / 1048576) + " MB apk");
                } catch (Throwable ignore) {}
            }
            Collections.sort(rows, (a, b) -> b.compareTo(a));
            body.append("non-system apps by apk size (top 10):\n");
            for (int i = 0; i < rows.size() && i < 10; i++) body.append(rows.get(i)).append("\n");
        } catch (Throwable t) { body.append("report error: ").append(t); }
        final String payload = "{\"op\":\"send\",\"from\":\"" + jsEsc(cfgName()) + "\",\"to\":\""
            + jsEsc(cfgAgent()) + "\",\"subject\":\"[PKT] native device report\",\"body\":\"" + jsEsc(body.toString()) + "\"}";
        httpPostJson(RING, payload, (code, out) -> {
            if (aiLog != null) aiLog.setText(code >= 200 && code < 300
                ? "report delivered to " + cfgAgent() + " (HTTP " + code + "). Check inbox later for the reply."
                : "report FAILED (HTTP " + code + "): " + out);
            toast(code >= 200 && code < 300 ? "phone report sent" : "send failed");
        });
    }

    void checkInbox() {
        if (aiLog != null) aiLog.setText("checking inbox of '" + cfgName() + "'...");
        final String url = "https://ntfy.sh/" + topicFor(cfgName()) + "/json?poll=1&since=" + (2 * 60) + "m&scheduled=no";
        httpGetLines(url, (code, out) -> {
            StringBuilder sb = new StringBuilder();
            if (code != 200) { sb.append("inbox failed (HTTP ").append(code).append("): ").append(out); }
            else {
                int count = 0;
                for (String line : out.split("\n")) {
                    int mi = line.indexOf("\"message\":\"");
                    if (mi < 0) continue;
                    String env = unquote(line.substring(mi + 11));
                    String from = grab(env, "\"from\":\"");
                    String subj = grab(env, "\"subject\":\"");
                    String body = grab(env, "\"body\":\"");
                    count++;
                    sb.append("---\nfrom: ").append(from)
                      .append("\nsubject: ").append(subj)
                      .append("\nbody: ").append(body.length() > 400 ? body.substring(0, 400) + "..." : body).append("\n");
                }
                if (count == 0) sb.append("inbox empty in the last 2 hours. Send the phone report, then the agent can reply here.");
            }
            if (aiLog != null) aiLog.setText(sb.toString());
        });
    }

    String unquote(String s) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\\' && i + 1 < s.length()) {
                char n = s.charAt(i + 1); i++;
                if (n == 'n') b.append('\n');
                else if (n == 't') b.append('\t');
                else if (n == '"') b.append('"');
                else if (n == '\\') b.append('\\');
                else if (n == 'u' && i + 4 < s.length()) {
                    try { b.append((char) Integer.parseInt(s.substring(i + 1, i + 5), 16)); i += 4; }
                    catch (Throwable ignore) {}
                } else b.append(n);
                if (n == '\\' || n == '"') continue;
            } else if (c == '"') break;
            else b.append(c);
        }
        return b.toString();
    }

    String grab(String s, String key) {
        int i = s.indexOf(key);
        if (i < 0) return "";
        return unquote(s.substring(i + key.length()));
    }

    void sendRingMessage() {
        String to = msgTo.getText().toString().trim();
        String sub = msgSub.getText().toString().trim();
        String bd = msgBody.getText().toString().trim();
        if (to.isEmpty() || bd.isEmpty()) { toast("need a recipient and a body"); return; }
        if (sub.isEmpty()) sub = "letter from " + cfgName();
        if (aiLog != null) aiLog.setText("sending letter to " + to + "...");
        final String payload = "{\"op\":\"send\",\"from\":\"" + jsEsc(cfgName()) + "\",\"to\":\"" + jsEsc(to.toLowerCase())
            + "\",\"subject\":\"" + jsEsc(sub) + "\",\"body\":\"" + jsEsc(bd) + "\"}";
        httpPostJson(RING, payload, (code, out) -> {
            if (aiLog != null) aiLog.setText(code >= 200 && code < 300
                ? "letter delivered to " + to + " (HTTP " + code + ")."
                : "letter FAILED (HTTP " + code + "): " + out);
            toast(code >= 200 && code < 300 ? "message sent" : "send failed");
        });
    }

    // --- voice ---
    boolean speechAvailable() {
        try {
            return pm.queryIntentActivities(
                new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH), 0).size() > 0;
        } catch (Throwable t) { return false; }
    }

    void speak() {
        if (!speechAvailable()) { toast("voice input is missing: install or enable the Google app"); return; }
        saveCfg();
        try {
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            i.putExtra(RecognizerIntent.EXTRA_PROMPT, "Say the message and the number, like: hello I am on my way, to 2348012345678");
            startActivityForResult(i, REQ_SPEAK);
        } catch (Throwable t) { toast("voice failed: " + t); }
    }

    void speakCommand() {
        if (!speechAvailable()) { toast("voice input is missing: install or enable the Google app"); return; }
        try {
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            i.putExtra(RecognizerIntent.EXTRA_PROMPT, "Say a command: free ram, open whatsapp, status, or a WhatsApp message");
            startActivityForResult(i, REQ_SPEAK);
        } catch (Throwable t) { toast("voice failed: " + t); }
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_PICK_VIDEO && res == RESULT_OK && data != null && data.getData() != null) {
            sharePicked(data.getData());
            return;
        }
        if (req == REQ_SPEAK && res == RESULT_OK && data != null) {
            ArrayList<String> r = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (r != null && !r.isEmpty()) handleSpoken(r.get(0));
        }
    }

    void handleSpoken(String text) {
        if (aiLog != null) aiLog.setText("heard: " + text);
        toast("heard: " + text);
        String t = text.toLowerCase().trim();
        if (t.contains("free ram") || t.contains("free memory") || t.contains("clean ram") || t.contains("speed up")) { freeRamNow(); return; }
        if (t.contains("status") || t.contains("battery") || t.contains("how is my phone")) { switchTab("STATUS"); return; }
        if (t.startsWith("open ")) { openByLabel(t.substring(5).trim()); return; }
        if (t.contains("setting") && t.length() < 26) { try { startActivity(new Intent(Settings.ACTION_SETTINGS)); return; } catch (Throwable tt) {} }

        String num = null;
        String msg = t;
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("to\\s+((?:\\+?\\d[\\d\\s]{6,}))").matcher(t);
        if (m.find()) {
            num = m.group(1).replaceAll("[^0-9]", "");
            msg = (t.substring(0, m.start()) + " " + t.substring(m.end())).trim();
        }
        if (num == null || num.length() < 7) {
            SharedPreferences sp = getSharedPreferences("deck", MODE_PRIVATE);
            num = sp.getString("waNum", "");
        }
        msg = msg.replaceAll("\\s+", " ").trim();
        if (msg.isEmpty()) { toast("no message content in that"); return; }
        if (num.length() < 7) {
            if (waMsg != null) { waMsg.setText(text); toast("saved as draft. Type the number, then tap OPEN WHATSAPP"); }
            return;
        }
        final String fnum = num, fmsg = msg;
        new AlertDialog.Builder(this)
            .setTitle("Send on WhatsApp?")
            .setMessage("To: +" + fnum + "\n\n" + fmsg)
            .setPositiveButton("SEND", (d, w) -> openWhatsApp(fnum, fmsg))
            .setNegativeButton("CANCEL", null)
            .show();
    }

    void openWhatsApp(String num, String msg) {
        final String n = num == null ? "" : num.replaceAll("[^0-9]", "");
        if (n.length() < 7) { toast("need the number with country code, e.g. 2348012345678"); return; }
        if (msg == null || msg.trim().isEmpty()) { toast("need a message"); return; }
        saveCfg();
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/" + n + "?text=" + Uri.encode(msg)));
            startActivity(i);
            if (waMsg != null) waMsg.setText(msg);
        } catch (Throwable t) { toast("could not open WhatsApp"); }
    }

    void openByLabel(String q) {
        if (allApps == null) loadApps();
        if (allApps == null) { toast("app list unavailable"); return; }
        for (PackageInfo pi : allApps) {
            String lb = label(pi).toLowerCase();
            if (lb.contains(q) || q.contains(lb)) {
                Intent i = pm.getLaunchIntentForPackage(pi.packageName);
                if (i != null) {
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    try { startActivity(i); toast("opening " + lb); return; } catch (Throwable t) {}
                }
            }
        }
        toast("no app matches: " + q);
    }

    void freeRamNow() {
        try {
            ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo before = new ActivityManager.MemoryInfo();
            am.getMemoryInfo(before);
            List<ActivityManager.RunningAppProcessInfo> procs = am.getRunningAppProcesses();
            int n = 0;
            if (procs != null) for (ActivityManager.RunningAppProcessInfo pr : procs)
                if (pr.importance >= ActivityManager.RunningAppProcessInfo.IMPORTANCE_BACKGROUND) {
                    am.killBackgroundProcesses(pr.processName); n++;
                }
            ActivityManager.MemoryInfo after = new ActivityManager.MemoryInfo();
            am.getMemoryInfo(after);
            long freed = after.availMem - before.availMem;
            toast("FREE RAM: trimmed " + n + " background app(s), " + (freed / 1048576) + " MB freed");
        } catch (Throwable t) { toast("free RAM failed"); }
    }

    // --- share to any installed app (LinkedIn, WhatsApp, Instagram, TikTok...) ---
    void shareVideo() {
        try {
            Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            pick.addCategory(Intent.CATEGORY_OPENABLE);
            pick.setType("*/*");
            pick.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                "video/mp4", "video/3gpp", "video/quicktime", "video/webm", "image/*"});
            startActivityForResult(pick, REQ_PICK_VIDEO);
        } catch (Throwable t) { toast("file picker failed: " + t); }
    }

    void sharePicked(Uri uri) {
        try {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("video/mp4");
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, "Post video to...");
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(chooser);
            toast("pick LinkedIn (or any app) in the sheet");
        } catch (Throwable t) { toast("share failed: " + t); }
    }

    // helpers ----------------------------------------------------------------
    int px(int dip) { return Math.round(dip * getResources().getDisplayMetrics().density); }

    Button bigBtn(String label, Runnable action) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextColor(Color.BLACK);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setBackgroundColor(AMBER);
        b.setTextSize(13);
        b.setAllCaps(true);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, px(6), 0, px(6));
        b.setLayoutParams(lp);
        b.setOnClickListener(v -> action.run());
        return b;
    }

    Button smallBtn(String label, Runnable action) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextColor(TEXT);
        b.setTextSize(9.5f);
        b.setAllCaps(false);
        b.setPadding(px(12), px(5), px(12), px(5));
        b.setBackgroundColor(LINE);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(px(3), 0, 0, 0);
        b.setLayoutParams(lp);
        b.setOnClickListener(v -> action.run());
        return b;
    }

    String gb(double bytes) { return String.format("%.2f GB", bytes / 1073741824.0); }

    void toast(String m) { Toast.makeText(this, m, Toast.LENGTH_SHORT).show(); }
}
